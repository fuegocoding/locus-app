import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/map_widget.dart';
import '../widgets/proximity_overlay.dart';
import '../widgets/convoy_panel.dart';
import 'tasks_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override void initState() { super.initState(); final s = context.read<AppState>(); s.requestPermissions().then((_) => s.startLocation()); }

  @override Widget build(BuildContext context) {
    final s = context.watch<AppState>(); final t = Theme.of(context);
    return Scaffold(body: Stack(children: [
      const MapWidget(),
      Positioned(top: MediaQuery.of(context).padding.top + 4, left: 8, right: 8, child: _topBar(s, t)),
      if (s.mode == 'proximity') const ProximityOverlay() else if (s.mode == 'convoy') const ConvoyPanel(),
      _audioBar(s, t),
    ]));
  }

  Widget _topBar(AppState s, ThemeData t) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(color: t.colorScheme.surface.withOpacity(0.92), borderRadius: BorderRadius.circular(14), border: Border.all(color: t.colorScheme.outline.withOpacity(0.15))),
    child: Row(children: [
      Container(w: 8, h: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: s.mode == 'proximity' ? Colors.green : Colors.blue)), const SizedBox(w: 6),
      GestureDetector(onTap: () => s.mode == 'proximity' ? _showConvoySheet() : s.setMode('proximity'),
        child: Text(s.mode == 'proximity' ? 'Proximity' : (s.currentConvoy?.name ?? 'Convoy'), style: t.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600))),
      if (s.currentConvoy != null && s.mode == 'convoy') Text(' - ${s.currentConvoy!.members.length} members', style: t.textTheme.bodySmall?.copyWith(color: t.colorScheme.onSurface.withOpacity(0.5), fontSize: 10)),
      const Spacer(),
      Text('${s.nearbyUsers.length} near', style: t.textTheme.bodySmall?.copyWith(color: t.colorScheme.onSurface.withOpacity(0.5), fontSize: 10)),
      const SizedBox(w: 8),
      _icon(Icons.assignment, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen()))),
      _icon(Icons.settings, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
    ]),
  );
  Widget _icon(IconData i, VoidCallback t) => GestureDetector(onTap: t, child: Padding(padding: const EdgeInsets.symmetric(h: 4), child: Icon(i, size: 18, color: Colors.white54)));

  Widget _audioBar(AppState s, ThemeData t) => Positioned(bottom: 16, left: 12, right: 12, child: Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: t.colorScheme.surface.withOpacity(0.95), borderRadius: BorderRadius.circular(18), border: Border.all(color: t.colorScheme.outline.withOpacity(0.2)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 4))]),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
      _btn(Icons.settings, 'Mode', _showModeMenu), _btn(s.micMuted ? Icons.mic_off : Icons.mic, s.micMuted ? 'Muted' : 'Mic', () => s.toggleMic()),
      _talkBtn(s, t),
      _btn(s.mode == 'proximity' ? Icons.groups : Icons.public, 'Switch', () => s.mode == 'proximity' ? _showConvoySheet() : s.setMode('proximity')),
      _btn(Icons.bolt, 'Burst', () {}),
    ]),
  ));
  Widget _btn(IconData i, String l, VoidCallback t) => GestureDetector(onTap: t, child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(i, size: 22, color: Colors.white70), const SizedBox(h: 2), Text(l, style: const TextStyle(fontSize: 9, color: Colors.white54))]));
  Widget _talkBtn(AppState s, ThemeData t) => GestureDetector(
    onTapDown: (_) => s.startSpeaking(), onTapUp: (_) => s.stopSpeaking(), onTapCancel: () => s.stopSpeaking(),
    child: Container(w: 56, h: 56, decoration: BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [t.colorScheme.primary, t.colorScheme.primary.withOpacity(0.7)], begin: Alignment.topLeft, end: Alignment.bottomRight), boxShadow: [BoxShadow(color: t.colorScheme.primary.withOpacity(0.4), blurRadius: 16, spreadRadius: 2)]), child: const Icon(Icons.mic, color: Colors.white, size: 28)),
  );

  void _showModeMenu() {
    final s = context.read<AppState>();
    showModalBottomSheet(context: context, builder: (_) => SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: [
      SwitchListTile(secondary: const Icon(Icons.mic), title: const Text('Open Mic'), value: !s.pushToTalk, onChanged: (v) => s.setPushToTalk(!v)),
      SwitchListTile(secondary: const Icon(Icons.mic_none), title: const Text('Push to Talk'), value: s.pushToTalk, onChanged: (v) => s.setPushToTalk(v)),
      ListTile(leading: const Icon(Icons.visibility_off), title: const Text('Go Invisible'), onTap: () => Navigator.pop(context)),
    ])));
  }
  void _showConvoySheet() {
    final s = context.read<AppState>(); final c = TextEditingController();
    showModalBottomSheet(context: context, builder: (_) => SafeArea(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Text('Create Convoy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), const SizedBox(h: 16),
      TextField(controller: c, decoration: InputDecoration(labelText: 'Convoy name', hintText: 'e.g. Road Trip Crew', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))), const SizedBox(h: 8),
      SizedBox(w: double.infinity, h: 52, child: ElevatedButton(onPressed: () { if (c.text.trim().isNotEmpty) { s.createConvoy(c.text.trim()); Navigator.pop(context); } }, child: const Text('Create'))),
      const SizedBox(h: 8), OutlinedButton(onPressed: () { Navigator.pop(context); _promptInviteCode(); }, child: const Text('Join with Invite Code')),
    ]))));
  }
  void _promptInviteCode() {
    final s = context.read<AppState>(); final c = TextEditingController();
    showDialog(context: context, builder: (_) => AlertDialog(title: const Text('Join Convoy'), content: TextField(controller: c, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Invite code', hintText: 'ABC123')), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), ElevatedButton(onPressed: () { if (c.text.trim().isNotEmpty) { s.joinConvoy(c.text.trim()); Navigator.pop(context); } }, child: const Text('Join'))]));
  }
}

extension _Pad on EdgeInsets {
  const EdgeInsets.symmetric({double h = 0, double v = 0}) : this.symmetric(horizontal: h, vertical: v);
}
