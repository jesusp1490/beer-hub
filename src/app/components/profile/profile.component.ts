import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

interface FavoriteBeer {
beerImageUrl: any;
  id: string;
  name: string;
  imageUrl: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user$: Observable<firebase.User | null> = this.afAuth.authState;
  userProfile: any = {};
  selectedFile: File | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  user: firebase.User | null = null;
  showNewBeerModal: boolean = false;
  newBeer: any = { name: '', description: '' };
  favoriteBeers: FavoriteBeer[] = [];
  private unsubscribe$ = new Subject<void>();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

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
    this.firestore.doc(`users/${userId}`).valueChanges()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(profile => {
        this.userProfile = profile || {};
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
              imageUrl: beerData.imageUrl,
              beerImageUrl: beerData.beerImageUrl
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
      const storageRef = firebase.storage().ref();
      const userProfilePicRef = storageRef.child(`profilePictures/${this.user.uid}`);

      try {
        await userProfilePicRef.put(this.selectedFile);
        const photoURL = await userProfilePicRef.getDownloadURL();
        await this.user.updateProfile({ photoURL });
        await this.firestore.doc(`users/${this.user.uid}`).update({ photoURL });

        this.userProfile.photoURL = photoURL;
      } catch (error) {
        console.error('Error updating profile picture:', error);
      }
    }
  }

  async updatePassword(): Promise<void> {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (this.user) {
      try {
        await this.user.updatePassword(this.newPassword);
        alert('Password updated successfully!');
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (error) {
        alert(`Error updating password: ${(error as any).message}`);
      }
    }
  }

  signOut(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      alert(`Error signing out: ${(error as any).message}`);
    });
  }

  openNewBeerModal(): void {
    this.showNewBeerModal = true;
  }

  closeNewBeerModal(): void {
    this.showNewBeerModal = false;
    this.newBeer = { name: '', description: '' };
  }

  submitNewBeerRequest(): void {
    if (this.newBeer.name && this.newBeer.description) {
      this.firestore.collection('beerRequests').add({
        ...this.newBeer,
        userId: this.user?.uid,
        userEmail: this.user?.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).then(() => {
        alert('New beer request submitted!');
        this.closeNewBeerModal();
      }).catch(error => {
        alert('Error submitting request: ' + error);
      });
    } else {
      alert('Please fill out all fields.');
    }
  }

  removeFavoriteBeer(beerId: string): void {
    if (this.user) {
      this.firestore.doc(`users/${this.user.uid}/favorites/${beerId}`).delete()
        .then(() => {
          this.favoriteBeers = this.favoriteBeers.filter(beer => beer.id !== beerId);
        })
        .catch(error => {
          console.error('Error removing favorite beer:', error);
        });
    }
  }
}