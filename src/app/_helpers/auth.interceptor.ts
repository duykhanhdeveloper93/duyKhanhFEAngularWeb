import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
    HTTP_INTERCEPTORS,
    HttpErrorResponse,
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { TokenStorageService } from '../_service/token-storage.service';
import { AuthService } from '../_service/auth.service';
import { catchError, concatMap, filter, finalize } from 'rxjs/operators';
import { ResponseCodeEnum } from '../_common';
import { Router } from '@angular/router';

const TOKEN_HEADER_KEY = 'Authorization';
const CLIENT_ID_KEY = 'client-id';
const REFRESH_TOKEN_KEY = `u-s-r`;
const ACCESS_TOKEN_KEY = `u-s`;
@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> =
        new BehaviorSubject<any>(null);
    constructor(
        private tokenStorageService: TokenStorageService,
        private authService: AuthService,
        private router: Router
    ) {}

    private handleRefreshToken(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<any> {
        if (this.isRefreshing) {
            return this.refreshTokenSubject.pipe(
                filter(Boolean),
                concatMap(() => {
                    req = req.clone({
                        headers: req.headers.set(
                            TOKEN_HEADER_KEY,
                            `Bearer ${this.refreshTokenSubject.value}`
                        ),
                    });
                    return next.handle(req);
                })
            );
        }
        this.isRefreshing = true;
        this.refreshTokenSubject.next(false);
        return this.authService.refreshToken().pipe(
            concatMap((res: any) => {
                this.tokenStorageService.setCookies(res.data);
                req = req.clone({
                    headers: req.headers
                        .set(
                            TOKEN_HEADER_KEY,
                            `Bearer ${res.data.access_token}`
                        )
                        .set(CLIENT_ID_KEY, res.data.client_Id)
                        .set(REFRESH_TOKEN_KEY, res.data.refresh_token),
                });
                this.refreshTokenSubject.next(res.data.access_token);
                return next.handle(req);
            }),
            catchError((err) => {
                return throwError(err);
            }),
            finalize(() => {
                this.isRefreshing = false;
            })
        );
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        console.log("zzzzzzzzzzzz")
        const access_token = this.tokenStorageService.getAccessToken();
        const client_id = this.tokenStorageService.getClientId();
        const refresh_token = this.tokenStorageService.getRefreshToken();
        console.log("zzzzzzzzzzzz")
        const guest_access_token =
            this.tokenStorageService.getGuestAccessToken();
        const guest = this.tokenStorageService.getGuest();
        if (access_token && client_id && refresh_token) {
            req = req.clone({
                headers: req.headers
                    .set(
                        `X-${TOKEN_HEADER_KEY}`,
                        `Bearer ${guest_access_token}`
                    )
                    .set(TOKEN_HEADER_KEY, `Bearer ${access_token}`)
                    .set(ACCESS_TOKEN_KEY, `${access_token}`)
                    .set(CLIENT_ID_KEY, client_id)
                    .set(REFRESH_TOKEN_KEY, refresh_token),
            });
        } else if (guest_access_token && guest) {
            req = req.clone({
                headers: req.headers.set(
                    `X-${TOKEN_HEADER_KEY}`,
                    `Bearer ${guest_access_token}`
                ),
            });
        }

        return next.handle(req).pipe(
            catchError((error) => {
                if (
                    error instanceof HttpErrorResponse &&
                    error.status === 401 &&
                    error.error.message == ResponseCodeEnum.TOKEN_EXPIRED
                ) {
                    if (this.tokenStorageService.getKeepLoginSessionStatus()) {
                        return this.handleRefreshToken(req, next);
                    } else {
                        if (!this.isOnlineChat()) {
                            this.tokenStorageService.signOut();
                            this.router.navigate(['/authentication/login']);
                        }
                    }
                }
                if (
                    error instanceof HttpErrorResponse &&
                    error.status === 401 &&
                    error.error.message == ResponseCodeEnum.REQUIRE_SIGN_IN
                ) {
                    if (!this.isOnlineChat()) {
                        this.tokenStorageService.signOut();
                        this.router.navigate(['/authentication/login']);
                    }
                    return throwError(() => error);
                }
                return throwError(() => error);
            })
        );
    }

    isOnlineChat() {
        return this.router.url.startsWith('/online/');
    }
}

export const authInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];
