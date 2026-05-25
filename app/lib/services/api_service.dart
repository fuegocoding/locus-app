import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

class ApiService {
  final String baseUrl;
  String? authToken;

  ApiService({required this.baseUrl});

  Future<void> loadToken() async {
    authToken = await _storage.read(key: 'auth_token');
  }
  Future<void> saveToken(String token) async {
    authToken = token;
    await _storage.write(key: 'auth_token', value: token);
  }
  Future<void> clearToken() async {
    authToken = null;
    await _storage.delete(key: 'auth_token');
  }
  bool get hasToken => authToken != null;
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  Future<Map<String, dynamic>> sendVerificationCode(String phone) async {
    final r = await http.post(Uri.parse('$baseUrl/api/auth/verify/send'), headers: _headers, body: jsonEncode({'phone': phone}));
    final body = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode != 200) throw Exception(body['error'] ?? 'Failed to send code');
    return body;
  }
  Future<Map<String, dynamic>> verifyCode(String phone, String code, {String? referralUsername}) async {
    final body = <String, dynamic>{'phone': phone, 'code': code};
    if (referralUsername != null && referralUsername.isNotEmpty) {
      body['referralUsername'] = referralUsername;
    }
    final r = await http.post(Uri.parse('$baseUrl/api/auth/verify/check'), headers: _headers, body: jsonEncode(body));
    final decoded = jsonDecode(r.body);
    if (r.statusCode == 200 && decoded['token'] != null) await saveToken(decoded['token']);
    return decoded;
  }
  Future<Map<String, dynamic>?> getProfile() async {
    if (authToken == null) return null;
    final r = await http.get(Uri.parse('$baseUrl/api/auth/me'), headers: _headers);
    if (r.statusCode == 200) {
      return jsonDecode(r.body);
    } else if (r.statusCode == 401 || r.statusCode == 403) {
      throw AuthException('Session expired');
    } else {
      throw Exception('Server returned status code: ${r.statusCode}');
    }
  }
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/auth/me'), headers: _headers, body: jsonEncode(updates));
    return jsonDecode(r.body);
  }
  Future<Map<String, dynamic>?> getConvoyByInvite(String code) async {
    final r = await http.get(Uri.parse('$baseUrl/api/auth/convoy/$code'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body);
    return null;
  }
  Future<bool> checkUsername(String username) async {
    final r = await http.post(Uri.parse('$baseUrl/api/auth/check-username'), headers: _headers, body: jsonEncode({'username': username}));
    if (r.statusCode == 200) return (jsonDecode(r.body)['available'] == true);
    return false;
  }

  // Social & Friend Endpoints
  Future<List<dynamic>> searchUsers(String query) async {
    final r = await http.get(Uri.parse('$baseUrl/api/social/search?query=${Uri.encodeComponent(query)}'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body) as List<dynamic>;
    throw Exception('Failed to search users');
  }

  Future<Map<String, dynamic>> followUser(String targetUserId) async {
    final r = await http.post(Uri.parse('$baseUrl/api/social/follow'), headers: _headers, body: jsonEncode({'targetUserId': targetUserId}));
    final body = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode != 200) throw Exception(body['error'] ?? 'Failed to follow user');
    return body;
  }

  Future<Map<String, dynamic>> unfollowUser(String targetUserId) async {
    final r = await http.post(Uri.parse('$baseUrl/api/social/unfollow'), headers: _headers, body: jsonEncode({'targetUserId': targetUserId}));
    final body = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode != 200) throw Exception(body['error'] ?? 'Failed to unfollow user');
    return body;
  }

  Future<List<dynamic>> getFriends() async {
    final r = await http.get(Uri.parse('$baseUrl/api/social/friends'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body) as List<dynamic>;
    throw Exception('Failed to get friends list');
  }

  Future<void> registerDeviceToken(String token) async {
    final r = await http.post(Uri.parse('$baseUrl/api/social/device-token'), headers: _headers, body: jsonEncode({'token': token}));
    if (r.statusCode != 200) {
      final body = jsonDecode(r.body);
      throw Exception(body['error'] ?? 'Failed to register device token');
    }
  }

  Future<Map<String, dynamic>> sendConvoyInvite(String convoyId, String receiverId) async {
    final r = await http.post(Uri.parse('$baseUrl/api/social/convoy/invite'), headers: _headers, body: jsonEncode({
      'convoyId': convoyId,
      'receiverId': receiverId,
    }));
    final body = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode != 200) throw Exception(body['error'] ?? 'Failed to send invite');
    return body;
  }

  Future<List<dynamic>> getPendingInvites() async {
    final r = await http.get(Uri.parse('$baseUrl/api/social/convoy/invites'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body) as List<dynamic>;
    throw Exception('Failed to fetch pending invites');
  }

  Future<void> respondToInvite(String inviteId, String status) async {
    final r = await http.post(Uri.parse('$baseUrl/api/social/convoy/invite/$inviteId/respond'), headers: _headers, body: jsonEncode({
      'status': status,
    }));
    if (r.statusCode != 200) {
      final body = jsonDecode(r.body);
      throw Exception(body['error'] ?? 'Failed to respond to invite');
    }
  }

  Future<List<dynamic>> getFriendLocations() async {
    final r = await http.get(Uri.parse('$baseUrl/api/social/friends/locations'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body) as List<dynamic>;
    throw Exception('Failed to get friend locations');
  }

  Future<void> deleteAccount() async {
    final r = await http.delete(Uri.parse('$baseUrl/api/auth/account'), headers: _headers);
    if (r.statusCode != 200) {
      final body = jsonDecode(r.body);
      throw Exception(body['error'] ?? 'Failed to delete account');
    }
    await clearToken();
  }
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  @override
  String toString() => message;
}
