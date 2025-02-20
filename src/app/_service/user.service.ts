import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const AUTH_API = `${environment.apiUrl}/api/v1/users/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

@Injectable({
    providedIn: 'root',
})
export class UserService {
    constructor(
        private http: HttpClient
    ) {}

    getUsers(options: { page: number; limit: number }): Observable<any> {
        return this.http.get(AUTH_API, { params: { ...options } });
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/${id}`);
    }

}
