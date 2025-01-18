import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Timestamp } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NewBeerRequestComponent } from './new-beer-request.component';
import { BeerService } from '../../services/beer.service';
import { Beer, RatedBeer } from '../beers/beers.interface';

interface UserProfile {
  country: string;
  dob: Timestamp | null;
  firstName: string;
  lastName: string;
  photoURL: string;
  username: string;
  email: string;
}

interface FavoriteBeer {
  beerImageUrl: string;
  beerLabelUrl: string;
  id: string;
  name: string;
}


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user$: Observable<firebase.User | null> = this.afAuth.authState;
  userProfile: UserProfile = {
    country: '',
    dob: null,
    firstName: '',
    lastName: '',
    photoURL: '',
    username: '',
    email: '',
  };
  selectedFile: File | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  user: firebase.User | null = null;
  newBeer: any = { name: '', description: '' };
  favoriteBeers: FavoriteBeer[] = [];
  ratedBeers: RatedBeer[] = [];
  private unsubscribe$ = new Subject<void>();
  isLoading: boolean = false;
  isEditMode: boolean = false;
  editForm: FormGroup;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private beerService: BeerService
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      country: [''],
      dob: [null]
    });
  }

  ngOnInit(): void {
    this.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      this.user = user;
      if (user) {
        console.log('User authenticated:', user.uid);
        this.loadUserProfile(user.uid);
        this.loadFavoriteBeers(user.uid);
        this.loadRatedBeers(user.uid);
      } else {
        console.log('No authenticated user');
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadUserProfile(userId: string): void {
    this.firestore.doc<UserProfile>(`users/${userId}`).valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(profile => {
        if (profile) {
          this.userProfile = { ...profile };
          this.editForm.patchValue({
            firstName: profile.firstName,
            lastName: profile.lastName,
            username: profile.username,
            country: profile.country,
            dob: profile.dob ? profile.dob.toDate() : null
          });
        }
      }, error => {
        console.error('Error loading user profile:', error);
      });
  }

  private loadFavoriteBeers(userId: string): void {
    this.firestore.collection(`users/${userId}/favorites`)
      .valueChanges({ idField: 'id' })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(favorites => {
        const beerPromises = favorites.map((favorite: any) =>
          this.firestore.doc(`beers/${favorite.id}`).get().toPromise()
        );

        Promise.all(beerPromises).then(beers => {
          this.favoriteBeers = beers.map(beer => {
            const beerData = beer?.data() as any;
            return {
              id: beer?.id || '',
              name: beerData?.name || '',
              beerLabelUrl: beerData?.beerLabelUrl || '',
              beerImageUrl: beerData?.beerImageUrl || ''
            };
          });
        });
      });
  }

  private loadRatedBeers(userId: string): void {
    console.log('Loading rated beers for user:', userId);
    this.firestore.collection(`users/${userId}/ratings`).get().subscribe(
      snapshot => {
        console.log('Raw ratings snapshot:', snapshot);
        if (snapshot.empty) {
          console.log('No ratings found in the snapshot');
        } else {
          snapshot.docs.forEach(doc => {
            console.log('Rating document:', doc.id, doc.data());
          });
        }
      },
      error => {
        console.error('Error fetching ratings:', error);
      }
    );

    this.firestore.collection(`users/${userId}/ratings`, ref => ref.orderBy('ratedAt', 'desc'))
    .snapshotChanges()
    .pipe(
      takeUntil(this.unsubscribe$),
      switchMap(actions => {
        console.log('Ratings snapshot:', actions);
        const ratingData = actions.map(a => {
          const data = a.payload.doc.data() as { beerId: string; rating: number; ratedAt: Timestamp };
          const id = a.payload.doc.id;
          return { id, ...data };
        });
        console.log('Mapped rating data:', ratingData);

        if (ratingData.length === 0) {
          console.log('No ratings found for user');
          return of([]);
        }

        const beerIds = ratingData.map(rating => rating.beerId);
        console.log('Beer IDs to fetch:', beerIds);
        return this.beerService.getBeers().pipe(
          map(beers => {
            console.log('All beers:', beers);
            return ratingData.map(rating => {
              const beer = beers.find(b => b.id === rating.beerId);
              console.log(`Beer found for ID ${rating.beerId}:`, beer);
              if (beer) {
                return {
                  ...beer,
                  rating: rating.rating,
                  ratedAt: rating.ratedAt
                } as RatedBeer;
              }
              return null;
            }).filter((beer): beer is RatedBeer => beer !== null);
          })
        );
      }),
      catchError(error => {
        console.error('Error loading rated beers:', error);
        this.snackBar.open('Error loading rated beers. Please try again.', 'Close', { duration: 5000 });
        return of([]);
      })
    )
    .subscribe(
      ratedBeers => {
        this.ratedBeers = ratedBeers;
        console.log('Rated beers loaded:', this.ratedBeers);
      },
      error => {
        console.error('Error in rated beers subscription:', error);
      }
    );
}

  formatDate(timestamp: Timestamp | null): string {
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return 'N/A';
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.editForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        username: this.userProfile.username,
        country: this.userProfile.country,
        dob: this.userProfile.dob ? this.userProfile.dob.toDate() : null
      });
    }
  }

  saveProfile(): void {
    if (this.editForm.valid && this.user) {
      this.isLoading = true;
      const updatedProfile = {
        ...this.editForm.value,
        dob: this.editForm.value.dob ? Timestamp.fromDate(this.editForm.value.dob) : null
      };

      this.firestore.doc(`users/${this.user.uid}`).update(updatedProfile)
        .then(() => {
          this.userProfile = { ...this.userProfile, ...updatedProfile };
          this.isEditMode = false;
          this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
        })
        .catch(error => {
          console.error('Error updating profile:', error);
          this.snackBar.open('Error updating profile. Please try again.', 'Close', { duration: 3000 });
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadProfilePicture();
    }
  }

  private async uploadProfilePicture(): Promise<void> {
    if (this.selectedFile && this.user) {
      this.isLoading = true;
      const storageRef = firebase.storage().ref();
      const userProfilePicRef = storageRef.child(`profilePictures/${this.user.uid}`);

      try {
        await userProfilePicRef.put(this.selectedFile);
        const photoURL = await userProfilePicRef.getDownloadURL();
        await this.user.updateProfile({ photoURL });
        await this.firestore.doc(`users/${this.user.uid}`).update({
          photoURL: photoURL,
          googlePhotoURL: null // Remove the Google photo URL to use the custom one
        });

        this.userProfile.photoURL = photoURL;
        this.snackBar.open('Profile picture updated successfully!', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error updating profile picture:', error);
        this.snackBar.open('Error updating profile picture. Please try again.', 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  async updatePassword(): Promise<void> {
    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open('Passwords do not match.', 'Close', { duration: 3000 });
      return;
    }

    if (this.user) {
      this.isLoading = true;
      try {
        await this.user.updatePassword(this.newPassword);
        this.snackBar.open('Password updated successfully!', 'Close', { duration: 3000 });
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (error) {
        this.snackBar.open(`Error updating password: ${(error as any).message}`, 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      this.snackBar.open(`Error signing out: ${(error as any).message}`, 'Close', { duration: 3000 });
    });
  }

  openNewBeerModal(): void {
    const dialogRef = this.dialog.open(NewBeerRequestComponent, {
      width: '400px',
      data: { newBeer: this.newBeer },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.submitNewBeerRequest(result);
      }
    });
  }

  submitNewBeerRequest(newBeer: any): void {
    this.isLoading = true;
    this.firestore.collection('beerRequests').add({
      ...newBeer,
      userId: this.user?.uid,
      userEmail: this.user?.email,
      createdAt: Timestamp.now(),
    }).then(() => {
      this.snackBar.open('New beer request submitted!', 'Close', { duration: 3000 });
    }).catch(error => {
      this.snackBar.open('Error submitting request: ' + error, 'Close', { duration: 3000 });
    }).finally(() => {
      this.isLoading = false;
    });
  }

  async removeFavoriteBeer(beerId: string): Promise<void> {
    if (this.user) {
      this.isLoading = true;
      try {
        await this.firestore.collection('users').doc(this.user.uid).collection('favorites').doc(beerId).delete();
        this.snackBar.open('Favorite beer removed successfully', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error removing favorite beer:', error);
        this.snackBar.open('Error removing favorite beer. Please try again.', 'Close', { duration: 3000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  navigateToBeerDetails(beerId: string): void {
    this.router.navigate(['/beer-details', beerId]);
  }

  ratedBeersExist(): boolean {
    return this.ratedBeers && this.ratedBeers.length > 0;
  }
}

