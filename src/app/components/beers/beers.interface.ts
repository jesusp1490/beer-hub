export interface Ingredient {
  name: string;
  iconUrl: string;
}

export interface Beer {
  id: string;
  name: string;
  type: string;
  alcoholPercentage: number;
  description: string;
  imageUrl: string;
  ingredients: Ingredient[];
  brandId: string;
  countryId: string;
  averageRating: number;
   ratings: Record<string, number>; // Usa Record para una estructura de clave-valor
  favoriteUsers: Record<string, boolean>; // Usa Record para una estructura de clave-valor
}
