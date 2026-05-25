import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

const String _tileUrl =
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

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
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    final userLocation = state.latitude != 0 && state.longitude != 0
        ? LatLng(state.latitude, state.longitude)
        : const LatLng(40.7128, -74.0060);

    WidgetsBinding.instance.addPostFrameCallback((_) => _followIfNeeded(state));

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: userLocation,
            initialZoom: 15,
            minZoom: 3,
            maxZoom: 19,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
            onMapEvent: (event) {
              if (event is MapEventMoveStart && event.source != MapEventSource.mapController) {
                setState(() => followingUser = false);
              }
            },
          ),
          children: [
            TileLayer(
              urlTemplate: _tileUrl,
              subdomains: const ['a', 'b', 'c', 'd'],
              userAgentPackageName: 'com.locus.locus',
              tileProvider: NetworkTileProvider(),
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: userLocation,
                  width: 40,
                  height: 40,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: theme.colorScheme.primary.withOpacity(0.3),
                      border: Border.all(color: theme.colorScheme.primary, width: 2),
                    ),
                    child: Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  ),
                ),
                ...state.friendLocations.map((f) {
                  final lat = (f['latitude'] as num?)?.toDouble() ?? 0.0;
                  final lng = (f['longitude'] as num?)?.toDouble() ?? 0.0;
                  return Marker(
                    point: LatLng(lat, lng),
                    width: 44,
                    height: 56,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF10B981).withOpacity(0.7),
                            border: Border.all(color: const Color(0xFF34D399), width: 2),
                          ),
                          child: Center(
                            child: Icon(Icons.person, size: 18, color: Colors.white),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            f['displayName'] ?? f['userId'].toString().substring(0, 8),
                            style: const TextStyle(fontSize: 8, color: Colors.white70),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                ...state.nearbyUsers.map((user) {
                  final isSpeaking = state.speaking[user.userId] == true;
                  final isPinned = state.user?.pins.contains(user.userId) ?? false;
                  final volume = state.volumes[user.userId] ?? 0.5;
                  final displayName = (user.displayName != null && user.displayName!.isNotEmpty)
                      ? user.displayName!
                      : user.userId.substring(0, 8);

                  return Marker(
                    point: LatLng(user.latitude, user.longitude),
                    width: 44,
                    height: 56,
                    child: GestureDetector(
                      onTap: () => _showUserSheet(context, state, user, isPinned),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSpeaking
                                  ? theme.colorScheme.primary
                                  : isPinned
                                      ? Colors.amber
                                      : theme.colorScheme.primary.withOpacity(0.5),
                              border: Border.all(
                                color: isPinned ? Colors.amber : theme.colorScheme.primary,
                                width: isSpeaking ? 3 : 1.5,
                              ),
                              boxShadow: isSpeaking
                                  ? [
                                      BoxShadow(
                                        color: theme.colorScheme.primary.withOpacity(0.4),
                                        blurRadius: 12,
                                        spreadRadius: 2,
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Center(
                              child: Text(
                                '${(volume * 100).round()}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: Colors.black87,
                              borderRadius: BorderRadius.circular(3),
                            ),
                            child: Text(
                              displayName,
                              style: const TextStyle(fontSize: 8, color: Colors.white70),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),
      ],
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
