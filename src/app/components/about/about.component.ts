import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTabsModule]
})
export class AboutComponent {
  teamMembers = [
    { name: 'Jesús Pérez', role: 'Founder, FullStack Developer & Beer Enthusiast', image: 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/profilePictures%2FolUaCy9gcpSwKiWGLA42KWbaedj2?alt=media&token=734e3df4-7794-4c47-bf6f-a7f3971ff043' },
    // { name: 'NukeDev', role: 'FullStack Developer', image: 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/profilePictures%2FUqRBL0iHpegayh3gmcR93kg1bnq2?alt=media&token=a8bd80d4-cacf-4d36-a18d-32c163f71019' },
    // { name: 'John Doe', role: 'Chief Tasting Officer', image: 'https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fmisc%2Fmedium-shot-man-celebrating-new-year-s-eve.webp?alt=media&token=b47e359b-a1b2-4706-8ccf-0f6e78b6dd45' }
  ];

  constructor() { }
}