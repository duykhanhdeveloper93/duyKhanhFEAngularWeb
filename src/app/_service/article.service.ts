import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const AUTH_API = `${environment.apiUrl}/api/v1/content/`;
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true,
};

export class CreateArticleDto {
    title: string;
    content:string;
    
  }


@Injectable({
    providedIn: 'root',
})
export class ArticleService {
    constructor(
        private http: HttpClient
    ) {}

    getArticle(options: { page: number; limit: number }): Observable<any> {
        return this.http.get(AUTH_API, { params: { ...options } });
    }

    deleteArticle(id: number): Observable<void> {
        return this.http.delete<void>(`${AUTH_API}/${id}`);
    }

    createArticle(body: CreateArticleDto): Observable<any> {
        return this.http.post(AUTH_API + 'createArticle', body, httpOptions);
    }

}
