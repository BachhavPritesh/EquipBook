import { apiRequest } from "@/lib/api-client";
import type { Category, CategoryInput } from "@/types/category";

export async function listCategories(): Promise<Category[]> {
  const data = await apiRequest<{
    count: number;
    categories: Category[];
  }>("/categories");
  return data.categories;
}

export async function createCategory(
  input: CategoryInput,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>("/categories", {
    method: "POST",
    body: input,
  });
  return data.category;
}

export async function updateCategory(
  categoryId: string,
  input: CategoryInput,
): Promise<Category> {
  const data = await apiRequest<{ category: Category }>(
    `/categories/${categoryId}`,
    { method: "PUT", body: input },
  );
  return data.category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}
