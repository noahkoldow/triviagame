import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True inside Expo Go: the prototype with simulated ads and purchases. Test hints
 * ("Testwerbung", "Käufe sind simuliert") only appear here and never in a store build.
 */
export const IS_PROTOTYPE = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Our own backend endpoint (a Cloud Function) that asks the AI model for questions. It holds the API key
 * and chooses the model; the app never sees either. Empty = no AI, the built-in questions are used.
 */
const DEFAULT_AI_ENDPOINT =
  'https://europe-west3-nexus-trivia-prod-20261024.cloudfunctions.net/gemini';
/** Set EXPO_PUBLIC_AI_ENDPOINT to override the production endpoint (for example, the emulator). */
export const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_ENDPOINT ?? DEFAULT_AI_ENDPOINT;

/** Required for the App Store listing: a public URL of the privacy policy. Fill in before submitting. */
export const PRIVACY_URL = '';
/** Support contact shown in the privacy notice. Fill in before submitting. */
export const SUPPORT_EMAIL = '';
