import { Injectable } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
constructor(private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const requiredRole = route.data['role'] as string;

    const isLoggedIn = await this.authService.isLoggedIn();
    console.log('RoleGuard: isLoggedIn:', isLoggedIn); // Débogage
    if (!isLoggedIn) {
      console.log('RoleGuard: User not logged in, redirecting to /login');
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier si l'utilisateur a le rôle requis
    const hasRole = this.authService.hasRole(requiredRole);
    console.log(`RoleGuard: Checking for role ${requiredRole}:`, hasRole); // Débogage
    if (requiredRole && !hasRole) {
      console.log(`RoleGuard: User lacks required role ${requiredRole}, redirecting to /unauthorized`);
      this.router.navigate(['/unauthorized']);
      return false;
    }

    console.log(`RoleGuard: Access granted for role ${requiredRole}`);
    return true;
  }
}