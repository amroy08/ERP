/**
 * API Base URL Configuration
 *
 * Set the EXPO_PUBLIC_API_BASE_URL environment variable in your .env file
 * before running or building the app.
 *
 * Environment-specific values:
 *   - Android Emulator:        http://10.0.2.2:5001/api
 *   - iOS Simulator:           http://localhost:5001/api
 *   - Physical Device (LAN):   http://<YOUR_LAN_IP>:5001/api   e.g. http://192.168.1.X:5001/api
 *   - Internal/Preview Build:  http://<STAGING_SERVER_IP>:5001/api
 *   - Production Build:        https://api.yourschool.com/api   (HTTPS required for App Store)
 *
 * ⚠️  IMPORTANT: `localhost` does NOT work on a physical device.
 *     When testing on a real Android/iOS phone, you must use your machine's
 *     LAN IP address (e.g. 192.168.1.X), NOT localhost or 127.0.0.1.
 *     The `localhost` fallback below is only safe for iOS Simulator / emulator.
 *
 * Never commit your .env file to the repository.
 * Copy .env.example to .env and fill in the correct URL for your environment.
 */
import { Platform } from 'react-native';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api');

