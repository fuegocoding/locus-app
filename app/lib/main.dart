import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/onboarding_screen.dart';
import 'screens/profile_setup_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C63FF), brightness: Brightness.dark),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF0D1117),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF161B22), selectedItemColor: Color(0xFF6C63FF), unselectedItemColor: Color(0xFF8B949E)),
      ),
      builder: (context, child) {
        if (!isMobile && kIsWeb) {
          return Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 430),
            child: Container(decoration: BoxDecoration(border: Border.all(color: const Color(0xFF30363D))), child: child!)));
        }
        return child!;
      },
      home: Consumer<AppState>(builder: (context, state, _) {
        if (!state.isAuthenticated) return const OnboardingScreen();
        if (!state.hasProfile) return const ProfileSetupScreen();
        return const HomeScreen();
      }),
    );
  }
}
