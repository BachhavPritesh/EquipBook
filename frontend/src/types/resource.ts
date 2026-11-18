export type ResourceStatus = "available" | "unavailable" | "maintenance";

export interface Resource {
  id: string;
  assetTag: string;
  name: string;
  description: string;
  categoryId: string;
  location: string;
  image: string;
  totalQuantity: number;
  availableQuantity: number;
  status: ResourceStatus;
  instructions: string;
  requirements: string[];
  createdAt: string;
}

export interface ResourceFormValues {
  name: string;
  description: string;
  categoryId: string;
  location: string;
  image: string;
  totalQuantity: number;
  availableQuantity: number;
  status: ResourceStatus;
  instructions: string;
  requirements: string;
}

export interface ResourceInput {
  name: string;
  description: string;
  categoryId: string;
  location: string;
  image: string;
  totalQuantity: number;
  availableQuantity: number;
  status: ResourceStatus;
  instructions: string;
  requirements: string[];
}
