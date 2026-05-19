import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/map_widget.dart';
import '../widgets/proximity_overlay.dart';
import '../widgets/convoy_panel.dart';
import 'tasks_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    state.requestPermissions().then((_) => state.startLocation());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    return Scaffold(
      body: Stack(
        children: [
          const MapWidget(),
          if (state.mode == 'proximity')
            const ProximityOverlay()
          else if (state.mode == 'convoy')
            const ConvoyPanel(),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: state.mode == 'proximity'
                          ? Colors.green
                          : Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    state.mode == 'proximity' ? 'Proximity' : 'Convoy',
                    style: theme.textTheme.bodySmall,
                  ),
                  if (state.currentConvoy != null) ...[
                    const Spacer(),
                    Text(
                      state.currentConvoy!.name,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                  const Spacer(),
                  Text(
                    '${state.nearbyUsers.length} nearby',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
          ),
          _buildAudioControls(state, theme),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (index) {
          if (index == 1) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen()));
          } else if (index == 2) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }

  Widget _buildAudioControls(AppState state, ThemeData theme) {
    return Positioned(
      bottom: 80,
      left: 0,
      right: 0,
      child: Column(
        children: [
          if (state.mode == 'proximity') ...[
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: state.nearbyUsers.map((user) {
                  final isSpeaking = state.speaking[user.userId] == true;
                  final volume = state.volumes[user.userId] ?? 0.5;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => _showUserActions(user.userId),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isSpeaking
                              ? theme.colorScheme.primary.withOpacity(0.3)
                              : theme.colorScheme.surface.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: isSpeaking
                                ? theme.colorScheme.primary
                                : theme.colorScheme.outline.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircleAvatar(
                              radius: 12,
                              backgroundColor: theme.colorScheme.primary,
                              child: Text(
                                user.userId.substring(0, 1),
                                style: const TextStyle(fontSize: 10),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Vol: ${(volume * 100).round()}%',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
          ],
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface.withOpacity(0.95),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _controlButton(
                  icon: state.micMuted ? Icons.mic_off : Icons.mic,
                  label: state.micMuted ? 'Unmute' : 'Mute',
                  active: !state.micMuted,
                  onTap: () => state.toggleMic(),
                ),
                _talkButton(state),
                _controlButton(
                  icon: state.mode == 'proximity' ? Icons.groups : Icons.public,
                  label: state.mode == 'proximity' ? 'Convoy' : 'Proximity',
                  onTap: () {
                    if (state.mode == 'proximity') {
                      _showConvoySheet(context, state);
                    } else {
                      state.setMode('proximity');
                    }
                  },
                ),
                _controlButton(
                  icon: Icons.more_horiz,
                  label: 'More',
                  onTap: () => _showModeMenu(context, state),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool active = false,
  }) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 24, color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  Widget _talkButton(AppState state) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTapDown: (_) => state.startSpeaking(),
      onTapUp: (_) => state.stopSpeaking(),
      onTapCancel: () => state.stopSpeaking(),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: theme.colorScheme.primary,
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.4),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ],
        ),
        child: const Icon(Icons.mic, color: Colors.white, size: 32),
      ),
    );
  }

  void _showUserActions(String userId) {
    final state = context.read<AppState>();
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.push_pin),
              title: const Text('Pin user'),
              onTap: () {
                state.pinUser(userId);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.volume_off),
              title: const Text('Mute'),
              onTap: () {
                state.muteUser(userId);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: Colors.red),
              title: const Text('Block'),
              onTap: () {
                state.blockUser(userId);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.flag, color: Colors.orange),
              title: const Text('Report'),
              onTap: () {
                state.reportUser(userId);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showModeMenu(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.groups),
              title: const Text('Create Convoy'),
              onTap: () {
                Navigator.pop(context);
                _showConvoySheet(context, state);
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Join Convoy'),
              onTap: () {
                Navigator.pop(context);
                _promptInviteCode(context, state);
              },
            ),
            SwitchListTile(
              secondary: const Icon(Icons.mic),
              title: const Text('Push to Talk'),
              value: state.pushToTalk,
              onChanged: (v) => state.setPushToTalk(v),
            ),
            SwitchListTile(
              secondary: const Icon(Icons.mic_none),
              title: const Text('Open Mic'),
              value: !state.pushToTalk,
              onChanged: (v) => state.setPushToTalk(!v),
            ),
          ],
        ),
      ),
    );
  }

  void _showConvoySheet(BuildContext context, AppState state) {
    final nameController = TextEditingController();
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Convoy name',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    if (nameController.text.trim().isNotEmpty) {
                      state.createConvoy(nameController.text.trim());
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('Create Convoy'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _promptInviteCode(BuildContext context, AppState state) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Join Convoy'),
        content: TextField(
          controller: codeController,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            labelText: 'Invite code',
            hintText: 'ABCDEF',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (codeController.text.trim().isNotEmpty) {
                state.joinConvoy(codeController.text.trim());
                Navigator.pop(context);
              }
            },
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }
}
