import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'v-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    standalone:true,
    imports: [
        MatButton,CommonModule 
    ]
})
export class VButtonComponent {
    @Input() type:
        | 'primary'
        | 'primary-hb'
        | 'default'
        | 'default-raised'
        | 'danger'
        | 'raised'
        | 'disabled' = 'default';
    @Input() moreCustomClasses: string = '';

    @Input() disabled: boolean = false;

    // ms
    @Input() throttleTime = 1000;

    @Output() cancelEvent = new EventEmitter<boolean>();

    @Output() clickEvent = new EventEmitter<boolean>();

    constructor() {}

    onCancel() {
        this.cancelEvent.emit(true);
    }

    canClick() {
        return this.type !== 'disabled';
    }

    onClick() {
        if (!this.canClick()) {
            return;
        }
        this.clickEvent.emit(true);
    }

    custom() {
        if (this.moreCustomClasses) {
            return `${this.type} ${this.moreCustomClasses}`;
        }
        return this.type;
    }
}
