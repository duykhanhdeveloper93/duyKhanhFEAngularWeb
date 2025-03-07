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
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';


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
import { ToastrService } from 'ngx-toastr';
import {
    getErrorMessageForControl,
    getFormControlErrorMessages,
} from '../../../_helpers/helpers';
import { VTextBoxComponent } from '../../../common/my-template/text-box/text-box.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomErrorstatematcherComponent } from '../../../ui-elements/input/custom-errorstatematcher/custom-errorstatematcher.component';
import { CustomizerSettingsService } from '../../../customizer-settings/customizer-settings.service';
import { VButtonComponent } from '../../../common/my-template/v-button/button.component';
import { ArticleService } from '../../../_service/article.service';



@Component({
    selector: 'article-form',
    templateUrl: './article-form.component.html',
    styleUrls: ['./article-form.component.scss'],
    standalone: true, // Thêm dòng này để khai báo là standalone component
    imports: [
        MatCardModule,
        MatFormFieldModule, 
        MatInputModule, 
        MatIconModule, 
        MatButtonModule, 
        CustomErrorstatematcherComponent,
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        VTextOnlyComponent,
        RouterLink,
        VTextBoxComponent,
        RouterLink, RouterOutlet, MatCardModule, MatButtonModule, RouterLinkActive,
        VButtonComponent
        ]
    // encapsulation: ViewEncapsulation.None,
})
export class ArticleFormComponent implements AfterViewInit, OnInit {
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
    currentArticle: any;
    isAdmin: boolean = false;
    siteIdCurrent: number = 1;

    totalRole: number = 0;

    attactmentsArr: any = [];
    isShowLimited: boolean = false;
    isShowHistory: boolean = false;
    dataReturn: any;
    selectedNumber = 1;

    errorMessage: any = {
        firstName: ''
       
    };

    selectedFeatures: any[]

    get f(): { [key: string]: AbstractControl } {
        return this.myForm.controls;
    }


    elementFormControl(elementName: string): FormControl {
        return this.myForm.get(elementName) as FormControl;
    }
   
    formInit() {
        this.myForm = this.formBuilder.group({
            title: ['', 
                        [Validators.required, 
                        Validators.maxLength(255)]],
            content: ['', 
                        [Validators.required, 
                        Validators.maxLength(4000)]],
        });
    }

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private articleService: ArticleService,
        private _liveAnnouncer: LiveAnnouncer,
        private route: ActivatedRoute,
        public dialog: MatDialog,
        private toastr: ToastrService,
        private spinnerService: NgxSpinnerService,
        private paginatorIntl: MatPaginatorIntl,
        public themeService: CustomizerSettingsService,
    ) {
       
        this.formInit();
    }

    onTouch(name: any) {
        const f = this.elementFormControl(name);

        if ((f.touched || f.dirty) && f.errors) {
            this.errorMessage[name] = getErrorMessageForControl(f);
        }
    }

    

    ngOnInit(): void {
        this.id = Number(this.route.snapshot.paramMap.get('id'));
       
    }



    ngAfterViewInit() {
        
    }




    saveOrUpdate() {
        this.submitted = true;
        if (this.action == 'save') {
            this.addArticle(this.myForm);
        } else {
            this.editArticle(this.myForm);
        }
    }

    addArticle(myForm: FormGroup) {
        if (myForm.invalid) {
            this.getErrorForm();
            return;
        }
        const bodyData = this.myForm.value;
        bodyData.status = true;
        this.spinnerService.show();
        this.articleService.createArticle(bodyData).subscribe({
            next: async (res) => {
                if (res.status === true) {
                   
                    this.spinnerService.hide();
                    this.toastr.success(res.message, TOASTR_TITLE.SUCCESS);
                    this.cancel();
                } else {
                    this.toastr.error(res.message, TOASTR_TITLE.ERROR);
                    this.spinnerService.hide();
                }
            },
            error: (err) => {
                this.toastr.error(
                    ` Lỗi`,
                    'Thông báo lỗi'
                );
            }
        })
       
    }

    getErrorForm() {
        if (this.myForm.invalid) {
            let textRequired: string = '';
            let textMaxLength: string = '';
            Object.keys(this.myForm.controls).forEach((controlName) => {
                const control = this.myForm.get(controlName);

                if (control!.invalid && control!.errors !== null) {
                    Object.keys(control!.errors).forEach((errorKey) => {
                        //====================================
                        if (
                            controlName === 'firstName' &&
                            errorKey === 'required'
                        ) {
                            if (textRequired.length === 0) {
                                textRequired += ' Tên người dùng';
                            } else {
                                textRequired += ', Tên người dùng';
                            }
                        }
                        if (
                            controlName === 'firstName' &&
                            errorKey === 'maxlength'
                        ) {
                            if (textMaxLength.length === 0) {
                                textMaxLength += ' Tên người dùng';
                            } else {
                                textMaxLength += ', Tên người dùng';
                            }
                        }
                        //====================================
 
                    });
                }
            });
            if (textRequired.length > 0) {
                this.toastr.error('Yêu cầu nhập:' + textRequired, 'Lỗi');
            }
            if (textMaxLength.length > 0) {
                this.toastr.error(
                    'Các trường bị quá số kí tự cho phép:' + textMaxLength,
                    'Lỗi'
                );
            }
        }
    }

    editArticle(myForm: FormGroup) {
       
    }

    
    cancel() {
        this.router.navigate(['/settings/manage-article']);
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
