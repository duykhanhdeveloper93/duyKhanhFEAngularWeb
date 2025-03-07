import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleFormComponent } from '../form-article/article-form.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'create-article',
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.scss'],
  standalone: true,
  imports: [
          MatCardModule,
    ArticleFormComponent]
    
})
export class CreateArticleComponent implements OnInit {

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
