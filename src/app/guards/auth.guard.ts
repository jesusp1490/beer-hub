import { Injectable } from "@angular/core"
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from "@angular/router"
import { Observable } from "rxjs"
import { AuthService } from "../services/auth.service"
import { map, take } from "rxjs/operators"

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        const isLoggedIn = !!user
        if (isLoggedIn) {
          return true
        }
        console.log("User not authenticated, redirecting to login")
        return this.router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } })
      }),
    )
  }
}

