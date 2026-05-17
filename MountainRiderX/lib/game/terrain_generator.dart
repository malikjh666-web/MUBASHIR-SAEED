import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame_forge2d/flame_forge2d.dart';
import 'package:mountain_rider_x/core/game_constants.dart';

class TerrainGenerator extends Component with HasGameReference<Forge2DGame> {
  TerrainGenerator({required this.theme});

  final MapTheme theme;
  final Random _random = Random();
  double _lastX = -20;
  double _lastY = 0;

  @override
  Future<void> onLoad() async {
    _generateChunk(80);
  }

  void _generateChunk(int segments) {
    for (int i = 0; i < segments; i++) {
      final x = _lastX + 2.2;
      final wave = sin(x * 0.18) * 1.4;
      final noise = (_random.nextDouble() - 0.5) * 0.8;
      final y = (_lastY * 0.55) + wave + noise;
      _addGroundSegment(Vector2(_lastX, _lastY), Vector2(x, y));
      _lastX = x;
      _lastY = y;
    }
  }

  void _addGroundSegment(Vector2 a, Vector2 b) {
    final body = game.world.createBody(BodyDef());
    body.createFixture(FixtureDef(EdgeShape()..set(a, b), friction: 1.2));
  }
}
