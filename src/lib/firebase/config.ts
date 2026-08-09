import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBRJ-AFZkDlRxT2BhP4KvwVGKDnP5IUUQM",
  authDomain: "cs-kasir.firebaseapp.com",
  databaseURL: "https://cs-kasir-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cs-kasir",
  storageBucket: "cs-kasir.firebasestorage.app",
  messagingSenderId: "12760208804",
  appId: "1:12760208804:web:dd970a17f9547451455d31",
};

// Inisialisasi Firebase (Singleton Pattern agar tidak duplikasi koneksi)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };