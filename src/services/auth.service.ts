import { auth, database } from "@/lib/firebase/config";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  User 
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { UserProfile } from "@/types/auth";

/**
 * Service utama penanganan Autentikasi & Sesi CSKasir Web
 */
export const AuthService = {
  /**
   * Login menggunakan Email dan Password
   */
  async login(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  /**
   * Logout dari akun
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Mengambil data profil user (Role, GroupId, StoreId) dari Realtime Database
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Gagal mengambil data profil user:", error);
      return null;
    }
  }
};