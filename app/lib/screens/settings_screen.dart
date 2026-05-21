import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

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
}
