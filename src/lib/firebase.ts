import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const env = import.meta.env

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/**
 * `false` enquanto o `.env` não estiver preenchido (ver `.env.example`).
 * Nesse caso o site continua servindo os dados de exemplo e o painel mostra
 * um aviso de configuração em vez do login.
 */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId && config.storageBucket,
)

const app = isFirebaseConfigured ? initializeApp(config) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
