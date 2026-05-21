import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Country data — flag emoji + dial code + min/max digits for local number
// ─────────────────────────────────────────────────────────────────────────────
class _Country {
  final String flag;
  final String name;
  final String code; // e.g. "+1"
  final int minLen; // min local digits (excluding country code)
  final int maxLen;

  const _Country(this.flag, this.name, this.code, this.minLen, this.maxLen);
}

const List<_Country> _countries = [
  _Country('🇨🇦', 'Canada', '+1', 10, 10),
  _Country('🇺🇸', 'United States', '+1', 10, 10),
  _Country('🇬🇧', 'United Kingdom', '+44', 10, 10),
  _Country('🇫🇷', 'France', '+33', 9, 9),
  _Country('🇩🇪', 'Germany', '+49', 10, 11),
  _Country('🇯🇵', 'Japan', '+81', 10, 10),
  _Country('🇰🇷', 'South Korea', '+82', 9, 10),
  _Country('🇧🇷', 'Brazil', '+55', 10, 11),
  _Country('🇮🇳', 'India', '+91', 10, 10),
  _Country('🇨🇳', 'China', '+86', 11, 11),
  _Country('🇷🇺', 'Russia', '+7', 10, 10),
  _Country('🇦🇺', 'Australia', '+61', 9, 9),
  _Country('🇲🇽', 'Mexico', '+52', 10, 10),
  _Country('🇿🇦', 'South Africa', '+27', 9, 9),
  _Country('🇦🇷', 'Argentina', '+54', 10, 10),
  _Country('🇳🇬', 'Nigeria', '+234', 10, 10),
  _Country('🇪🇬', 'Egypt', '+20', 10, 10),
  _Country('🇸🇦', 'Saudi Arabia', '+966', 9, 9),
  _Country('🇦🇪', 'UAE', '+971', 9, 9),
  _Country('🇨🇭', 'Switzerland', '+41', 9, 9),
  _Country('🇳🇱', 'Netherlands', '+31', 9, 9),
  _Country('🇧🇪', 'Belgium', '+32', 9, 9),
  _Country('🇪🇸', 'Spain', '+34', 9, 9),
  _Country('🇮🇹', 'Italy', '+39', 9, 10),
  _Country('🇵🇹', 'Portugal', '+351', 9, 9),
  _Country('🇸🇪', 'Sweden', '+46', 9, 9),
  _Country('🇳🇴', 'Norway', '+47', 8, 8),
  _Country('🇩🇰', 'Denmark', '+45', 8, 8),
  _Country('🇵🇱', 'Poland', '+48', 9, 9),
  _Country('🇹🇷', 'Turkey', '+90', 10, 10),
  _Country('🇮🇩', 'Indonesia', '+62', 9, 12),
  _Country('🇵🇭', 'Philippines', '+63', 10, 10),
  _Country('🇹🇭', 'Thailand', '+66', 9, 9),
  _Country('🇻🇳', 'Vietnam', '+84', 9, 10),
  _Country('🇲🇾', 'Malaysia', '+60', 9, 10),
  _Country('🇸🇬', 'Singapore', '+65', 8, 8),
  _Country('🇵🇰', 'Pakistan', '+92', 10, 10),
  _Country('🇧🇩', 'Bangladesh', '+880', 10, 10),
  _Country('🇨🇴', 'Colombia', '+57', 10, 10),
  _Country('🇨🇱', 'Chile', '+56', 9, 9),
  _Country('🇵🇪', 'Peru', '+51', 9, 9),
  _Country('🇺🇦', 'Ukraine', '+380', 9, 9),
  _Country('🇮🇱', 'Israel', '+972', 9, 9),
  _Country('🇬🇭', 'Ghana', '+233', 9, 9),
  _Country('🇰🇪', 'Kenya', '+254', 9, 9),
  _Country('🇿🇼', 'Zimbabwe', '+263', 9, 9),
  _Country('🇳🇿', 'New Zealand', '+64', 8, 9),
  _Country('🇮🇪', 'Ireland', '+353', 9, 9),
  _Country('🇬🇷', 'Greece', '+30', 10, 10),
  _Country('🇨🇿', 'Czech Republic', '+420', 9, 9),
  _Country('🇭🇺', 'Hungary', '+36', 9, 9),
  _Country('🇷🇴', 'Romania', '+40', 9, 9),
  _Country('🇧🇬', 'Bulgaria', '+359', 9, 9),
  _Country('🇸🇰', 'Slovakia', '+421', 9, 9),
  _Country('🇭🇷', 'Croatia', '+385', 8, 9),
  _Country('🇷🇸', 'Serbia', '+381', 8, 9),
  _Country('🇦🇹', 'Austria', '+43', 10, 11),
  _Country('🇫🇮', 'Finland', '+358', 9, 10),
  _Country('🇧🇾', 'Belarus', '+375', 9, 9),
  _Country('🇰🇿', 'Kazakhstan', '+7', 10, 10),
  _Country('🇺🇿', 'Uzbekistan', '+998', 9, 9),
  _Country('🇮🇷', 'Iran', '+98', 10, 10),
  _Country('🇮🇶', 'Iraq', '+964', 10, 10),
  _Country('🇲🇦', 'Morocco', '+212', 9, 9),
  _Country('🇩🇿', 'Algeria', '+213', 9, 9),
  _Country('🇹🇳', 'Tunisia', '+216', 8, 8),
  _Country('🇱🇾', 'Libya', '+218', 9, 9),
  _Country('🇸🇩', 'Sudan', '+249', 9, 9),
  _Country('🇪🇹', 'Ethiopia', '+251', 9, 9),
  _Country('🇹🇿', 'Tanzania', '+255', 9, 9),
  _Country('🇨🇲', 'Cameroon', '+237', 8, 9),
  _Country('🇸🇳', 'Senegal', '+221', 9, 9),
  _Country('🇨🇮', "Côte d'Ivoire", '+225', 8, 10),
  _Country('🇦🇴', 'Angola', '+244', 9, 9),
  _Country('🇲🇿', 'Mozambique', '+258', 9, 9),
  _Country('🇪🇨', 'Ecuador', '+593', 9, 9),
  _Country('🇻🇪', 'Venezuela', '+58', 10, 10),
  _Country('🇧🇴', 'Bolivia', '+591', 8, 8),
  _Country('🇵🇾', 'Paraguay', '+595', 9, 9),
  _Country('🇺🇾', 'Uruguay', '+598', 8, 8),
  _Country('🇨🇷', 'Costa Rica', '+506', 8, 8),
  _Country('🇬🇹', 'Guatemala', '+502', 8, 8),
  _Country('🇸🇻', 'El Salvador', '+503', 8, 8),
  _Country('🇭🇳', 'Honduras', '+504', 8, 8),
  _Country('🇳🇮', 'Nicaragua', '+505', 8, 8),
  _Country('🇵🇦', 'Panama', '+507', 8, 8),
  _Country('🇩🇴', 'Dominican Republic', '+1', 10, 10),
  _Country('🇯🇲', 'Jamaica', '+1', 10, 10),
  _Country('🇹🇹', 'Trinidad & Tobago', '+1', 10, 10),
  _Country('🇧🇧', 'Barbados', '+1', 10, 10),
  _Country('🇵🇷', 'Puerto Rico', '+1', 10, 10),
];

