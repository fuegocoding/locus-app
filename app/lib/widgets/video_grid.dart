import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class VideoGrid extends StatelessWidget {
  const VideoGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    final activeVideoUsers = state.remoteVideoEnabled.entries
        .where((e) => e.value)
        .map((e) => e.key)
        .toList();

    final showSelf = state.videoEnabled;
    final totalTiles = activeVideoUsers.length + (showSelf ? 1 : 0);

    if (totalTiles == 0) return const SizedBox.shrink();

    final allParticipants = [
      if (showSelf) state.user?.id ?? '',
      ...activeVideoUsers,
    ];

    return Positioned(
      top: MediaQuery.of(context).padding.top + 60,
      left: 16,
      right: 16,
      child: Container(
        height: _gridHeight(totalTiles),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blue.withOpacity(0.3)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: GridView.builder(
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(4),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: totalTiles == 1 ? 1 : 2,
              crossAxisSpacing: 4,
              mainAxisSpacing: 4,
            ),
            itemCount: totalTiles,
            itemBuilder: (context, index) {
              final userId = allParticipants[index];
              final isSelf = showSelf && index == 0;
              return _VideoTile(userId: userId, isSelf: isSelf);
            },
          ),
        ),
      ),
    );
  }

  double _gridHeight(int count) {
    if (count <= 2) return 160;
    if (count <= 4) return 280;
    return 400;
  }
}

class _VideoTile extends StatelessWidget {
  final String userId;
  final bool isSelf;

  const _VideoTile({required this.userId, required this.isSelf});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = isSelf ? 'You' : 'User ${userId.length > 6 ? userId.substring(0, 6) : userId}';

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Placeholder for LiveKit VideoTrack renderer
          // Replace with VideoTrackRenderer(track) when livekit_client is integrated
          Container(
            color: const Color(0xFF1A1F2B),
            child: Icon(
              isSelf ? Icons.videocam : Icons.person,
              color: Colors.white24,
              size: 40,
            ),
          ),
          Positioned(
            bottom: 6,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500),
              ),
            ),
          ),
          if (isSelf)
            Positioned(
              top: 6,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }
}
