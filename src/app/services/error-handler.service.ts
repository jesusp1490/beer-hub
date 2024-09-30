import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse): void {
    const router = this.injector.get(Router);
    const ngZone = this.injector.get(NgZone);

    console.error('An error occurred:', error);

    if (error instanceof HttpErrorResponse) {
 
      if (!navigator.onLine) {

        console.log('No Internet Connection');
      } else {
       
        console.log(`${error.status} - ${error.message}`);
      }
    } else {
      
      console.log(error);
    }

    ngZone.run(() => {
      router.navigate(['/error']);
    });
  }
}