import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    ViewEncapsulation,
    forwardRef,
    SimpleChanges,
    OnChanges,
    ChangeDetectorRef,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
    ViewChild,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormControl,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Editor, Toolbar } from 'ngx-editor';
import { EditorChangeContent, EditorChangeSelection, QuillEditorComponent, QuillModule, QuillModules } from 'ngx-quill';
import { CustomErrorstatematcherComponent } from '../../../ui-elements/input/custom-errorstatematcher/custom-errorstatematcher.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'v-content-editor',
    templateUrl: './v-content-editor.component.html',
    styleUrls: ['./v-content-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true, // Thêm dòng này để khai báo là standalone component
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VContentEditorComponent),
            multi: true,
        },
    ],
     imports: [
                MatCardModule,
                CommonModule,
                ReactiveFormsModule,
                MatFormFieldModule, 
                MatInputModule, 
                MatIconModule, 
                MatButtonModule, 
                CustomErrorstatematcherComponent,
                MatCardModule,
                QuillModule
    
                ]
})
export class VContentEditorComponent
    implements ControlValueAccessor, OnChanges, OnInit, OnDestroy
{
    value: any;
    @Input() label: string;
    @Input() placeholder: string;
    @Input() message: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() control: FormControl;
    @Input() displayType: 'row' | 'column' = 'column';

    @Output() uploadFileFromQuill: EventEmitter<{ file: File; tempImageUrl: string }> = new EventEmitter<{ file: File; tempImageUrl: string }>();

       
    quill!: any;
    setEditorInstance(quill: any) {
        this.quill = quill;
        console.log('Quill instance:', this.quill);
    }


    constructor(
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer) {

    }
    blurred: boolean = false;
    focused: boolean = false;
    editor: Editor;
    html: '';


    
    toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }, { 'header': 4 }, { 'header': 5 }, { 'header': 6 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'size': ['small', 'normal', 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video', 'formula'],
        ['emoji']
      ];
      
    modules: QuillModules = {
        toolbar: {
            container: this.toolbarOptions,
            handlers: {
                image: () => this.selectLocalImage(),
            },
        },
    };

    selectLocalImage() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
    
        input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
                const reader = new FileReader();
    
                reader.onload = () => {
                    const range = this.quill.getSelection(); // Lấy vị trí con trỏ
                    this.quill.insertEmbed(range?.index || 0, 'image', reader.result);
                    const tempImageUrl = reader.result as string;
                    this.uploadFileFromQuill.emit({ file, tempImageUrl});

                    // Cập nhật giá trị của FormControl sau khi ảnh được thêm
                    const editorContent = this.quill.root.innerHTML;
                    this.control.setValue(editorContent);
                };
               
                reader.readAsDataURL(file);
            }
        };
    }

    onChange: (value: any) => void;
    onTouched: () => void;
    writeValue(value: any): void {
        this.value = value;
    }
    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
    ngOnChanges(changes: SimpleChanges): void {
        if ('disabled' in changes && this.control) {
            const change = changes['disabled'];
            if (this.control) {
                change.currentValue
                    ? this.control.disable()
                    : this.control.enable();
            }
            this.cdr.detectChanges();
        }
    }
    getDisplayType() {
        return `input-${this.displayType}`;
    }
    ngOnInit() {
        this.editor = new Editor();
    }
    ngOnDestroy(): void {
        this.editor.destroy();
    }


   
}
