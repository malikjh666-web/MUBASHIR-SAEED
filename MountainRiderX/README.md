# Mountain Rider X (Flutter + Flame)

Complete starter architecture for a 2D hill-climbing physics mobile game targeting Android first.

## Features Included
- Physics driving core (Forge2D scaffold)
- Procedural terrain generation (hills/noise segments)
- Vehicle/controller module
- Fuel, flip-fail, pit-fail game-over logic
- Score system (distance + coins)
- Garage system with four vehicles + upgrade model
- Save/load system (SharedPreferences)
- Audio manager, leaderboard, ad reward stubs
- Debug cheats for fuel/coins
- Modular folder architecture for future multiplayer

## Folder Structure
- `lib/game`: vehicle + terrain + main game loop
- `lib/systems`: game systems (garage, save, audio, pooling)
- `lib/ui`: main menu, HUD, in-game overlays
- `lib/services`: leaderboard/ad integration points
- `lib/data`: models and progression schema
- `lib/debug`: cheat/debug helpers
- `assets/*`: placeholders for visuals/audio/particles

## Setup
1. Install Flutter 3.22+ and Android SDK.
2. Run:
   ```bash
   cd MountainRiderX
   flutter pub get
   flutter run -d android
   ```
3. Replace placeholders under `assets/` with game sprites, sounds, and map art.

## Gameplay Rules Implemented
- Lose when fuel reaches 0.
- Lose when upside down for >3 seconds.
- Lose when falling into pit threshold.

## Map Plan
Implement themes in `MapTheme` with distinct gravity multipliers:
- countryside
- desert
- snow mountain
- moon

## Next Steps to Production
- Replace placeholder body torque with wheel-joint suspension and wheel torque.
- Add collectible entity components for coins/fuel.
- Add parallax backgrounds, dust/exhaust particles, damage animation.
- Implement achievements, daily rewards, tutorial flow, ghost replay recording/playback.
- Hook leaderboard to Google Play Games Services.
- Add offline cache, rewarded ads SDK, skin customization UI.

