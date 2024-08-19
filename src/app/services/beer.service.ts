import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  private apiUrl = 'https://your-firebase-function-url/api';

  constructor(private http: HttpClient) { }

  getCountries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/countries`);
  }

  getBrands(countryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/countries/${countryId}/brands`);
  }

  getBeers(brandId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/brands/${brandId}/beers`);
  }

  getBeer(beerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/beers/${beerId}`);
  }
}
