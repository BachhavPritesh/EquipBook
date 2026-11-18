import { apiRequest } from "@/lib/api-client";
import type { Resource, ResourceInput } from "@/types/resource";

export async function listResources(): Promise<Resource[]> {
  const data = await apiRequest<{
    count: number;
    resources: Resource[];
  }>("/resources");
  return data.resources;
}

export async function createResource(
  input: ResourceInput,
): Promise<Resource> {
  const data = await apiRequest<{ resource: Resource }>("/resources", {
    method: "POST",
    body: input,
  });
  return data.resource;
}

export async function updateResource(
  resourceId: string,
  input: ResourceInput,
): Promise<Resource> {
  const data = await apiRequest<{ resource: Resource }>(
    `/resources/${resourceId}`,
    { method: "PUT", body: input },
  );
  return data.resource;
}

export async function deleteResource(resourceId: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/resources/${resourceId}`, {
    method: "DELETE",
  });
}
