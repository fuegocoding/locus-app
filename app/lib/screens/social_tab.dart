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

    final convoyPattern = RegExp(r'locus\.(wtf|app)/(convoy|join)/([a-zA-Z0-9_]+)');
    final convoyMatch = convoyPattern.firstMatch(result);
    if (convoyMatch != null) {
      final code = convoyMatch.group(3)!;
      if (!mounted) return;
      _showConvoyJoinDialog(code);
      return;
    }

    final userPattern = RegExp(r'locus\.wtf/([a-zA-Z0-9_]+)');
    final userMatch = userPattern.firstMatch(result);
    if (userMatch != null) {
      _lookupAndFollow(userMatch.group(1)!);
      return;
    }

    // Fallback: treat raw text as search query
    _searchController.text = result;
    _searchQuery = result;
    _onSearchChanged(result, context.read<AppState>());
  }

  void _showConvoyJoinDialog(String code) {
    final state = context.read<AppState>();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161B22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Join Convoy', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.groups, color: Color(0xFFC4B5FD), size: 48),
            const SizedBox(height: 16),
            const Text('You scanned a convoy invite.', style: TextStyle(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0D1117),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF30363D)),
              ),
              child: Text(
                code,
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 3),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white38)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF)),
            onPressed: () {
              state.joinConvoy(code);
              Navigator.pop(ctx);
            },
            child: const Text('Join Convoy'),
          ),
        ],
      ),
    );
  }

  Future<void> _lookupAndFollow(String username) async {
    final state = context.read<AppState>();
    final results = await state.searchUsers(username);

    if (!mounted) return;

    final matchedUser = results.cast<Map<String, dynamic>?>().firstWhere(
      (u) => (u?['displayName']?.toString().toLowerCase() ?? '') == username.toLowerCase(),
      orElse: () => null,
    );

    if (matchedUser == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User not found')),
      );
      return;
    }

    _showFollowDialog(state, matchedUser);
  }

  void _showFollowDialog(AppState state, Map<String, dynamic> user) {
    final displayName = user['displayName'] ?? 'Unknown';
    final userId = user['id'] as String;
    final bool isFollowing = user['isFollowing'] == true;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161B22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Scanned User', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: const Color(0xFF21262D),
              child: Text(
                displayName[0].toUpperCase(),
                style: const TextStyle(fontSize: 28, color: Color(0xFFC4B5FD)),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '@$displayName',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (isFollowing)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'You are already following this user',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 13),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white38)),
          ),
          if (!isFollowing)
            StatefulBuilder(
              builder: (ctx, setDialogState) {
                bool loading = false;
                return ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF)),
                  onPressed: loading
                      ? null
                      : () async {
                          setDialogState(() => loading = true);
                          final result = await state.apiService.followUser(userId);
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          if (!mounted) return;
                          final isFriend = result['isFriend'] == true;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                isFriend
                                    ? '@$displayName is now your friend!'
                                    : 'Follow request sent to @$displayName',
                              ),
                              backgroundColor: isFriend ? const Color(0xFF10B981) : const Color(0xFF6C63FF),
                            ),
                          );
                          state.loadFriends();
                        },
                  child: loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Follow'),
                );
              },
            ),
        ],
      ),
    );
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
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white54),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('', state);
                          },
                        )
                      : null,
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
