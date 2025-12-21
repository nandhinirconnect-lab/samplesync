
# Flutter Starter Code for Torch Sync

Here is the complete Flutter starter code as requested. You can copy these files into a new Flutter project.

## 1. `pubspec.yaml` (Dependencies)

```yaml
name: flashman_app
description: A real-time flashlight synchronization app.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  # State management (optional, but good for structured apps)
  provider: ^6.0.0 
  # Socket.IO client
  socket_io_client: ^2.0.0
  # Torch control
  torch_light: ^1.0.0
  # Keep screen on
  wakelock_plus: ^1.1.0
  # Permissions
  permission_handler: ^11.0.0
  # QR Scanner
  mobile_scanner: ^5.0.0
  # Unique ID
  uuid: ^4.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
```

## 2. `lib/core/constants.dart`

```dart
class Constants {
  // REPLACE WITH YOUR REPLIT URL (e.g., wss://your-repl.replit.co)
  // Ensure you use wss:// for https or ws:// for http
  static const String serverUrl = 'https://YOUR-REPL-URL.replit.co'; 
  
  // Effect Types
  static const String effectTorchOn = 'TORCH_ON';
  static const String effectTorchOff = 'TORCH_OFF';
  static const String effectStrobe = 'STROBE';
  static const String effectPulse = 'PULSE';
}
```

## 3. `lib/core/event_client.dart` (Logic)

```dart
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:torch_light/torch_light.dart';
import 'constants.dart';

class EventClient {
  late IO.Socket socket;
  final String pin;
  
  // Time sync
  int serverTimeOffset = 0;
  
  // Strobe timer
  Timer? _effectTimer;

  EventClient(this.pin);

  void connect() {
    socket = IO.io(Constants.serverUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .setPath('/socket.io')
      .disableAutoConnect()
      .build());

    socket.connect();

    socket.onConnect((_) {
      print('Connected');
      socket.emit('join_event', pin);
      _syncTime();
    });

    socket.on('effect', (data) {
      _handleEffect(data);
    });
  }

  void _syncTime() {
    int start = DateTime.now().millisecondsSinceEpoch;
    socket.emitWithAck('time_sync', {'clientSendTime': start}, ack: (data) {
      int end = DateTime.now().millisecondsSinceEpoch;
      int serverReceive = data['serverReceiveTime'];
      int serverSend = data['serverSendTime'];
      
      // Simple NTP offset calculation
      int latency = (end - start) ~/ 2;
      serverTimeOffset = serverReceive - start - latency; // approximate
      print('Time offset: $serverTimeOffset ms');
    });
  }

  int getServerTime() {
    return DateTime.now().millisecondsSinceEpoch + serverTimeOffset;
  }

  void _handleEffect(dynamic data) {
    String type = data['type'];
    int startAt = data['startAt'];
    int now = getServerTime();
    int delay = startAt - now;

    if (delay < 0) delay = 0;

    print('Scheduling $type in ${delay}ms');

    Timer(Duration(milliseconds: delay), () {
      _executeEffect(type, data);
    });
  }

  void _executeEffect(String type, dynamic data) async {
    _effectTimer?.cancel(); // Stop existing effects
    
    try {
      switch (type) {
        case Constants.effectTorchOn:
          await TorchLight.enableTorch();
          break;
        case Constants.effectTorchOff:
          await TorchLight.disableTorch();
          break;
        case Constants.effectStrobe:
          _startStrobe(data['frequency'] ?? 5); // Default 5Hz
          break;
        case Constants.effectPulse:
          await TorchLight.enableTorch();
          Future.delayed(Duration(milliseconds: data['duration'] ?? 200), () {
            TorchLight.disableTorch();
          });
          break;
      }
    } catch (e) {
      print('Torch error: $e');
    }
  }

  void _startStrobe(int hz) {
    int period = (1000 / hz).round();
    bool on = false;
    _effectTimer = Timer.periodic(Duration(milliseconds: period ~/ 2), (timer) async {
      on = !on;
      try {
        if (on) await TorchLight.enableTorch();
        else await TorchLight.disableTorch();
      } catch (e) {
        print('Strobe error: $e');
      }
    });
  }
  
  void dispose() {
    _effectTimer?.cancel();
    socket.disconnect();
    TorchLight.disableTorch();
  }
}
```

## 4. `lib/main.dart` (UI)

```dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'core/event_client.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FlashMan',
      theme: ThemeData.dark(),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _pinController = TextEditingController();

  void _joinEvent() async {
    if (await Permission.camera.request().isGranted) {
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => EventScreen(pin: _pinController.text),
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Camera permission needed for flashlight')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FlashMan')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _pinController,
              decoration: const InputDecoration(labelText: 'Enter Event PIN'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _joinEvent,
              child: const Text('Join with FlashMan'),
            ),
          ],
        ),
      ),
    );
  }
}

class EventScreen extends StatefulWidget {
  final String pin;
  const EventScreen({super.key, required this.pin});
  @override
  State<EventScreen> createState() => _EventScreenState();
}

class _EventScreenState extends State<EventScreen> {
  late EventClient _client;

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable(); // Keep screen awake
    _client = EventClient(widget.pin);
    _client.connect();
  }

  @override
  void dispose() {
    WakelockPlus.disable();
    _client.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.flash_on, size: 80, color: Colors.white),
            const SizedBox(height: 20),
            Text('Connected to Event ${widget.pin}', 
              style: const TextStyle(color: Colors.white)),
            const SizedBox(height: 10),
            const Text('Keep app open. Flashlight controlled by host.',
              style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Leave'),
            )
          ],
        ),
      ),
    );
  }
}
```

## Android Manifest (`android/app/src/main/AndroidManifest.xml`)

Add these permissions:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.FLASHLIGHT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.flash" />
```
