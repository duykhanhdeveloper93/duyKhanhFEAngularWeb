import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const AUTH_API = `${environment.apiUrl}/api/v1/users/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

export class CreateUserDto {
    username: string;
    firstName:string;
    lastName: string;
    address: string;
    status: boolean;
    password?: string;
    isSys?: boolean;
    passwordHash?: string;
    passwordHashTemp?: string;
    roleIds?: number[];
    createdAt?: Date;
    createdBy?: number;
  }


@Injectable({
    providedIn: 'root',
})
export class UserService {
    constructor(
        private http: HttpClient
    ) {}

    getUsers(options: any): Observable<any> {
        return this.http.get(AUTH_API, { params: { ...options } });
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/${id}`);
    }

    createUser(body: CreateUserDto): Observable<any> {
        return this.http.post(AUTH_API + 'createUser', body, httpOptions);
    }

}
