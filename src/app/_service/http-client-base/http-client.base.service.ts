import {
    HttpClient,
    HttpContext,
    HttpHeaders,
    HttpParams,
    HttpRequest,
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import urlJoin from 'url-join';
import { Observer } from 'rxjs';

export interface PaginateResults<T> {
    items: T[];
    total: number;
}

export interface PaginateOptions<T> {
    top: number;
    skip: number;
    order?: Partial<{ [Property in keyof T]: 'asc' | 'desc' }>;
}

export interface BaseEntity {
    id: number;
    createdAt: Date;
    modifiedAt: Date;
}

export class AxiosConfig {
    endpoint: string;
}

export interface BaseResponse<T> {
    data: T;
    statusCode: number;
}

export interface PaginateResponse<T> {
    items: T[];
    total: number;
}

export interface PaginateObserver<T> extends Observer<T> {}

export interface HttpOptions {
    apiVersion?: '1' | '2' | '3';
    headers?:
        | HttpHeaders
        | {
              [header: string]: string | string[];
          };
    context?: HttpContext;
    observe?: 'body';
    params?:
        | HttpParams
        | {
              [param: string]:
                  | string
                  | number
                  | boolean
                  | ReadonlyArray<string | number | boolean>;
          };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
}

export const PREFIX = new InjectionToken<string>('page.prefix');

@Injectable({
    providedIn: 'root',
})
export class HttpClientBaseService {
    protected readonly httpOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true,
    };

    private baseUrl = `${environment.apiUrl}/api/v1`;

    constructor(
        protected readonly http: HttpClient,
        @Inject(PREFIX) protected readonly prefix: string
    ) {}

    protected post<T>(endPoint: string, data: any, httpOptions?: HttpOptions) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        return this.http.post<T>(url, data, {
            ...this.httpOptions,
            ...httpOptions,
        });
    }

    protected get<T>(endPoint: string, httpOptions?: HttpOptions) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        return this.http.get<T>(url, {
            ...this.httpOptions,
            ...httpOptions,
        });
    }

    protected put<T>(endPoint: string, data: any, httpOptions?: HttpOptions) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        return this.http.put<T>(url, data, {
            ...this.httpOptions,
            ...httpOptions,
        });
    }

    protected patch<T>(endPoint: string, data: any, httpOptions?: HttpOptions) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        return this.http.patch<T>(url, data, {
            ...this.httpOptions,
            ...httpOptions,
        });
    }

    protected delete<T>(endPoint: string, httpOptions?: HttpOptions) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        return this.http.delete<T>(url, {
            ...this.httpOptions,
            ...httpOptions,
        });
    }

    protected request(
        method: 'POST' | 'GET' | 'PUT',
        endPoint: string,
        data: any
    ) {
        const url = urlJoin(this.baseUrl, this.prefix, endPoint);
        const request = new HttpRequest(method, url, data, {
            reportProgress: true,
        });
        return this.http.request(request);
    }
}
