import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArticleService } from '../../../_service/article.service';
import { PAGE_SIZE, pageSizeOptions, ResponseCodeEnum, TOASTR_MSG, TOASTR_TITLE } from '../../../_common';
import { VTableComponent } from '../../../common/my-template/table/table.component';
import { VButtonComponent } from '../../../common/my-template/v-button/button.component';
import { VIconButtonComponent } from '../../../common/my-template/icon-button/button.component';
import { SelectionModel } from '@angular/cdk/collections';
import { NgxSpinnerService } from 'ngx-spinner';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/internal/Subscription';
import { concatMap, debounceTime, Subject, switchMap, toArray } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../../common/my-template/confirm-dialog/confirm-dialog.component';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

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
        VButtonComponent,
        VIconButtonComponent,
        MatCheckboxModule
    ],
    templateUrl: './list-article.component.html',
    styleUrl: './list-article.component.scss'
})
export class ListArticleComponent implements AfterViewInit, OnInit {
  protected readonly pageSizeOptions = pageSizeOptions;
  p: number = 1;

  pageSize = PAGE_SIZE.SM;
  pageIndex: number = 0;
  total: number = 0;
  paginateOptions: any = {};
  paginateOptionsFull: any = {};
  data_export = [];
  data_export_excel = [];
  filter_value: any;

  displayedColumns: string[] = [
      'select',
      'stt',
      'title',
      'action',
  ];

  show_button_delete: boolean = false;

  listData: PeriodicElement[] = [];
  dataSource = new MatTableDataSource<PeriodicElement>(this.listData);
  selection = new SelectionModel<PeriodicElement>(true, []);
  selectedItems: any;
  currentUser: any;
  sites: any[] = [];
  departments: any[] = [];
  listRole: any[] = [];
  packageService: any;


  private readonly searchSubject = new Subject<any | undefined>();
  private searchSubscription: Subscription;

  constructor(
      private _liveAnnouncer: LiveAnnouncer,
      private articleService: ArticleService,
      public themeService: CustomizerSettingsService,
      public dialog: MatDialog,
      private paginatorIntl: MatPaginatorIntl,
      private toastr: ToastrService,
      private cdr: ChangeDetectorRef,
      private router: Router,
      private spinnerService: NgxSpinnerService,
  

  ) {
      this.paginatorIntl.itemsPerPageLabel = 'Số mục mỗi trang'; // Thay đổi chuỗi "Số mục mỗi trang" thành "Tùy chọn trang"}
  }

  
  async ngOnInit(): Promise<void> {
      this.searchSubscription = this.searchSubject
          .pipe(
              debounceTime(300),
              switchMap((keyword) =>
                  this.articleService.getArticle({
                      ...this.paginateOptions,
                      skip: 0,
                      ...keyword,
                  })
              )
          )
          .subscribe((res) => {
              this.listData = res.data.items.map((item: any, stt: number) => {
                  const element: PeriodicElement = {
                    id: item.id,
                    stt: stt + 1,
                    status: 0,
                    title: item.title,
                    content: item.title
                  };
                  return element;
              });

              this.dataSource = new MatTableDataSource<PeriodicElement>(
                  this.listData
              );
              this.total = res.data.count;
          });

      const paginateOptions: any = {
          skip: this.pageIndex * this.pageSize,
          top: this.pageSize,
          order: { createdAt: 'desc' }
      };

      this.paginateOptions = { ...this.paginateOptions, ...paginateOptions  };

      this.paginateOptionsFull = {
          ...this.paginateOptions,
          ...paginateOptions,
          top: 1000,
      };
     
      this.getListArticles();
  }


  ngOnDestroy() {
      this.searchSubscription.unsubscribe();
  }

  updateButtonDelete() {
    this.show_button_delete = this.selection.selected.length >= 2 ? true : false;
    this.dataSource.data = [...this.dataSource.data]; // Tạo một bản sao mới để Angular phát hiện 
  }

  convertDateToString(data: string): string {
      const data1: Date = new Date(data);
      const day = data1.getDate(); // Lấy ngày
      const month = data1.getMonth(); // Lấy tháng (giá trị từ 0-11, 0: tháng 1, 11: tháng 12)
      const year = data1.getFullYear(); // Lấy năm

      const dateStringOK: string = day + '-' + month + '-' + year;
      return dateStringOK;
  }

