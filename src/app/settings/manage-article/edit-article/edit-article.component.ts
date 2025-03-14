import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleFormComponent } from '../form-article/article-form.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'edit-article',
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.scss'],
  standalone: true,
  imports: [
          MatCardModule,
    ArticleFormComponent]
    
})
export class EditArticleComponent implements OnInit {

  sites: any;
  departments: any;
  articles: any;


  step: number;
  submitted = false;

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {    
  }


}
