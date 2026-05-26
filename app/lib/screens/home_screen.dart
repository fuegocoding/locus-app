import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/map_widget.dart';
import '../widgets/proximity_overlay.dart';
import '../widgets/convoy_panel.dart';
import '../widgets/speedometer.dart';
import 'tasks_screen.dart';
import 'settings_screen.dart';
import 'social_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey<MapWidgetState> _mapKey = GlobalKey();
  bool _isHolding = false;
  bool _swipedToLock = false;
  double _dragY = 0;
  static const double _swipeThreshold = 80;

  // Bar metrics — keep in one place so mic/speedo track automatically
  static const double _barHeight = 52.0;
  static const double _barBottomPadding = 6.0; // gap from screen edge
  static const double _floatGap = 10.0;          // gap between bar top and floating widgets

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    state.requestPermissions().then((_) => state.startLocation());
  }

  // Bottom of floating widgets (mic / speedometer) relative to screen
  double _floatBottom(double bottomSafe) =>
      _barHeight + _barBottomPadding + bottomSafe + _floatGap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final bottomSafe = MediaQuery.of(context).padding.bottom;
    final topPad = MediaQuery.of(context).padding.top;

    final bool showAudioError = state.isAuthenticated &&
        !state.isAudioConnected &&
        (state.mode == 'convoy' || state.nearbyUsers.isNotEmpty);

    double proximityTop = topPad + 58;
    if (!state.isOnline) proximityTop += 38;
    if (showAudioError) proximityTop += 38;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: Stack(
        children: [
          Positioned.fill(
            child: MapWidget(key: _mapKey),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 4,
            left: 8,
            right: 8,
            child: _buildTopBar(state, theme),
          ),

          if (state.mode == 'proximity')
            ProximityOverlay(topOffset: proximityTop)
          else if (state.mode == 'convoy') ...[
            const ConvoyPanel(),
          ],

          Positioned(
            bottom: _floatBottom(bottomSafe),
            left: 16,
            child: _buildMicCircle(state, theme),
          ),

          Positioned(
            bottom: _floatBottom(bottomSafe),
            right: 16,
            child: Speedometer(
              speedKmh: state.speed,
              unit: state.resolvedSpeedUnit,
              size: 72,
            ),
          ),

          if (_mapKey.currentState != null &&
              !_mapKey.currentState!.followingUser &&
              state.latitude != 0)
            Positioned(
              bottom: _floatBottom(bottomSafe) + 80,
              right: 16,
              child: Material(
                color: const Color(0xFF1A1A3E).withOpacity(0.85),
                borderRadius: BorderRadius.circular(28),
                elevation: 4,
                child: InkWell(
                  borderRadius: BorderRadius.circular(28),
                  onTap: () => _mapKey.currentState?.recenterOnUser(state),
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
                    ),
                    child: const Icon(Icons.my_location, color: Color(0xFFC4B5FD), size: 22),
                  ),
                ),
              ),
            ),

          _buildBottomBar(state, theme, bottomSafe),
        ],
      ),
    );
  }

  // ── Top bar ───────────────────────────────────────────────────────────────

  Widget _buildTopBar(AppState state, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A3E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.4), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 12, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: state.mode == 'proximity' ? Colors.green : const Color(0xFFC4B5FD),
            ),
          ),
          const SizedBox(width: 6),
          if (state.mode == 'convoy' && state.currentConvoy != null) ...[
            Expanded(
              child: Row(
                children: [
                  Text(
                    state.currentConvoy!.name,
                    style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () => state.setMode('proximity'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFC4B5FD).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.swap_horiz, size: 12, color: const Color(0xFFC4B5FD)),
                          const SizedBox(width: 2),
                          Text('Live',
                              style: TextStyle(fontSize: 10, color: const Color(0xFFC4B5FD), fontWeight: FontWeight.bold)),
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
              style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
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
          _topIcon(Icons.assignment,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen()))),
          _topIcon(Icons.settings,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
        ],
      ),
    );
  }

  Widget _topIcon(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Icon(icon, size: 18, color: Colors.white54),
        ),
      ),
    );
  }

  // ── Bottom bar — 4 buttons, compact height ────────────────────────────────

  Widget _buildBottomBar(AppState state, ThemeData theme, double bottomSafe) {
    final isPtt = state.pushToTalk;
    return Positioned(
      bottom: _barBottomPadding + bottomSafe,
      left: 16,
      right: 16,
      child: Container(
        height: _barHeight,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF1C1C40),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.35), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _barBtn(
              isPtt ? Icons.touch_app : Icons.mic,
              isPtt ? 'PTT' : 'Open',
              () => state.setPushToTalk(!isPtt),
              highlight: isPtt,
            ),
            _barBtn(
              Icons.groups_rounded,
              'Convoy',
              () => _showConvoySheet(context, state),
              highlight: state.mode == 'convoy',
            ),
            _barBtn(
              Icons.radar,
              'Nearby',
              () => _showNearbySheet(context, state),
              badge: state.nearbyUsers.isNotEmpty ? state.nearbyUsers.length : null,
            ),
            _barBtn(
              Icons.people_rounded,
              'Friends',
              () => _showFriendsSheet(context, state),
              badge: state.pendingInvites.isNotEmpty ? state.pendingInvites.length : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _barBtn(IconData icon, String label, VoidCallback onTap,
      {bool highlight = false, int? badge}) {
    final color = highlight ? const Color(0xFFC4B5FD) : Colors.white60;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: SizedBox(
          width: 72,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon, size: 20, color: color),
                  if (badge != null && badge > 0)
                    Positioned(
                      top: -4,
                      right: -6,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Color(0xFF6C63FF),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                        child: Text(
                          '$badge',
                          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 9.5,
                  color: color,
                  fontWeight: highlight ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Banners ───────────────────────────────────────────────────────────────

  Widget _buildOfflineBanner(ThemeData theme) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 54,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          children: [
            Icon(Icons.wifi_off, size: 16, color: Colors.white),
            SizedBox(width: 8),
            Text('You are offline',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioErrorBanner(AppState state, ThemeData theme) {
    double topOffset = MediaQuery.of(context).padding.top + 54;
    if (!state.isOnline) topOffset += 36;
    final String label =
        state.mode == 'convoy' ? 'Convoy audio connection lost' : 'Audio connection error';
    return Positioned(
      top: topOffset,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFB91C1C).withOpacity(0.92),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.volume_off, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(label,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12))),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => state.reconnectAudio(),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Retry',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPinnedBanner(AppState state, ThemeData theme) {
    double topOffset = MediaQuery.of(context).padding.top + 54;
    if (!state.isOnline) topOffset += 36;
    if (state.isAuthenticated && !state.isAudioConnected &&
        (state.mode == 'convoy' || state.nearbyUsers.isNotEmpty)) topOffset += 44;
    return Positioned(
      top: topOffset,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF6C63FF).withOpacity(0.9),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFC4B5FD).withOpacity(0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.push_pin, size: 16, color: Color(0xFFC4B5FD)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(state.pinnedByMessage!,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Pin back',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                onTap: () {
                  // TODO: Pin back — need the userId from the pinnedByMessage
                  // Currently this just dismisses the banner
                  setState(() {});
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInviteBanner(AppState state, ThemeData theme) {
    if (state.pendingInvites.isEmpty) return const SizedBox.shrink();
    final invite = state.pendingInvites.last;
    double topOffset = MediaQuery.of(context).padding.top + 54;
    if (!state.isOnline) topOffset += 36;
    if (state.isAuthenticated && !state.isAudioConnected &&
        (state.mode == 'convoy' || state.nearbyUsers.isNotEmpty)) topOffset += 44;
    if (state.mode == 'convoy') topOffset += 240;

    return Positioned(
      top: topOffset,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1F1A3A).withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.4), width: 1.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFF6C63FF).withOpacity(0.2),
              child: const Icon(Icons.directions_car, color: Color(0xFFC4B5FD)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Convoy Invite from ${invite['senderName']}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text('Join: ${invite['convoyName']}',
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.redAccent, size: 20),
                  onPressed: () => state.respondToInvite(invite['id'], 'declined'),
                ),
                IconButton(
                  icon: const Icon(Icons.check, color: Colors.greenAccent, size: 20),
                  onPressed: () => state.respondToInvite(invite['id'], 'accepted'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Mic ───────────────────────────────────────────────────────────────────

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
          setState(() { _isHolding = true; _swipedToLock = false; _dragY = 0; });
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
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(_isHolding ? 0.6 : 0.3),
            blurRadius: _isHolding ? 28 : 16,
            spreadRadius: _isHolding ? 6 : 2,
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 32),
    );
  }

  Widget _buildSwipeIndicator(ThemeData theme, double bottomSafe) {
    return Positioned(
      bottom: _floatBottom(bottomSafe) + 80,
      left: 0,
      right: 0,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.keyboard_arrow_up, size: 26,
                color: theme.colorScheme.primary.withOpacity(0.8)),
            Text('Slide up to lock open mic',
                style: TextStyle(
                  color: theme.colorScheme.primary.withOpacity(0.8),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                )),
          ],
        ),
      ),
    );
  }

  // ── Sheet helpers — shared styling ────────────────────────────────────────

  void _openSheet(BuildContext context, Widget child) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      // Fixed height — does NOT expand when user scrolls up
      isScrollControlled: false,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF161B22),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: child,
      ),
    );
  }

  Widget _sheetHandle() => Center(
        child: Container(
          margin: const EdgeInsets.only(top: 10, bottom: 6),
          width: 36,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.white12,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      );

  Widget _sheetTitle(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFC4B5FD), size: 20),
          const SizedBox(width: 10),
          Text(title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 17,
              )),
        ],
      ),
    );
  }

  // ── Nearby sheet ──────────────────────────────────────────────────────────

  void _showNearbySheet(BuildContext context, AppState state) {
    _openSheet(
      context,
      SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _sheetHandle(),
            _sheetTitle(Icons.radar, 'Nearby'),
            if (state.nearbyUsers.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text('No one nearby yet',
                      style: TextStyle(color: Colors.white38, fontSize: 14)),
                ),
              )
            else
              ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: state.nearbyUsers.map((user) => _nearbyTile(user, state)).toList(),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _nearbyTile(dynamic user, AppState state) {
    final userId = user.userId as String;
    final initial = userId.isNotEmpty ? userId.substring(0, 1).toUpperCase() : '?';
    final shortId = userId.length > 6 ? userId.substring(0, 6) : userId;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: const Color(0xFF6C63FF).withOpacity(0.2),
        child: Text(
          initial,
          style: const TextStyle(color: Color(0xFFC4B5FD)),
        ),
      ),
      title: Text(user.displayName ?? 'User $shortId',
          style: const TextStyle(color: Colors.white)),
      subtitle: Text(
        '${user.latitude.toStringAsFixed(4)}, ${user.longitude.toStringAsFixed(4)}',
        style: const TextStyle(color: Colors.white38, fontSize: 11),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.volume_off, size: 18, color: Colors.white38),
            onPressed: () { state.muteUser(user.userId); Navigator.pop(context); },
          ),
          IconButton(
            icon: const Icon(Icons.block, size: 18, color: Colors.redAccent),
            onPressed: () { state.blockUser(user.userId); Navigator.pop(context); },
          ),
        ],
      ),
    );
  }

  // ── Friends sheet ─────────────────────────────────────────────────────────

  void _showFriendsSheet(BuildContext context, AppState state) {
    state.loadFriends();
    state.loadPendingInvites();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: state,
        child: const _FriendsSheet(),
      ),
    );
  }

  // ── Convoy sheet ──────────────────────────────────────────────────────────

  void _showConvoySheet(BuildContext context, AppState state) {
    final nameController = TextEditingController();
    _openSheet(
      context,
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _sheetHandle(),
              _sheetTitle(Icons.groups_rounded, 'Convoy'),
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Convoy name',
                  labelStyle: const TextStyle(color: Colors.white38),
                  hintText: 'e.g. Road Trip Crew',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF21262D),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none),
                  enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF30363D))),
                  focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF6C63FF))),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    if (nameController.text.trim().isNotEmpty) {
                      state.createConvoy(nameController.text.trim());
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('Create Convoy',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF30363D)),
                    foregroundColor: Colors.white60,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                    _promptInviteCode(context, state);
                  },
                  child: const Text('Join with Code'),
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
        backgroundColor: const Color(0xFF161B22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Join Convoy', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: codeController,
          textCapitalization: TextCapitalization.characters,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            labelText: 'Invite code',
            labelStyle: TextStyle(color: Colors.white38),
            hintText: 'ABC123',
            hintStyle: TextStyle(color: Colors.white24),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white38)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF)),
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

