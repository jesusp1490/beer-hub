import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { UserService } from "../../../services/user.service"
import { UserProfile } from "../../../models/user.model"
import { Router } from "@angular/router"
import { NotificationService } from "../../../services/notification.service"

@Component({
  selector: "app-edit-profile",
  templateUrl: "./edit-profile.component.html",
  styleUrls: ["./edit-profile.component.scss"],
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup
  userProfile: UserProfile | null = null

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.profileForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      bio: [""],
    })
  }

  ngOnInit(): void {
    this.userService.getCurrentUserProfile().subscribe((data: UserProfile | null) => {
      if (data) {
        this.userProfile = data
        this.profileForm.patchValue({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          bio: data.bio || "",
        })
      }
    })
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.userProfile) {
      const updatedProfile: Partial<UserProfile> = {
        firstName: this.profileForm.get("firstName")?.value,
        lastName: this.profileForm.get("lastName")?.value,
        bio: this.profileForm.get("bio")?.value,
      }

      this.userService.updateUserProfile(updatedProfile).subscribe(
        () => {
          this.notificationService.showSuccess("Profile updated successfully")
          this.router.navigate(["/profile"])
        },
        (error) => {
          console.error("Error updating profile:", error)
          this.notificationService.showError("Error updating profile")
        },
      )
    }
  }

  onCancel(): void {
    this.router.navigate(["/profile"])
  }
}

