import 'package:flutter/material.dart';

class MainMenuScreen extends StatelessWidget {
  const MainMenuScreen({super.key, required this.gameFactory});

  final Widget Function() gameFactory;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Colors.indigo, Colors.black]),
        ),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('Mountain Rider X', style: TextStyle(fontSize: 42, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => Scaffold(body: gameFactory()))),
              child: const Text('Play'),
            ),
            ElevatedButton(onPressed: () {}, child: const Text('Garage')),
            ElevatedButton(onPressed: () {}, child: const Text('Daily Rewards')),
          ]),
        ),
      ),
    );
  }
}
