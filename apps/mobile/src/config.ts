import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True inside Expo Go: the prototype with simulated ads and purchases. Test hints
 * ("Testwerbung", "Käufe sind simuliert") only appear here and never in a store build.
 */
export const IS_PROTOTYPE = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Base URL of our backend (Cloud Functions `questions` and `league`). It holds the API key and
 * chooses the model; the app never sees either and never sends a prompt. Empty = offline: the
 * built-in questions carry the game and the league is unavailable.
 */
const DEFAULT_API_BASE = 'https://europe-west3-nexus-trivia-prod-20261024.cloudfunctions.net';
/** Set EXPO_PUBLIC_API_BASE to override it (for example, the emulator). */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? DEFAULT_API_BASE;

/** Required for the App Store listing: a public URL of the privacy policy. Fill in before submitting. */
export const PRIVACY_URL = '';
/** Support contact shown in the privacy notice. Fill in before submitting. */
export const SUPPORT_EMAIL = '';
/** Terms of use for subscriptions (App Store rule 3.1.2): Apple's standard EULA until there are own terms. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
