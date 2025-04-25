import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    ViewEncapsulation,
    forwardRef,
    ChangeDetectorRef,
} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'v-image',
    templateUrl: './v-image.component.html',
    styleUrls: ['./v-image.component.scss'],
    standalone: true, // Khai báo là standalone component
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VImageComponent),
            multi: true,
        },
    ],
    imports: [
        MatCardModule,
        CommonModule,
        ReactiveFormsModule
    ]
})
export class VImageComponent implements ControlValueAccessor{
    @Input() src: string;
    @Input() alt: string = 'image';
    @Input() width: string = '60';
    @Input() height: string;
    @Input() class: string = 'rounded-circle';
    @Input() label: string;
    @Input() disabled: boolean = false;
    @Input() displayType: 'row' | 'column' = 'column';
    @Input() required: boolean = false;
     @Input() control: FormControl;

    // Thuộc tính src sẽ được điều khiển thông qua ControlValueAccessor
    imageSrc: string = '';

    // Các hàm callback cho ControlValueAccessor
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};



    constructor(private cdr: ChangeDetectorRef) {}
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.cdr.markForCheck();
    }

    writeValue(value: any): void {
        this.imageSrc = value || '';
        this.cdr.markForCheck();
    }

    getDisplayType() {
        return `image-${this.displayType}`;
    }
}
