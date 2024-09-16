export interface Ingredient {
  name: string;
  ingImageUrl: string;
}

export interface Beer {
  id: string;
  name: string;
  beerType: string;
  ABV: number;
  description: string;
  beerImageUrl: string;
  ingredients?: { name: string; ingImageUrl: string }[];
  brandId: string;
  countryId: string;
  averageRating?: number;
  favoriteUsers?: { [userId: string]: boolean };
  rating: Record<string, number>;
  addedDate?: string;
}

