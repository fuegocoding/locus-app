import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import 'qr_scan_screen.dart';

class SocialTabScreen extends StatefulWidget {
  final bool autoFocus;
  const SocialTabScreen({super.key, this.autoFocus = false});

  @override
  State<SocialTabScreen> createState() => _SocialTabScreenState();
}

class _SocialTabScreenState extends State<SocialTabScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  List<dynamic> _searchResults = [];
  bool _isSearching = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      state.loadFriends();
      state.loadPendingInvites();
      if (widget.autoFocus) {
        _searchFocus.requestFocus();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, AppState state) {
    setState(() {
      _searchQuery = query;
      if (query.trim().length < 2) {
        _searchResults = [];
        _isSearching = false;
        return;
      }
      _isSearching = true;
    });

    if (query.trim().length >= 2) {
      state.searchUsers(query).then((results) {
        if (mounted && _searchQuery == query) {
          setState(() {
            _searchResults = results;
            _isSearching = false;
          });
        }
      });
    }
  }

  Future<void> _scanQrCode() async {
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const QrScanScreen()),
    );
    if (result == null || !mounted) return;

    String? username;
    final locusWtfPrefix = RegExp(r'locus\.wtf/([a-zA-Z0-9_]+)');
    final locusAppPrefix = RegExp(r'locus\.app/(join|convoy)/([a-zA-Z0-9_]+)');
    final match = locusWtfPrefix.firstMatch(result);
    if (match != null) {
      username = match.group(1);
    } else {
      final joinMatch = locusAppPrefix.firstMatch(result);
      if (joinMatch != null) {
        username = joinMatch.group(2);
      }
    }

    if (username != null) {
      _searchController.text = username;
      _searchQuery = username;
      _onSearchChanged(username, context.read<AppState>());
    } else {
      _searchController.text = result;
      _searchQuery = result;
      _onSearchChanged(result, context.read<AppState>());
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161B22),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white70),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Find People',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: Color(0xFFC4B5FD)),
            tooltip: 'Scan QR Code',
            onPressed: _scanQrCode,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF30363D)),
              ),
              child: TextField(
                autofocus: widget.autoFocus,
                controller: _searchController,
                focusNode: _searchFocus,
                onChanged: (val) => _onSearchChanged(val, state),
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'Search by username...',
                  hintStyle: const TextStyle(color: Colors.white38),
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.qr_code_scanner, color: Color(0xFFC4B5FD), size: 22),
                        tooltip: 'Scan QR',
                        onPressed: _scanQrCode,
                      ),
                      if (_searchQuery.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white54),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('', state);
                          },
                        ),
                    ],
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
          ),
          Expanded(
            child: _searchQuery.trim().length < 2
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.search, size: 48, color: Colors.white12),
                        SizedBox(height: 12),
                        Text(
                          'Type a name to find other drivers',
                          style: TextStyle(color: Colors.white30, fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : _isSearching
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF6C63FF)))
                    : _searchResults.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.sentiment_dissatisfied, size: 48, color: Colors.white12),
                                SizedBox(height: 12),
                                Text(
                                  'No users found',
                                  style: TextStyle(color: Colors.white30, fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _searchResults.length,
                            itemBuilder: (context, index) {
                              final user = _searchResults[index];
                              return _buildUserTile(user, state);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserTile(dynamic user, AppState state) {
    final bool isFollowing = user['isFollowing'] == true;
    final bool isFriend = user['isFriend'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF30363D), width: 1),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF21262D),
          child: const Icon(Icons.person, color: Colors.white54),
        ),
        title: Row(
          children: [
            Text(
              user['displayName'] ?? 'User',
              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
            ),
            if (isFriend) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Friend',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ],
        ),
        trailing: isFollowing
            ? OutlinedButton(
                onPressed: () async {
                  await state.unfollowUser(user['id']);
                  _onSearchChanged(_searchQuery, state);
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                ),
                child: const Text('Following', style: TextStyle(color: Colors.white54, fontSize: 12)),
              )
            : ElevatedButton(
                onPressed: () async {
                  await state.followUser(user['id']);
                  _onSearchChanged(_searchQuery, state);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  elevation: 0,
                ),
                child: const Text('Follow', style: TextStyle(fontSize: 12)),
              ),
      ),
    );
  }
}
