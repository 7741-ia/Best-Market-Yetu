import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBMAlFxgHXuO8gnl35cpu_K_ECsZO3XHLc',
  authDomain: 'best-market-c2755.firebaseapp.com',
  projectId: 'best-market-c2755',
  storageBucket: 'best-market-c2755.firebasestorage.app',
  messagingSenderId: '405920895772',
  appId: '1:405920895772:web:a325486a0350897a3a60d9',
}

// eslint-disable-next-line
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
