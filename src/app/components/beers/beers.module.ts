import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BeersComponent } from './beers.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [BeersComponent],
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule.forChild([
      { path: '', component: BeersComponent }
    ])
  ],
  exports: [BeersComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class BeersModule { }
