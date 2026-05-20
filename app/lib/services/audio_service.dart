import 'dart:async';

class AudioService {
  bool _isConnected = false;
  final _connectionController = StreamController<bool>.broadcast();

  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isConnected => _isConnected;

  Future<void> connect(String url, String token) async {
    if (_isConnected) await disconnect();
    await Future.delayed(const Duration(milliseconds: 500));
    _isConnected = true;
    _connectionController.add(true);
  }

  Future<void> setPushToTalk(bool enabled) async {}
  Future<void> startSpeaking() async {}
  Future<void> stopSpeaking() async {}
  Future<void> setMuted(bool muted) async {}
  Future<void> startVideo() async {}
  Future<void> stopVideo() async {}

  Future<void> disconnect() async {
    _isConnected = false;
    _connectionController.add(false);
  }
}
