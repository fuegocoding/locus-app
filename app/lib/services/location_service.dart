import 'dart:async';
import 'package:location/location.dart' as loc;
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_background_service/flutter_background_service.dart';

class LocationService {
  final loc.Location _location = loc.Location();
  StreamSubscription<loc.LocationData>? _subscription;
  final _positionController = StreamController<loc.LocationData>.broadcast();
  bool _isRunning = false;

  Stream<loc.LocationData> get positionStream => _positionController.stream;
  bool get isRunning => _isRunning;

  Future<bool> requestPermissions() async {
    final locStatus = await Permission.location.request();
    final micStatus = await Permission.microphone.request();

    if (locStatus.isGranted) {
      final serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        final result = await _location.requestService();
        if (!result) return false;
      }
    }

    if (await Permission.locationAlways.isGranted) {
      await _location.changeSettings(accuracy: loc.LocationAccuracy.high, interval: 1000);
    }

    return locStatus.isGranted && micStatus.isGranted;
  }

  void startLocationUpdates() {
    if (_isRunning) return;
    _isRunning = true;

    _location.changeSettings(
      accuracy: loc.LocationAccuracy.high,
      distanceFilter: 5,
      interval: 1000,
    );

    _subscription = _location.onLocationChanged.listen((data) {
      if (data.latitude != null && data.longitude != null) {
        _positionController.add(data);
      }
    });
  }

  void stopLocationUpdates() {
    _isRunning = false;
    _subscription?.cancel();
    _subscription = null;
  }

  Future<void> startBackgroundService() async {
    final service = FlutterBackgroundService();

    final configured = await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: _onBackgroundStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'locus_location',
        foregroundServiceNotificationId: 888,
        initialNotificationTitle: 'Locus is active',
        initialNotificationContent: 'Sharing your location',
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: null,
        onBackground: null,
      ),
    );

    if (configured) {
      await service.startService();
    }
  }

  void stopBackgroundService() {
    final service = FlutterBackgroundService();
    service.invoke('stopService');
  }

  void dispose() {
    stopLocationUpdates();
    _positionController.close();
  }
}

@pragma('vm:entry-point')
void _onBackgroundStart(ServiceInstance service) async {
  // Background GPS updates handled by platform-specific native code
  // Flutter isolate can't access location in background on iOS
}
