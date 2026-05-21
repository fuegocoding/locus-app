import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class SocialTabScreen extends StatefulWidget {
  const SocialTabScreen({super.key});

  @override
  State<SocialTabScreen> createState() => _SocialTabScreenState();
}

class _SocialTabScreenState extends State<SocialTabScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  bool _isSearching = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Refresh lists on startup
    final state = context.read<AppState>();
    state.loadFriends();
    state.loadPendingInvites();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, AppState state) async {
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
      final results = await state.searchUsers(query);
      if (mounted && _searchQuery == query) {
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF161B22), Color(0xFF0D1117)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            border: Border(
              bottom: BorderSide(
                color: theme.colorScheme.outline.withOpacity(0.08),
              ),
            ),
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white70),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'Friends',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 22,
                letterSpacing: 0.5,
                color: Colors.white,
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF6C63FF),
              indicatorWeight: 3,
              labelColor: const Color(0xFF6C63FF),
              unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              tabs: const [
                Tab(text: 'Friends & Invites'),
                Tab(text: 'Find People'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFriendsTab(state, theme),
          _buildFindPeopleTab(state, theme),
        ],
      ),
    );
  }

  Widget _buildFriendsTab(AppState state, ThemeData theme) {
    if (state.isLoadingFriends && state.friends.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF6C63FF)),
      );
    }

    final invites = state.pendingInvites;
    final friends = state.friends;

    if (friends.isEmpty && invites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF30363D), width: 2),
              ),
              child: const Icon(Icons.people_outline, size: 64, color: Colors.white30),
            ),
            const SizedBox(height: 24),
            const Text(
              'No friends or invites yet',
              style: TextStyle(color: Colors.white70, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Follow other driving users to trigger mutual friendships and invite them directly to convoys.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white30, fontSize: 13),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _tabController.animateTo(1),
              icon: const Icon(Icons.search, size: 18),
              label: const Text('Find Users'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C63FF),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF6C63FF),
      backgroundColor: const Color(0xFF161B22),
      onRefresh: () async {
        await state.loadFriends();
        await state.loadPendingInvites();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (invites.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.mail_outline, color: Color(0xFF6C63FF), size: 20),
                const SizedBox(width: 8),
                Text(
                  'Incoming Invites (${invites.length})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...invites.map((inv) => _buildInviteCard(inv, state, theme)),
            const SizedBox(height: 24),
          ],
          if (friends.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.group, color: Color(0xFF10B981), size: 20),
                const SizedBox(width: 8),
                Text(
                  'Friends (${friends.length})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: friends.length,
              itemBuilder: (context, index) {
                final friend = friends[index];
                return _buildFriendTile(friend, state, theme);
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInviteCard(dynamic invite, AppState state, ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1A3A), // custom glassmorphic tone for invites
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFF6C63FF).withOpacity(0.2),
                child: const Icon(Icons.directions_car, color: Color(0xFFC4B5FD)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invite['senderName'] ?? 'A friend',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Invited you to: ${invite['convoyName']}',
                      style: const TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => state.respondToInvite(invite['id'], 'declined'),
                child: const Text('Decline', style: TextStyle(color: Colors.redAccent)),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => state.respondToInvite(invite['id'], 'accepted'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('Join Convoy'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFriendTile(dynamic friend, AppState state, ThemeData theme) {
    final bool isOnline = friend['isOnline'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF30363D), width: 1),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Stack(
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFF21262D),
              backgroundImage: (friend['avatar'] != null && (friend['avatar'] as String).isNotEmpty)
                  ? NetworkImage(friend['avatar'])
                  : null,
              child: friend['avatar'] == null
                  ? const Icon(Icons.person, color: Colors.white54)
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: isOnline ? const Color(0xFF10B981) : Colors.grey,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF161B22), width: 2),
                ),
              ),
            ),
          ],
        ),
        title: Text(
          friend['displayName'] ?? 'User',
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        subtitle: friend['vehicleTag'] != null && (friend['vehicleTag'] as String).isNotEmpty
            ? Text(
                friend['vehicleTag'],
                style: const TextStyle(color: Colors.white30, fontSize: 11),
              )
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (state.mode == 'convoy')
              IconButton(
                icon: const Icon(Icons.group_add, color: Color(0xFF6C63FF)),
                tooltip: 'Invite to Convoy',
                onPressed: () {
                  state.sendConvoyInvite(friend['id']);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Sent convoy invitation to ${friend['displayName']}')),
                  );
                },
              ),
            IconButton(
              icon: const Icon(Icons.person_remove_outlined, color: Colors.white30),
              tooltip: 'Unfollow',
              onPressed: () => _confirmUnfollow(friend, state),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmUnfollow(dynamic friend, AppState state) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF161B22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Unfollow User?', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to unfollow ${friend['displayName']}? You will no longer be friends.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white30)),
          ),
          ElevatedButton(
            onPressed: () {
              state.unfollowUser(friend['id']);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Unfollow', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildFindPeopleTab(AppState state, ThemeData theme) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outline.withOpacity(0.12),
              ),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => _onSearchChanged(val, state),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search display name...',
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
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
        ),
        Expanded(
          child: _searchQuery.trim().length < 2
              ? _buildSearchInstruction()
              : _isSearching
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF6C63FF)))
                  : _searchResults.isEmpty
                      ? _buildNoResults()
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _searchResults.length,
                          itemBuilder: (context, index) {
                            final user = _searchResults[index];
                            return _buildSearchUserTile(user, state, theme);
                          },
                        ),
        ),
      ],
    );
  }

  Widget _buildSearchInstruction() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.search, size: 64, color: Colors.white12),
          SizedBox(height: 16),
          Text(
            'Type at least 2 characters to search',
            style: TextStyle(color: Colors.white30, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.sentiment_dissatisfied, size: 64, color: Colors.white12),
          SizedBox(height: 16),
          Text(
            'No users found matching query',
            style: TextStyle(color: Colors.white30, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchUserTile(dynamic user, AppState state, ThemeData theme) {
    final bool isFollowing = user['isFollowing'] == true;
    final bool isFriend = user['isFriend'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF30363D), width: 1),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF21262D),
          backgroundImage: (user['avatar'] != null && (user['avatar'] as String).isNotEmpty)
              ? NetworkImage(user['avatar'])
              : null,
          child: user['avatar'] == null
              ? const Icon(Icons.person, color: Colors.white54)
              : null,
        ),
        title: Row(
          children: [
            Text(
              user['displayName'] ?? 'User',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            if (isFriend) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Friend',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ],
        ),
        subtitle: user['vehicleTag'] != null && (user['vehicleTag'] as String).isNotEmpty
            ? Text(
                user['vehicleTag'],
                style: const TextStyle(color: Colors.white30, fontSize: 11),
              )
            : null,
        trailing: isFollowing
            ? OutlinedButton(
                onPressed: () async {
                  await state.unfollowUser(user['id']);
                  _onSearchChanged(_searchQuery, state); // refresh tile
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Following', style: TextStyle(color: Colors.white70, fontSize: 12)),
              )
            : ElevatedButton(
                onPressed: () async {
                  await state.followUser(user['id']);
                  _onSearchChanged(_searchQuery, state); // refresh tile
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Follow', style: TextStyle(fontSize: 12)),
              ),
      ),
    );
  }
}
