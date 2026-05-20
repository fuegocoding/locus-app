import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/audio_service.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  static const String _devUrl = 'http://localhost:3001';
  static const String _prodUrl = 'https://YOUR_RAILWAY_URL.up.railway.app';

  final ApiService apiService;
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
  String _speedUnit = 'default';
  String? _error;
  bool _isLoading = false;
  bool _isOnline = true;
  String? _livekitRoom;
  String? _livekitToken;

  AppState({String? serverUrl})
      : apiService = ApiService(baseUrl: serverUrl ?? _devUrl);

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
  bool get isOnline => _isOnline;
  bool get isAudioConnected => audioService.isConnected;
  String get resolvedSpeedUnit {
    if (_speedUnit != 'default') return _speedUnit;
    final locale = WidgetsBinding.instance.platformDispatcher.locale;
    final country = locale.countryCode?.toUpperCase() ?? '';
    const mphCountries = {'US', 'GB', 'LR', 'MM'};
    return mphCountries.contains(country) ? 'mph' : 'kmh';
  }

  String get speedUnitSetting => _speedUnit;
  String? get error => _error;
  bool get isLoading => _isLoading;
  String? get livekitRoom => _livekitRoom;
  String? get livekitToken => _livekitToken;

  Future<void> init() async {
    await apiService.loadToken();
    if (apiService.hasToken) {
      try {
        final p = await apiService.getProfile();
        if (p != null) {
          _user = User.fromJson(p);
          _isAuthenticated = true;
          _connectSocket();
        }
      } catch (e) {
        _error = 'Failed to load profile';
        await apiService.clearToken();
      }
    }
    notifyListeners();
  }

  Future<void> sendVerificationCode(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await apiService.sendVerificationCode(phone);
    } catch (e) {
      _error = 'Failed to send verification code';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> verifyCode(String phone, String code) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final r = await apiService.verifyCode(phone, code);
      if (r['token'] != null) {
        _isAuthenticated = true;
        final p = await apiService.getProfile();
        if (p != null) _user = User.fromJson(p);
        _connectSocket();
        notifyListeners();
        return true;
      }
      _error = r['error'] ?? 'Invalid code';
    } catch (e) {
      _error = 'Verification failed';
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> checkUsername(String u) async {
    try {
      return await apiService.checkUsername(u);
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateProfile(String name) async {
    _isLoading = true;
    notifyListeners();
    try {
      final r = await apiService.updateProfile({'displayName': name});
      if (r['displayName'] == name) {
        _user?.displayName = name;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = r['error'] ?? 'Failed to update';
    } catch (e) {
      _error = 'Failed to update profile';
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void _connectSocket() {
    socketService.connect(apiService.baseUrl, apiService.authToken ?? '');

    socketService.presenceStream.listen((ups) {
      for (final u in ups) {
        final i = _nearbyUsers.indexWhere((x) => x.userId == u.userId);
        if (i >= 0) {
          _nearbyUsers[i] = u;
        } else {
          _nearbyUsers.add(u);
        }
      }
      notifyListeners();
    });

    socketService.volumeStream.listen((v) {
      _volumes.addAll(v);
      for (final entry in v.entries) {
        audioService.applyVolume(entry.key, entry.value);
      }
      notifyListeners();
    });

    socketService.speakingStream.listen((s) {
      _speaking.addAll(s);
      notifyListeners();
    });

    socketService.convoyStream.listen((d) {
      if (d['type'] == 'created' || d['type'] == 'joined') {
        if (d['convoy'] != null) _currentConvoy = Convoy.fromJson(d['convoy']);
        _mode = 'convoy';
        _convoyId = _currentConvoy?.id;
      } else if (d['type'] == 'left') {
        _currentConvoy = null;
        _convoyId = null;
        _mode = 'proximity';
      }
      notifyListeners();
    });

    socketService.audioTokenStream.listen((data) {
      _livekitRoom = data['room'];
      _livekitToken = data['token'];
      _connectAudio();
      notifyListeners();
    });

    socketService.errorStream.listen((e) {
      _error = e;
      notifyListeners();
    });
  }

  Future<void> _connectAudio() async {
    if (_livekitRoom != null && _livekitToken != null) {
      try {
        await audioService.connect(_livekitRoom!, _livekitToken!);
      } catch (e) {
        _error = 'Audio connection failed';
        notifyListeners();
      }
    }
  }

  Future<bool> requestPermissions() async {
    return await locationService.requestPermissions();
  }

  void startLocation() {
    locationService.startLocationUpdates();
    locationService.positionStream.listen((p) {
      _latitude = p['latitude']!;
      _longitude = p['longitude']!;
      _speed = p['speed']!;
      _heading = p['heading']!;
      socketService.updatePresence(
        latitude: _latitude,
        longitude: _longitude,
        speed: _speed,
        heading: _heading,
      );
      notifyListeners();
    });
  }

  void stopLocation() => locationService.stopLocationUpdates();

  Future<void> startBackgroundService() async {
    await locationService.startBackgroundService();
  }

  void setMode(String m) {
    _mode = m;
    if (m == 'proximity') {
      _convoyId = null;
      _currentConvoy = null;
    }
    socketService.switchMode(m, convoyId: _convoyId);
    notifyListeners();
  }

  void createConvoy(String n) => socketService.createConvoy(n, 'invite-only');
  void joinConvoy(String c) => socketService.joinConvoy(c);
  void leaveConvoy() => socketService.leaveConvoy();
  void pinUser(String id) => socketService.pinUser(id);
  void unpinUser(String id) => socketService.unpinUser(id);
  void muteUser(String id) => socketService.muteUser(id);
  void blockUser(String id) => socketService.blockUser(id);
  void reportUser(String id) => socketService.reportUser(id);

  void toggleMic() {
    _micMuted = !_micMuted;
    socketService.toggleMic(_micMuted);
    audioService.setMuted(_micMuted);
    notifyListeners();
  }

  void setPushToTalk(bool v) {
    _pushToTalk = v;
    audioService.setPushToTalk(v);
    notifyListeners();
  }

  void setSpeedUnit(String unit) {
    _speedUnit = unit;
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
    audioService.dispose();
    super.dispose();
  }
}
