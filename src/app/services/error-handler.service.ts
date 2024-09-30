import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse): void {
    const router = this.injector.get(Router);

    console.error('An error occurred:', error);

    if (error instanceof HttpErrorResponse) {
      // Server or connection error happened
      if (!navigator.onLine) {
        // Handle offline error
        console.log('No Internet Connection');
      } else {
        // Handle Http Error (error.status === 403, 404...)
        console.log(`${error.status} - ${error.message}`);
      }
    } else {
      // Handle Client Error (Angular Error, ReferenceError...)
      console.log(error);
    }

    // Optionally: Log error to an error logging service here

    // Navigate to error page
    router.navigate(['/error']);
  }
}