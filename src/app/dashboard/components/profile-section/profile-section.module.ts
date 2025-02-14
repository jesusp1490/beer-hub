import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileSectionComponent } from './profile-section.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ProfileSectionComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  exports: [ProfileSectionComponent]
})
export class ProfileSectionModule { }
