import 'package:mountain_rider_x/core/game_constants.dart';

class GameManager {
  double fuel = GameConstants.initialFuel;
  double distance = 0;
  int coins = 0;
  double flipTimer = 0;
  bool debugUnlimitedFuel = false;

  void consumeFuel(bool accelerating, double dt) {
    if (debugUnlimitedFuel || !accelerating) return;
    fuel -= GameConstants.fuelConsumptionPerSec * dt;
  }

  int get score => distance.floor() + coins * GameConstants.coinScore;

  bool shouldLose({required double vehicleY}) {
    return fuel <= 0 || flipTimer > GameConstants.flipFailSeconds || vehicleY > 50;
  }
}
