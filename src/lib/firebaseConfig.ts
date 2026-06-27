export type ClientFirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function isConfigured(value?: string): value is string {
  return !!value && value.trim().length > 0 && !value.startsWith("YOUR_") && !value.startsWith("MY_");
}

const productionFirebaseConfig: ClientFirebaseConfig = {
  apiKey: "AIzaSyBMzIYsXYg9jo1k-te_5SZcasIsY3gNqF8",
  authDomain: "gen-lang-client-0000039141.firebaseapp.com",
  projectId: "gen-lang-client-0000039141",
  storageBucket: "gen-lang-client-0000039141.firebasestorage.app",
  messagingSenderId: "479832936331",
  appId: "1:479832936331:web:ec4ca896d9a0597291298e"
};

export function getClientFirebaseConfig(): ClientFirebaseConfig | null {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  return Object.values(config).every(isConfigured) ? config as ClientFirebaseConfig : productionFirebaseConfig;
}
