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
} from '@angular/forms';

@Component({
    selector: 'v-pw-box',
    templateUrl: './pw-box.component.html',
    styleUrls: ['./pw-box.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VPwBoxComponent),
            multi: true,
        },
    ],
})
export class VPwBoxComponent implements ControlValueAccessor, OnChanges {
    @Input() label: string;
    @Input() min: number;
    @Input() max: number;
    @Input() placeholder: string;
    @Input() message: string;
    @Input() required: boolean = false;
    @Input() control: FormControl;
    @Input() disabled: boolean = false;
    @Input() displayType: 'row' | 'column' | 'row-full' = 'column';
    @Input() ngModelValue: any;
    @Input() hasHint: boolean = false;
    @Input() hasError: boolean = false;

    value: string;
    hide: boolean = true;

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
