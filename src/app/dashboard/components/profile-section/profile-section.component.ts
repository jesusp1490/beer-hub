import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UserProfile, UserRank } from "../../../models/user.model";
import { UserService } from "../../../services/user.service";

@Component({
  selector: "app-profile-section",
  template: `
    <div class="profile-container" *ngIf="userProfile">
      <!-- Previous content remains the same -->
      <div class="profile-details" *ngIf="!editMode">
        <p><strong>Username:</strong> {{ userProfile.username }}</p>
        <p><strong>Country:</strong> {{ userProfile.country }}</p>
        <p><strong>Joined:</strong> {{ getDateString(userProfile.statistics.registrationDate) }}</p>
        <p><strong>Total Beers Rated:</strong> {{ userProfile.statistics.totalBeersRated || 0 }}</p>
      </div>
      <!-- Rest of the template remains the same -->
    </div>
  `,
  styleUrls: ["./profile-section.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class ProfileSectionComponent {
  @Input() userProfile: UserProfile | null = null;
  @Output() profileUpdated = new EventEmitter<Partial<UserProfile>>();

  editMode = false;
  editedProfile: Partial<UserProfile> = {};

  constructor(private userService: UserService) {}

  updateProfilePicture(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.userService.uploadProfilePicture(file).subscribe({
        next: (url) => {
          if (this.userProfile) {
            this.userProfile.photoURL = url;
            this.profileUpdated.emit({ photoURL: url });
          }
        },
        error: (error) => console.error("Error uploading profile picture:", error),
      });
    }
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.saveProfile();
    } else {
      this.editedProfile = { ...this.userProfile };
    }
    this.editMode = !this.editMode;
  }

  saveProfile(): void {
    if (this.userProfile) {
      this.userService.updateUserProfile(this.editedProfile).subscribe({
        next: () => {
          this.userProfile = { ...this.userProfile, ...this.editedProfile } as UserProfile;
          this.profileUpdated.emit(this.editedProfile);
          this.editMode = false;
        },
        error: (error) => console.error("Error updating profile:", error),
      });
    }
  }

  getRankProgress(rank: UserRank | undefined | null): number {
    if (!rank || rank.progress === undefined) return 0;
    return Math.min(rank.progress * 100, 100);
  }

  getDateString(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString().split("T")[0];
    }
    return "";
  }
}