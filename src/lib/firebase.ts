import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { app, auth, db } from '../firebase';

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked'
    ) {
      console.warn('Sign-in popup was closed or cancelled by the user.');
      return null;
    }
    if (
      error?.code === 'auth/unauthorized-domain' || 
      error?.message?.includes('unauthorized-domain') ||
      error?.message?.includes('Pending promise was never set')
    ) {
      console.warn('Domain is not authorized in Firebase Auth console for Google popup sign-in.');
      alert('Tryb Demo aktywne: Domena podglądu wymaga autoryzacji w konsoli Firebase Auth. Wszystkie funkcje aplikacji działają w trybie gościa z lokalnym zapisem stanu.');
      return null;
    }
    console.error("Error signing in with Google", error);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
