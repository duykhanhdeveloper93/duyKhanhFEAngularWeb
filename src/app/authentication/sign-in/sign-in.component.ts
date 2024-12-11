import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { AuthService } from '../../_service/auth.service';
import { TokenStorageService } from '../../_service/token-storage.service';
import { CookieService } from 'ngx-cookie-service';
import { CookieEnum } from '../../_common/consts';

@Component({
    selector: 'app-sign-in',
    standalone: true,
    imports: [RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, ReactiveFormsModule, NgIf],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit {

    // isToggled
    isToggled = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        public themeService: CustomizerSettingsService,
        private authService: AuthService,
        private tokenStorage: TokenStorageService,
        private activatedRoute: ActivatedRoute,
        private cookieService : CookieService
    ) {
        this.authForm = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        });
        this.themeService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
    }
    ngOnInit(): void {
        if (this.tokenStorage.getAccessToken()) {
            this.router.navigate(['/to-do-list']);
        } 
    }

    // Password Hide
    hide = true;

    // Form
    authForm: FormGroup;
    onSubmit() {
        if (this.authForm.valid) {
            this.authService
            .login({
                username: this.authForm.value.username,
                password: this.authForm.value.password
               
            })
            .subscribe({
                next: (res) => {
                    if (res.statusCode == 200) {
                        this.tokenStorage.setCookies(res.data);
                        this.tokenStorage.setKeepLoginSessionStatus(
                            true
                        );
                        console.log(res.data);
                        this.activatedRoute.queryParams.subscribe(async () => {
                            const returnUrl = '/to-do-list';
                            this.router.navigate([returnUrl]);
                            
                        });

                        console.log("get ACCESS_TOKEN_KEY "+this.cookieService.get(CookieEnum.ACCESS_TOKEN_KEY));
                    }
                },
                error: (err) => {
                }
            });
            
        } else {
            console.log('Form is invalid. Please check the fields.');
        }
    }

}