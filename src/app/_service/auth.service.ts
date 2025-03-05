import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const AUTH_API = `${environment.apiUrl}/api/v1/auth/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(
        private http: HttpClient
    ) {}

    login(user: any): Observable<any> {
        return this.http.post(AUTH_API + 'login', user, httpOptions);
    }

    logOut(): Observable<any> {
        return this.http.post(AUTH_API + 'sign-out', {}, httpOptions);
    }
    
    refreshToken(): Observable<any> {
        return this.http.post(AUTH_API + 'refresh', {}, httpOptions);
    }

}
