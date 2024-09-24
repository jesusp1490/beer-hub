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
  ingredients: { name: string; ingImageUrl: string }[];
  brandId: string;
  countryId: string;
  averageRating?: number;
  favoriteUsers?: { [userId: string]: boolean };
  rating?: Record<string, number>;
  addedDate?: string;
  web: string;
}

