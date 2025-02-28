import {
    Component,
    Input,
    OnInit,
    ViewChild,
    AfterViewInit,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    Validators,
    FormBuilder,
    AbstractControl,
    ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


import {
    PAGE_SIZE,
    ResponseCodeEnum,
    TOASTR_MSG,
    TOASTR_TITLE,
    pageSizeOptions,
    regexs,
} from '../../../_common';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

import { NgxSpinnerService } from 'ngx-spinner';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { VTextOnlyComponent } from '../../../common/my-template/v-text-only/v-text-only.component';


@Component({
    selector: 'user-form',
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss'],
    standalone: true, // Thêm dòng này để khai báo là standalone component
    imports: [
        MatCardModule,
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        VTextOnlyComponent
        ]
    // encapsulation: ViewEncapsulation.None,
})
export class UserFormComponent implements AfterViewInit, OnInit {
    @Input() action: string;

    id: number;
    sites: any;
    departments: any;
    roleSites: PeriodicElement[] = [];
   
    myForm: FormGroup;
    step: number;
    submitted = false;

   

    show_button_delete: boolean = false;
    selection = new SelectionModel<PeriodicElement>(true, []);
    selectedItems: PeriodicElement[] = [];
    currentUser: any;
    isAdmin: boolean = false;
    siteIdCurrent: number = 1;

    totalRole: number = 0;

    attactmentsArr: any = [];
    isShowLimited: boolean = false;
    isShowHistory: boolean = false;
    dataReturn: any;
    selectedNumber = 1;

    errorMessages: any = {};

    selectedFeatures: any[]

    get f(): { [key: string]: AbstractControl } {
        return this.myForm.controls;
    }


    elementFormControl(elementName: string): FormControl {
        return this.myForm.get(elementName) as FormControl;
    }
   
    formInit() {
        this.myForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.maxLength(255)]]
        });
    }

    constructor(
        private formBuilder: FormBuilder,
        private toastr: ToastrService,
        private router: Router,
        private _liveAnnouncer: LiveAnnouncer,
        private route: ActivatedRoute,
        public dialog: MatDialog,
        private spinnerService: NgxSpinnerService,
        private paginatorIntl: MatPaginatorIntl
    ) {
       
        this.formInit();
    }

    

    ngOnInit(): void {
        this.id = Number(this.route.snapshot.paramMap.get('id'));
       
    }

    @ViewChild(MatPaginator) paginator: MatPaginator;

    ngAfterViewInit() {
        
    }




    saveOrUpdate() {
        this.submitted = true;
        if (this.action == 'save') {
            this.addUser(this.myForm);
        } else {
            this.editUser(this.myForm);
        }
    }

    addUser(myForm: FormGroup) {

    }

    editUser(myForm: FormGroup) {
       
    }

    
    cancel() {
        this.router.navigate(['/settings/manage-user']);
    }

}

export interface PeriodicElement {
    stt: number;
    roleId: number;
    name: string;
    desc: string;
    site: string;
    isSelected: boolean;
    isOld: boolean;
}
