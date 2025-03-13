import {
    Component,
    Input,
    ElementRef,
    ViewChild,
    TemplateRef,
    AfterContentInit,
    ContentChildren,
    QueryList,
    OnInit,
    Output,
    EventEmitter,
    ViewEncapsulation,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import {
    MatTable,
    MatTableDataSource,
    MatColumnDef,
    MatTableModule,
} from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatSort, Sort } from '@angular/material/sort';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SelectionModel } from '@angular/cdk/collections';
import { filter, flattenDeep, forEach, isEmpty, map } from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PAGE_SIZE } from '../../../_common';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { VButtonComponent } from '../v-button/button.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';


export interface TableChangeEvent {
    paginator: {
        event: PageEvent;
        top: number;
        skip: number;
    };
    sort: Sort;
}
export interface VTabelDataSource<T> {
    items: T[];
    total: number;
}
export interface VTableDeleteAllConfig {
    title: string;
    body: string;
    buttons?: {
        confirm: string;
        cancel: string;
        confirmType: string;
        confirmIcon: string;
    };
}
@Component({
    selector: 'v-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    encapsulation: ViewEncapsulation.None,
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
        VButtonComponent,
        MatCheckboxModule,
        MatTooltipModule ,
        DragDropModule
    ],
})
export class VTableComponent<T> implements OnInit, AfterContentInit, OnChanges {
    /* =============Input============ */
    @Input() data: any;
    @Input() loading: boolean;
    @Input() selectedIds: number[] | number[][] = [];
    @Input() displayedColumns: any;
    @Input() enableDrag: boolean = false;
    @Input() enableSort: boolean = false;
    @Input() pagingConfig: any = {};
    @Input() removeBtnClass: string = 'ri-delete-bin-line';
    @Input() removeBtnTooltip: string = '';
    @Input() enableRemoveBtn = true;

