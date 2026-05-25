import 'dart:math';
import 'package:flutter/material.dart';

class Speedometer extends StatelessWidget {
  final double speedKmh;
  final String unit;
  final double size;

  const Speedometer({
    super.key,
    required this.speedKmh,
    this.unit = 'kmh',
    this.size = 110,
  });

  double get _displaySpeed {
    if (unit == 'mph') return speedKmh * 0.621371;
    return speedKmh;
  }

  double get _maxSpeed => unit == 'mph' ? 125 : 200;

  @override
  Widget build(BuildContext context) {
    final speed = _displaySpeed.clamp(0, _maxSpeed);
    final pct = (speed / _maxSpeed).clamp(0.0, 1.0);
    final color = _speedColor(pct);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF161B22),
              border: Border.all(
                color: const Color(0xFF6C63FF).withValues(alpha: 0.4),
                width: 2,
              ),
            ),
          ),
          CustomPaint(
            size: Size(size, size),
            painter: _ArcPainter(
              progress: pct,
              color: color,
              strokeWidth: size * 0.06,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                speed.toStringAsFixed(0),
                style: TextStyle(
                  color: Colors.white,
                  fontSize: size * 0.28,
                  fontWeight: FontWeight.bold,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                unit.toUpperCase(),
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: size * 0.12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _speedColor(double pct) {
    if (pct < 0.35) return const Color(0xFF4ADE80);
    if (pct < 0.6) return const Color(0xFFFACC15);
    if (pct < 0.8) return const Color(0xFFFB923C);
    return const Color(0xFFEF4444);
  }
}

class _ArcPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _ArcPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background track
    final trackPaint = Paint()
      ..color = Colors.white24
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi * 0.75,
      pi * 1.5,
      false,
      trackPaint,
    );

    // Progress arc
    if (progress > 0) {
      final progressPaint = Paint()
        ..color = color
        ..strokeWidth = strokeWidth
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        pi * 0.75,
        pi * 1.5 * progress,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ArcPainter old) {
    return old.progress != progress || old.color != color;
  }
}
