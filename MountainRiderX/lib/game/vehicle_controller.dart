import 'package:flame/components.dart';
import 'package:flame_forge2d/flame_forge2d.dart';

class VehicleController extends BodyComponent {
  late Body chassis;
  bool isAccelerating = false;
  bool isBraking = false;

  @override
  Body createBody() {
    final def = BodyDef(type: BodyType.dynamic, position: Vector2(0, -3));
    chassis = world.createBody(def)
      ..createFixture(FixtureDef(PolygonShape()..setAsBox(1.8, 0.35), density: 1.2));
    return chassis;
  }

  PositionComponent get chassisComponent => this;

  bool get isUpsideDown {
    final upDot = Vector2(0, -1)..rotate(body.angle);
    return upDot.y > 0.2;
  }

  @override
  void update(double dt) {
    super.update(dt);
    final torque = isAccelerating ? 24.0 : (isBraking ? -14.0 : 0.0);
    body.applyTorque(torque);
  }
}
