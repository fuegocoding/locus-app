import 'dart:async';
import 'package:livekit_client/livekit_client.dart';

class AudioService {
  Room? _room;
  bool _isConnected = false;
  bool _pushToTalk = true;
  final _connectionController = StreamController<bool>.broadcast();

  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isConnected => _isConnected;

  Future<void> connect(String url, String token) async {
    if (_isConnected) await disconnect();

    _room = Room(
      roomOptions: RoomOptions(
        defaultAudioCaptureOptions: const AudioCaptureOptions(
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        ),
        defaultAudioPublishOptions: const AudioPublishOptions(
          codec: AudioCodec.opus,
          bitrate: 32000,
        ),
      ),
    );

    _room!.addListener(_onRoomUpdate);

    try {
      await _room!.connect(url, token);
      _isConnected = true;
      _connectionController.add(true);

      if (_pushToTalk) {
        await _room!.localParticipant?.setMicrophoneEnabled(false);
      }
    } catch (e) {
      print('[Audio] Connection error: $e');
      _connectionController.add(false);
    }
  }

  void _onRoomUpdate() {
    final state = _room?.connectionState ?? ConnectionState.disconnected;
    if (state == ConnectionState.disconnected) {
      _isConnected = false;
      _connectionController.add(false);
    }
  }

  Future<void> setPushToTalk(bool enabled) async {
    _pushToTalk = enabled;
    if (!enabled && _isConnected) {
      await _room?.localParticipant?.setMicrophoneEnabled(true);
    }
  }

  Future<void> startSpeaking() async {
    if (_pushToTalk && _isConnected) {
      await _room?.localParticipant?.setMicrophoneEnabled(true);
    }
  }

  Future<void> stopSpeaking() async {
    if (_pushToTalk && _isConnected) {
      await _room?.localParticipant?.setMicrophoneEnabled(false);
    }
  }

  Future<void> setMuted(bool muted) async {
    if (_isConnected) {
      await _room?.localParticipant?.setMicrophoneEnabled(!muted);
    }
  }

  Future<void> setVolume(String participantSid, double volume) async {
    final participant = _room?.remoteParticipants.values
        .firstWhere((p) => p.sid == participantSid);
    if (participant != null) {
      await participant.setVolume(volume);
    }
  }

  Future<void> disconnect() async {
    if (_room != null) {
      await _room!.disconnect();
      _room!.removeListener(_onRoomUpdate);
      _room = null;
    }
    _isConnected = false;
    _connectionController.add(false);
  }
}
