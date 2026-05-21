import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  final _positionController = StreamController<Map<String, double>>.broadcast();
  bool _isRunning = false;
  StreamSubscription<Position>? _positionStream;
  Timer? _backgroundTimer;
  Position? _lastPosition;
  bool _hasPermission = false;

  Stream<Map<String, double>> get positionStream => _positionController.stream;
  bool get isRunning => _isRunning;
  bool get hasPermission => _hasPermission;

  Future<bool> requestPermissions() async {
    final locationStatus = await Permission.location.request();
    final locationWhenInUseStatus = await Permission.locationWhenInUse.request();

    _hasPermission = locationStatus.isGranted || locationWhenInUseStatus.isGranted;

    if (!_hasPermission) {
      if (locationStatus.isPermanentlyDenied || locationWhenInUseStatus.isPermanentlyDenied) {
        await openAppSettings();
      }
    }

    return _hasPermission;
  }

  Future<bool> requestBackgroundPermission() async {
    final status = await Permission.locationAlways.request();
    return status.isGranted;
  }

  void startLocationUpdates() {
    if (_isRunning) return;
    if (!_hasPermission) return;

    _isRunning = true;

    final settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
      timeLimit: const Duration(seconds: 10),
    );

    _positionStream = Geolocator.getPositionStream(locationSettings: settings).listen(
      (Position position) {
        _lastPosition = position;
        _positionController.add({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'speed': position.speed >= 0 ? position.speed * 3.6 : 0,
          'heading': position.heading >= 0 ? position.heading : 0,
        });
      },
      onError: (error) {
        print('[Location] Error: $error');
      },
    );
  }

  void startBackgroundUpdates() {
    stopLocationUpdates();
    _isRunning = true;

    _backgroundTimer?.cancel();
    _backgroundTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 5),
        );
        _lastPosition = position;
        _positionController.add({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'speed': position.speed >= 0 ? position.speed * 3.6 : 0,
          'heading': position.heading >= 0 ? position.heading : 0,
        });
      } catch (e) {
        print('[Location] Background update error: $e');
      }
    });
  }

  Position? getLastPosition() => _lastPosition;

  Future<Position?> getLastKnownPosition() async {
    try {
      if (!_hasPermission) {
        final status = await Permission.location.status;
        _hasPermission = status.isGranted;
      }
      if (_hasPermission) {
        return await Geolocator.getLastKnownPosition();
      }
    } catch (_) {}
    return null;
  }

  void stopLocationUpdates() {
    _isRunning = false;
    _positionStream?.cancel();
    _positionStream = null;
    _backgroundTimer?.cancel();
    _backgroundTimer = null;
  }

  Future<void> startBackgroundService() async {
    final hasBg = await requestBackgroundPermission();
    if (hasBg) {
      startBackgroundUpdates();
    } else {
      startLocationUpdates();
    }
  }

  void dispose() {
    stopLocationUpdates();
    _positionController.close();
  }
}
