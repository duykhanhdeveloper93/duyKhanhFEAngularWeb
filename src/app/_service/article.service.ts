import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const URL = `${environment.apiUrl}/api/v1/content/`;
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

    uploadFile(id: string, formData: FormData): Observable<any> {
        const uploadOptions = {
            withCredentials: true, // Nếu cần gửi cookie
            reportProgress: true,  // Theo dõi tiến trình
            observe: 'events' as const // Nhận sự kiện upload
        };
    
        return this.http.post(`${URL}upload/${id}`, formData, uploadOptions);
    }
    



    getArticle(options: any): Observable<any> {
        return this.http.post(URL + 'search', options, httpOptions);
    }

    deleteArticle(id: number): Observable<void> {
        return this.http.delete<void>(`${URL}/${id}`);
    }

    createArticle(body: CreateArticleDto): Observable<any> {
        return this.http.post(URL + 'createArticle', body, httpOptions);
    }

}
