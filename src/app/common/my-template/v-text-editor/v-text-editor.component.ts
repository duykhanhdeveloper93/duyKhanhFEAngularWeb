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
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormControl,
} from '@angular/forms';
import { Editor, Toolbar } from 'ngx-editor';
import { EditorChangeContent, EditorChangeSelection, QuillModules } from 'ngx-quill';
import Quill from 'quill';

@Component({
    selector: 'v-text-editor',
    templateUrl: './v-text-editor.component.html',
    styleUrls: ['./v-text-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VTextEditorComponent),
            multi: true,
        },
    ],
})
export class VTextEditorComponent
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

    constructor(private cdr: ChangeDetectorRef) {}
    blurred: boolean = false;
    focused: boolean = false;
    editor: Editor;
    html: '';
    
    toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        [{ header: 1 }, { header: 2 }], // custom button values
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
        [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
        [{ direction: 'rtl' }], // text direction
        [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }], // dropdown with defaults from theme
        [{ font: [] }],
        [{ align: [] }],
        ['clean'], // remove formatting button
    ];

    modules: QuillModules = {
        toolbar: this.toolbarOptions,
    };
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
