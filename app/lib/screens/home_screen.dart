import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/map_widget.dart';
import '../widgets/proximity_overlay.dart';
import '../widgets/convoy_panel.dart';
import '../widgets/speedometer.dart';
import '../widgets/video_grid.dart';
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
          if (!state.isOnline) _buildOfflineBanner(theme),
          if (!state.isAudioConnected && state.isAuthenticated) _buildAudioDisconnectedBanner(theme),
          if (state.mode == 'proximity')
            const ProximityOverlay()
          else if (state.mode == 'convoy') ...[
            const ConvoyPanel(),
            const VideoGrid(),
          ],
          _buildBottomBar(state, theme),
          Positioned(
            bottom: 8,
            left: 16,
            child: _buildMicCircle(state, theme),
          ),
          Positioned(
            bottom: 8,
            right: 16,
            child: Speedometer(
              speedKmh: state.speed,
              unit: state.resolvedSpeedUnit,
              size: 80,
            ),
          ),
          if (_isHolding && state.pushToTalk && !_swipedToLock)
            _buildSwipeIndicator(theme),
        ],
      ),
    );
  }

  Widget _buildOfflineBanner(ThemeData theme) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 50,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(Icons.wifi_off, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            const Text(
              'You are offline',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioDisconnectedBanner(ThemeData theme) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + (state.isOnline ? 50 : 80),
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(Icons.volume_off, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            const Text(
              'Audio disconnected',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ],
        ),
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

  Widget _buildBottomBar(AppState state, ThemeData theme) {
    return Positioned(
      bottom: 24,
      left: 104,
      right: 104,
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.6),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.15),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _barButton(
              state.pushToTalk ? Icons.touch_app : Icons.mic,
              state.pushToTalk ? 'PTT' : 'Open',
              () => state.setPushToTalk(!state.pushToTalk),
            ),
            _barButton(Icons.groups, 'Convoy', () => _showConvoySheet(context, state)),
            _barButton(Icons.people, 'Nearby', () => _showNearbySheet(context, state)),
          ],
        ),
      ),
    );
  }

  Widget _barButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 22, color: Colors.white70),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: Colors.white60,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMicCircle(AppState state, ThemeData theme) {
    final isPtt = state.pushToTalk;
    final isMuted = state.micMuted;
    final isActive = isPtt ? _isHolding : !isMuted;
    final icon = isMuted && !isPtt ? Icons.mic_off : Icons.mic;
    final color = isMuted && !isPtt
        ? theme.colorScheme.error
        : isActive
            ? const Color(0xFFC4B5FD)
            : Colors.grey.shade700;

    if (isPtt) {
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
              if (state.micMuted) state.toggleMic();
            }
          });
        },
        onPanEnd: (_) {
          setState(() { _isHolding = false; _dragY = 0; });
          if (!_swipedToLock) state.stopSpeaking();
        },
        onPanCancel: () {
          setState(() { _isHolding = false; _dragY = 0; });
          if (!_swipedToLock) state.stopSpeaking();
        },
        child: _micContainer(theme, icon, color),
      );
    }
    return GestureDetector(
      onTap: () => state.toggleMic(),
      child: _micContainer(theme, icon, color),
    );
  }

  Widget _micContainer(ThemeData theme, IconData icon, Color color) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(_isHolding ? 0.6 : 0.3),
            blurRadius: _isHolding ? 32 : 20,
            spreadRadius: _isHolding ? 8 : 2,
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 36),
    );
  }

  Widget _buildSwipeIndicator(ThemeData theme) {
    return Positioned(
      bottom: 110,
      left: 0,
      right: 0,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.keyboard_arrow_up,
              size: 28,
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

  void _showNearbySheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nearby Users', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (state.nearbyUsers.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: Text('No one nearby')),
                )
              else
                ...state.nearbyUsers.map((user) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(user.userId.substring(0, 1).toUpperCase()),
                  ),
                  title: Text('User ${user.userId.substring(0, 6)}'),
                  subtitle: Text('${user.latitude.toStringAsFixed(4)}, ${user.longitude.toStringAsFixed(4)}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.volume_off, size: 20),
                        onPressed: () { state.muteUser(user.userId); Navigator.pop(context); },
                      ),
                      IconButton(
                        icon: const Icon(Icons.block, size: 20, color: Colors.red),
                        onPressed: () { state.blockUser(user.userId); Navigator.pop(context); },
                      ),
                    ],
                  ),
                )),
            ],
          ),
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
