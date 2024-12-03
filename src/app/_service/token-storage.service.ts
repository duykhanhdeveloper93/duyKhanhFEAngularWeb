import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { CookieEnum, ttlCookies } from '../_common';

interface LoginResult {
    access_token: string;
    client_Id: string;
    logged_in: string;
    refresh_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class TokenStorageService {
    constructor(private cookieService: CookieService) {}

    signOut(): void {
        this.clearCookies();
    }

    public getKeepLoginSessionStatus() {
        const result = this.cookieService.get(CookieEnum.KEEP_SESSION);
        return result == 'yes' ? true : false;
    }

    public setKeepLoginSessionStatus(status: boolean) {
        this.cookieService.delete(CookieEnum.KEEP_SESSION);
        const cookie_value = status ? 'yes' : 'no';
        console.log("cookie_value" + cookie_value)
        const expried = new Date(new Date().getTime() + ttlCookies);
        this.cookieService.set(
            CookieEnum.KEEP_SESSION,
            cookie_value,
            expried,
            '/'
        );
    }

    public setCookies(item: LoginResult): void {
        const { access_token, client_Id, logged_in, refresh_token } = item;
        const expried = new Date(new Date().getTime() + ttlCookies);
        if (access_token && client_Id && refresh_token && logged_in) {
            this.clearCookies();
            this.cookieService.set(
                CookieEnum.ACCESS_TOKEN_KEY,
                access_token,
                expried,
                '/'
            );
            this.cookieService.set(
                CookieEnum.CLIENT_ID,
                client_Id,
                expried,
                '/'
            );
            this.cookieService.set(
                CookieEnum.REFRESH_TOKEN_KEY,
                refresh_token,
                expried,
                '/'
            );
            console.log(" CookieEnum.REFRESH_TOKEN_KEY" +  CookieEnum.REFRESH_TOKEN_KEY + ":" + refresh_token)
            this.cookieService.set(
                CookieEnum.LOGGED_IN,
                logged_in,
                expried,
                '/'
            );
        }
    }

    public clearCookies() {
        this.cookieService.delete(CookieEnum.ACCESS_TOKEN_KEY, '/');
        this.cookieService.delete(CookieEnum.CLIENT_ID, '/');
        this.cookieService.delete(CookieEnum.REFRESH_TOKEN_KEY, '/');
        this.cookieService.delete(CookieEnum.LOGGED_IN, '/');
    }

    public getAccessToken(): any {
        return this.cookieService.get(CookieEnum.ACCESS_TOKEN_KEY);
    }

    public getGuestAccessToken(options?: { site: number }): any {
        if (options?.site) {
            return this.cookieService.get(
                CookieEnum.GUEST_ACCESS_TOKEN_KEY + '-' + options?.site
            );
        } else {
            return this.cookieService.get(CookieEnum.GUEST_ACCESS_TOKEN_KEY);
        }
    }

    public getGuest(): any {
        return this.cookieService.get(CookieEnum.GUEST);
    }

    public getClientId(): any {
        return this.cookieService.get(CookieEnum.CLIENT_ID);
    }

    public getRefreshToken(): any {
        return this.cookieService.get(CookieEnum.REFRESH_TOKEN_KEY);
    }

    public isLoggedIn() {
        return this.cookieService.get(CookieEnum.LOGGED_IN) === 'true';
    }
}
