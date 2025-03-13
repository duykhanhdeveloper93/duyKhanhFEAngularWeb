import {
    Component,
    Input,
    OnInit,
    AfterViewInit,
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
    TOASTR_TITLE,
} from '../../../_common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

import { NgxSpinnerService } from 'ngx-spinner';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { VTextOnlyComponent } from '../../../common/my-template/v-text-only/v-text-only.component';
import { ToastrService } from 'ngx-toastr';
import {
    getErrorMessageForControl,
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
import { QuillModule } from 'ngx-quill';
import { VContentEditorComponent } from '../../../common/my-template/content-editor/v-content-editor.component';
import { saveAs } from 'file-saver'
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

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
        VButtonComponent,
        VContentEditorComponent ,
        QuillModule

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

    selectedFile: File | null = null;

    tempImages: { file: File; tempImageUrl: string }[] = [];// Biến lưu tạm cái media được upload vào quill

    errorMessage: any = {
        title: '',
        content: ''
       
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
                        Validators.maxLength(4000)]]

           
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




    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            console.log('File selected:', file.name);
        }
    }

    onUpload(): void {
        if (!this.selectedFile) {
            this.toastr.error('Vui lòng chọn một file để upload', 'Lỗi');
            return;
        }

        const id = this.id.toString(); // Lấy ID bài viết hiện tại
        this.uploadFile(id, this.selectedFile).subscribe({
            next: (res) => {
                this.toastr.success('File uploaded successfully', 'Thành công');
            },
            error: (err) => {
                this.toastr.error('File upload failed', 'Lỗi');
            },
        });
    }

    whenUpdloadMedia(event: any) {
        
        this.tempImages.push(event);
    }

    uploadFile(id: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
    
        return this.articleService.uploadFile(id, formData).pipe(
            tap((event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const progress = Math.round((100 * event.loaded) / event.total!);
                    console.log(`File upload progress: ${progress}%`);
                } else if (event instanceof HttpResponse) {
                    console.log('File uploaded successfully', event.body);
                }
            }),
            catchError((error) => {
                console.error('File upload failed', error);
                return throwError(() => new Error('File upload failed'));
            })
        );
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
        bodyData.status = 1;
        this.spinnerService.show();

       
    
    
        this.articleService.createArticle(bodyData).subscribe({
            next: async (res) => {
                if (res.status === true) {
                    this.spinnerService.hide();
                    this.toastr.success(res.message, TOASTR_TITLE.SUCCESS);

                    // // Upload ảnh trong content
                    // const uploadPromises = this.tempImages.map((image) => {
                    //     const formData = new FormData();
                    //     formData.append('file', image.file);
                
                    //     // Gọi API upload ảnh
                    //     return this.articleService.uploadImage(formData).toPromise();
                    // });
    
                    // Kiểm tra nếu có file được chọn thì tiến hành upload
                    if (this.selectedFile) {
                        this.uploadFile(res.data.id, this.selectedFile).subscribe({
                            next: () => {
                                this.toastr.success('File đã được upload thành công', 'Thành công');
                            },
                            error: () => {
                                this.toastr.error('Không thể upload file', 'Lỗi');
                            },
                        });
                    }
    
                    this.cancel(); // Điều hướng sau khi hoàn tất
                } else {
                    this.toastr.error(res.message, TOASTR_TITLE.ERROR);
                    this.spinnerService.hide();
                }
            },
            error: (err) => {
                this.toastr.error('Lỗi khi tạo bài viết', 'Thông báo lỗi');
                this.spinnerService.hide();
            },
        });
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
                            controlName === 'title' &&
                            errorKey === 'required'
                        ) {
                            if (textRequired.length === 0) {
                                textRequired += ' Tiêu đề';
                            } else {
                                textRequired += ', Tiêu đề';
                            }
                        }
                        if (
                            controlName === 'title' &&
                            errorKey === 'maxlength'
                        ) {
                            if (textMaxLength.length === 0) {
                                textMaxLength += ' Tiêu đề';
                            } else {
                                textMaxLength += ', Tiêu đề';
                            }
                        }
                        if (
                            controlName === 'content' &&
                            errorKey === 'required'
                        ) {
                            if (textRequired.length === 0) {
                                textRequired += ' Nội dung';
                            } else {
                                textRequired += ', Nội dung';
                            }
                        }
                        if (
                            controlName === 'content' &&
                            errorKey === 'maxlength'
                        ) {
                            if (textMaxLength.length === 0) {
                                textMaxLength += ' Nội dung';
                            } else {
                                textMaxLength += ', Nội dung';
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
