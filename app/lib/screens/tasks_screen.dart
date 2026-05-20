import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class TasksScreen extends StatelessWidget {
  const TasksScreen({super.key});

  void _showEarnDialog(BuildContext context, String taskType) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Coming Soon'),
        content: Text('$taskType will be available in a future update.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final points = state.user?.points ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Tasks')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.stars, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$points Points', style: theme.textTheme.titleMedium),
                      Text('Complete tasks to earn points',
                        style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('Available Tasks', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          _taskTile(
            context,
            icon: Icons.person_add,
            title: 'Refer a Friend',
            subtitle: 'Share your invite link',
            points: 100,
            onTap: () => _showEarnDialog(context, 'Referral rewards'),
          ),
          _taskTile(
            context,
            icon: Icons.play_circle,
            title: 'Watch an Ad',
            subtitle: 'Watch a short video for points',
            points: 25,
            onTap: () => _showEarnDialog(context, 'Ad watching'),
          ),
          _taskTile(
            context,
            icon: Icons.check_circle,
            title: 'Complete Your Profile',
            subtitle: 'Add an avatar and vehicle tag',
            points: 50,
            onTap: () => _showEarnDialog(context, 'Profile completion'),
          ),
          const SizedBox(height: 24),
          Text('Premium Features', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          _premiumTile(
            context,
            icon: Icons.push_pin,
            title: 'Unlimited Pins',
            subtitle: 'Pin anyone, no limit',
            cost: 200,
          ),
          _premiumTile(
            context,
            icon: Icons.people,
            title: 'Larger Convoys',
            subtitle: 'Up to 20 members',
            cost: 300,
          ),
          _premiumTile(
            context,
            icon: Icons.zoom_out_map,
            title: 'Extended Radius',
            subtitle: 'Hear people up to 5 miles away',
            cost: 150,
          ),
          _premiumTile(
            context,
            icon: Icons.high_quality,
            title: 'Priority Audio',
            subtitle: 'Higher quality voice codec',
            cost: 250,
          ),
          _premiumTile(
            context,
            icon: Icons.palette,
            title: 'Custom Theme',
            subtitle: 'Unlock exclusive themes',
            cost: 100,
          ),
        ],
      ),
    );
  }

  Widget _taskTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required int points,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: theme.colorScheme.primary),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text('+$points pts',
            style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _premiumTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required int cost,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: Colors.amber),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text('$cost pts',
            style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
        ),
        onTap: () {},
      ),
    );
  }
}
