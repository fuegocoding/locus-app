import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class ConvoyPanel extends StatelessWidget {
  const ConvoyPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final convoy = state.currentConvoy;

    if (convoy == null) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.of(context).padding.top + 60,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.blue.withOpacity(0.3),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(Icons.groups, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(convoy.name,
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      Text('${convoy.members.length} members',
                        style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => state.leaveConvoy(),
                  child: const Text('Leave'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Expanded(
                          child: Text(convoy.inviteCode,
                            style: const TextStyle(fontFamily: 'monospace', fontSize: 18)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: convoy.inviteCode));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Invite code copied')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.qr_code),
                  onPressed: () => _showQR(context, convoy.inviteCode),
                ),
                IconButton(
                  icon: const Icon(Icons.share),
                  onPressed: () {
                    // TODO: Share sheet
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showQR(BuildContext context, String code) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Convoy Invite'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 200,
              height: 200,
              color: Colors.white,
              child: Center(
                child: Text(code,
                  style: const TextStyle(fontSize: 24, fontFamily: 'monospace')),
              ),
            ),
            const SizedBox(height: 12),
            Text('Code: $code',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 18)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
