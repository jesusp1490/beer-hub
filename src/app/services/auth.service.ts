import { Injectable } from "@angular/core"
import { AngularFireAuth } from "@angular/fire/compat/auth"
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore"
import firebase from "firebase/compat/app"
import { Observable, of } from "rxjs"
import { switchMap, map, catchError, take } from "rxjs/operators"
import { Router } from "@angular/router"

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  country?: string
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  user$: Observable<User | null>

  // NOTE: this is a client-side-only soft limiter for UX (e.g. disabling a
  // sign-in button briefly after repeated failures). It resets on page
  // refresh and is trivially bypassable, so it is NOT a security control.
  // Real brute-force protection belongs server-side (Firebase Auth's built-in
  // abuse protections, or App Check / a Cloud Function with persisted state).
  private lastAttempt = 0
  private attemptLimit = 3
  private readonly COOLDOWN_TIME = 60000 // 1 minute

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<User>(`users/${user.uid}`)
            .valueChanges()
            .pipe(
              take(1),
              map((firebaseUser) => {
                if (firebaseUser) {
                  return {
                    ...user,
                    ...firebaseUser,
                    photoURL: firebaseUser.photoURL || user.photoURL,
                  } as User
                }
                return {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  emailVerified: user.emailVerified,
                } as User
              }),
              catchError((error) => {
                console.error("Error fetching user data:", error)
                return of(null)
              }),
            )
        } else {
          return of(null)
        }
      }),
      catchError((error) => {
        console.error("Error in auth state:", error)
        return of(null)
      }),
    )
  }

  private validateEmailAndPassword(email: string, password: string): void {
    if (!email || !password) {
      throw new Error("Email and password are required")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format")
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }
  }

  private sanitizeUserData(userData: any): any {
    const sanitizedData: any = {}
    for (const [key, value] of Object.entries(userData)) {
      if (typeof value === "string") {
        sanitizedData[key] = value.replace(/[<>&'"]/g, (char) => {
          switch (char) {
            case "<":
              return "&lt;"
            case ">":
              return "&gt;"
            case "&":
              return "&amp;"
            case "'":
              return "&#39;"
            case '"':
              return "&quot;"
            default:
              return char
          }
        })
      } else {
        sanitizedData[key] = value
      }
    }
    return sanitizedData
  }

  private checkRateLimit(): boolean {
    const now = Date.now()
    if (now - this.lastAttempt < this.COOLDOWN_TIME) {
      this.attemptLimit--
      if (this.attemptLimit <= 0) {
        throw new Error("Too many attempts. Please try again later.")
      }
    } else {
      this.attemptLimit = 3
    }
    this.lastAttempt = now
    return true
  }

  async signUp(email: string, password: string, userData: any): Promise<firebase.auth.UserCredential> {
    this.validateEmailAndPassword(email, password)
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password)
      await this.updateUserData(result.user, userData)
      return result
    } catch (error) {
      console.error("Error in signUp:", error)
      throw error
    }
  }

  async signIn(email: string, password: string): Promise<firebase.auth.UserCredential> {
    this.validateEmailAndPassword(email, password)
    this.checkRateLimit()
    try {
      return await this.afAuth.signInWithEmailAndPassword(email, password)
    } catch (error) {
      console.error("Error in signIn:", error)
      throw error
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.afAuth.signOut()
      await this.router.navigate(["/"])
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  async signInWithGoogle(): Promise<firebase.auth.UserCredential> {
    try {
      const provider = new firebase.auth.GoogleAuthProvider()
      const credential = await this.afAuth.signInWithPopup(provider)
      await this.updateUserData(credential.user)
      return credential
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  private async updateUserData(user: firebase.User | null, additionalData: any = {}): Promise<void> {
    if (!user) return

    const userRef: AngularFirestoreDocument<User> = this.firestore.doc(`users/${user.uid}`)
    const userData = this.sanitizeUserData({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      ...additionalData,
    })

    if (user.providerData[0]?.providerId === "google.com" && user.photoURL) {
      userData["googlePhotoURL"] = user.photoURL
    }

    return userRef.set(userData, { merge: true })
  }

  isLoggedIn(): Observable<boolean> {
    return this.user$.pipe(
      map((user) => !!user),
      catchError((error) => {
        console.error("Error checking login status:", error)
        return of(false)
      }),
    )
  }

  // FIX: previously this manually cached the ID token in localStorage and
  // refreshed it by hand. Firebase Auth already manages token lifecycle
  // internally (caching + automatic refresh), and localStorage is more
  // exposed to XSS than Firebase's own internal storage. We now just ask
  // Firebase for a token directly — `getIdToken()` returns the cached token
  // if still valid, or refreshes it transparently if not.
  async getAuthToken(): Promise<string | null> {
    const user = await this.afAuth.currentUser
    if (!user) return null
    try {
      return await user.getIdToken()
    } catch (error) {
      console.error("Error getting auth token:", error)
      return null
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email)
    } catch (error) {
      console.error("Error sending password reset email:", error)
      throw error
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const user = await this.afAuth.currentUser
    if (user) {
      try {
        await user.updatePassword(newPassword)
      } catch (error) {
        console.error("Error updating password:", error)
        throw error
      }
    } else {
      throw new Error("No authenticated user found")
    }
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.afAuth.currentUser.then((user) => {
      if (!user) {
        throw new Error("No authenticated user")
      }
      const credential = firebase.auth.EmailAuthProvider.credential(user.email!, currentPassword)
      return user.reauthenticateWithCredential(credential).then(() => {
        return user.updatePassword(newPassword)
      })
    })
  }

  // FIX: this now also updates Firestore via updateUserData so the profile
  // doc and the Auth login email stay in sync (see the corresponding fix in
  // profile-section/dashboard for routing the "email" field through here
  // instead of a generic Firestore field update).
  async updateEmail(newEmail: string): Promise<void> {
    const user = await this.afAuth.currentUser
    if (user) {
      try {
        await user.updateEmail(newEmail)
        await this.updateUserData(user, { email: newEmail })
      } catch (error) {
        console.error("Error updating email:", error)
        throw error
      }
    } else {
      throw new Error("No authenticated user found")
    }
  }

  async deleteAccount(): Promise<void> {
    const user = await this.afAuth.currentUser
    if (user) {
      try {
        await this.firestore.doc(`users/${user.uid}`).delete()
        await user.delete()
      } catch (error) {
        console.error("Error deleting account:", error)
        throw error
      }
    } else {
      throw new Error("No authenticated user found")
    }
  }
}