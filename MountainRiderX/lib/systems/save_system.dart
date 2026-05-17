import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mountain_rider_x/data/models.dart';

class SaveSystem {
  static const _key = 'mountain_rider_progress_v1';

  Future<PlayerProgress> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) {
      return PlayerProgress(
        coins: 0,
        selectedVehicle: 'jeep',
        upgrades: {'engine': 0, 'suspension': 0, 'grip': 0, 'fuel': 0},
        unlockedVehicles: {
          'jeep': true,
          'bike': false,
          'monster': false,
          'sport': false,
        },
      );
    }
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return PlayerProgress(
      coins: map['coins'] as int,
      selectedVehicle: map['selectedVehicle'] as String,
      upgrades: Map<String, int>.from(map['upgrades'] as Map),
      unlockedVehicles: Map<String, bool>.from(map['unlockedVehicles'] as Map),
    );
  }

  Future<void> save(PlayerProgress progress) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = jsonEncode({
      'coins': progress.coins,
      'selectedVehicle': progress.selectedVehicle,
      'upgrades': progress.upgrades,
      'unlockedVehicles': progress.unlockedVehicles,
    });
    await prefs.setString(_key, payload);
  }
}
