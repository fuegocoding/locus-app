class User {
  final String id;
  final String phone;
  String displayName;
  String? avatar;
  String? vehicleTag;
  String privacyMode;
  int points;
  bool premium;
  bool anonymousMode;
  List<String> pins;

  User({
    required this.id,
    required this.phone,
    required this.displayName,
    this.avatar,
    this.vehicleTag,
    this.privacyMode = 'open',
    this.points = 0,
    this.premium = false,
    this.anonymousMode = false,
    List<String>? pins,
  }) : pins = pins ?? [];

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      phone: json['phone'],
      displayName: json['displayName'],
      avatar: json['avatar'],
      vehicleTag: json['vehicleTag'],
      privacyMode: json['privacyMode'] ?? 'open',
      points: json['points'] ?? 0,
      premium: json['premium'] ?? false,
      anonymousMode: json['anonymousMode'] ?? false,
      pins: List<String>.from(json['pins'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'phone': phone,
    'displayName': displayName,
    'avatar': avatar,
    'vehicleTag': vehicleTag,
    'privacyMode': privacyMode,
    'points': points,
    'premium': premium,
    'anonymousMode': anonymousMode,
    'pins': pins,
  };
}

class PresenceUpdate {
  final String userId;
  final double latitude;
  final double longitude;
  final double speed;
  final double heading;
  final String privacyMode;
  final String mode;
  final String? convoyId;
  final int timestamp;
  final String? displayName;
  final bool? anonymousMode;

  PresenceUpdate({
    required this.userId,
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.heading,
    required this.privacyMode,
    required this.mode,
    this.convoyId,
    required this.timestamp,
    this.displayName,
    this.anonymousMode,
  });

  factory PresenceUpdate.fromJson(Map<String, dynamic> json) {
    return PresenceUpdate(
      userId: json['userId'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      speed: (json['speed'] as num).toDouble(),
      heading: (json['heading'] as num).toDouble(),
      privacyMode: json['privacyMode'],
      mode: json['mode'],
      convoyId: json['convoyId'],
      timestamp: json['timestamp'],
      displayName: json['displayName'],
      anonymousMode: json['anonymousMode'],
    );
  }
}

class Convoy {
  final String id;
  final String name;
  final String creatorId;
  final String accessLevel;
  final String inviteCode;
  final List<String> members;
  final String livekitRoom;
  final DateTime createdAt;

  Convoy({
    required this.id,
    required this.name,
    required this.creatorId,
    required this.accessLevel,
    required this.inviteCode,
    required this.members,
    required this.livekitRoom,
    required this.createdAt,
  });

  factory Convoy.fromJson(Map<String, dynamic> json) {
    return Convoy(
      id: json['id'],
      name: json['name'],
      creatorId: json['creatorId'],
      accessLevel: json['accessLevel'],
      inviteCode: json['inviteCode'],
      members: List<String>.from(json['members'] ?? []),
      livekitRoom: json['livekitRoom'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
