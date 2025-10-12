export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: UserRole;

  // --- NEW PROPERTIES TO MATCH BACKEND ---
  credits: number;
  lastCreditReset: string; // Stays as string for easy JSON parsing

  // --- Existing Properties ---
  phoneNumber: string | null;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  refreshToken: string;
}