// ─────────────────────────────────────────────────────────────────────────────

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();

  _Country _selectedCountry = _countries[0]; // default Canada
  bool _codeSent = false;
  String _phone = '';

  // Phone validation state
  String? _phoneError;
  bool _phoneTouched = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  // ─── Phone validation ───────────────────────────────────────────────────

  String? _validatePhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return 'Phone number is required';
    if (digits.length < _selectedCountry.minLen) {
      return 'Too short — ${_selectedCountry.name} numbers need '
          '${_selectedCountry.minLen} digits (you entered ${digits.length})';
    }
    if (digits.length > _selectedCountry.maxLen) {
      return 'Too long — ${_selectedCountry.name} numbers have '
          'at most ${_selectedCountry.maxLen} digits';
    }
    return null;
  }

  String _buildE164() {
    final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    return '${_selectedCountry.code}$digits';
  }

  void _onPhoneChanged(String v) {
    if (!_phoneTouched) return;
    setState(() => _phoneError = _validatePhone(v));
  }

  Future<void> _sendCode(AppState state) async {
    setState(() {
      _phoneTouched = true;
      _phoneError = _validatePhone(_phoneController.text);
    });
    if (_phoneError != null) return;

    _phone = _buildE164();
    await state.sendVerificationCode(_phone);
    if (state.error == null && mounted) {
      setState(() => _codeSent = true);
    }
  }

  // ─── Country picker ─────────────────────────────────────────────────────

  void _pickCountry() {
    final searchCtrl = TextEditingController();
    List<_Country> filtered = List.from(_countries);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheet) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: Color(0xFF161B22),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Handle
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                  child: TextField(
                    controller: searchCtrl,
                    autofocus: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search country…',
                      hintStyle: const TextStyle(color: Colors.white38),
                      prefixIcon: const Icon(Icons.search, color: Colors.white54),
                      filled: true,
                      fillColor: const Color(0xFF21262D),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onChanged: (q) {
                      setSheet(() {
                        filtered = _countries
                            .where((c) =>
                                c.name.toLowerCase().contains(q.toLowerCase()) ||
                                c.code.contains(q))
                            .toList();
                      });
                    },
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final c = filtered[i];
                      final selected = c.code == _selectedCountry.code &&
                          c.name == _selectedCountry.name;
                      return ListTile(
                        leading: Text(c.flag, style: const TextStyle(fontSize: 26)),
                        title: Text(
                          c.name,
                          style: TextStyle(
                            color: selected ? const Color(0xFFC4B5FD) : Colors.white,
                            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        trailing: Text(
                          c.code,
                          style: TextStyle(
                            color: selected ? const Color(0xFFC4B5FD) : Colors.white54,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        onTap: () {
                          setState(() {
                            _selectedCountry = c;
                            if (_phoneTouched) {
                              _phoneError = _validatePhone(_phoneController.text);
                            }
                          });
                          Navigator.pop(ctx);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    final hasPhoneError = _phoneError != null;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(28, 48, 28, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Logo ──────────────────────────────────────────────────
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Image.asset(
                  'assets/icon/app_icon.png',
                  width: 80,
                  height: 80,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Locus',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _codeSent
                    ? 'Enter the 6-digit code sent to\n$_phone'
                    : 'Proximity voice chat.\nTalk to people around you.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: Colors.white54,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 48),

              // ── Phone entry ────────────────────────────────────────────
              if (!_codeSent) ...[
                // Country picker row
                GestureDetector(
                  onTap: _pickCountry,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF161B22),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: hasPhoneError
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF30363D),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(_selectedCountry.flag, style: const TextStyle(fontSize: 22)),
                        const SizedBox(width: 10),
                        Text(
                          _selectedCountry.name,
                          style: const TextStyle(color: Colors.white70, fontSize: 15),
                        ),
                        const Spacer(),
                        Text(
                          _selectedCountry.code,
                          style: const TextStyle(
                            color: Color(0xFFC4B5FD),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.expand_more, color: Colors.white38, size: 20),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Phone number field (local number only)
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d\s\-\(\)]'))],
                  style: const TextStyle(color: Colors.white, fontSize: 17),
                  onChanged: _onPhoneChanged,
                  decoration: InputDecoration(
                    hintText:
                        '${'0' * _selectedCountry.minLen}  (${_selectedCountry.minLen} digits)',
                    hintStyle: const TextStyle(color: Colors.white24, fontSize: 14),
                    prefixText: '${_selectedCountry.code} ',
                    prefixStyle: const TextStyle(
                      color: Color(0xFFC4B5FD),
                      fontWeight: FontWeight.w600,
                      fontSize: 17,
                    ),
                    filled: true,
                    fillColor: const Color(0xFF161B22),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: hasPhoneError ? const Color(0xFFEF4444) : const Color(0xFF30363D),
                        width: 1.5,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: hasPhoneError
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF6C63FF),
                        width: 2,
                      ),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFEF4444), width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),

                // Phone error message
                if (hasPhoneError) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 15),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _phoneError!,
                          style: const TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 24),
                _PrimaryButton(
                  label: 'Send Code',
                  isLoading: state.isLoading,
                  onPressed: () => _sendCode(state),
                ),
              ]

              // ── OTP entry ──────────────────────────────────────────────
              else ...[
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    letterSpacing: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  decoration: InputDecoration(
                    hintText: '···  ···',
                    hintStyle: TextStyle(
                      color: Colors.white.withOpacity(0.15),
                      fontSize: 24,
                      letterSpacing: 8,
                    ),
                    counterText: '',
                    filled: true,
                    fillColor: const Color(0xFF161B22),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF30363D), width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF6C63FF), width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                ),
                const SizedBox(height: 24),
                _PrimaryButton(
                  label: 'Verify',
                  isLoading: state.isLoading,
                  onPressed: () async {
                    final code = _codeController.text.trim();
                    if (code.length < 4) return;
                    final success = await state.verifyCode(_phone, code);
                    if (!success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Invalid or expired code — please try again.'),
                          backgroundColor: Color(0xFFB91C1C),
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => setState(() {
                    _codeSent = false;
                    _codeController.clear();
                  }),
                  child: const Text(
                    'Change number',
                    style: TextStyle(color: Colors.white38, fontSize: 13),
                  ),
                ),
              ],

              // ── Server error ───────────────────────────────────────────
              if (state.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB91C1C).withOpacity(0.15),
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
                          style: const TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 13,
                          ),
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

// ─── Reusable primary button ─────────────────────────────────────────────────

class _PrimaryButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final VoidCallback onPressed;

  const _PrimaryButton({
    required this.label,
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 54,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF6C63FF),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF6C63FF).withOpacity(0.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Text(
                label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }
}
