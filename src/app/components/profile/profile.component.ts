import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';  // Correct import for User type

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;  // Use User from 'firebase/auth'

  constructor(private afAuth: AngularFireAuth) {
    this.user$ = this.afAuth.authState;  // This should work for AngularFireAuth
  }

  ngOnInit(): void { }
}
