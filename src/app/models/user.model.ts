import { Timestamp } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  photoURL: string;
  country: string;
  dob: Timestamp | null;
}

export interface FavoriteBeer {
  id: string;
  name: string;
  beerLabelUrl: string;
  beerImageUrl: string;
}

export interface RatedBeer {
  id: string;
  name: string;
  beerLabelUrl: string;
  rating: number;
  ratedAt: Timestamp;
}

