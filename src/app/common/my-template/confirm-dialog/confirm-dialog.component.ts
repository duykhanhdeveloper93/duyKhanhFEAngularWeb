import { CommonModule } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { VTableComponent } from '../table/table.component';
import { VButtonComponent } from '../v-button/button.component';

export type VDialogCloseResult = 'confirmed' | 'closed' | 'cancelled';

export interface DialogData {
    title: string;
    body: string;
    buttons: {
        confirm: string;
        cancel: string;
        cancelIcon: string;
        confirmIcon: string;
        confirmType:
            | 'primary'
            | 'primary-hb'
            | 'default'
            | 'default-raised'
            | 'danger'
            | 'disabled';
        cancelType:
            | 'primary'
            | 'primary-hb'
            | 'default'
            | 'default-raised'
            | 'danger'
            | 'disabled';
    };
    titleStyle: any;
}

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
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
        VButtonComponent
    ],
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData
    ) {}

    confirm() {
        this.dialogRef.close('confirmed');
    }

    close() {
        this.dialogRef.close('closed');
    }

    cancel() {
        this.dialogRef.close('cancelled');
    }
}
