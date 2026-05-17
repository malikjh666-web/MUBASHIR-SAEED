import 'package:mountain_rider_x/data/models.dart';

class GarageSystem {
  static const vehicles = [
    VehicleStats(id: 'jeep', displayName: 'Jeep', baseTorque: 22, suspensionStiffness: 0.9, tireGrip: 1, fuelTank: 100),
    VehicleStats(id: 'bike', displayName: 'Bike', baseTorque: 18, suspensionStiffness: 0.7, tireGrip: 0.95, fuelTank: 90),
    VehicleStats(id: 'monster', displayName: 'Monster Truck', baseTorque: 30, suspensionStiffness: 1.3, tireGrip: 1.1, fuelTank: 120),
    VehicleStats(id: 'sport', displayName: 'Sports Car', baseTorque: 26, suspensionStiffness: 0.8, tireGrip: 1.05, fuelTank: 95),
  ];
}
