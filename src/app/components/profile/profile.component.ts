import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage'; 

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user$: Observable<firebase.User | null> = this.afAuth.authState;
  userProfile: any = {}; // Esto almacenará la información adicional
  selectedFile: File | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  user: firebase.User | null = null; // Definido para el uso en métodos
  showNewBeerModal: boolean = false; // Controla la visibilidad del modal
  newBeer: any = { name: '', description: '' }; // Almacena los datos de la nueva cerveza

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.firestore.doc(`users/${user.uid}`).valueChanges().subscribe(profile => {
          this.userProfile = profile || {};
        });
      }
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
    if (this.selectedFile) {
      const user = await this.afAuth.currentUser;
      if (user) {
        const storageRef = firebase.storage().ref();
        const userProfilePicRef = storageRef.child(`profilePictures/${user.uid}`);

        try {
          await userProfilePicRef.put(this.selectedFile);
          const photoURL = await userProfilePicRef.getDownloadURL();
          await user.updateProfile({ photoURL });
          await this.firestore.doc(`users/${user.uid}`).update({ photoURL });

          alert('Profile picture updated successfully!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          alert('Error updating profile picture');
        }
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
      } catch (error) {
        alert(`Error updating password: ${(error as any).message}`);
      }
    }
  }

  signOut(): void {
    this.afAuth.signOut().then(() => {
      alert('Logged out successfully!');
    }).catch(error => {
      alert(`Error signing out: ${(error as any).message}`);
    });
  }

  // Abrir modal de nueva cerveza
  openNewBeerModal(): void {
    this.showNewBeerModal = true;
  }

  // Cerrar modal de nueva cerveza
  closeNewBeerModal(): void {
    this.showNewBeerModal = false;
  }

  // Enviar solicitud de nueva cerveza
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
}
