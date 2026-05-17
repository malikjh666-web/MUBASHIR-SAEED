class GameConstants {
  static const double baseGravity = 20;
  static const double initialFuel = 100;
  static const double fuelConsumptionPerSec = 4.5;
  static const double flipFailSeconds = 3;
  static const int coinScore = 10;
}

enum MapTheme { countryside, desert, snowMountain, moon }

extension MapThemeConfig on MapTheme {
  double get gravityMultiplier => switch (this) {
        MapTheme.countryside => 1.0,
        MapTheme.desert => 0.95,
        MapTheme.snowMountain => 1.1,
        MapTheme.moon => 0.35,
      };
}
