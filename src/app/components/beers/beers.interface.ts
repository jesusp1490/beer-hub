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
  ingredients: Ingredient[];
  brandId: string;
  countryId: string;
  averageRating: number;
  ratings: Record<string, number>;
  favoriteUsers: Record<string, boolean>;
}
