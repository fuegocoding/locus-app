import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/app_state.dart';
import '../services/overlay_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _overlayEnabled = false;

  @override
  void initState() {
    super.initState();
    OverlayService.init();
    OverlayService.isRunning().then((running) {
      if (mounted) setState(() => _overlayEnabled = running);
    });
  }

  Future<void> _toggleOverlay(bool enable) async {
    if (enable) {
      final canDraw = await OverlayService.canDrawOverlays();
      if (!canDraw) {
        OverlayService.requestOverlayPermission();
        return;
      }
      await OverlayService.start();
    } else {
      await OverlayService.stop();
    }
    final running = await OverlayService.isRunning();
    if (mounted) setState(() => _overlayEnabled = running);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          if (state.user != null) ...[
            _sectionHeader('Profile', theme),
            ListTile(
              leading: CircleAvatar(
                backgroundColor: theme.colorScheme.primary,
                child: Text(state.user!.displayName.substring(0, 1)),
              ),
              title: Text(state.user!.displayName),
              subtitle: Text(state.user!.phone),
            ),
            ListTile(
              leading: const Icon(Icons.qr_code, color: Color(0xFFC4B5FD)),
              title: const Text('My QR Code'),
              subtitle: const Text('Share your profile with a QR code'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showMyQr(context, state),
            ),
          ],
          _sectionHeader('Privacy', theme),
          ListTile(
            leading: const Icon(Icons.visibility),
            title: const Text('Discoverability'),
            subtitle: Text(_privacyLabel(state.user?.privacyMode ?? 'open')),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showPrivacySheet(context, state),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.masks),
            title: const Text('Anonymous Mode'),
            subtitle: const Text('Masks your username to nearby users'),
            value: state.user?.anonymousMode ?? false,
            onChanged: (v) => state.toggleAnonymousMode(v),
          ),
          _sectionHeader('Audio', theme),
          SwitchListTile(
            secondary: const Icon(Icons.mic),
            title: const Text('Push to Talk'),
            subtitle: const Text('Hold to speak, release to listen'),
            value: state.pushToTalk,
            onChanged: (v) => state.setPushToTalk(v),
          ),
          _sectionHeader('Speed Unit', theme),
          ListTile(
            leading: const Icon(Icons.speed),
            title: const Text('Display Unit'),
            subtitle: Text(_unitLabel(state.speedUnitSetting)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showSpeedUnitSheet(context, state),
          ),
          _sectionHeader('Background', theme),
          SwitchListTile(
            secondary: const Icon(Icons.phone_android),
            title: const Text('Background Service'),
            subtitle: const Text('Keep Locus active when screen is off'),
            value: true,
            onChanged: (v) {
              if (v) {
                state.startBackgroundService();
              }
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.bubble_chart, color: Color(0xFFC4B5FD)),
            title: const Text('Voice Overlay'),
            subtitle: const Text('Show a floating mic bubble over other apps'),
            value: _overlayEnabled,
            onChanged: _toggleOverlay,
          ),
          _sectionHeader('Account', theme),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () => _confirmLogout(context, state),
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever, color: Colors.red),
            title: const Text('Delete Account', style: TextStyle(color: Colors.red)),
            subtitle: const Text('Permanently delete all data', style: TextStyle(color: Colors.white38, fontSize: 12)),
            onTap: () => _confirmDelete(context, state),
          ),
          _sectionHeader('About', theme),
          const ListTile(
            title: Text('Version'),
            trailing: Text('0.1.0'),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
      child: Text(title,
        style: theme.textTheme.titleSmall?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _privacyLabel(String mode) {
    switch (mode) {
      case 'open': return 'Open - Anyone nearby';
      case 'friends-only': return 'Friends only';
      case 'convoy-only': return 'Convoy only';
      case 'invisible': return 'Invisible';
      default: return mode;
    }
  }

  String _unitLabel(String unit) {
    switch (unit) {
      case 'kmh': return 'km/h';
      case 'mph': return 'mph';
      default: return 'Auto (based on locale)';
    }
  }

  void _showSpeedUnitSheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Speed Unit', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ListTile(
              leading: const Icon(Icons.auto_mode),
              title: const Text('Default'),
              subtitle: const Text('Auto-detect based on your locale'),
              trailing: state.speedUnitSetting == 'default' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { state.setSpeedUnit('default'); Navigator.pop(context); },
            ),
            ListTile(
              leading: const Icon(Icons.speed),
              title: const Text('km/h'),
              trailing: state.speedUnitSetting == 'kmh' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { state.setSpeedUnit('kmh'); Navigator.pop(context); },
            ),
            ListTile(
              leading: const Icon(Icons.speed),
              title: const Text('mph'),
              trailing: state.speedUnitSetting == 'mph' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { state.setSpeedUnit('mph'); Navigator.pop(context); },
            ),
          ],
        ),
      ),
    );
  }

  void _showPrivacySheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Discoverability', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ListTile(
              leading: const Icon(Icons.public),
              title: const Text('Open'),
              subtitle: const Text('Anyone nearby can see and hear you'),
              trailing: state.user?.privacyMode == 'open' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { _setPrivacy(context, state, 'open'); },
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Friends Only'),
              subtitle: const Text('Only friends can see you'),
              trailing: state.user?.privacyMode == 'friends-only' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { _setPrivacy(context, state, 'friends-only'); },
            ),
            ListTile(
              leading: const Icon(Icons.groups),
              title: const Text('Convoy Only'),
              subtitle: const Text('Visible only in your active convoy'),
              trailing: state.user?.privacyMode == 'convoy-only' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { _setPrivacy(context, state, 'convoy-only'); },
            ),
            ListTile(
              leading: const Icon(Icons.visibility_off),
              title: const Text('Invisible'),
              subtitle: const Text('Completely hidden from others'),
              trailing: state.user?.privacyMode == 'invisible' ? const Icon(Icons.check, color: Colors.green) : null,
              onTap: () { _setPrivacy(context, state, 'invisible'); },
            ),
          ],
        ),
      ),
    );
  }

  void _setPrivacy(BuildContext context, AppState state, String mode) {
    state.apiService.updateProfile({'privacyMode': mode});
    state.user?.privacyMode = mode;
    Navigator.pop(context);
  }

  void _confirmDelete(BuildContext context, AppState state) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text('This will permanently delete your account and all associated data. This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final ok = await state.deleteAccount();
              if (ok && context.mounted) {
                Navigator.pop(context);
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete Everything', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, AppState state) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              state.apiService.clearToken();
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  void _showMyQr(BuildContext context, AppState state) {
    final username = state.user?.displayName ?? 'unknown';
    final inviteLink = 'https://locus.wtf/$username';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF161B22),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'My QR Code',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '@$username',
                style: const TextStyle(color: Color(0xFFC4B5FD), fontSize: 16),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: QrImageView(
                  data: inviteLink,
                  version: QrVersions.auto,
                  size: 220,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                inviteLink,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Share.share(
                      'Join me on Locus! $inviteLink',
                      subject: 'Join Locus',
                    );
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.share, size: 18),
                  label: const Text('Share Link'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
