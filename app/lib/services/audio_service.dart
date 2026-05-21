import 'dart:async';
import 'package:flutter_webrtc/flutter_webrtc.dart' as rtc;
import 'package:livekit_client/livekit_client.dart';

class AudioService {
  Room? _room;
  EventsListener<RoomEvent>? _roomListener;
  bool _isConnected = false;
  bool _isMuted = false;
  bool _pushToTalk = false;
  bool _isSpeaking = false;
  bool _videoEnabled = false;
  final _connectionController = StreamController<bool>.broadcast();
  final _speakingController = StreamController<String>.broadcast();
  final _volumeController = StreamController<Map<String, double>>.broadcast();
  final Map<String, double> _volumes = {};
  String? _currentRoom;
  String? _currentToken;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  static const int maxReconnectAttempts = 5;

  Stream<bool> get connectionStream => _connectionController.stream;
  Stream<String> get speakingStream => _speakingController.stream;
  Stream<Map<String, double>> get volumeStream => _volumeController.stream;
  bool get isConnected => _isConnected;
  bool get isMuted => _isMuted;
  bool get pushToTalk => _pushToTalk;
  bool get isSpeaking => _isSpeaking;
  bool get videoEnabled => _videoEnabled;

  Future<void> connect(String url, String token) async {
    if (_isConnected) await disconnect();

    _currentRoom = url;
    _currentToken = token;
    _reconnectAttempts = 0;

    try {
      final room = Room(
        roomOptions: const RoomOptions(
          adaptiveStream: false,
          dynacast: false,
          defaultAudioPublishOptions: AudioPublishOptions(
            name: 'microphone',
            dtx: true,
            red: false,
            audioBitrate: 64000,
          ),
        ),
      );

      await room.connect(
        url,
        token,
      );

      _room = room;
      _isConnected = true;
      _connectionController.add(true);

      room.addListener(() {
        if (room.connectionState == ConnectionState.disconnected) {
          _isConnected = false;
          _connectionController.add(false);
          _handleReconnect();
        }
      });

      _roomListener = room.createListener()
        ..on<TrackSubscribedEvent>((event) {
          if (event.track.kind == TrackType.AUDIO) {
            _applyVolume(event.participant.identity, _volumes[event.participant.identity] ?? 1.0);
          }
        })
        ..on<TrackStreamStateUpdatedEvent>((event) {
          if (event.publication.kind == TrackType.AUDIO) {
            _speakingController.add(event.participant.identity);
          }
        });

      print('[Audio] Connected to room');
    } catch (e) {
      print('[Audio] Connection error: $e');
      _connectionController.add(false);
      _handleReconnect();
      rethrow;
    }
  }

  Future<void> reconnect(String url, String token) async {
    await disconnect();
    await connect(url, token);
  }

  void _handleReconnect() {
    if (_reconnectAttempts >= maxReconnectAttempts) {
      print('[Audio] Max reconnect attempts reached');
      return;
    }

    if (_currentRoom == null || _currentToken == null) return;

    _reconnectAttempts++;
    final delay = _reconnectAttempts * 2000;

    print('[Audio] Reconnecting in ${delay}ms (attempt $_reconnectAttempts)');
    _reconnectTimer = Timer(Duration(milliseconds: delay), () async {
      try {
        await connect(_currentRoom!, _currentToken!);
      } catch (e) {
        print('[Audio] Reconnect failed: $e');
      }
    });
  }

  Future<void> setPushToTalk(bool enabled) async {
    _pushToTalk = enabled;
    if (enabled && _isMuted) {
      await setMuted(true);
    }
  }

  Future<void> startSpeaking() async {
    if (!_isConnected || _room == null) return;
    _isSpeaking = true;
    await setMuted(false);
  }

  Future<void> stopSpeaking() async {
    if (!_isConnected || _room == null) return;
    _isSpeaking = false;
    if (_pushToTalk) {
      await setMuted(true);
    }
  }

  Future<void> setMuted(bool muted) async {
    if (_room == null) return;

    _isMuted = muted;
    await _room!.localParticipant?.setMicrophoneEnabled(!muted);
  }

  Future<void> applyVolume(String participantIdentity, double volume) async {
    _volumes[participantIdentity] = volume;
    if (_room != null) {
      _applyVolume(participantIdentity, volume);
    }
  }

  void _applyVolume(String participantIdentity, double volume) {
    if (_room == null) return;

    final clampedVolume = volume.clamp(0.0, 1.0);

    for (final participant in _room!.remoteParticipants.values) {
      if (participant.identity == participantIdentity) {
        for (final publication in participant.trackPublications.values) {
          final track = publication.track;
          if (track != null && publication.kind == TrackType.AUDIO) {
            rtc.Helper.setVolume(clampedVolume, track.mediaStreamTrack);
          }
        }
      }
    }
  }

  Future<void> startVideo() async {
    if (!_isConnected || _room == null) return;
    _videoEnabled = true;
    try {
      await _room!.localParticipant?.setCameraEnabled(true);
    } catch (e) {
      print('[Audio] Video start error: $e');
    }
  }

  Future<void> stopVideo() async {
    if (_room == null) return;
    _videoEnabled = false;
    try {
      await _room!.localParticipant?.setCameraEnabled(false);
    } catch (e) {
      print('[Audio] Video stop error: $e');
    }
  }

  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _reconnectAttempts = 0;

    _roomListener?.dispose();
    _roomListener = null;

    if (_room != null) {
      try {
        await _room!.disconnect();
      } catch (e) {
        print('[Audio] Disconnect error: $e');
      }
      _room = null;
    }

    _isConnected = false;
    _isMuted = false;
    _isSpeaking = false;
    _videoEnabled = false;
    _volumes.clear();
    _connectionController.add(false);
  }

  void dispose() {
    disconnect();
    _connectionController.close();
    _speakingController.close();
    _volumeController.close();
  }
}
