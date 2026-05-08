// Custom entry point for the monorepo. Expo's default `expo/AppEntry.js`
// resolves `App` via `../../App`, which under pnpm's hoisted node-linker
// (node_modules at the workspace root) walks out of the mobile package
// entirely. Pointing `main` at this file keeps resolution local.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
