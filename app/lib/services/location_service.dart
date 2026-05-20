import 'dart:async';
import 'dart:math';

class LocationService {
  final _positionController = StreamController<Map<String, double>>.broadcast();
  bool _isRunning = false;
  Timer? _timer;

  Stream<Map<String, double>> get positionStream => _positionController.stream;
  bool get isRunning => _isRunning;

  Future<bool> requestPermissions() async => true;

  void startLocationUpdates() {
    if (_isRunning) return;
    _isRunning = true;
    const lat = 40.7128;
    const lng = -74.0060;
    double currentSpeed = 0;
    _timer = Timer.periodic(const Duration(seconds: 2), (_) {
      // Simulate realistic car acceleration/deceleration
      final change = (Random().nextDouble() - 0.4) * 15;
      currentSpeed = (currentSpeed + change).clamp(0, 140);
      _positionController.add({
        'latitude': lat + Random().nextDouble() * 0.005,
        'longitude': lng + Random().nextDouble() * 0.005,
        'speed': currentSpeed,
        'heading': Random().nextDouble() * 360,
      });
    });
  }

  void stopLocationUpdates() { _isRunning = false; _timer?.cancel(); }
  Future<void> startBackgroundService() async {}
  void dispose() { stopLocationUpdates(); _positionController.close(); }
}
