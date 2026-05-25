import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/profile_setup_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  ErrorWidget.builder = (details) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: const Color(0xFF0D1117),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Something went wrong',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'sans-serif'),
                ),
                const SizedBox(height: 8),
                Text(
                  details.exceptionAsString(),
                  style: const TextStyle(color: Colors.white54, fontSize: 12, fontFamily: 'sans-serif'),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  };

  runApp(ChangeNotifierProvider(create: (_) => AppState(), child: const LocusApp()));
}

class LocusApp extends StatelessWidget {
  const LocusApp({super.key});

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    return MaterialApp(
      title: 'Locus',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(context, Brightness.dark),
      builder: (context, child) {
        if (!isMobile && kIsWeb) {
          return Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 430),
            child: Container(decoration: BoxDecoration(border: Border.all(color: const Color(0xFF30363D))), child: child!)));
        }
        return child!;
      },
      home: const AppEntry(),
    );
  }

  ThemeData _buildTheme(BuildContext context, Brightness brightness) {
    final base = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C63FF), brightness: brightness),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFF0D1117),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF161B22), selectedItemColor: Color(0xFF6C63FF), unselectedItemColor: Color(0xFF8B949E)),
    );

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      return base.copyWith(
        appBarTheme: AppBarTheme(
          backgroundColor: const Color(0xFF1A1D23).withOpacity(0.7),
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        cardTheme: const CardThemeData(
          color: Color(0xFF21262D),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
        ),
        bottomSheetTheme: BottomSheetThemeData(
          backgroundColor: const Color(0xFF161B22).withOpacity(0.9),
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        ),
      );
    }

    return base;
  }
}

class AppEntry extends StatefulWidget {
  const AppEntry({super.key});

  @override
  State<AppEntry> createState() => _AppEntryState();
}

class _AppEntryState extends State<AppEntry> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await context.read<AppState>().init();
    setState(() => _initialized = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) return const SplashScreen();

    return Consumer<AppState>(builder: (context, state, _) {
      if (state.error != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!), action: SnackBarAction(label: 'Dismiss', onPressed: state.clearError)),
          );
        });
      }

      if (!state.isAuthenticated) return const OnboardingScreen();
      if (!state.hasProfile) return const ProfileSetupScreen();
      return const HomeScreen();
    });
  }
}
