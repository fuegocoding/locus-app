import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class InviteFriendsSheet extends StatefulWidget {
  const InviteFriendsSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF161B22),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => const InviteFriendsSheet(),
    );
  }

  @override
  State<InviteFriendsSheet> createState() => _InviteFriendsSheetState();
}

class _InviteFriendsSheetState extends State<InviteFriendsSheet> {
  final Set<String> _invitedUserIds = {};

  @override
  void initState() {
    super.initState();
    // Fetch fresh friends list
    context.read<AppState>().loadFriends();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final friends = state.friends;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Invite Friends',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      color: Colors.white,
                    ),
                  ),
                  if (state.currentConvoy != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6C63FF).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Code: ${state.currentConvoy!.inviteCode}',
                        style: const TextStyle(
                          color: Color(0xFFC4B5FD),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Invite your mutual friends to join this voice convoy. They will receive an in-app popup and device notification.',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: state.isLoadingFriends
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF6C63FF)))
                    : friends.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            controller: scrollController,
                            itemCount: friends.length,
                            itemBuilder: (context, index) {
                              final friend = friends[index];
                              return _buildFriendTile(friend, state);
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.people_outline, size: 48, color: Colors.white12),
          const SizedBox(height: 12),
          const Text(
            'No friends available to invite',
            style: TextStyle(color: Colors.white30, fontSize: 14),
          ),
          const SizedBox(height: 4),
          const Text(
            'Go to Find People to search for and follow users.',
            style: TextStyle(color: Colors.white24, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildFriendTile(dynamic friend, AppState state) {
    final String friendId = friend['id'];
    final bool isOnline = friend['isOnline'] == true;
    final bool hasInvited = _invitedUserIds.contains(friendId);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF21262D).withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF30363D), width: 1),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Stack(
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFF21262D),
              backgroundImage: (friend['avatar'] != null && (friend['avatar'] as String).isNotEmpty)
                  ? NetworkImage(friend['avatar'])
                  : null,
              child: friend['avatar'] == null
                  ? const Icon(Icons.person, color: Colors.white54)
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: isOnline ? const Color(0xFF10B981) : Colors.grey,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF161B22), width: 1.5),
                ),
              ),
            ),
          ],
        ),
        title: Text(
          friend['displayName'] ?? 'User',
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            Text(
              isOnline ? 'Online' : 'Offline',
              style: TextStyle(
                color: isOnline ? const Color(0xFF10B981) : Colors.white24,
                fontSize: 11,
              ),
            ),
            if (friend['vehicleTag'] != null && (friend['vehicleTag'] as String).isNotEmpty) ...[
              const SizedBox(width: 8),
              Text(
                '•  ${friend['vehicleTag']}',
                style: const TextStyle(color: Colors.white30, fontSize: 11),
              ),
            ],
          ],
        ),
        trailing: hasInvited
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Invited',
                  style: TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              )
            : ElevatedButton(
                onPressed: () async {
                  setState(() {
                    _invitedUserIds.add(friendId);
                  });
                  await state.sendConvoyInvite(friendId);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('Invite', style: TextStyle(fontSize: 12)),
              ),
      ),
    );
  }
}
