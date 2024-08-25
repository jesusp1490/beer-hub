export interface Ingredient {
  name: string;
  iconUrl: string;
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
  ratings: Record<string, number>; // Usa Record para una estructura de clave-valor
  favoriteUsers: Record<string, boolean>; // Usa Record para una estructura de clave-valor
}
