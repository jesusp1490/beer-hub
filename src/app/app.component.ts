import { Component, OnInit } from "@angular/core"
import { TranslateService } from "@ngx-translate/core"
import { NotificationService } from "./services/notification.service"
import { Router, NavigationEnd } from "@angular/router"
import { AuthService } from "./services/auth.service"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "beer-hub"
  currentRoute = ""
  isAuthenticated = false

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
  ) {
    translate.setDefaultLang("en")
    translate.use("en")
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url
        console.log("Navigation ended. Current route:", this.currentRoute)
      }
    })

    this.authService.isLoggedIn().subscribe((loggedIn) => {
      this.isAuthenticated = loggedIn
      console.log("Is user authenticated:", this.isAuthenticated)
    })
  }

  login() {
    this.router.navigate(["/login"])
  }

  logout() {
    this.authService.signOut().then(() => {
      this.router.navigate(["/"])
    })
  }
}

