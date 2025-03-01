import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserFormComponent } from '../form-user/user-form.component';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
  standalone: true,
  imports: [
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
