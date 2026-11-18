export interface Category {
  id: string;
  name: string;
  description: string;
}

export type CategoryInput = Omit<Category, "id">;
