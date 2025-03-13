import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArticleService } from '../../../_service/article.service';
import { PAGE_SIZE } from '../../../_common';
import { VTableComponent } from '../../../common/my-template/table/table.component';
import { VButtonComponent } from '../../../common/my-template/v-button/button.component';

interface Article {
    id: number;
    articlename: string;
    email: string;
    fullName: string;
    status: boolean;
    createdAt: Date;
}

interface PaginatedResponse {
    items: Article[];
    count: number;
}

@Component({
    selector: 'app-list-article',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatTableModule,
        MatPaginatorModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        VTableComponent,
        VButtonComponent
    ],
    templateUrl: './list-article.component.html',
    styleUrl: './list-article.component.scss',
})
export class ListArticleComponent {
    private articleService = inject(ArticleService);
    listData: PeriodicElement = {};

    displayedColumns: string[] = ['index', 'title', 'actions'];

    // Pagination
    protected readonly pageSizeOptions: number[] = [
        PAGE_SIZE.S5,
        PAGE_SIZE.SM,
        PAGE_SIZE.S25,
        PAGE_SIZE.S100,
    ];
    pageSize: number = PAGE_SIZE.SM;
    resetPageIndex: boolean = false;
    pageIndex: number = 0;
    paginateOptions: any = {};

    filterValue: any = {
        skip: this.pageIndex,
        top: this.pageSize,
        keyword: '',
    };

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.getList(this.filterValue);
    }

    onTableChange(event: any) {
        const { pageIndex, pageSize } = event.paginator.event;
        if (pageIndex >= 0) this.pageIndex = pageIndex;
        if (pageSize) this.pageSize = pageSize;
        if (this.resetPageIndex) this.resetPageIndex = false;
        const skip = pageIndex * pageSize;
        const top = pageSize + skip;
        this.filterValue = { ...this.filterValue, skip, top };
        this.getList(this.filterValue);
    }

    getList(payload: any) {
        this.articleService.getArticle(payload).subscribe({
            next: (res) => {
                const items = res?.items.map(
                    (item: any, index: number) => {
                        return {
                            ...item,
                            index: this.pageIndex * this.pageSize + 1 + index,
                        };
                    }
                );
                this.listData = {
                    items: items,
                    total: res?.count,
                };
            },
            error: (err) => {},
        });
    }

    deleteArticle(articleId: number): void {
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            // Implement delete logic here
            console.log('Deleting article:', articleId);
        }
    }

    addNewArticle() {
        this.router.navigate(['/settings/manage-article/add']);
    }
}

export interface PeriodicElement {
    items?: {
        id: number;
    }[];
    total?: number;
}
