import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _ctrl = TextEditingController();
  String _status = '';
  bool _checking = false;
  bool _available = false;
  Timer? _debounce;

  @override
  void dispose() { _ctrl.dispose(); _debounce?.cancel(); super.dispose(); }

  void _onChanged(String v) {
    _debounce?.cancel();
    if (v.trim().length < 2) { setState(() => _status = ''); return; }
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      setState(() => _checking = true);
      final ok = await context.read<AppState>().checkUsername(v.trim());
      if (mounted) setState(() { _checking = false; _available = ok; _status = ok ? 'Available' : 'Taken'; });
    });
  }

  Future<void> _save() async {
    final name = _ctrl.text.trim();
    if (name.length >= 2 && _available) {
      final state = context.read<AppState>();
      if (!await state.updateProfile(name) && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save')));
      }
    }
  }

  void _skip() {
    // Mark profile as "completed" by keeping default name
    // hasProfile returns false if displayName starts with 'User_'
    // So we need to update to something that doesn't start with 'User_'
    // Just use a random valid username or keep the generated one
    final state = context.read<AppState>();
    // Update with the current auto-generated name so hasProfile becomes true
    final currentName = state.user?.displayName ?? '';
    if (currentName.isNotEmpty) {
      state.updateProfile(currentName);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final ok = _available && _ctrl.text.trim().length >= 2;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.person_add, size: 64, color: theme.colorScheme.primary),
              const SizedBox(height: 16),
              Text('Choose your username',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('This is how others will see you.\nNo two users can have the same name.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6))),
              const SizedBox(height: 32),
              TextField(
                controller: _ctrl,
                maxLength: 30,
                onChanged: _onChanged,
                decoration: InputDecoration(
                  labelText: 'Username',
                  hintText: 'Your display name',
                  prefixIcon: const Icon(Icons.person),
                  suffixIcon: _checking
                    ? const Padding(padding: EdgeInsets.all(14), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
                    : _status.isNotEmpty
                      ? Padding(padding: const EdgeInsets.all(14), child: Text(_status, style: TextStyle(color: _available ? Colors.green : Colors.red, fontWeight: FontWeight.bold, fontSize: 12)))
                      : null,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: (ok && !state.isLoading) ? _save : null,
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: state.isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Continue'),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(onPressed: _skip, child: const Text('Skip for now')),
            ],
          ),
        ),
      ),
    );
  }
}
