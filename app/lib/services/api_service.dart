import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final String baseUrl;
  String? authToken;

  ApiService({required this.baseUrl});

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    authToken = prefs.getString('auth_token');
  }
  Future<void> saveToken(String token) async {
    authToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  Future<void> clearToken() async {
    authToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
  bool get hasToken => authToken != null;
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  Future<Map<String, dynamic>> sendVerificationCode(String phone) async {
    final r = await http.post(Uri.parse('$baseUrl/api/auth/verify/send'), headers: _headers, body: jsonEncode({'phone': phone}));
    return jsonDecode(r.body);
  }
  Future<Map<String, dynamic>> verifyCode(String phone, String code) async {
    final r = await http.post(Uri.parse('$baseUrl/api/auth/verify/check'), headers: _headers, body: jsonEncode({'phone': phone, 'code': code}));
    final body = jsonDecode(r.body);
    if (r.statusCode == 200 && body['token'] != null) await saveToken(body['token']);
    return body;
  }
  Future<Map<String, dynamic>?> getProfile() async {
    if (authToken == null) return null;
    final r = await http.get(Uri.parse('$baseUrl/api/auth/me'), headers: _headers);
    if (r.statusCode == 200) return jsonDecode(r.body);
    return null;
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
}
