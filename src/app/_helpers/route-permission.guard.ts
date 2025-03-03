import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from '@vscc/service/user.service';
import { get, isEmpty } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { TOASTR_MSG, TOASTR_TITLE } from '../_common';

@Injectable({ providedIn: 'root' })
export class RoutePermissionGuard implements CanActivate {
    constructor(
        private router: Router,
        private readonly userService: UserService,
        private readonly toastrService: ToastrService
    ) {}

    async canActivate(route: ActivatedRouteSnapshot) {
        const currentUser = await this.userService.getCurrentUserAsync();
        const pers = get(route, 'data.permissions');
        if (!pers || isEmpty(pers)) {
            return true;
        }
        const isExistedPers = this.userService.acquirePer(...pers);
        if (isExistedPers || currentUser.isSys) {
            return true;
        } else {
            this.toastrService.error(TOASTR_MSG.NO_ACCESS, TOASTR_TITLE.NOTI);
            this.router.navigate(['/'], {});
            return false;
        }
    }
}