  getListArticles() {
      if (this.canViewList() === false) return;

      this.articleService.getArticle(this.paginateOptions).subscribe({
          next: (res) => {
              if (res.status) {
                  this.listData = res.data.items.map(
                      (item: any, stt: number) => {
                          const element: PeriodicElement = {
                            id: item.id,
                            stt: stt + 1,
                            status: 0,
                            title: item.title,
                            content: item.title
                          };
                          return element;
                      }
                  );
                  this.dataSource = new MatTableDataSource<PeriodicElement>(
                      this.listData
                  );

                  this.total = res.data.count;
              }
          },
          error: (err) => {
              if (err.error.message !== ResponseCodeEnum.TOKEN_EXPIRED) {
                  this.toastr.error(
                     "Lỗi",
                      TOASTR_TITLE.ERROR
                  );
              }
          },
      });
  }

  toggleTheme() {
      this.themeService.toggleTheme();
  }

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
  }


  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
      if (this.isAllSelected()) {
        this.selection.clear();
      } else {
          this.selection.select(...this.dataSource.data);
      }
      this.updateButtonDelete();
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: PeriodicElement) {
      this.selectedItems = this.selection.selected;
      this.updateButtonDelete();
      if (!row) {
          return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
      }
      return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
          row.stt + 1
      }`;
  }

  onCheckboxChange(event: MatCheckboxChange, row: any): void {
    // Kiểm tra trạng thái checkbox
    const isChecked = event.checked; // Sử dụng thuộc tính checked của MatCheckboxChange

    if (isChecked) {
        this.selection.select(row); // Chọn hàng
    } else {
        this.selection.deselect(row); // Bỏ chọn hàng
    }

    // Cập nhật nút xóa
    this.updateButtonDelete();
  }

  /** The label for the checkbox on the passed row */

  applyFilter(event: Event) {
      this.selection.clear();
      this.pageIndex = 0;
      this.filter_value = event;
      this.searchSubject.next(this.filter_value);
     
  }

  filterButton() {
      this.selection.clear();
      const query = this.filter_value.toLowerCase();

      this.searchSubject.next(query);
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(event: any) {
      const columnName = event.active;
      const sortDirection = event.direction;

      // This example uses English messages. If your application supports
      // multiple language, you would internationalize these strings.
      // Furthermore, you can customize the message to add additional
      // details about the values being sorted.
      if (sortDirection) {
          this._liveAnnouncer.announce(
              `Sorted by ${columnName} ${sortDirection}ending`
          );
      } else {
          this._liveAnnouncer.announce('Sorting cleared');
      }
  }

  onChangePaginator(pageEvent: PageEvent) {
      this.selection.clear();
      this.pageSize = pageEvent.pageSize;
      this.pageIndex = pageEvent.pageIndex;
      const paginateOptions: any = {
          skip: this.pageIndex * this.pageSize,
          top: this.pageSize,
          keyword: this.filter_value,
      };

      this.paginateOptions = { ...this.paginateOptions, ...paginateOptions };
      this.getListArticles();
  }
  
  // Routing
  addNewArticle() {
      this.router.navigate(['/settings/manage-article/add']);
  }

  editArticle(elementId: any) {
      this.router.navigate(['/settings/manage-article/edit/' + elementId]);
  }

  viewContent(elementId: any) {
      this.router.navigate(['/settings/manage-article/view-content-article/' + elementId]);
  }


 
 
  deleteSingleData(data: any) {
      
  }

  deleteOneData(data: any) {
      
  }

  deleteMultiData() {
      
  }

  deleteMulti() {
      
  }




  isSys() {
      return true;
  }
  
  isManagerDepartment() {
    return true;
  }

  isManagerSite() {
    return true;
  }


  canViewList() {
    return true;
  }

  canCreateNew() {
    return true;
  }

  canEdit() {
    return true;
  }

  canDelete() {
    return true;
  }

    
}

export interface PeriodicElement {
  id: number;
  stt: number;
  status: number;
  title: string;
  content: string;

}
