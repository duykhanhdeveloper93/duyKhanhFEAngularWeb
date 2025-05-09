import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../_service/user.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: boolean;
  createdAt: Date;
}

interface PaginatedResponse {
  items: User[];
  count: number;
}

@Component({
  selector: 'app-list-user',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './list-user.component.html',
  styleUrl: './list-user.component.scss'
})
export class ListUserComponent {
  private userService = inject(UserService);
  
  users = signal<User[]>([]);
  totalItems = signal<number>(0);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  paginateOptions: any = {};
  
  displayedColumns: string[] = [
    'id', 
    'username', 
    'email', 
    'fullName', 
    'status', 
    'createdAt', 
    'actions'
  ];
  
  // Pagination
  pageSize = signal<number>(10);
  pageSizeOptions = signal<number[]>([10, 20, 50, 100]);
  currentPage = signal<number>(0);

  constructor(
    private router: Router
  ) {
    
    this.loadUsers();
  }

  loadUsers(skip:number = 0,top : number = this.pageSize() - 1): void {
    this.paginateOptions = {
      skip: skip,
      top: top,
      order: { createdAt: 'desc' },
      keyword: ""
    }
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers(this.paginateOptions).subscribe({
      next: (response: PaginatedResponse) => {
        this.users.set(response.items);
        this.totalItems.set(response.count);
       
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Không thể tải danh sách người dùng');
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers((this.currentPage() - 1)  * this.pageSize(), this.pageSize());
  }

  deleteUser(userId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      // Implement delete logic here
      console.log('Deleting user:', userId);
    }
  }

  addNewPackage() {
    this.router.navigate(['/settings/manage-user/add']);
}
}
