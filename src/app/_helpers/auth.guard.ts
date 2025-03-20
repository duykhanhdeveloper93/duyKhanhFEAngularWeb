import { Injectable } from '@angular/core';
import {
    Router,
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
// import { TokenStorageService } from '../_service/cookie-storage.service';
import { TokenStorageService } from '../_service/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authenticationService: TokenStorageService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const token = this.authenticationService.getAccessToken();
        if (token) {
            return true;
        }
        this.router.navigate(['/authentication'], {
            queryParams: { returnUrl: state.url },
        });
        return false;
    }
}
