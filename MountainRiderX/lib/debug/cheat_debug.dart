import 'package:mountain_rider_x/systems/game_manager.dart';

extension DebugCheats on GameManager {
  void addCoins(int amount) => coins += amount;
  void refillFuel() => fuel = 999;
}
