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
        gameFactory: () => GameWidget(game: MountainRiderGame()),
      ),
    );
  }
}
