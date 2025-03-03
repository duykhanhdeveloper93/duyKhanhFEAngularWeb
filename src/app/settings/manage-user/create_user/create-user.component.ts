import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserFormComponent } from '../form-user/user-form.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
  standalone: true,
  imports: [
          MatCardModule,
    UserFormComponent]
    
})
export class CreateUserComponent implements OnInit {

  sites: any;
  departments: any;
  users: any;


  step: number;
  submitted = false;

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {    
  }


}