    @Input() confirmDeleteDialogConfig: VTableDeleteAllConfig = {
        title: 'Xác nhận xóa',
        body: 'Bạn có chắc chắn muốn xóa dữ liệu không ?',
    };
    @Input() pageSize = PAGE_SIZE.SM;
    @Input() pageSizeOptions: number[] = [
        PAGE_SIZE.S5,
        PAGE_SIZE.SM,
        PAGE_SIZE.S25,
        PAGE_SIZE.S100,
    ];
    @Input() resetPageIndex: boolean = false;
    /* =============Output============ */
    @Output() tableChange: EventEmitter<TableChangeEvent> =
        new EventEmitter<TableChangeEvent>();
    @Output() selectedRowsChange: EventEmitter<any[]> = new EventEmitter<
        any[]
    >();
    @Output() removeCheckedItem: EventEmitter<any[]> = new EventEmitter<
        any[]
    >();
    @Output() sortOrderColumn: EventEmitter<any[]> = new EventEmitter<any[]>();
    /* =============ViewChild============ */
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatTable, { static: true }) table: MatTable<T>;
    @ViewChild('tableContainer', { static: true }) tableContainer: ElementRef;
    @ContentChildren(MatColumnDef)
    /* =============Variables============ */
    columnDefs: QueryList<MatColumnDef>;
    dataSource: any;
    columnTemplates: Map<string, TemplateRef<any>> = new Map();
    tableData: any;
    pageIndex: number = 0;
    total: number = 0;

    paginateOptions: any = {};
    isDragging = false;
    lastX: number;
    selection = new SelectionModel<any>(true, []);
    enableCheckbox: boolean = false;
    constructor(
        public dialog: MatDialog,
        public themeService: CustomizerSettingsService
    ) {}
    dragging: boolean = false;

    ngOnInit(): void {
        this.updateDataSource(this.data?.items);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    ngAfterContentInit() {
        this.columnDefs.forEach((columnDef) =>
            this.table.addColumnDef(columnDef)
        );
        this.enableCheckbox = this.displayedColumns.includes('select');
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('data' in changes && !changes['data'].isFirstChange()) {
            const data = changes['data'].currentValue;
            this.updateDataSource(data?.items);
            this.total = data.total;
            if (this.resetPageIndex && this.paginator)
                this.paginator.pageIndex = 0;
            //reset checkbox all
            this.selection = new SelectionModel<any>(true, []);
        }

        if (
            'selectedIds' in changes &&
            isEmpty(changes['selectedIds'].currentValue)
        ) {
            this.selection = new SelectionModel<any>(true, []);
        }
    }
    private updateDataSource(data: any) {
        this.tableData = data;
        this.dataSource = new MatTableDataSource<any>(data);
        this.onSelectedIds();
    }

    protected onSelectedIds() {
        const ids = flattenDeep(this.selectedIds);
        if (!isEmpty(ids)) {
            const items = filter(this.tableData, (item) => {
                return ids.includes(item.id);
            });
            setTimeout(() => {
                forEach(items, (item) => {
                    this.selection.toggle(item);
                });
            });
        }
    }
    // Sự kiện sort
    protected onSortChanged(event: any) {
        this.emitTableChange();
    }

    protected onChangePaginator($event: PageEvent) {
        this.emitTableChange($event);
    }
    // emit thông tin paging và sort
    private emitTableChange($event?: PageEvent) {
        const event: TableChangeEvent = {
            paginator: {
                event: {
                    pageIndex: $event?.pageIndex ?? this.paginator.pageIndex,
                    pageSize: $event?.pageSize ?? this.paginator.pageSize,
                    length: this.paginator.length,
                },
                top: this.paginator.pageSize,
                skip: this.paginator.pageIndex * this.paginator.pageSize,
            },
            sort: {
                active: this.sort?.active,
                direction: this.sort?.direction,
            },
        };
        this.onSelectedIds();
        this.tableChange.emit(event);
    }
    // sự kiện checkbox
    protected isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.tableData?.length;
        return numSelected === numRows;
    }

    protected checkboxLabel(row?: any): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
            row.id + 1
        }`;
    }
    protected onMouseDown(event: MouseEvent): void {
        this.isDragging = true;
        this.lastX = event.clientX; // Lưu lại vị trí X hiện tại của chuột
    }

    protected onMouseUp(): void {
        this.isDragging = false; // Ngừng kéo
    }

    protected onMouseMove(event: MouseEvent): void {
        if (this.isDragging) {
            const deltaX = this.lastX - event.clientX; // Tính toán sự chênh lệch của chuột
            this.lastX = event.clientX;

            // Di chuyển table theo sự chênh lệch của chuột
            this.tableContainer.nativeElement.scrollLeft += deltaX;
        }
    }
    protected removeSelected() {
        const ids = map(this.selection.selected, 'id');
        this.removeCheckedItem.emit(ids);
        this.selection.clear();
    }

    protected toggleAllRows() {
        if (this.isAllSelected()) {
            this.selection.clear();
            this.selectedRowsChange.emit([]);
            return;
        }
        this.selection.select(...this.tableData);
        const ids = map(this.selection.selected, 'id');
        this.selectedRowsChange.emit(ids);
    }

    resetPage() {
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
    }

    protected confirmDelete() {
        const element = {
            buttons: {
                confirm: 'Xóa',
                cancel: 'Đóng',
                confirmType: 'danger',
                confirmIcon: 'ri-delete-bin-line',
            },
            ...this.confirmDeleteDialogConfig,
        };
        const currentDialog = this.dialog.open(ConfirmDialogComponent, {
            data: element,
        });
        currentDialog.afterClosed().subscribe((result: any) => {
            if (result) {
                if (result === 'confirmed') {
                    this.removeSelected();
                }
            }
        });
    }
    // Sự kiện kéo thả
    protected drop(event: CdkDragDrop<any[]>) {
        if (!event || !event.previousIndex || !event.currentIndex) {
            return;
        }

        moveItemInArray(
            this.tableData,
            event.previousIndex,
            event.currentIndex
        );
        this.sortOrderColumn.emit(this.tableData);
        this.dataSource.data = [...this.tableData];
    }
    protected startDrag(): void {
        if (this.enableDrag) {
            this.dragging = true;
        }
    }
    protected stopDrag(): void {
        this.dragging = false;
    }

    // Sự kiện toggle selection
    protected toggleSelection($event: any, row: any) {
        if ($event) {
            this.selection.toggle(row);
            const ids = map(this.selection.selected, 'id');
            this.selectedRowsChange.emit(ids);
        }
    }
}
