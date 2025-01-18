import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserProfile, FavoriteBeer, RatedBeer } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService
  ) {}

  getCurrentUserProfile(): Observable<UserProfile | null> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.doc<UserProfile>(`users/${user.uid}`).valueChanges().pipe(
            map(profile => profile || null)
          );
        } else {
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of(null);
      })
    );
  }

  updateUserProfile(profile: Partial<UserProfile>): Observable<void> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return from(this.firestore.doc(`users/${user.uid}`).update(profile));
        } else {
          throw new Error('No authenticated user');
        }
      })
    );
  }

  uploadProfilePicture(file: File): Observable<string> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          const filePath = `profilePictures/${user.uid}`;
          const fileRef = this.storage.ref(filePath);
          const task = this.storage.upload(filePath, file);

          return task.snapshotChanges().pipe(
            switchMap(() => fileRef.getDownloadURL()),
            switchMap(photoURL => {
              return from(this.firestore.doc(`users/${user.uid}`).update({ photoURL })).pipe(
                map(() => photoURL)
              );
            })
          );
        } else {
          throw new Error('No authenticated user');
        }
      })
    );
  }

  getUserFavoriteBeers(): Observable<FavoriteBeer[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.collection<FavoriteBeer>(`users/${user.uid}/favorites`).valueChanges({ idField: 'id' });
        } else {
          return of([]);
        }
      })
    );
  }

  getUserRatedBeers(): Observable<RatedBeer[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.collection<RatedBeer>(`users/${user.uid}/ratings`, ref => ref.orderBy('ratedAt', 'desc')).valueChanges({ idField: 'id' });
        } else {
          return of([]);
        }
      })
    );
  }

  removeFavoriteBeer(beerId: string): Observable<void> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return from(this.firestore.doc(`users/${user.uid}/favorites/${beerId}`).delete());
        } else {
          throw new Error('No authenticated user');
        }
      })
    );
  }
}

