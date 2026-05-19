import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class MapWidget extends StatelessWidget {
  const MapWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final theme = Theme.of(context);

    return Container(
      color: const Color(0xFF1A1D23),
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.map, size: 64, color: theme.colorScheme.primary.withOpacity(0.3)),
                const SizedBox(height: 8),
                Text(
                  state.latitude != 0
                      ? '${state.latitude.toStringAsFixed(4)}, ${state.longitude.toStringAsFixed(4)}'
                      : 'Acquiring GPS...',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.4),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: MediaQuery.of(context).padding.bottom + 8,
            right: 12,
            child: FloatingActionButton.small(
              onPressed: () {},
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}
