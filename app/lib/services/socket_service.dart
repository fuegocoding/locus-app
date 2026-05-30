import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/user.dart';

class SocketService {
  io.Socket? _socket;
  final _presenceController = StreamController<List<PresenceUpdate>>.broadcast();
  final _presenceRemoveController = StreamController<String>.broadcast();
  final _volumeController = StreamController<Map<String, double>>.broadcast();
  final _speakingController = StreamController<Map<String, bool>>.broadcast();
  final _convoyController = StreamController<Map<String, dynamic>>.broadcast();
  final _audioTokenController = StreamController<Map<String, dynamic>>.broadcast();
  final _errorController = StreamController<String>.broadcast();
  final _videoController = StreamController<Map<String, dynamic>>.broadcast();
  final _inviteController = StreamController<Map<String, dynamic>>.broadcast();
  final _accountDeletedController = StreamController<void>.broadcast();
  final _friendLocationController = StreamController<Map<String, dynamic>>.broadcast();
  final _pinnedYouController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<List<PresenceUpdate>> get presenceStream => _presenceController.stream;
  Stream<String> get presenceRemoveStream => _presenceRemoveController.stream;
  Stream<Map<String, double>> get volumeStream => _volumeController.stream;
  Stream<Map<String, bool>> get speakingStream => _speakingController.stream;
  Stream<Map<String, dynamic>> get convoyStream => _convoyController.stream;
  Stream<Map<String, dynamic>> get audioTokenStream => _audioTokenController.stream;
  Stream<String> get errorStream => _errorController.stream;
  Stream<Map<String, dynamic>> get videoStream => _videoController.stream;
  Stream<Map<String, dynamic>> get inviteStream => _inviteController.stream;
  Stream<void> get accountDeletedStream => _accountDeletedController.stream;
  Stream<Map<String, dynamic>> get friendLocationStream => _friendLocationController.stream;
  Stream<Map<String, dynamic>> get pinnedYouStream => _pinnedYouController.stream;

  bool get connected => _socket?.connected ?? false;

  void connect(String serverUrl, String token) {
    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .disableReconnection()
          .build(),
    );

    _socket!.on('connect', (_) {
      print('[Socket] Connected');
    });

    _socket!.on('disconnect', (_) {
      print('[Socket] Disconnected');
    });

    _socket!.on('reconnect', (_) {
      print('[Socket] Reconnected');
    });

    _socket!.on('presence:neighbors', (data) {
      final list = (data as List).map((p) => PresenceUpdate.fromJson(p)).toList();
      _presenceController.add(list);
    });

    _socket!.on('presence:update', (data) {
      _presenceController.add([PresenceUpdate.fromJson(data)]);
    });

    _socket!.on('presence:remove', (data) {
      if (data != null && data['userId'] != null) {
        _presenceRemoveController.add(data['userId'] as String);
      }
    });

    _socket!.on('audio:volume-update', (data) {
      _volumeController.add({data['userId']: (data['volume'] as num).toDouble()});
    });

    _socket!.on('audio:speaking', (data) {
      _speakingController.add({data['userId']: data['speaking']});
    });

    _socket!.on('audio:token', (data) {
      _audioTokenController.add(data);
    });

    _socket!.on('convoy:created', (data) {
      _convoyController.add({'type': 'created', 'convoy': data});
    });

    _socket!.on('convoy:joined', (data) {
      _convoyController.add({'type': 'joined', ...data});
    });

    _socket!.on('convoy:left', (data) {
      _convoyController.add({'type': 'left', ...data});
    });

    _socket!.on('convoy:member-joined', (data) {
      _convoyController.add({'type': 'member_joined', ...data});
    });

    _socket!.on('convoy:member-left', (data) {
      _convoyController.add({'type': 'member_left', ...data});
    });

    _socket!.on('error', (data) {
      _errorController.add(data['message'] ?? 'Unknown error');
    });

    _socket!.on('video:participant-started', (data) {
      _videoController.add({'type': 'started', 'userId': data['userId']});
    });

    _socket!.on('video:participant-stopped', (data) {
      _videoController.add({'type': 'stopped', 'userId': data['userId']});
    });

    _socket!.on('invite:received', (data) {
      _inviteController.add({'type': 'received', ...data});
    });

    _socket!.on('invite:responded', (data) {
      _inviteController.add({'type': 'responded', ...data});
    });

    _socket!.on('account:deleted', (_) {
      _accountDeletedController.add(null);
    });

    _socket!.on('friends:location', (data) {
      _friendLocationController.add(data);
    });

    _socket!.on('user:pinned-you', (data) {
      _pinnedYouController.add(data);
    });
  }

  void updatePresence({
    required double latitude,
    required double longitude,
    required double speed,
    required double heading,
  }) {
    _socket?.emit('presence:update', {
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'heading': heading,
    });
  }

  void switchMode(String mode, {String? convoyId}) {
    _socket?.emit('mode:switch', {'mode': mode, 'convoyId': convoyId});
  }

  void createConvoy(String name, String accessLevel) {
    _socket?.emit('convoy:create', {'name': name, 'accessLevel': accessLevel});
  }

  void joinConvoy(String inviteCode) {
    _socket?.emit('convoy:join', {'inviteCode': inviteCode});
  }

  void leaveConvoy() {
    _socket?.emit('convoy:leave', {});
  }

  void pinUser(String userId) {
    _socket?.emit('user:pin', {'targetUserId': userId});
  }

  void unpinUser(String userId) {
    _socket?.emit('user:unpin', {'targetUserId': userId});
  }

  void muteUser(String userId) {
    _socket?.emit('user:mute', {'targetUserId': userId});
  }

  void blockUser(String userId) {
    _socket?.emit('user:block', {'targetUserId': userId});
  }

  void reportUser(String userId, {String? reason}) {
    _socket?.emit('user:report', {'targetUserId': userId, 'reason': reason});
  }

  void pushToTalk(bool speaking) {
    _socket?.emit('audio:push-to-talk', {'speaking': speaking});
  }

  void toggleMic(bool muted) {
    _socket?.emit('audio:toggle-mic', {'muted': muted});
  }

  void startVideo() {
    _socket?.emit('video:start', {});
  }

  void stopVideo() {
    _socket?.emit('video:stop', {});
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
  }

  void dispose() {
    disconnect();
    _presenceController.close();
    _presenceRemoveController.close();
    _volumeController.close();
    _speakingController.close();
    _convoyController.close();
    _audioTokenController.close();
    _errorController.close();
    _videoController.close();
    _inviteController.close();
    _accountDeletedController.close();
    _friendLocationController.close();
    _pinnedYouController.close();
  }
}
