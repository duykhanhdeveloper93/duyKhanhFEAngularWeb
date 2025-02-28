import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService } from '../../../_service/role.service';

interface Role {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: boolean;
  createdAt: Date;
}

interface PaginatedResponse {
  items: Role[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    pageSizeOptions: number[];
  };
}

@Component({
  selector: 'app-list-role',
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
  templateUrl: './list-role.component.html',
  styleUrl: './list-role.component.scss'
})
export class ListRoleComponent {
  private roleService = inject(RoleService);
  
  roles = signal<Role[]>([]);
  totalItems = signal<number>(0);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  displayedColumns: string[] = [
    'id', 
    'name', 
    'createdAt', 
    'actions'
  ];
  
  // Pagination
  pageSize = signal<number>(10);
  pageSizeOptions = signal<number[]>([10, 20, 50, 100]);
  currentPage = signal<number>(0);

  constructor() {
    this.loadRoles();
  }

  loadRoles(page: number = 1, limit: number = this.pageSize()): void {
    this.loading.set(true);
    this.error.set(null);

    this.roleService.getRoles({ page, limit }).subscribe({
      next: (response: PaginatedResponse) => {
        this.roles.set(response.items);
        this.totalItems.set(response.meta.total);
       
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
    this.loadRoles(this.currentPage() + 1, this.pageSize());
  }

  deleteRole(userId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      // Implement delete logic here
      console.log('Deleting role:', userId);
    }
  }
}
