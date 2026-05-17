import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:mountain_rider_x/core/game_constants.dart';
import 'package:mountain_rider_x/game/terrain_generator.dart';
import 'package:mountain_rider_x/game/vehicle_controller.dart';
import 'package:mountain_rider_x/systems/audio_manager.dart';
import 'package:mountain_rider_x/systems/game_manager.dart';
import 'package:mountain_rider_x/systems/object_pool.dart';

class MountainRiderGame extends Forge2DGame with TapCallbacks {
  MountainRiderGame() : super(gravity: Vector2(0, GameConstants.baseGravity));

  late final TerrainGenerator terrainGenerator;
  late final VehicleController vehicle;
  late final GameManager gameManager;
  late final AudioManager audioManager;
  late final ObjectPool pool;

  @override
  Future<void> onLoad() async {
    camera.viewfinder.zoom = 16;
    terrainGenerator = TerrainGenerator(theme: MapTheme.countryside);
    vehicle = VehicleController();
    gameManager = GameManager();
    audioManager = AudioManager();
    pool = ObjectPool();

    await addAll([terrainGenerator, vehicle, gameManager]);
    camera.follow(vehicle.chassisComponent, maxSpeed: 4);
  }

  @override
  void update(double dt) {
    super.update(dt);
    gameManager.consumeFuel(vehicle.isAccelerating, dt);
    gameManager.distance = max(gameManager.distance, vehicle.position.x);

    if (vehicle.isUpsideDown) {
      gameManager.flipTimer += dt;
    } else {
      gameManager.flipTimer = 0;
    }

    if (gameManager.shouldLose(vehicleY: vehicle.position.y)) {
      pauseEngine();
      overlays.add('GameOver');
    }
  }
}
