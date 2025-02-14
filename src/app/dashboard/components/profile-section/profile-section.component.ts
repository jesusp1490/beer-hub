import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatDialogModule, MatDialog } from "@angular/material/dialog"
import { UserProfile } from "../../../models/user.model"
import { Timestamp } from "firebase/firestore"
import { ChangePasswordComponent } from "../change-password/change-password.component"
import { NewBeerRequestComponent } from "../new-beer-request/new-beer-request.component"
import { Router } from "@angular/router"

interface ProfileField {
  key: string
  label: string
  value: string | null | undefined
  editable: boolean
}

@Component({
  selector: "app-profile-section",
  templateUrl: "./profile-section.component.html",
  styleUrls: ["./profile-section.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    ChangePasswordComponent,
    NewBeerRequestComponent,
  ],
})
export class ProfileSectionComponent implements OnInit, OnChanges {
  @Input() userProfile: UserProfile | null = null
  @Output() editField = new EventEmitter<{ field: string; value: string }>()
  @Output() changePassword = new EventEmitter<void>()
  @Output() requestNewBeer = new EventEmitter<void>()
  @Output() logout = new EventEmitter<void>()
  @Output() uploadProfilePicture = new EventEmitter<File>()

  profileFields: ProfileField[] = []
  editingField: string | null = null

  constructor(
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.updateProfileFields()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["userProfile"]) {
      this.updateProfileFields()
    }
  }

  updateProfileFields() {
    if (this.userProfile) {
      const fullName =
        [this.userProfile.firstName, this.userProfile.lastName].filter(Boolean).join(" ") ||
        this.userProfile.displayName ||
        "Not set"

      this.profileFields = [
        { key: "displayName", label: "Full Name", value: fullName, editable: true },
        { key: "username", label: "Username", value: this.userProfile.username, editable: false },
        { key: "email", label: "Email", value: this.userProfile.email, editable: true },
        { key: "country", label: "Country", value: this.userProfile.country, editable: true },
        { key: "dob", label: "Date of Birth", value: this.convertTimestamp(this.userProfile.dob), editable: true },
        {
          key: "joined",
          label: "Joined",
          value: this.convertTimestamp(this.userProfile.statistics?.registrationDate),
          editable: false,
        },
      ]
    } else {
      this.profileFields = []
    }
  }

  convertTimestamp(timestamp: Timestamp | null | undefined): string | null {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString()
    } else if (timestamp === null || timestamp === undefined) {
      return "Not set"
    } else {
      return "Invalid date"
    }
  }

  startEditing(field: string): void {
    this.editingField = field
  }

  onEditField(field: string, value: string): void {
    this.editingField = null
    if (field === "displayName") {
      // Split the full name into firstName and lastName
      const [firstName = "", ...lastNameParts] = value.trim().split(" ")
      const lastName = lastNameParts.join(" ")

      this.editField.emit({ field: "firstName", value: firstName })
      if (lastName) {
        this.editField.emit({ field: "lastName", value: lastName })
      }
    } else {
      this.editField.emit({ field, value })
    }
  }

  onChangePassword(): void {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: "400px",
      data: { userId: this.userProfile?.uid },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.changePassword.emit()
      }
    })
  }

  onRequestNewBeer(): void {
    const dialogRef = this.dialog.open(NewBeerRequestComponent, {
      width: "500px",
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.requestNewBeer.emit()
      }
    })
  }

  onLogout(): void {
    this.logout.emit()
    this.router.navigate(["/"])
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement
    if (element.files && element.files.length > 0) {
      this.uploadProfilePicture.emit(element.files[0])
    }
  }
}

