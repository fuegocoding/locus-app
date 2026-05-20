import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/audio_service.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  final ApiService apiService = ApiService(baseUrl: 'http://localhost:3001');
  final SocketService socketService = SocketService();
  final LocationService locationService = LocationService();
  final AudioService audioService = AudioService();

  User? _user;
  bool _isAuthenticated = false;
  String _mode = 'proximity';
  String? _convoyId;
  double _latitude = 0, _longitude = 0, _speed = 0, _heading = 0;
  List<PresenceUpdate> _nearbyUsers = [];
  Map<String, double> _volumes = {};
  Map<String, bool> _speaking = {};
  Convoy? _currentConvoy;
  bool _micMuted = false;
  bool _pushToTalk = false;
  bool _videoEnabled = false;
  Map<String, bool> _remoteVideoEnabled = {};
  String _speedUnit = 'default'; // 'default' | 'kmh' | 'mph'
  String? _error;
  bool _isLoading = false;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get hasProfile => _user != null && !_user!.displayName.startsWith('User_');
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
  bool get videoEnabled => _videoEnabled;
  Map<String, bool> get remoteVideoEnabled => _remoteVideoEnabled;
  String get resolvedSpeedUnit {
    if (_speedUnit != 'default') return _speedUnit;
    // Detect based on locale: US, UK, Liberia, Myanmar use mph
    final locale = WidgetsBinding.instance.platformDispatcher.locale;
    final country = locale.countryCode?.toUpperCase() ?? '';
    const mphCountries = {'US', 'GB', 'LR', 'MM'};
    return mphCountries.contains(country) ? 'mph' : 'kmh';
  }

  String get speedUnitSetting => _speedUnit;
  String? get error => _error;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    await apiService.loadToken();
    if (apiService.hasToken) {
      final p = await apiService.getProfile();
      if (p != null) { _user = User.fromJson(p); _isAuthenticated = true; _connectSocket(); }
    }
    notifyListeners();
  }

  Future<void> sendVerificationCode(String phone) async { _isLoading = true; notifyListeners(); await apiService.sendVerificationCode(phone); _isLoading = false; notifyListeners(); }
  Future<bool> verifyCode(String phone, String code) async {
    _isLoading = true; notifyListeners();
    final r = await apiService.verifyCode(phone, code);
    if (r['token'] != null) {
      _isAuthenticated = true;
      final p = await apiService.getProfile(); if (p != null) _user = User.fromJson(p);
      _connectSocket(); _isLoading = false; notifyListeners(); return true;
    }
    _isLoading = false; notifyListeners(); return false;
  }
  Future<bool> checkUsername(String u) async => apiService.checkUsername(u);
  Future<bool> updateProfile(String name) async {
    _isLoading = true; notifyListeners();
    final r = await apiService.updateProfile({'displayName': name});
    if (r['displayName'] == name) { _user?.displayName = name; _isLoading = false; notifyListeners(); return true; }
    _isLoading = false; notifyListeners(); return false;
  }
  void _connectSocket() {
    socketService.connect('http://localhost:3001', apiService.authToken ?? '');
    socketService.presenceStream.listen((ups) {
      for (final u in ups) { final i = _nearbyUsers.indexWhere((x) => x.userId == u.userId); if (i >= 0) _nearbyUsers[i] = u; else _nearbyUsers.add(u); }
      notifyListeners();
    });
    socketService.volumeStream.listen((v) { _volumes.addAll(v); notifyListeners(); });
    socketService.speakingStream.listen((s) { _speaking.addAll(s); notifyListeners(); });
    socketService.convoyStream.listen((d) {
      if (d['type'] == 'created' || d['type'] == 'joined') { if (d['convoy'] != null) _currentConvoy = Convoy.fromJson(d['convoy']); _mode = 'convoy'; _convoyId = _currentConvoy?.id; }
      else if (d['type'] == 'left') { _currentConvoy = null; _convoyId = null; _mode = 'proximity'; }
      notifyListeners();
    });
    socketService.errorStream.listen((e) { _error = e; notifyListeners(); });
    socketService.videoStream.listen((d) {
      if (d['type'] == 'started') { _remoteVideoEnabled[d['userId']] = true; notifyListeners(); }
      else if (d['type'] == 'stopped') { _remoteVideoEnabled[d['userId']] = false; notifyListeners(); }
    });
  }
  Future<bool> requestPermissions() async => locationService.requestPermissions();
  void startLocation() {
    locationService.startLocationUpdates();
    locationService.positionStream.listen((p) {
      _latitude = p['latitude']!; _longitude = p['longitude']!; _speed = p['speed']!; _heading = p['heading']!;
      socketService.updatePresence(latitude: _latitude, longitude: _longitude, speed: _speed, heading: _heading);
      notifyListeners();
    });
  }
  void stopLocation() => locationService.stopLocationUpdates();
  Future<void> startBackgroundService() async => locationService.startBackgroundService();
  void setMode(String m) { _mode = m; socketService.switchMode(m, convoyId: _convoyId); notifyListeners(); }
  void createConvoy(String n) => socketService.createConvoy(n, 'invite-only');
  void joinConvoy(String c) => socketService.joinConvoy(c);
  void leaveConvoy() => socketService.leaveConvoy();
  void pinUser(String id) => socketService.pinUser(id);
  void unpinUser(String id) => socketService.unpinUser(id);
  void muteUser(String id) => socketService.muteUser(id);
  void blockUser(String id) => socketService.blockUser(id);
  void reportUser(String id) => socketService.reportUser(id);
  void toggleMic() { _micMuted = !_micMuted; socketService.toggleMic(_micMuted); notifyListeners(); }
  void setPushToTalk(bool v) { _pushToTalk = v; audioService.setPushToTalk(v); notifyListeners(); }
  void setSpeedUnit(String unit) { _speedUnit = unit; notifyListeners(); }
  void startSpeaking() { socketService.pushToTalk(true); audioService.startSpeaking(); }
  void stopSpeaking() { socketService.pushToTalk(false); audioService.stopSpeaking(); }
  void toggleVideo() {
    _videoEnabled = !_videoEnabled;
    if (_videoEnabled) { socketService.startVideo(); audioService.startVideo(); }
    else { socketService.stopVideo(); audioService.stopVideo(); }
    notifyListeners();
  }
  void clearError() { _error = null; notifyListeners(); }
  @override void dispose() { socketService.disconnect(); locationService.dispose(); audioService.disconnect(); super.dispose(); }
}
