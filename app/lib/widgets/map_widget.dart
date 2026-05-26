import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

const String _tileUrl =
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

class MapWidget extends StatefulWidget {
  const MapWidget({super.key});

  @override
  MapWidgetState createState() => MapWidgetState();
}

class MapWidgetState extends State<MapWidget> {
  final MapController _mapController = MapController();
  bool followingUser = true;

  void recenterOnUser(AppState state) {
    if (state.latitude != 0 && state.longitude != 0) {
      _mapController.move(
        LatLng(state.latitude, state.longitude),
        _mapController.camera.zoom,
      );
      setState(() => followingUser = true);
    }
  }

  void _followIfNeeded(AppState state) {
    if (followingUser && state.latitude != 0 && state.longitude != 0) {
      _mapController.move(
        LatLng(state.latitude, state.longitude),
        _mapController.camera.zoom,
      );
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = context.read<AppState>();
      if (state.latitude != 0 && state.longitude != 0) {
        _mapController.move(
          LatLng(state.latitude, state.longitude),
          15,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    try {
      return _buildMap(context);
    } catch (e, stack) {
      debugPrint('MAP WIDGET CRASH: $e\n$stack');
      return Container(
        color: const Color(0xFF1A1A3E),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.map, color: Color(0xFF6C63FF), size: 48),
              SizedBox(height: 12),
              Text('Map unavailable', style: TextStyle(color: Colors.white70, fontSize: 16)),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildMap(BuildContext context) {
    return Container(
      color: const Color(0xFF0A1A2E),
      child: const Center(
        child: Text('MAP', style: TextStyle(color: Color(0xFF6C63FF), fontSize: 24)),
      ),
    );
  }

  void _showUserSheet(BuildContext context, AppState state, user, bool isPinned) {
    final displayName = (user.displayName != null && user.displayName!.isNotEmpty)
        ? user.displayName!
        : user.userId.substring(0, 8);
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: isPinned ? Colors.amber : Theme.of(context).colorScheme.primary,
                    child: Text(displayName.substring(0, 1).toUpperCase()),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${user.latitude.toStringAsFixed(4)}, ${user.longitude.toStringAsFixed(4)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        if (isPinned) {
                          state.unpinUser(user.userId);
                        } else {
                          state.pinUser(user.userId);
                        }
                        Navigator.pop(context);
                      },
                      icon: Icon(isPinned ? Icons.push_pin : Icons.push_pin_outlined),
                      label: Text(isPinned ? 'Unpin' : 'Pin'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        state.muteUser(user.userId);
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.volume_off),
                      label: const Text('Mute'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    state.blockUser(user.userId);
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.block, color: Colors.red),
                  label: const Text('Block', style: TextStyle(color: Colors.red)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
