import { Component, OnInit, OnDestroy, HostListener } from "@angular/core"
import { Router } from "@angular/router"
import { AuthService } from "../../services/auth.service"
import { Observable, Subject } from "rxjs"

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user$: Observable<any>
  isMenuOpen = false
  isUserMenuOpen = false

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.user$ = this.authService.user$ as Observable<any>
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToSignUp(): void {
    this.router.navigate(["/signup"])
    this.closeMenu()
  }

  goToLogin(): void {
    this.router.navigate(["/login"])
    this.closeMenu()
  }

  goToProfile(): void {
    this.router.navigate(["/dashboard"])
    this.closeMenu()
    this.closeUserMenu()
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(["/"])
      this.closeMenu()
      this.closeUserMenu()
    })
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen
    document.body.style.overflow = this.isMenuOpen ? "hidden" : ""
  }

  closeMenu(): void {
    this.isMenuOpen = false
    document.body.style.overflow = ""
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: Event): void {
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu()
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.isUserMenuOpen && !(event.target as HTMLElement).closest(".user-menu")) {
      this.closeUserMenu()
    }
  }
}
