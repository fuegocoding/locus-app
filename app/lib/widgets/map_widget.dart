import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class MapWidget extends StatelessWidget {
  const MapWidget({super.key});
  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);
    return Container(
      color: const Color(0xFF1A1D23),
      child: Stack(children: [
        CustomPaint(painter: _MapGridPainter(), size: Size.infinite),
        if (state.nearbyUsers.isNotEmpty) ...state.nearbyUsers.take(10).map((u) {
          final angle = u.userId.hashCode % 360 * pi / 180;
          final dist = 60.0 + (u.userId.hashCode % 10) * 12.0;
          final isSpeaking = state.speaking[u.userId] == true;
          final isPinned = state.user?.pins.contains(u.userId) ?? false;
          return Positioned(top: 120 + sin(angle) * dist, left: MediaQuery.of(context).size.width / 2 - 24 + cos(angle) * dist,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 40, height: 40,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: isSpeaking ? theme.colorScheme.primary : isPinned ? Colors.amber : theme.colorScheme.primary.withOpacity(0.5),
                  border: Border.all(color: isPinned ? Colors.amber : theme.colorScheme.primary, width: isSpeaking ? 3 : 1.5),
                  boxShadow: isSpeaking ? [BoxShadow(color: theme.colorScheme.primary.withOpacity(0.4), blurRadius: 12, spreadRadius: 2)] : null),
                child: Center(child: Text('${((state.volumes[u.userId] ?? 0.5) * 100).round()}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)))),
              const SizedBox(height: 2),
              Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(4)),
                child: Text(u.userId.substring(0, 5), style: const TextStyle(fontSize: 8, color: Colors.white70))),
            ]));
        }),
        Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.my_location, size: 48, color: theme.colorScheme.primary),
          const SizedBox(height: 4),
          Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(8)),
            child: Text(state.latitude != 0 ? '${state.latitude.toStringAsFixed(6)}, ${state.longitude.toStringAsFixed(6)}' : 'Simulating GPS...',
              style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.white70))),
        ])),
      ]),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = const Color(0xFF21262D)..strokeWidth = 0.5;
    for (double x = 0; x < size.width; x += 40) canvas.drawLine(Offset(x, 0), Offset(x, size.height), p);
    for (double y = 0; y < size.height; y += 40) canvas.drawLine(Offset(0, y), Offset(size.width, y), p);
    final mp = Paint()..color = const Color(0xFF30363D)..strokeWidth = 1.0;
    final cx = size.width / 2; final cy = size.height / 2;
    canvas.drawCircle(Offset(cx, cy), size.width * 0.45, mp);
    canvas.drawCircle(Offset(cx, cy), size.width * 0.25, mp);
    canvas.drawCircle(Offset(cx, cy), size.width * 0.08, mp);
    canvas.drawLine(Offset(cx - 12, cy), Offset(cx + 12, cy), mp..strokeWidth = 2);
    canvas.drawLine(Offset(cx, cy - 12), Offset(cx, cy + 12), mp);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
