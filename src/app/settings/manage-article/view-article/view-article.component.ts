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
import { environment } from '../../../../environments/environment';
import { SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'view-article',
    templateUrl: './view-article.component.html',
    styleUrls: ['./view-article.component.scss'],
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
        RouterLink, RouterOutlet, 
        MatCardModule, 
        MatButtonModule, 
        RouterLinkActive,
        VButtonComponent,
        VContentEditorComponent ,
        QuillModule

        ]
    // encapsulation: ViewEncapsulation.None,
})
export class ViewArtileComponent implements AfterViewInit, OnInit {
    id: number;
    sites: any;
    departments: any;
    roleSites: PeriodicElement[] = [];
   
    myForm: FormGroup;
    step: number;
    submitted = false;

   
    currentArticle: any;
    content: string;

    is_show_image_title = false;
   
    selectedFeatures: any[]                  
    contentTemp: string = `<!DOCTYPE html>
            <html>
                <body>
                    <iframe width="420" height="345" src="https://www.youtube.com/embed/tgbNymZ7vqY">
                    </iframe>
                </body>
            </html>`;
    
    title: string;
    image_title: string;

    get f(): { [key: string]: AbstractControl } {
        return this.myForm.controls;
    }


    elementFormControl(elementName: string): FormControl {
        return this.myForm.get(elementName) as FormControl;
    }
   
    formInit() {
        
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


    ngOnInit(): void {
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        this.articleService.findById(this.id).subscribe({
            next: (res) => {
                if (res.status) {
                    this.contentTemp = res.data.content;
                    this.contentTemp = this.articleService.processImagePaths(this.contentTemp);
                    this.title = res.data.title;
                    this.image_title = res.data.image_title_path;
                    if(this.image_title === null || this.image_title === '') {
                        this.is_show_image_title = false;
                    } else {
                        this.is_show_image_title = true;
                    }
                    this.image_title = '<img src="' +  this.image_title + '" >';
                    this.image_title = this.articleService.processImagePaths(this.image_title);
                }
            },
            error: (err) => {

            }
        });
       
    }


    ngAfterViewInit() {
        
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
