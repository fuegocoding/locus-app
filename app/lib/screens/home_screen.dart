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
  bool _isHolding = false;
  bool _swipedToLock = false;
  double _dragY = 0;
  static const double _swipeThreshold = 80;

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
          Positioned(
            top: MediaQuery.of(context).padding.top + 4,
            left: 8,
            right: 8,
            child: _buildTopBar(state, theme),
          ),
          if (state.mode == 'proximity')
            const ProximityOverlay()
          else if (state.mode == 'convoy')
            const ConvoyPanel(),
          _buildAudioBar(state, theme),
          if (_isHolding && state.pushToTalk && !_swipedToLock)
            _buildSwipeIndicator(theme),
        ],
      ),
    );
  }

  Widget _buildTopBar(AppState state, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withOpacity(0.92),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.15),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: state.mode == 'proximity' ? Colors.green : Colors.blue,
            ),
          ),
          const SizedBox(width: 6),
          if (state.mode == 'convoy' && state.currentConvoy != null) ...[
            Expanded(
              child: Row(
                children: [
                  Text(
                    state.currentConvoy!.name,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: GestureDetector(
                      onTap: () => state.setMode('proximity'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.swap_horiz, size: 12, color: Colors.blue[300]),
                          const SizedBox(width: 2),
                          Text(
                            'Live',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue[300],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            Text(
              state.mode == 'proximity' ? 'Proximity' : 'Convoy',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const Spacer(),
          Text(
            '${state.nearbyUsers.length} near',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
              fontSize: 10,
            ),
          ),
          const SizedBox(width: 8),
          _topIcon(
            Icons.assignment,
            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen())),
          ),
          _topIcon(
            Icons.settings,
            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
    );
  }

  Widget _topIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Icon(icon, size: 18, color: Colors.white54),
      ),
    );
  }

  Widget _buildAudioBar(AppState state, ThemeData theme) {
    return Positioned(
      bottom: 16,
      left: 12,
      right: 12,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _controlButton(
              icon: state.pushToTalk ? Icons.touch_app : Icons.mic,
              label: state.pushToTalk ? 'PTT' : 'Open',
              onTap: () => _showModeSheet(context, state),
            ),
            _controlButton(
              icon: state.micMuted ? Icons.mic_off : Icons.mic,
              label: state.micMuted ? 'Muted' : 'Live',
              onTap: () {
                if (!state.pushToTalk) {
                  // Open mic: toggle mute
                  state.toggleMic();
                }
              },
            ),
            _buildMicButton(state, theme),
            _controlButton(
              icon: Icons.groups,
              label: 'Convoy',
              onTap: () => _showConvoySheet(context, state),
            ),
            _controlButton(
              icon: Icons.more_horiz,
              label: 'More',
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 22, color: Colors.white70),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 9, color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildMicButton(AppState state, ThemeData theme) {
    if (state.pushToTalk) {
      // PTT mode: hold to talk, swipe up to lock open mic
      return GestureDetector(
        onPanStart: (_) {
          setState(() {
            _isHolding = true;
            _swipedToLock = false;
            _dragY = 0;
          });
          state.startSpeaking();
        },
        onPanUpdate: (details) {
          setState(() {
            _dragY += details.delta.dy;
            if (_dragY < -_swipeThreshold && !_swipedToLock) {
              _swipedToLock = true;
              state.setPushToTalk(false);
            }
          });
        },
        onPanEnd: (_) {
          setState(() {
            _isHolding = false;
            _dragY = 0;
          });
          if (!_swipedToLock) {
            state.stopSpeaking();
          }
        },
        onPanCancel: () {
          setState(() {
            _isHolding = false;
            _dragY = 0;
          });
          if (!_swipedToLock) {
            state.stopSpeaking();
          }
        },
        child: _micContainer(
          theme,
          state.micMuted ? Icons.mic_off : Icons.mic,
          state.micMuted ? theme.colorScheme.error : theme.colorScheme.primary,
        ),
      );
    } else {
      // Open mic mode: tap to toggle mute
      return GestureDetector(
        onTap: () => state.toggleMic(),
        child: _micContainer(
          theme,
          state.micMuted ? Icons.mic_off : Icons.mic,
          state.micMuted ? theme.colorScheme.error : theme.colorScheme.primary,
        ),
      );
    }
  }

  Widget _micContainer(ThemeData theme, IconData icon, Color color) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _isHolding ? color.withOpacity(0.9) : color,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(_isHolding ? 0.6 : 0.4),
            blurRadius: _isHolding ? 24 : 16,
            spreadRadius: _isHolding ? 4 : 2,
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 28),
    );
  }

  Widget _buildSwipeIndicator(ThemeData theme) {
    return Positioned(
      bottom: 100,
      left: 0,
      right: 0,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.keyboard_arrow_up,
              size: 32,
              color: theme.colorScheme.primary.withOpacity(0.8),
            ),
            Text(
              'Slide up to lock open mic',
              style: TextStyle(
                color: theme.colorScheme.primary.withOpacity(0.8),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showModeSheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Mic Mode', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ),
            SwitchListTile(
              secondary: Icon(state.pushToTalk ? Icons.touch_app : Icons.mic),
              title: Text(state.pushToTalk ? 'Push to Talk' : 'Open Mic'),
              subtitle: Text(state.pushToTalk
                  ? 'Hold mic button to speak, slide up to lock'
                  : 'Mic stays on, tap button to mute'),
              value: state.pushToTalk,
              onChanged: (v) {
                state.setPushToTalk(v);
                Navigator.pop(context);
              },
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
              const Text('Convoy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Convoy name',
                  hintText: 'e.g. Road Trip Crew',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 8),
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
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _promptInviteCode(context, state);
                },
                child: const Text('Join with Code'),
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
            hintText: 'ABC123',
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
