import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    ViewEncapsulation,
    forwardRef,
    SimpleChanges,
    OnChanges,
    ChangeDetectorRef,
    Output,
    EventEmitter,
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
import { CustomErrorstatematcherComponent } from '../../../ui-elements/input/custom-errorstatematcher/custom-errorstatematcher.component';

@Component({
    selector: 'v-text-box',
    templateUrl: './text-box.component.html',
    styleUrls: ['./text-box.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true, // Thêm dòng này để khai báo là standalone component
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VTextBoxComponent),
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

            ]
})
export class VTextBoxComponent implements ControlValueAccessor, OnChanges {
    value: any;
    @Input() label: string;
    @Input() min: number;
    @Input() max: number;
    @Input() placeholder: string;
    @Input() inputType: 'text' | 'password' | 'email' | 'number' = 'text';
    @Input() message: string;
    @Input() required: boolean = false;
    @Input() control: FormControl;
    @Input() disabled: boolean = false;
    @Input() displayType: 'row' | 'column' | 'row-full' = 'column';
    @Input() ngModelValue: any;
    @Input() hasHint: boolean = false;
    @Input() hasError: boolean = false;


    @Output() touched: EventEmitter<void> = new EventEmitter<void>();
    @Output() onEnter: EventEmitter<void> = new EventEmitter<void>();
    constructor(private cdr: ChangeDetectorRef) {}

    onChange: (value: any) => void;
    onTouched: any = () => {};
    writeValue(value: any): void {
        this.value = value;
    }
    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
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
    markAsTouch(): void {
        this.touched.emit();
        this.onTouched();
    }

    onEnterEvent() {
        this.onEnter.emit();
    }
}
