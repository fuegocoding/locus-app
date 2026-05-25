import 'dart:async';
import 'package:flutter/services.dart';

class OverlayService {
  static const _channel = MethodChannel('com.fuegocoding.locus/overlay');

  static bool _initialized = false;
  static bool _isRunning = false;

  static final _micToggledController = StreamController<bool>.broadcast();
  static Stream<bool> get micToggledStream => _micToggledController.stream;

  static void init() {
    if (_initialized) return;
    _initialized = true;
    _channel.setMethodCallHandler(_handleMethod);
  }

  static Future<void> _handleMethod(MethodCall call) async {
    if (call.method == 'onMicToggled') {
      final muted = call.arguments['muted'] as bool? ?? false;
      _micToggledController.add(muted);
    }
  }

  static Future<bool> canDrawOverlays() async {
    try {
      return await _channel.invokeMethod<bool>('canDrawOverlays') ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> requestOverlayPermission() async {
    try {
      await _channel.invokeMethod('requestOverlayPermission');
    } catch (_) {}
  }

  static Future<bool> isRunning() async {
    try {
      _isRunning = await _channel.invokeMethod<bool>('isOverlayRunning') ?? false;
      return _isRunning;
    } catch (_) {
      return false;
    }
  }

  static Future<void> start() async {
    if (_isRunning) return;
    try {
      await _channel.invokeMethod('startOverlay');
      _isRunning = true;
    } catch (_) {}
  }

  static Future<void> stop() async {
    if (!_isRunning) return;
    try {
      await _channel.invokeMethod('stopOverlay');
      _isRunning = false;
    } catch (_) {}
  }

  static Future<void> setMuted(bool muted) async {
    try {
      await _channel.invokeMethod('setOverlayMuted', {'muted': muted});
    } catch (_) {}
  }
}
