import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/audio_service.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  final ApiService apiService = ApiService(baseUrl: 'http://10.0.2.2:3001');
  final SocketService socketService = SocketService();
  final LocationService locationService = LocationService();
  final AudioService audioService = AudioService();

  User? _user;
  bool _isAuthenticated = false;
  String _mode = 'proximity';
  String? _convoyId;
  double _latitude = 0;
  double _longitude = 0;
  double _speed = 0;
  double _heading = 0;
  List<PresenceUpdate> _nearbyUsers = [];
  Map<String, double> _volumes = {};
  Map<String, bool> _speaking = {};
  Convoy? _currentConvoy;
  bool _micMuted = false;
  bool _pushToTalk = true;
  String? _error;
  bool _isLoading = false;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  String get mode => _mode;
  String? get convoyId => _convoyId;
  double get latitude => _latitude;
  double get longitude => _longitude;
  double get speed => _speed;
  double get heading => _heading;
  List<PresenceUpdate> get nearbyUsers => _nearbyUsers;
  Map<String, double> get volumes => _volumes;
  Map<String, bool> get speaking => _speaking;
  Convoy? get currentConvoy => _currentConvoy;
  bool get micMuted => _micMuted;
  bool get pushToTalk => _pushToTalk;
  String? get error => _error;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    await apiService.loadToken();
    if (apiService.hasToken) {
      final profile = await apiService.getProfile();
      if (profile != null) {
        _user = User.fromJson(profile);
        _isAuthenticated = true;
        _connectSocket();
      }
    }
    notifyListeners();
  }

  Future<void> sendVerificationCode(String phone) async {
    _isLoading = true;
    notifyListeners();
    await apiService.sendVerificationCode(phone);
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> verifyCode(String phone, String code) async {
    _isLoading = true;
    notifyListeners();
    final result = await apiService.verifyCode(phone, code);
    if (result['token'] != null) {
      _isAuthenticated = true;
      final profile = await apiService.getProfile();
      if (profile != null) {
        _user = User.fromJson(profile);
      }
      _connectSocket();
      _isLoading = false;
      notifyListeners();
      return true;
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void _connectSocket() {
    socketService.connect('http://10.0.2.2:3001', apiService.authToken ?? '');

    socketService.presenceStream.listen((updates) {
      for (final update in updates) {
        final idx = _nearbyUsers.indexWhere((u) => u.userId == update.userId);
        if (idx >= 0) {
          _nearbyUsers[idx] = update;
        } else {
          _nearbyUsers.add(update);
        }
      }
      notifyListeners();
    });

    socketService.volumeStream.listen((volumeData) {
      _volumes.addAll(volumeData);
      notifyListeners();
    });

    socketService.speakingStream.listen((speakingData) {
      _speaking.addAll(speakingData);
      notifyListeners();
    });

    socketService.convoyStream.listen((data) {
      if (data['type'] == 'created' || data['type'] == 'joined') {
        if (data['convoy'] != null) {
          _currentConvoy = Convoy.fromJson(data['convoy']);
        }
        _mode = 'convoy';
        _convoyId = _currentConvoy?.id;
      } else if (data['type'] == 'left') {
        _currentConvoy = null;
        _convoyId = null;
        _mode = 'proximity';
      }
      notifyListeners();
    });

    socketService.errorStream.listen((err) {
      _error = err;
      notifyListeners();
    });
  }

  Future<bool> requestPermissions() async {
    return locationService.requestPermissions();
  }

  void startLocation() {
    locationService.startLocationUpdates();
    locationService.positionStream.listen((pos) {
      _latitude = pos.latitude!;
      _longitude = pos.longitude!;
      _speed = pos.speed ?? 0;
      _heading = pos.heading ?? 0;
      socketService.updatePresence(
        latitude: _latitude,
        longitude: _longitude,
        speed: _speed,
        heading: _heading,
      );
      notifyListeners();
    });
  }

  void stopLocation() {
    locationService.stopLocationUpdates();
  }

  Future<void> startBackgroundService() async {
    await locationService.startBackgroundService();
  }

  void setMode(String mode) {
    _mode = mode;
    socketService.switchMode(mode, convoyId: _convoyId);
    notifyListeners();
  }

  void createConvoy(String name) {
    socketService.createConvoy(name, 'invite-only');
  }

  void joinConvoy(String inviteCode) {
    socketService.joinConvoy(inviteCode);
  }

  void leaveConvoy() {
    socketService.leaveConvoy();
  }

  void pinUser(String userId) {
    socketService.pinUser(userId);
  }

  void unpinUser(String userId) {
    socketService.unpinUser(userId);
  }

  void muteUser(String userId) {
    socketService.muteUser(userId);
  }

  void blockUser(String userId) {
    socketService.blockUser(userId);
  }

  void reportUser(String userId) {
    socketService.reportUser(userId);
  }

  void toggleMic() {
    _micMuted = !_micMuted;
    socketService.toggleMic(_micMuted);
    notifyListeners();
  }

  void setPushToTalk(bool enabled) {
    _pushToTalk = enabled;
    audioService.setPushToTalk(enabled);
    notifyListeners();
  }

  void startSpeaking() {
    socketService.pushToTalk(true);
    audioService.startSpeaking();
  }

  void stopSpeaking() {
    socketService.pushToTalk(false);
    audioService.stopSpeaking();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    socketService.disconnect();
    locationService.dispose();
    audioService.disconnect();
    super.dispose();
  }
}
