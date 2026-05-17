import 'package:flutter/material.dart';

class HudOverlay extends StatelessWidget {
  final int score;
  final double fuel;
  const HudOverlay({super.key, required this.score, required this.fuel});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Padding(padding: const EdgeInsets.all(12), child: Text('Score: $score')),
          Padding(padding: const EdgeInsets.all(12), child: Text('Fuel: ${fuel.toStringAsFixed(0)}')),
        ],
      ),
    );
  }
}
