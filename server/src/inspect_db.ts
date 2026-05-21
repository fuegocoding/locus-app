import { prisma } from './services/db';

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    include: {
      followers: true,
      following: true,
      deviceTokens: true,
      sentInvites: true,
      receivedInvites: true,
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
