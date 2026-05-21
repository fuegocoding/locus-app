import { prisma } from './services/db';
import { generateAuthToken } from './services/auth';
import { io } from 'socket.io-client';

async function main() {
  console.log('[Mock Friend] Searching for emulator user "skipfornow"...');
  const userA = await prisma.user.findUnique({
    where: { displayName: 'skipfornow' }
  });

  if (!userA) {
    console.error('[Mock Friend] Error: User "skipfornow" not found in the database. Please sign in / enter username in the emulator first.');
    process.exit(1);
  }

  console.log(`[Mock Friend] Found emulator user: ${userA.displayName} (${userA.id})`);

  // Ensure testfriend exists
  const friendId = 'test-friend-uuid-55555';
  const friendPhone = '+15555555555';
  const friendName = 'testfriend';

  const userB = await prisma.user.upsert({
    where: { id: friendId },
    update: { displayName: friendName },
    create: {
      id: friendId,
      phone: friendPhone,
      displayName: friendName,
    }
  });

  console.log(`[Mock Friend] Ensured mock friend exists: ${userB.displayName} (${userB.id})`);

  // Establish mutual follow
  try {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } },
      update: {},
      create: { followerId: userA.id, followingId: userB.id }
    });
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userB.id, followingId: userA.id } },
      update: {},
      create: { followerId: userB.id, followingId: userA.id }
    });
    console.log('[Mock Friend] Mutual follow established: skipfornow <--> testfriend are now friends!');
  } catch (err) {
    console.warn('[Mock Friend] Follow establishment warning:', err);
  }

  // Generate auth token for testfriend
  const token = generateAuthToken(userB.id, userB.phone);
  console.log('[Mock Friend] Token generated for testfriend.');

  // Connect to socket.io
  const socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log(`[Mock Friend] Socket connected successfully to server! Socket ID: ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Mock Friend] Socket disconnected. Reason: ${reason}`);
  });

  socket.on('invite:received', async (data: any) => {
    console.log('\n=========================================');
    console.log('[Mock Friend] RECEIVED CONVOY INVITATION EVENT!');
    console.log('Invite ID:', data.id);
    console.log('Convoy Name:', data.convoyName);
    console.log('Sender Name:', data.senderName);
    console.log('=========================================');

    // Respond ACCEPTED via HTTP POST
    console.log('[Mock Friend] Accepting invitation via REST API...');
    try {
      const response = await fetch(`http://localhost:3001/api/social/convoy/invite/${data.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      const body = await response.json();
      if (response.ok) {
        console.log('[Mock Friend] Invitation accepted successfully!');
      } else {
        console.error('[Mock Friend] Error responding to invite:', body);
      }
    } catch (err) {
      console.error('[Mock Friend] Error connecting to REST API:', err);
    }
  });

  socket.on('invite:responded', (data: any) => {
    console.log('[Mock Friend] Invite response update:', data);
  });
}

main().catch(err => {
  console.error('[Mock Friend] Critical failure:', err);
});