// ─── Friends sheet widget (stateful so it can rebuild when state changes) ────

class _FriendsSheet extends StatelessWidget {
  const _FriendsSheet();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final screenHeight = MediaQuery.of(context).size.height;

    final friends = state.friends;
    final invites = state.pendingInvites;

    return DraggableScrollableSheet(
      initialChildSize: friends.isEmpty && invites.isEmpty ? 0.35 : 0.45,
      minChildSize: 0.25,
      maxChildSize: 0.85,
      builder: (ctx, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF161B22),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 6),
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                // Header row
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 8, 10),
                  child: Row(
                    children: [
                      const Icon(Icons.people_rounded, color: Color(0xFFC4B5FD), size: 20),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Friends',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const SocialTabScreen(autoFocus: true)));
                        },
                        icon: const Icon(Icons.search, size: 15, color: Color(0xFF6C63FF)),
                        label: const Text('Find People',
                            style: TextStyle(color: Color(0xFF6C63FF), fontSize: 12)),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ),

                // Content
                Expanded(
                  child: _friendsSheetContent(context, state, friends, invites, scrollController),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _friendsSheetContent(BuildContext context, AppState state, List<dynamic> friends, List<dynamic> invites,
      ScrollController scrollController) {
    if (state.isLoadingFriends && friends.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: CircularProgressIndicator(color: Color(0xFF6C63FF)),
        ),
      );
    }

    if (friends.isEmpty && invites.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.people_outline, size: 48, color: Colors.white12),
            const SizedBox(height: 12),
            const Text('No friends yet',
                style: TextStyle(color: Colors.white38, fontSize: 14)),
            const SizedBox(height: 4),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Follow other drivers to become mutual friends,\nthen invite them to convoys.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white24, fontSize: 12),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SocialTabScreen(autoFocus: true)));
              },
              icon: const Icon(Icons.search, size: 15),
              label: const Text('Find People'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF6C63FF)),
                foregroundColor: const Color(0xFF6C63FF),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      );
    }

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
      children: [
        if (invites.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Text('Convoy Invites (${invites.length})',
                style: const TextStyle(
                    color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          ...invites.map((inv) => _InviteCard(invite: inv, state: state)),
          const SizedBox(height: 12),
        ],
        if (friends.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Text('Friends (${friends.length})',
                style: const TextStyle(
                    color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          ...friends.map((f) => _FriendRow(friend: f, state: state)),
        ],
      ],
    );
  }
}

// ── Invite card in the friends sheet ─────────────────────────────────────────

class _InviteCard extends StatelessWidget {
  final dynamic invite;
  final AppState state;
  const _InviteCard({required this.invite, required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1A3A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 18,
            backgroundColor: Color(0xFF2D2555),
            child: Icon(Icons.directions_car, color: Color(0xFFC4B5FD), size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(invite['senderName'] ?? 'A friend',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text('Join: ${invite['convoyName']}',
                    style: const TextStyle(color: Colors.white38, fontSize: 11)),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _SheetIconBtn(
                icon: Icons.close,
                color: Colors.redAccent,
                onTap: () => state.respondToInvite(invite['id'], 'declined'),
              ),
              const SizedBox(width: 4),
              _SheetIconBtn(
                icon: Icons.check,
                color: const Color(0xFF10B981),
                onTap: () => state.respondToInvite(invite['id'], 'accepted'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Friend row in the friends sheet ──────────────────────────────────────────

class _FriendRow extends StatelessWidget {
  final dynamic friend;
  final AppState state;
  const _FriendRow({required this.friend, required this.state});

  @override
  Widget build(BuildContext context) {
    final bool isOnline = friend['isOnline'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2128),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF30363D), width: 1),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF21262D),
                child: const Icon(Icons.person, color: Colors.white38, size: 20),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: isOnline ? const Color(0xFF10B981) : Colors.grey.shade600,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF1C2128), width: 1.5),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              friend['displayName'] ?? 'User',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
          if (state.mode == 'convoy')
            _SheetIconBtn(
              icon: Icons.group_add,
              color: const Color(0xFF6C63FF),
              onTap: () {
                state.sendConvoyInvite(friend['id']);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Invited ${friend['displayName']} to convoy'),
                    backgroundColor: const Color(0xFF161B22),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

// ── Small icon button for sheets ─────────────────────────────────────────────

class _SheetIconBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _SheetIconBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 16),
        ),
      ),
    );
  }
}
