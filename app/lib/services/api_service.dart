import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final String baseUrl;
  String? _token;

  ApiService({required this.baseUrl});

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  bool get hasToken => _token != null;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<Map<String, dynamic>> sendVerificationCode(String phone) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/verify/send'),
      headers: _headers,
      body: jsonEncode({'phone': phone}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> verifyCode(String phone, String code) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/verify/check'),
      headers: _headers,
      body: jsonEncode({'phone': phone, 'code': code}),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 200 && body['token'] != null) {
      await saveToken(body['token']);
    }
    return body;
  }

  Future<Map<String, dynamic>?> getProfile() async {
    if (_token == null) return null;
    final response = await http.get(
      Uri.parse('$baseUrl/api/auth/me'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/api/auth/me'),
      headers: _headers,
      body: jsonEncode(updates),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>?> getConvoyByInvite(String code) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/auth/convoy/$code'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }
}
