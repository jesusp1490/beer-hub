import { Timestamp } from '@angular/fire/firestore';

export interface Ingredient {
  name: string;
  ingImageUrl: string;
}

export interface Beer {
  id: string;
  name: string;
  brand: string;
  beerType: string;
  ABV: number;
  IBU: number;
  description: string;
  beerImageUrl: string;
  beerLabelUrl: string;
  ingredients: Ingredient[];
  brandId: string;
  countryId: string;
  averageRating?: number;
  numberOfRatings?: number;
  favoriteUsers?: { [userId: string]: boolean };
  rating?: { [userId: string]: number };
  addedDate?: string;
  web: string;
}

export interface RatedBeer extends Omit<Beer, 'rating'> {
  rating: number;
  ratedAt: Timestamp;
}

