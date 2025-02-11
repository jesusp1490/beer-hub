import { Component, Input } from "@angular/core"
import { UserProfile } from "../../../models/user.model"
import { UserService } from "../../../services/user.service"

@Component({
  selector: "app-profile-section",
  templateUrl: "./profile-section.component.html",
  styleUrls: ["./profile-section.component.scss"],
})
export class ProfileSectionComponent {
  @Input() userProfile: UserProfile | null = null

  constructor(private userService: UserService) {}

  updateProfilePicture(event: any): void {
    const file = event.target.files[0]
    if (file) {
      this.userService.uploadProfilePicture(file).subscribe({
        next: (url) => {
          if (this.userProfile) {
            this.userProfile.photoURL = url
          }
        },
        error: (error) => console.error("Error uploading profile picture:", error),
      })
    }
  }
}

