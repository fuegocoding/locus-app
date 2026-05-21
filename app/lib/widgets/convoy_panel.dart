import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../screens/invite_friends_sheet.dart';

class ConvoyPanel extends StatelessWidget {
  const ConvoyPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final convoy = state.currentConvoy;

    if (convoy == null) return const SizedBox.shrink();

    final inviteUrl = 'https://locus.app/convoy/${convoy.inviteCode}';

    return Positioned(
      top: MediaQuery.of(context).padding.top + 60,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.2)),
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
                      Text(convoy.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      Text('${convoy.members.length} members', style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                TextButton(onPressed: () => state.leaveConvoy(), child: const Text('Leave')),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Expanded(child: Text(convoy.inviteCode, style: const TextStyle(fontFamily: 'monospace', fontSize: 18))),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: convoy.inviteCode));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copied')));
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.person_add, color: Color(0xFF6C63FF)),
                  tooltip: 'Invite Friends',
                  onPressed: () => InviteFriendsSheet.show(context),
                ),
                IconButton(icon: const Icon(Icons.qr_code), onPressed: () => _showQR(context, convoy.inviteCode, inviteUrl)),
                IconButton(
                  icon: const Icon(Icons.share),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: inviteUrl));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invite link copied')));
                  },
                ),
              ],
            ),

          ],
        ),
      ),
    );
  }

  void _showQR(BuildContext context, String code, String url) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Convoy Invite'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 220,
              height: 220,
              color: Colors.white,
              child: QrImageView(data: url, version: QrVersions.auto, size: 220),
            ),
            const SizedBox(height: 12),
            Text('Code: $code', style: const TextStyle(fontFamily: 'monospace', fontSize: 16)),
            const SizedBox(height: 4),
            Text(url, style: TextStyle(fontSize: 10, color: Colors.grey[600]), textAlign: TextAlign.center),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: url));
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invite link copied')));
            },
            child: const Text('Copy Link'),
          ),
        ],
      ),
    );
  }
}
