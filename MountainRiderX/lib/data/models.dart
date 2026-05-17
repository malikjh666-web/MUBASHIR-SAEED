class VehicleStats {
  final String id;
  final String displayName;
  final double baseTorque;
  final double suspensionStiffness;
  final double tireGrip;
  final double fuelTank;

  const VehicleStats({
    required this.id,
    required this.displayName,
    required this.baseTorque,
    required this.suspensionStiffness,
    required this.tireGrip,
    required this.fuelTank,
  });
}

class PlayerProgress {
  int coins;
  String selectedVehicle;
  Map<String, int> upgrades;
  Map<String, bool> unlockedVehicles;

  PlayerProgress({
    required this.coins,
    required this.selectedVehicle,
    required this.upgrades,
    required this.unlockedVehicles,
  });
}
