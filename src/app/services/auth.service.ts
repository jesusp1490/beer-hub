import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<firebase.User | null>;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user: firebase.User | null) => {
        if (user) {
          return this.firestore.doc<firebase.User>(`users/${user.uid}`).valueChanges().pipe(
            map((firebaseUser: firebase.User | undefined) => firebaseUser || null),
            catchError(error => {
              console.error('Error fetching user data:', error);
              return of(null);
            })
          );
        } else {
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Error in auth state:', error);
        return of(null);
      })
    );
  }

  async signUp(email: string, password: string, userData: any): Promise<firebase.auth.UserCredential> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const uid = result.user?.uid;

      if (uid) {
        await this.firestore.collection('users').doc(uid).set(userData);
      }
      return result;
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  }

  signIn(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut();
  }

  signInWithGoogle(): Promise<firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.afAuth.signInWithPopup(provider);
  }

  isLoggedIn(): Observable<boolean> {
    return this.user$.pipe(
      map(user => !!user),
      catchError(error => {
        console.error('Error checking login status:', error);
        return of(false);
      })
    );
  }
}