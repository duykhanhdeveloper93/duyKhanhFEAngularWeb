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
  export class UpdateArticleDto {
    id: number;
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


    // Hàm upload file Base64
    uploadBase64File(base64: string, fileName: string): Observable<any> {
        const payload = {
            base64,
            fileName,
        };

        return this.http.post(`${URL}upload-base64`, payload, httpOptions);
    }

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

    
    findById(id: number): Observable<any> {
        return this.http.get(`${URL}${id}`, httpOptions);
      
    }

    deleteArticle(id: number): Observable<void> {
        return this.http.delete<void>(`${URL}/${id}`);
    }

    deleteMultiArticle(ids: any): Observable<any> {
        return this.http.post(URL + 'delete-many', ids, httpOptions);
    }
    

    createArticle(body: CreateArticleDto): Observable<any> {
        return this.http.post(URL + 'createArticle', body, httpOptions);
    }

    updateArticle(body: UpdateArticleDto): Observable<any> {
        return this.http.post(URL + 'updateArticle', body, httpOptions);
    }



    processImagePaths(content: string): string {
        if (!content) return '';
        
        const baseUrl = URL + 'image/' ; // Thay thế bằng URL thực tế
        
        return content.replace(/<img src="([^"]+)"/g, (match, fileName) => {
            if (fileName.startsWith('http') || fileName.startsWith('/uploads/')) {
                return match;
            }
            return `<img src="${baseUrl}${fileName}"`;
        });
    }

    processImageTitle(fileName: string): string {
     
        const baseUrl = URL + 'image/' ; // Thay thế bằng URL thực tế
        const srcShow = baseUrl + fileName;
        return srcShow;

    }


   
}
