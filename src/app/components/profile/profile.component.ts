import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

interface UserProfile {
  country: string;
  dob: string;
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
    dob: '',
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
  private unsubscribe$ = new Subject<void>();
  isLoading: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.user$.pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserProfile(user.uid);
        this.loadFavoriteBeers(user.uid);
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
          console.log('Loaded user profile:', this.userProfile);
        } else {
          console.log('No user profile found');
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
              name: beerData.name,
              beerLabelUrl: beerData.beerLabelUrl,
              beerImageUrl: beerData.beerImageUrl || ''
            };
          });
        });
      });
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
        await this.firestore.doc(`users/${this.user.uid}`).update({ photoURL });

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
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
}

@Component({
  selector: 'app-new-beer-request',
  template: `
    <h2 mat-dialog-title>Request New Beer</h2>
    <mat-dialog-content>
      <form #beerForm="ngForm">
        <mat-form-field appearance="fill">
          <mat-label>Beer Name</mat-label>
          <input matInput type="text" [(ngModel)]="data.newBeer.name" name="beerName" required>
          <mat-icon matSuffix>local_drink</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="data.newBeer.description" name="beerDescription" required></textarea>
          <mat-icon matSuffix>description</mat-icon>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!beerForm.form.valid" (click)="onSubmit()">Submit Request</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #424242;
      color: #e0e0e0;
      padding: 20px;
      border-radius: 8px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 15px;
    }
    .mat-mdc-form-field {
      --mdc-filled-text-field-container-color: transparent;
      --mdc-filled-text-field-focus-active-indicator-color: #ff9100;
      --mdc-filled-text-field-focus-label-text-color: #ff9100;
      --mdc-filled-text-field-label-text-color: #e0e0e0;
      --mdc-filled-text-field-input-text-color: #e0e0e0;
    }
    .mat-mdc-dialog-actions {
      justify-content: flex-end;
    }
    .mat-mdc-raised-button.mat-primary {
      background-color: #ff9100;
    }
  `]
})
export class NewBeerRequestComponent {
  constructor(
    public dialogRef: MatDialogRef<NewBeerRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { newBeer: any }
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.data.newBeer);
  }
}