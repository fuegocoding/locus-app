import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/audio_service.dart';
import '../services/api_service.dart';
import '../services/overlay_service.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppState extends ChangeNotifier {
  static const String _devUrl = 'http://localhost:3001';
  static const String _prodUrl = 'https://locus-production-99b7.up.railway.app';

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
  bool _videoEnabled = false;
  Map<String, bool> _remoteVideoEnabled = {};
  String _speedUnit = 'default';
  String? _error;
  bool _isLoading = false;
  bool _isOnline = true;
  String? _livekitRoom;
  String? _livekitToken;
  String? _livekitServerUrl;
  String? _pinnedByMessage;

  List<dynamic> _friends = [];
  List<dynamic> _pendingInvites = [];
  bool _isLoadingFriends = false;
  bool _isLoadingInvites = false;

  List<Map<String, dynamic>> _friendLocations = [];
  Timer? _friendLocationTimer;

  AppState({String? serverUrl})
      : apiService = ApiService(
          baseUrl: serverUrl ??
              (kDebugMode
                  ? (kIsWeb ? _devUrl : _prodUrl)
                  : _prodUrl),
        );

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
  bool get videoEnabled => _videoEnabled;
  Map<String, bool> get remoteVideoEnabled => _remoteVideoEnabled;
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

  List<dynamic> get friends => _friends;
  List<dynamic> get pendingInvites => _pendingInvites;
  List<Map<String, dynamic>> get friendLocations => _friendLocations;
  bool get isLoadingFriends => _isLoadingFriends;
  bool get isLoadingInvites => _isLoadingInvites;
  String? get pinnedByMessage => _pinnedByMessage;

  Future<void> init() async {
    await apiService.loadToken();
    final prefs = await SharedPreferences.getInstance();

    // OverlayService is Android-only; safe to silently fail on other platforms
    try {
      OverlayService.init();
      OverlayService.micToggledStream.listen((muted) {
        if (_micMuted != muted) {
          _micMuted = muted;
          socketService.toggleMic(_micMuted);
          audioService.setMuted(_micMuted);
          notifyListeners();
        }
      });
    } catch (_) {
      // Overlay not available on this platform
    }

    // Load last cached coordinates immediately to prevent New York map jump
    final lastLat = prefs.getDouble('last_latitude');
    final lastLng = prefs.getDouble('last_longitude');
    if (lastLat != null && lastLng != null) {
      _latitude = lastLat;
      _longitude = lastLng;
    }

    if (apiService.hasToken) {
      final cachedProfile = prefs.getString('cached_profile');
      if (cachedProfile != null) {
        try {
          _user = User.fromJson(jsonDecode(cachedProfile));
          _isAuthenticated = true;
        } catch (_) {}
      }

      try {
        final p = await apiService.getProfile();
        if (p != null) {
          _user = User.fromJson(p);
          _isAuthenticated = true;
          await prefs.setString('cached_profile', jsonEncode(p));
          _connectSocket();
          initPushNotifications();
          loadFriends();
          loadPendingInvites();
        }
      } catch (e) {
        if (e is AuthException) {
          _error = 'Session expired';
          _isAuthenticated = false;
          _user = null;
          await apiService.clearToken();
        } else {
          // Network or server error: do NOT log out!
          _error = 'Connecting offline...';
          _connectSocket();
          if (_user != null) {
            _isAuthenticated = true;
          }
        }
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

  Future<bool> verifyCode(String phone, String code, {String? referralUsername}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final r = await apiService.verifyCode(phone, code, referralUsername: referralUsername);
      if (r['token'] != null) {
        _isAuthenticated = true;
        _error = null;
        final p = await apiService.getProfile();
        if (p != null) _user = User.fromJson(p);
        _connectSocket();
        initPushNotifications();
        loadFriends();
        loadPendingInvites();
        return true;
      }
      _error = r['error'] ?? 'Invalid code';
    } catch (e) {
      _error = 'Verification failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
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

  Future<bool> toggleAnonymousMode(bool value) async {
    try {
      final r = await apiService.updateProfile({'anonymousMode': value});
      if (r['anonymousMode'] == value) {
        _user?.anonymousMode = value;

        // Also update cached profile in SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        if (_user != null) {
          await prefs.setString('cached_profile', jsonEncode(_user!.toJson()));
        }

        notifyListeners();
        return true;
      }
      _error = r['error'] ?? 'Failed to update settings';
    } catch (e) {
      _error = 'Failed to update settings';
    }
    notifyListeners();
    return false;
  }

  StreamSubscription<List<PresenceUpdate>>? _presenceSub;
  StreamSubscription<Map<String, double>>? _volumeSub;
  StreamSubscription<Map<String, bool>>? _speakingSub;
  StreamSubscription<Map<String, dynamic>>? _convoySub;
  StreamSubscription<Map<String, dynamic>>? _tokenSub;
  StreamSubscription<String>? _errorSub;
  StreamSubscription<Map<String, dynamic>>? _videoSub;
  StreamSubscription<void>? _deletedSub;
  StreamSubscription<Map<String, dynamic>>? _friendLocSub;
  StreamSubscription<Map<String, dynamic>>? _pinnedSub;
  StreamSubscription<Map<String, dynamic>>? _inviteSub;

  void _connectSocket() {
    socketService.connect(apiService.baseUrl, apiService.authToken ?? '');
    _startFriendLocationPolling();

    _presenceSub?.cancel();
    _presenceSub = socketService.presenceStream.listen((ups) {
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

    _volumeSub?.cancel();
    _volumeSub = socketService.volumeStream.listen((v) {
      _volumes.addAll(v);
      for (final entry in v.entries) {
        audioService.applyVolume(entry.key, entry.value);
      }
      notifyListeners();
    });

    _speakingSub?.cancel();
    _speakingSub = socketService.speakingStream.listen((s) {
      _speaking.addAll(s);
      notifyListeners();
    });

    _convoySub?.cancel();
    _convoySub = socketService.convoyStream.listen((d) {
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

    _tokenSub?.cancel();
    _tokenSub = socketService.audioTokenStream.listen((data) {
      _livekitRoom = data['room'];
      _livekitToken = data['token'];
      _livekitServerUrl = data['serverUrl'];
      _connectAudio();
      notifyListeners();
    });

    _errorSub?.cancel();
    _errorSub = socketService.errorStream.listen((e) {
      _error = e;
      notifyListeners();
    });

    _videoSub?.cancel();
    _videoSub = socketService.videoStream.listen((d) {
      if (d['type'] == 'started') { _remoteVideoEnabled[d['userId']] = true; notifyListeners(); }
      else if (d['type'] == 'stopped') { _remoteVideoEnabled[d['userId']] = false; notifyListeners(); }
    });

    _deletedSub?.cancel();
    _deletedSub = socketService.accountDeletedStream.listen((_) {
      _isAuthenticated = false;
      _user = null;
      _friends = [];
      _pendingInvites = [];
      _currentConvoy = null;
      _convoyId = null;
      _nearbyUsers.clear();
      apiService.clearToken();
      _friendLocationTimer?.cancel();
      notifyListeners();
    });

    _friendLocSub?.cancel();
    _friendLocSub = socketService.friendLocationStream.listen((data) {
      final idx = _friendLocations.indexWhere((f) => f['userId'] == data['userId']);
      if (idx >= 0) {
        _friendLocations[idx] = data;
      } else {
        _friendLocations.add(data);
      }
      notifyListeners();
    });

    _pinnedSub?.cancel();
    _pinnedSub = socketService.pinnedYouStream.listen((data) {
      _pinnedByMessage = '${data['pinnedByDisplayName']} pinned you on the map!';
      notifyListeners();
      loadFriends();
      Future.delayed(const Duration(seconds: 5), () {
        if (_pinnedByMessage != null) {
          _pinnedByMessage = null;
          notifyListeners();
        }
      });
    });

    _inviteSub?.cancel();
    _inviteSub = socketService.inviteStream.listen((d) {
      if (d['type'] == 'received') {
        final inviteId = d['id'];
        if (!_pendingInvites.any((x) => x['id'] == inviteId)) {
          _pendingInvites.add({
            'id': inviteId,
            'convoyId': d['convoyId'],
            'convoyName': d['convoyName'],
            'senderId': d['senderId'],
            'senderName': d['senderName'],
            'createdAt': DateTime.now().toIso8601String(),
          });
          notifyListeners();
        }
      } else if (d['type'] == 'responded') {
        if (d['status'] == 'accepted') {
          loadFriends();
        }
      }
    });
  }

  Future<void> _connectAudio() async {
    if (_livekitServerUrl != null && _livekitToken != null) {
      try {
        String url = _livekitServerUrl!;
        if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
          url = url.replaceAll('localhost', '10.0.2.2').replaceAll('127.0.0.1', '10.0.2.2');
        }
        await audioService.connect(url, _livekitToken!);
      } catch (e) {
        _error = 'Audio connection failed';
        notifyListeners();
      }
    }
  }

  /// Called by the UI retry button when the audio error banner is shown.
  Future<void> reconnectAudio() async {
    await _connectAudio();
    notifyListeners();
  }

  Future<bool> requestPermissions() async {
    final locationGranted = await locationService.requestPermissions();
    final micStatus = await Permission.microphone.request();
    return locationGranted && micStatus.isGranted;
  }

  void startLocation() {
    locationService.startLocationUpdates();

    // Asynchronously fetch last known position to get a quick coordinate update if available
    locationService.getLastKnownPosition().then((pos) {
      if (pos != null && _latitude == 0 && _longitude == 0) {
        _latitude = pos.latitude;
        _longitude = pos.longitude;
        socketService.updatePresence(
          latitude: _latitude,
          longitude: _longitude,
          speed: 0,
          heading: 0,
        );
        notifyListeners();
      }
    });

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
      SharedPreferences.getInstance().then((prefs) {
        prefs.setDouble('last_latitude', _latitude);
        prefs.setDouble('last_longitude', _longitude);
      });
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
  void pinUser(String id) {
    socketService.pinUser(id);
    Future.delayed(const Duration(milliseconds: 500), () => loadFriends());
  }
  void unpinUser(String id) => socketService.unpinUser(id);
  void muteUser(String id) => socketService.muteUser(id);
  void blockUser(String id) => socketService.blockUser(id);
  void reportUser(String id) => socketService.reportUser(id);

  void toggleMic() {
    _micMuted = !_micMuted;
    socketService.toggleMic(_micMuted);
    audioService.setMuted(_micMuted);
    OverlayService.setMuted(_micMuted);
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

  void toggleVideo() {
    _videoEnabled = !_videoEnabled;
    if (_videoEnabled) { socketService.startVideo(); audioService.startVideo(); }
    else { socketService.stopVideo(); audioService.stopVideo(); }
    notifyListeners();
  }

  // Push Notifications Setup
  Future<void> initPushNotifications() async {
    if (kIsWeb) return;
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        final token = await messaging.getToken();
        if (token != null) {
          debugPrint('[Push] Device Token registered: $token');
          await apiService.registerDeviceToken(token);
        }
      }
    } catch (e) {
      debugPrint('[Push] Firebase failed to initialize (expected in local dev / without credentials): $e');
    }
  }

  // Social Methods
  Future<void> loadFriends() async {
    _isLoadingFriends = true;
    notifyListeners();
    try {
      _friends = await apiService.getFriends();
    } catch (e) {
      debugPrint('Failed to load friends: $e');
    } finally {
      _isLoadingFriends = false;
      notifyListeners();
    }
  }

  Future<void> loadPendingInvites() async {
    _isLoadingInvites = true;
    notifyListeners();
    try {
      _pendingInvites = await apiService.getPendingInvites();
    } catch (e) {
      debugPrint('Failed to load invites: $e');
    } finally {
      _isLoadingInvites = false;
      notifyListeners();
    }
  }

  void _startFriendLocationPolling() {
    _friendLocationTimer?.cancel();
    _friendLocationTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        _friendLocations = (await apiService.getFriendLocations()).cast<Map<String, dynamic>>();
        notifyListeners();
      } catch (_) {}
    });
  }

  Future<void> loadFriendLocations() async {
    try {
      _friendLocations = (await apiService.getFriendLocations()).cast<Map<String, dynamic>>();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> followUser(String targetUserId) async {
    try {
      await apiService.followUser(targetUserId);
      await loadFriends();
    } catch (e) {
      _error = 'Failed to follow user';
      notifyListeners();
    }
  }

  Future<void> unfollowUser(String targetUserId) async {
    try {
      await apiService.unfollowUser(targetUserId);
      await loadFriends();
    } catch (e) {
      _error = 'Failed to unfollow user';
      notifyListeners();
    }
  }

  Future<List<dynamic>> searchUsers(String query) async {
    if (query.trim().isEmpty) return [];
    try {
      return await apiService.searchUsers(query);
    } catch (e) {
      debugPrint('Search failed: $e');
      return [];
    }
  }

  Future<bool> deleteAccount() async {
    _isLoading = true;
    notifyListeners();
    try {
      await apiService.deleteAccount();
      _isAuthenticated = false;
      _user = null;
      _friends = [];
      _pendingInvites = [];
      _currentConvoy = null;
      _convoyId = null;
      _nearbyUsers.clear();
      socketService.disconnect();
      locationService.dispose();
      audioService.dispose();
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete account';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendConvoyInvite(String targetUserId) async {
    if (_convoyId == null) return;
    try {
      await apiService.sendConvoyInvite(_convoyId!, targetUserId);
    } catch (e) {
      _error = 'Failed to send invite';
      notifyListeners();
    }
  }

  Future<void> respondToInvite(String inviteId, String status) async {
    try {
      await apiService.respondToInvite(inviteId, status);
      final inviteIndex = _pendingInvites.indexWhere((x) => x['id'] == inviteId);
      if (inviteIndex != -1) {
        final invite = _pendingInvites[inviteIndex];
        _pendingInvites.removeAt(inviteIndex);
        if (status == 'accepted') {
          joinConvoy(invite['convoyId']);
        }
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to respond to invitation';
      notifyListeners();
    }
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
