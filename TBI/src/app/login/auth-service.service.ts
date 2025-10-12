import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User, UserRole } from './user.model';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | undefined>(undefined);
  currentUser$ = this.currentUserSubject.asObservable();
  private isLoggedInState = false;

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private router: Router
  ) {
    this.afAuth.authState
      .pipe(
        switchMap(async (firebaseUser: firebase.User | null) => {
          if (firebaseUser) {
            this.isLoggedInState = true;
            try {
              const idTokenResult = await firebaseUser.getIdTokenResult();
              const role =
                (idTokenResult.claims['role'] as UserRole) || UserRole.USER;

              // Fetch full profile from your backend (source of truth)
              const backendUser = await this.userService.getMe().toPromise();

              // Combine Firebase info + backend info
              const mergedUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                phoneNumber: firebaseUser.phoneNumber,
                isAnonymous: firebaseUser.isAnonymous,
                role: role,
                credits: backendUser?.credits ?? 0,
                lastCreditReset:
                  backendUser?.lastCreditReset ??
                  new Date().toISOString(),
                metadata: {
                  creationTime: firebaseUser.metadata.creationTime!,
                  lastSignInTime: firebaseUser.metadata.lastSignInTime!,
                },
                refreshToken: firebaseUser.refreshToken,
              };

              return mergedUser;
            } catch (error) {
              console.error('Error fetching backend user or token:', error);
              this.isLoggedInState = false;
              return undefined;
            }
          } else {
            this.isLoggedInState = false;
            return undefined;
          }
        })
      )
      .subscribe((user) => {
        // user may be Promise<User | undefined> from async switchMap
        if (user instanceof Promise) {
          user.then((resolvedUser) =>
            this.currentUserSubject.next(resolvedUser)
          );
        } else {
          this.currentUserSubject.next(user);
        }
      });
  }

  /** --- Local State Helpers --- */
  updateLocalUser(updatedUser: Partial<User>) {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      this.currentUserSubject.next({ ...currentUser, ...updatedUser });
    }
  }

  updateLocalCredits(newCreditCount: number) {
    this.updateLocalUser({ credits: newCreditCount });
  }

  /** --- Role Helpers --- */
  async getUserRole(): Promise<UserRole> {
    try {
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const roleFromClaims = idTokenResult.claims['role'] as string;
        return Object.values(UserRole).includes(roleFromClaims as UserRole)
          ? (roleFromClaims as UserRole)
          : UserRole.USER;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return UserRole.USER;
  }

  /** --- Auth Actions --- */
  async signUp(email: string, password: string) {
    const credential = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password
    );
    if (credential.user) {
      return credential;
    }
    throw new Error('User creation failed');
  }

  async signIn(email: string, password: string) {
    const userCredential = await this.afAuth.signInWithEmailAndPassword(
      email,
      password
    );
    if (userCredential.user) {
      await userCredential.user.getIdToken(true);
    }
    return userCredential;
  }

  googleSignIn() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  githubSignIn() {
    return this.afAuth.signInWithPopup(new firebase.auth.GithubAuthProvider());
  }

  resetPassword(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  async signOut() {
    await this.afAuth.signOut();
    this.isLoggedInState = false;
    this.currentUserSubject.next(undefined);
    this.router.navigate(['/']); // cleaner than window.reload
  }

  getCurrentUser() {
    return this.afAuth.authState;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInState;
  }

  /** --- Profile Updates --- */
  updateUserProfile(displayName: string, photoURL: string): Promise<void> {
    return this.afAuth.currentUser.then(async (user) => {
      if (!user) throw new Error('No user is currently logged in.');

      await user.updateProfile({ displayName, photoURL });

      // Sync with backend for full updated data
      this.userService.getMe().subscribe((backendUser) => {
        this.currentUserSubject.next(backendUser);
      });
    });
  }
}
