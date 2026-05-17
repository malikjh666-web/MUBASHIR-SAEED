import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:mountain_rider_x/game/mountain_rider_game.dart';
import 'package:mountain_rider_x/ui/main_menu_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MountainRiderXApp());
}

class MountainRiderXApp extends StatelessWidget {
  const MountainRiderXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Mountain Rider X',
      theme: ThemeData.dark(useMaterial3: true),
      home: MainMenuScreen(
        gameFactory: () {
          final game = MountainRiderGame();
          return GameWidget(
            game: game,
            overlayBuilderMap: {
              'GameOver': (context, _) {
                return _GameOverOverlay(
                  onRestart: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => Scaffold(body: MountainRiderGameScreen())),
                    );
                  },
                  onExit: () => Navigator.of(context).pop(),
                );
              },
            },
          );
        },
      ),
    );
  }
}

class MountainRiderGameScreen extends StatelessWidget {
  const MountainRiderGameScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = MountainRiderGame();
    return GameWidget(
      game: game,
      overlayBuilderMap: {
        'GameOver': (context, _) => _GameOverOverlay(
          onRestart: () {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const Scaffold(body: MountainRiderGameScreen())),
            );
          },
          onExit: () => Navigator.of(context).pop(),
        ),
      },
    );
  }
}

class _GameOverOverlay extends StatelessWidget {
  const _GameOverOverlay({required this.onRestart, required this.onExit});

  final VoidCallback onRestart;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black54,
      child: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Game Over', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: onRestart, child: const Text('Restart')),
                TextButton(onPressed: onExit, child: const Text('Exit to Menu')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
