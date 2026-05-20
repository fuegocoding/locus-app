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
            title: const Text('Visibility'),
            subtitle: Text(state.user?.privacyMode ?? 'open'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showPrivacySheet(context, state),
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
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('Friends Only'),
              subtitle: const Text('Only friends can see you'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.groups),
              title: const Text('Convoy Only'),
              subtitle: const Text('Visible only in your active convoy'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.visibility_off),
              title: const Text('Invisible'),
              subtitle: const Text('Completely hidden from others'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
