import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

import { get } from 'lodash';

import { forkJoin } from 'rxjs';
import { ActiveType } from '../_common';


import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
const USER_API = `${environment.apiUrl}/api/v1/users/`;
const SITE_API = `${environment.apiUrl}/api/v1/sites`;
const DEP_API = `${environment.apiUrl}/api/v1/departments`;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

export interface AcTiveType {
    type: ActiveType;
    name: string;
    icon: string;
}

interface IBaseUser {
    id: number;
    firstName: string;
    fullNameVn: string;
    lastName: string;
    createdAt: Date;
    modifiedAt: Date;
    phoneNumber: string;
    status: boolean;
    address: string;
    loginName: string;
    workEmail: string;
    isSys: boolean;
    activeType: number;
    isOnlineChat: boolean;
}

export interface UserDto extends IBaseUser {
    department: {
        id: number;
        name: string;
        site: {
            id: number;
            alias: string;
        };
    };
}
export interface ICurrentUser extends IBaseUser {
    department: {
        id: number;
        site: {
            id: number;
        };
    };
    notificationConfig: any;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private toastr: ToastrService
    ) {}

    currentUser: ICurrentUser;

    /**
     * @deprecated Không nên gọi hàm này
     * @see getCurrentUserAsync
     * @returns
     */
    getCurrentUser(): Observable<any> {
        return this.http.post(USER_API + 'currentUser', {}, httpOptions);
    }


}
