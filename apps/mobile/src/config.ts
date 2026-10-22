import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True inside Expo Go: the prototype with simulated ads and purchases. Test hints
 * ("Testwerbung", "Käufe sind simuliert") only appear here and never in a store build.
 */
export const IS_PROTOTYPE = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Required for the App Store listing: a public URL of the privacy policy. Fill in before submitting. */
export const PRIVACY_URL = '';
/** Support contact shown in the privacy notice. Fill in before submitting. */
export const SUPPORT_EMAIL = '';
