import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const AUTH_API = `${environment.apiUrl}/api/v1/roles/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    constructor(
        private http: HttpClient
    ) {}

    getRoles(options: any): Observable<any> {
        return this.http.post(AUTH_API + '/paginate', options, httpOptions);
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/${id}`);
    }

}
