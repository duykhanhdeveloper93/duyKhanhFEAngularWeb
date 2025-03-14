import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CustomErrorstatematcherComponent } from '../../../ui-elements/input/custom-errorstatematcher/custom-errorstatematcher.component';

@Component({
    selector: 'v-icon-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true, // Thêm dòng này để khai báo là standalone component
         imports: [
                    MatCardModule,
                    CommonModule,
                    ReactiveFormsModule,
                    MatFormFieldModule, 
                    MatInputModule, 
                    MatIconModule, 
                    MatButtonModule, 
                    CustomErrorstatematcherComponent,

                    ]
})
export class VIconButtonComponent {
    @Input() color: 'primary' | 'accent' | 'warn' | '' = '';
    @Input() iconStyle: { [klass: string]: any };
    @Input() disabled: boolean = false;
    @Output() clickEvent = new EventEmitter<boolean>();

    onClick() {
        if (!this.canClick()) {
            return;
        }
        this.clickEvent.emit(true);
    }

    canClick() {
        return this.disabled !== true;
    }
}
