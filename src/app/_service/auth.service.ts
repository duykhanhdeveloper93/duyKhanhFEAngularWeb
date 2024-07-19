import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const AUTH_API = `${environment.apiUrl}/api/v1/oAuth/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};
@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: HttpClient) {}

    login(user: any): Observable<any> {
        return this.http.post(AUTH_API + 'sign-in', user, httpOptions);
    }

    

    // getCaptcha(): Observable<any> {
    //     return this.http.post(AUTH_API + `captcha`, null, {
    //         withCredentials: true,
    //     });
    // }

    // register(
    //     username: string,
    //     email: string,
    //     password: string
    // ): Observable<any> {
    //     return this.http.post(
    //         AUTH_API + 'signup',
    //         {
    //             username,
    //             email,
    //             password,
    //         },
    //         httpOptions
    //     );
    // }

    // logOut(): Observable<any> {
    //     return this.http.post(AUTH_API + 'sign-out', {}, httpOptions);
    // }

    // changePassword(form: any): Observable<any> {
    //     return this.http.post(AUTH_API + 'password/change', form, httpOptions);
    // }

    // refreshToken(): Observable<any> {
    //     return this.http.post(AUTH_API + 'refresh', {}, httpOptions);
    // }

    // resetPassword(form: any): Observable<any> {
    //     return this.http.post(AUTH_API + 'password/reset', form, httpOptions);
    // }
}
