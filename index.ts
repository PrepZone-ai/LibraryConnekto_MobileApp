import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

import App from './App';

// Register the app with both methods to ensure compatibility
// This ensures it works both with Expo and with native builds
registerRootComponent(App);

// Also register with AppRegistry directly with the name that matches MainActivity.kt
// This is the critical line that must match the name in MainActivity.kt
AppRegistry.registerComponent('libraryconneckto', () => App);

// For backward compatibility, also register with 'main'
AppRegistry.registerComponent('main', () => App);
