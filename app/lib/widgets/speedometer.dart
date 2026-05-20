import 'dart:math';
import 'package:flutter/material.dart';

class Speedometer extends StatelessWidget {
  final double speedKmh;
  final String unit; // 'kmh' | 'mph'

  const Speedometer({
    super.key,
    required this.speedKmh,
    this.unit = 'kmh',
  });

  double get _displaySpeed {
    if (unit == 'mph') return speedKmh * 0.621371;
    return speedKmh;
  }

  double get _maxSpeed => unit == 'mph' ? 120 : 200;

  @override
  Widget build(BuildContext context) {
    final speed = _displaySpeed.clamp(0, _maxSpeed);
    final theme = Theme.of(context);

    return Container(
      width: 110,
      height: 90,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: CustomPaint(
        painter: _SpeedometerPainter(
          speed: speed.toDouble(),
          maxSpeed: _maxSpeed,
          unit: unit.toUpperCase(),
        ),
      ),
    );
  }
}

class _SpeedometerPainter extends CustomPainter {
  final double speed;
  final double maxSpeed;
  final String unit;

  _SpeedometerPainter({
    required this.speed,
    required this.maxSpeed,
    required this.unit,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height - 8);
    final radius = size.width * 0.42;

    // Background arc (grey track)
    final trackPaint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + 0.3,
      pi - 0.6,
      false,
      trackPaint,
    );

    // Speed arc (colored)
    final pct = (speed / maxSpeed).clamp(0.0, 1.0);
    final sweepAngle = (pi - 0.6) * pct;

    final color = _speedColor(pct);
    final speedPaint = Paint()
      ..color = color
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + 0.3,
      sweepAngle,
      false,
      speedPaint,
    );

    // Tick marks
    final tickPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..strokeWidth = 1;

    for (int i = 0; i <= 4; i++) {
      final tickPct = i / 4;
      final tickAngle = pi + 0.3 + (pi - 0.6) * tickPct;
      final inner = center + Offset(cos(tickAngle) * (radius - 8), sin(tickAngle) * (radius - 8));
      final outer = center + Offset(cos(tickAngle) * (radius + 2), sin(tickAngle) * (radius + 2));
      canvas.drawLine(inner, outer, tickPaint);
    }

    // Digital speed
    final speedText = speed.toStringAsFixed(0);
    final textPainter = TextPainter(
      text: TextSpan(
        text: speedText,
        style: TextStyle(
          color: Colors.white,
          fontSize: 22,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          shadows: [
            Shadow(
              color: color.withOpacity(0.6),
              blurRadius: 8,
            ),
          ],
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - 28),
    );

    // Unit label
    final unitPainter = TextPainter(
      text: TextSpan(
        text: unit,
        style: TextStyle(
          color: Colors.white.withOpacity(0.5),
          fontSize: 9,
          fontWeight: FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    unitPainter.layout();
    unitPainter.paint(
      canvas,
      Offset(center.dx - unitPainter.width / 2, center.dy - 12),
    );

    // Glow dot at needle position
    if (pct > 0) {
      final needleAngle = pi + 0.3 + sweepAngle;
      final needlePos = center + Offset(cos(needleAngle) * radius, sin(needleAngle) * radius);
      final glowPaint = Paint()
        ..color = color.withOpacity(0.8)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
      canvas.drawCircle(needlePos, 3, glowPaint);
      canvas.drawCircle(needlePos, 2, Paint()..color = Colors.white);
    }
  }

  Color _speedColor(double pct) {
    if (pct < 0.35) return const Color(0xFF4ADE80); // green
    if (pct < 0.6) return const Color(0xFFFACC15);   // yellow
    if (pct < 0.8) return const Color(0xFFFB923C);   // orange
    return const Color(0xFFEF4444);                   // red
  }

  @override
  bool shouldRepaint(covariant _SpeedometerPainter old) {
    return old.speed != speed || old.unit != unit;
  }
}
