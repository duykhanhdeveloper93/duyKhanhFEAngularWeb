import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, Subscription, debounceTime, map, switchMap } from 'rxjs';

export type VOption = {
    index?: number;
    title: string | number;
    value: string | number;
};

export type VSelectMode = 'single' | 'mutiple';

@Component({
    selector: 'v-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        CommonModule,
        MatChipsModule,
    ],
})
export class SelectComponent implements OnInit, OnDestroy {
    private searchSubject = new Subject<string | undefined>();

    private searchSubscription: Subscription;

    protected items: VOption[] = [];

    protected zindexs: number[] = [];

    protected focus: boolean = false;

    @Input() _options: VOption[] = [];

    @Input() name: string = '';

    @Input() mode: VSelectMode = 'single';

    constructor(private elementRef: ElementRef) {}

    ngOnInit(): void {
        this.searchSubscription = this.searchSubject
            .pipe(debounceTime(300), (keyword) => {
                return keyword;
            })
            .subscribe((value) => {
                console.log(value);
            });
    }

    ngOnDestroy(): void {
        this.searchSubscription.unsubscribe();
    }

    //#region utils
    isModeSingle() {
        return this.mode === 'single';
    }

    isModeMultiple() {
        return this.mode === 'mutiple';
    }
    //#endregion

    //#region event
    onClick($event: any) {
        this.focus = true;
    }

    onKeyupChange($event: any) {
        const keyword = $event.target.value as string;
        this.searchSubject.next(keyword.toLocaleLowerCase().trim());
    }

    selectItem(index: number) {
        if (this.isModeMultiple()) {
            this.selectMultipleItem(index);
        }
        if (this.isModeSingle()) {
            this.selectSingleItem(index);
        }
    }

    selectSingleItem(index: number) {
        if (!this.items[index]) {
            this.items = [this._options[index]];
        } else {
            this.items.splice(index, 1);
        }
        if (!this.zindexs.includes(index)) {
            this.zindexs = [index];
        } else {
            this.zindexs.splice(index, 1);
        }
    }

    selectMultipleItem(index: number) {
        if (!this.items[index]) {
            this.items = [...this.items, this._options[index]];
        } else {
            this.items.splice(index, 1);
        }

        if (!this.zindexs.includes(index)) {
            this.zindexs = [...this.zindexs, index];
        } else {
            this.zindexs.splice(index, 1);
        }
    }

    remove(zindex: number): void {
        if (zindex >= 0) {
            this.items.splice(zindex, 1);
            this.zindexs.splice(zindex, 1);
        }
    }

    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        if (this.elementRef.nativeElement.contains(event.target)) {
            this.focus = true;
        } else {
            this.focus = false;
        }
    }

    //#region
}
