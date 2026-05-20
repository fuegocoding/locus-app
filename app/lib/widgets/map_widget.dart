import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

// Free dark map tiles (CartoDB Dark Matter) - no API key needed
const String _tileUrl =
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

class MapWidget extends StatefulWidget {
  const MapWidget({super.key});

  @override
  State<MapWidget> createState() => _MapWidgetState();
}

class _MapWidgetState extends State<MapWidget> {
  final MapController _mapController = MapController();

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _onPositionUpdate(AppState state) {
    if (state.latitude != 0 && state.longitude != 0) {
      _mapController.move(
        LatLng(state.latitude, state.longitude),
        _mapController.camera.zoom,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    // Follow user location
    WidgetsBinding.instance.addPostFrameCallback((_) => _onPositionUpdate(state));

    final userLocation = state.latitude != 0 && state.longitude != 0
        ? LatLng(state.latitude, state.longitude)
        : const LatLng(40.7128, -74.0060);

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: userLocation,
        initialZoom: 15,
        minZoom: 3,
        maxZoom: 19,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
      ),
      children: [
        TileLayer(
          urlTemplate: _tileUrl,
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'com.locus.locus',
          tileProvider: NetworkTileProvider(),
        ),
        // User location marker
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
            ...state.nearbyUsers.map((user) {
              final isSpeaking = state.speaking[user.userId] == true;
              final isPinned = state.user?.pins.contains(user.userId) ?? false;
              final volume = state.volumes[user.userId] ?? 0.5;
              return Marker(
                point: LatLng(user.latitude, user.longitude),
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
                        user.userId.substring(0, 5),
                        style: const TextStyle(fontSize: 8, color: Colors.white70),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ],
    );
  }
}
