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
import { VImageComponent } from '../../../common/my-template/image/v-image.component';

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
        QuillModule,
        VImageComponent

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

    tempImages: { fileName: string; base64Value: string }[] = [];// Biến lưu tạm cái media được upload vào quill

    mapMedia: { [key: string]: string } = {};

    errorMessage: any = {
        title: '',
        content: ''
       
    };
    selectedFeatures: any[]
    contentTemp: string = "";
    srcImageTitle: string = "images/admin.png";
    is_show_image_title = false;
    image_title: string;

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
                        [Validators.required]]

           
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
        if (this.id && this.id > 0) {
            this.articleService.findById(this.id).subscribe({
                next: res => {
                    if (res.status == true) {
                        this.dataReturn = res.data;

                        this.myForm.patchValue({
                            title: this.dataReturn.title,
                            content:  this.articleService.processImagePaths(this.dataReturn.content),
                           
                        });

                        this.image_title = res.data.image_title_path;
                        if(this.image_title === null || this.image_title === '') {
                            this.is_show_image_title = false;
                        } else {
                            this.is_show_image_title = true;
                        }
                       this.image_title = '<img src="' + this.image_title + '" width="100" >';
                        this.image_title = this.articleService.processImagePaths(this.image_title);
                    }
                },
                error: err => {},
            });
        } else {
           
        }
       
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

    whenUploadMedia(transferEvent: any) {
        
      
        
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

    replaceBase64WithPlaceholders(content: string): string {
        this.tempImages = [];
        
        // Tìm tất cả các chuỗi base64 trong chuỗi HTML
        const base64Regex = /data:\s*image\/\w+;\s*base64,\s*(.*?)\s*"/g;
        let match;
        let updatedContent = content;
      
        // Lặp qua từng chuỗi base64 và thay thế
        while ((match = base64Regex.exec(content)) !== null) {
          const base64Value = match[1];
      
          // Tạo tên tệp ngẫu nhiên
          const timestamp = new Date().getTime();
          const randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          let fileName = 'image_';
          for (let i = 0; i < 8; i++) {
            fileName += randomChars[Math.floor(Math.random() * randomChars.length)];
          }
          fileName += `_${timestamp}.png`;
      
          // Lưu trữ thông tin về tệp
          this.tempImages.push({ fileName, base64Value });
      
          // Thay thế chuỗi base64 bằng tên tệp mới
          updatedContent = updatedContent.replace(match[0], `<img src="${fileName}">`);
        }
        updatedContent = updatedContent.replace('<img src="<img src=','<img src=')
        updatedContent = updatedContent.replace('">>",>','">');
        return updatedContent;
      }
      



    updateContentWithUrls(content: string, file: File): Promise<string> {
        return new Promise(async (resolve, reject) => {
          try {
            // Chuyển file sang Base64
            const base64 = await this.fileToBase64(file);
            const fileName = file.name;
      
            // Gửi file Base64 tới server
            this.uploadBase64File(base64, fileName).subscribe({
              next: (response) => {
                if (response.status) {
                  const url = response.filePath; // URL trả về từ server
                  // Thay thế placeholder bằng URL
                  const updatedContent = content.replace('{{image}}', url);
                  resolve(updatedContent); // Trả về content đã cập nhật
                } else {
                  reject('Upload thất bại: ' + response.message);
                }
              },
              error: (error) => {
                reject('Lỗi khi upload file: ' + error);
              },
            });
          } catch (error) {
            reject('Lỗi khi chuyển file sang Base64: ' + error);
          }
        });
      }


    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }
      
    // Hàm upload Base64 (kế thừa từ ArticleService)
    private uploadBase64File(base64: string, fileName: string) {
    return this.articleService.uploadBase64File(base64, fileName);
    }

    addArticle(myForm: FormGroup) {
        if (myForm.invalid) {
            this.getErrorForm();
            return;
        }
    
        const bodyData = this.myForm.value;
        bodyData.status = 1;

        const updatedContent = this.replaceBase64WithPlaceholders(bodyData.content);
        bodyData.content = updatedContent;


        this.spinnerService.show();

       
    
    
        this.articleService.createArticle(bodyData).subscribe({
            next: async (res) => {
                if (res.status === true) {
                    this.spinnerService.hide();
                    this.toastr.success(res.message, TOASTR_TITLE.SUCCESS);

                    // Kiểm tra nếu có file được chọn thì tiến hành upload
                    if (this.selectedFile) {
                        this.uploadFile(res.data.id, this.selectedFile).subscribe({
                            next: () => {
                               console.log("đẩy ảnh đại diện bài báo thành công")
                            },
                            error: () => {
                                console.log("đẩy ảnh đại diện bài báo thất bại")
                            },
                        });
                    }
                    
                    
                    const uploadPromises = this.tempImages.map(async (element1) => {
                        return await this.articleService.uploadBase64File(element1.base64Value, element1.fileName).toPromise();
                    });
                    
                    // Chờ cho tất cả các Promise hoàn thành
                    await Promise.all(uploadPromises);


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

   

    editArticle(myForm: FormGroup) {
        const bodyData = this.myForm.value;
        const updatedContent = this.replaceBase64WithPlaceholders(bodyData.content);
        bodyData.content = updatedContent;
        this.articleService.createArticle(bodyData).subscribe({
            next: async (res) => {
                if (res.status === true) {
                    this.spinnerService.hide();
                    this.toastr.success(res.message, TOASTR_TITLE.SUCCESS);

                    // Kiểm tra nếu có file được chọn thì tiến hành upload
                    if (this.selectedFile) {
                        this.uploadFile(res.data.id, this.selectedFile).subscribe({
                            next: () => {
                               console.log("đẩy ảnh đại diện bài báo thành công")
                            },
                            error: () => {
                                console.log("đẩy ảnh đại diện bài báo thất bại")
                            },
                        });
                    }
                    
                    
                    const uploadPromises = this.tempImages.map(async (element1) => {
                        return await this.articleService.uploadBase64File(element1.base64Value, element1.fileName).toPromise();
                    });
                    
                    // Chờ cho tất cả các Promise hoàn thành
                    await Promise.all(uploadPromises);


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

    
    cancel() {
        this.router.navigate(['/settings/manage-article']);
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
