import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _ctrl = TextEditingController();
  final _focusNode = FocusNode();

  Timer? _debounce;
  bool _checking = false;
  bool _available = false;
  String? _serverStatus; // 'available' | 'taken' | null
  String? _localError;   // format / length errors from local validation
  bool _touched = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /// Returns a local error string, or null if looks valid
  String? _localValidate(String v) {
    if (v.isEmpty) return null; // don't nag before typing
    if (v.length < 2) return 'Username must be at least 2 characters';
    if (v.length > 30) return 'Username must be 30 characters or fewer';
    if (!RegExp(r'^[a-zA-Z0-9_.\-]+$').hasMatch(v)) {
      return 'Only letters, numbers, _, . and - are allowed';
    }
    if (v.startsWith('.') || v.startsWith('-') || v.startsWith('_')) {
      return 'Username cannot start with a symbol';
    }
    return null;
  }

  void _onChanged(String v) {
    final trimmed = v.trim();
    final local = _localValidate(trimmed);

    setState(() {
      _touched = true;
      _localError = local;
      _serverStatus = null;
      _available = false;
    });

    if (local != null || trimmed.length < 2) return;

    // Debounce server availability check
    _debounce?.cancel();
    setState(() => _checking = true);
    _debounce = Timer(const Duration(milliseconds: 550), () async {
      final ok = await context.read<AppState>().checkUsername(trimmed);
      if (mounted && _ctrl.text.trim() == trimmed) {
        setState(() {
          _checking = false;
          _available = ok;
          _serverStatus = ok ? 'available' : 'taken';
        });
      }
    });
  }

  Future<void> _save() async {
    final name = _ctrl.text.trim();
    final local = _localValidate(name);
    setState(() { _touched = true; _localError = local; });
    if (local != null || !_available) return;

    final state = context.read<AppState>();
    final ok = await state.updateProfile(name);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to save username. Please try again.'),
          backgroundColor: Color(0xFFB91C1C),
        ),
      );
    }
  }

  // ─── UI helpers ──────────────────────────────────────────────────────────

  Color get _borderColor {
    if (!_touched || _ctrl.text.trim().isEmpty) return const Color(0xFF30363D);
    if (_localError != null) return const Color(0xFFEF4444);
    if (_checking) return const Color(0xFF6C63FF);
    if (_serverStatus == 'taken') return const Color(0xFFEF4444);
    if (_serverStatus == 'available') return const Color(0xFF10B981);
    return const Color(0xFF30363D);
  }

  Widget? get _suffixWidget {
    if (_ctrl.text.trim().isEmpty) return null;
    if (_localError != null) {
      return const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 20);
    }
    if (_checking) {
      return const Padding(
        padding: EdgeInsets.all(14),
        child: SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF6C63FF)),
        ),
      );
    }
    if (_serverStatus == 'available') {
      return const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20);
    }
    if (_serverStatus == 'taken') {
      return const Icon(Icons.cancel, color: Color(0xFFEF4444), size: 20);
    }
    return null;
  }

  Widget? get _statusRow {
    if (!_touched || _ctrl.text.trim().isEmpty) return null;

    // Local format errors take priority
    if (_localError != null) {
      return _errorRow(_localError!);
    }
    if (_checking) return null;
    if (_serverStatus == 'taken') {
      return _errorRow('That username is already taken — try another');
    }
    if (_serverStatus == 'available') {
      return Row(
        children: const [
          Icon(Icons.check_circle, color: Color(0xFF10B981), size: 15),
          SizedBox(width: 6),
          Text(
            'Username is available',
            style: TextStyle(color: Color(0xFF10B981), fontSize: 12.5, fontWeight: FontWeight.w500),
          ),
        ],
      );
    }
    return null;
  }

  Widget _errorRow(String msg) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 15),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            msg,
            style: const TextStyle(
              color: Color(0xFFEF4444),
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  bool get _canSave {
    return _localError == null &&
        _serverStatus == 'available' &&
        _ctrl.text.trim().length >= 2 &&
        !_checking;
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(28, 48, 28, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Icon ─────────────────────────────────────────────────────
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF6C63FF).withOpacity(0.8),
                        const Color(0xFFC4B5FD).withOpacity(0.6),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6C63FF).withOpacity(0.3),
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.person_rounded, size: 40, color: Colors.white),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Choose your username',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'This is how others see you on Locus.\nYou can change it later in Settings.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white38,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 40),

              // ── Username field ───────────────────────────────────────────
              TextField(
                controller: _ctrl,
                focusNode: _focusNode,
                maxLength: 30,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_.\-]')),
                ],
                style: const TextStyle(color: Colors.white, fontSize: 17),
                onChanged: _onChanged,
                decoration: InputDecoration(
                  labelText: 'Username',
                  labelStyle: const TextStyle(color: Colors.white38),
                  hintText: 'e.g. speedy_driver',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.18), fontSize: 14),
                  prefixIcon: const Icon(Icons.alternate_email, color: Colors.white38, size: 20),
                  suffixIcon: _suffixWidget,
                  counterText: _ctrl.text.isNotEmpty ? '${_ctrl.text.length}/30' : '',
                  counterStyle: TextStyle(
                    color: _ctrl.text.length > 28 ? const Color(0xFFEF4444) : Colors.white24,
                    fontSize: 11,
                  ),
                  filled: true,
                  fillColor: const Color(0xFF161B22),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: _borderColor, width: 1.5),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: _borderColor, width: 2),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
              ),

              // ── Status message ───────────────────────────────────────────
              if (_statusRow != null) ...[
                const SizedBox(height: 6),
                _statusRow!,
              ],

              // ── Rules hint ───────────────────────────────────────────────
              if (!_touched || _ctrl.text.trim().isEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF161B22),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF30363D)),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Username rules',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 6),
                      _RuleRow('2–30 characters'),
                      _RuleRow('Letters, numbers, _, . and -'),
                      _RuleRow('Must not start with a symbol'),
                      _RuleRow('Must be unique'),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 28),

              // ── Continue button ──────────────────────────────────────────
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: (_canSave && !state.isLoading) ? _save : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF6C63FF).withOpacity(0.3),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: state.isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text(
                          'Continue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),

              // ── Server error ─────────────────────────────────────────────
              if (state.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB91C1C).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          state.error!,
                          style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Small rule row ──────────────────────────────────────────────────────────

class _RuleRow extends StatelessWidget {
  final String text;
  const _RuleRow(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          const Icon(Icons.circle, size: 5, color: Colors.white24),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Colors.white38, fontSize: 12)),
        ],
      ),
    );
  }
}
