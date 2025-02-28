import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    ViewEncapsulation,
    forwardRef,
    ChangeDetectorRef,
    Output,
    EventEmitter,
} from '@angular/core';
import {
    NG_VALUE_ACCESSOR,
    FormControl,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'v-text-only',
    templateUrl: './v-text-only.component.html',
    styleUrls: ['./v-text-only.component.scss'],
    standalone: true, // Thêm dòng này để khai báo là standalone component
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VTextOnlyComponent),
            multi: true,
        },
    ],
    imports: [
        MatCardModule,
        CommonModule,
        ReactiveFormsModule,
        MatCardModule
        ]
})
export class VTextOnlyComponent  {
    value: any;
    @Input() label: string;
    @Input() valueText: string;
    @Input() disabled: boolean = false;
    @Input() displayType: 'row' | 'column' = 'column';
    @Input() inputType: 'text' | 'password' | 'email' | 'number' = 'text';
    constructor(private cdr: ChangeDetectorRef) {}

    
    writeValue(value: any): void {
        this.value = value;
    }

    getDisplayType() {
        return `input-${this.displayType}`;
    }

}
