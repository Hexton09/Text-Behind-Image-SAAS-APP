import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { BehaviorSubject } from 'rxjs';
import { User, UserRole } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | undefined>(undefined);
  currentUser$ = this.currentUserSubject.asObservable();
  private isLoggedInState = false;

  constructor(private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        this.isLoggedInState = true;
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = (idTokenResult.claims['role'] as UserRole) || UserRole.USER;
          const mappedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
            isAnonymous: firebaseUser.isAnonymous,
            role: role,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime!,
              lastSignInTime: firebaseUser.metadata.lastSignInTime!,
            },
            refreshToken: firebaseUser.refreshToken,
          };
          this.currentUserSubject.next(mappedUser);
        } catch (error) {
          console.error('Error getting user token:', error);
          this.isLoggedInState = false;
          this.currentUserSubject.next(undefined);
        }
      } else {
        this.isLoggedInState = false;
        this.currentUserSubject.next(undefined);
      }
    });
  }

  async getUserRole(): Promise<UserRole> {
    try {
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        // Force token refresh to get latest claims
        await currentUser.getIdToken(true);
        const idTokenResult = await currentUser.getIdTokenResult(true);
        console.log('Token claims:', idTokenResult.claims); // Debug log
        const roleFromClaims = idTokenResult.claims['role'] as string;
        return Object.values(UserRole).includes(roleFromClaims as UserRole) 
          ? roleFromClaims as UserRole 
          : UserRole.USER;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return UserRole.USER;
    
  }

  setCurrentUser(user: User) {
    this.currentUserSubject.next(user);
  }

  // Sign Up with Email and Password
  async signUp(email: string, password: string) {
    const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    if (credential.user) {
      // Set the role to 'user' for new signups
      return credential;
    }
    throw new Error('User creation failed');
  }

  // Sign In with Email and Password
  async signIn(email: string, password: string) {
    const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
    if (userCredential.user) {
      // Force token refresh after login
      await userCredential.user.getIdToken(true);
    }
    return userCredential;
  }

  // Google Sign-In
  googleSignIn() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  // GitHub Sign-In
  githubSignIn() {
    return this.afAuth.signInWithPopup(new firebase.auth.GithubAuthProvider());
  }

  resetPassword(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  signOut() {
    return this.afAuth.signOut().then(() => {
      this.isLoggedInState = false;
      this.currentUserSubject.next(undefined);
      window.location.reload();
    });
  }

  getCurrentUser() {
    return this.afAuth.authState;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInState;
  }

  updateUserProfile(displayName: string, photoURL: string): Promise<void> {
    return this.afAuth.currentUser.then((user) => {
      if (!user) {
        throw new Error('No user is currently logged in.');
      }

      return user
        .updateProfile({ displayName, photoURL })
        .then(() => user.reload())
        .then(() => {
          const mappedUser: User = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            phoneNumber: user.phoneNumber,
            isAnonymous: user.isAnonymous,
            role: UserRole.USER, // Keep existing role
            metadata: {
              creationTime: user.metadata.creationTime!,
              lastSignInTime: user.metadata.lastSignInTime!,
            },
            refreshToken: user.refreshToken,
          };
          this.currentUserSubject.next(mappedUser);
        });
    });
  }
}
