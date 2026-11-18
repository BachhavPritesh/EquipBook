"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-provider";
import { RESOURCE_STATUSES, RESOURCE_STATUS_META } from "@/lib/constants";
import type { Resource } from "@/types/resource";
import {
  resourceSchema,
  type ResourceFormSchema,
} from "../utils/resource-schema";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80";

function getDefaults(resource?: Resource): ResourceFormSchema {
  if (resource) {
    return {
      name: resource.name,
      categoryId: resource.categoryId,
      description: resource.description,
      location: resource.location,
      image: resource.image,
      totalQuantity: resource.totalQuantity,
      availableQuantity: resource.availableQuantity,
      status: resource.status,
      instructions: resource.instructions,
      requirements: resource.requirements.join("\n"),
    };
  }

  return {
    name: "",
    categoryId: "",
    description: "",
    location: "",
    image: DEFAULT_IMAGE,
    totalQuantity: 1,
    availableQuantity: 1,
    status: "available",
    instructions:
      "Handle with care. Return all included accessories with the equipment.",
    requirements:
      "University ID required\nReturn by the expected date\nReport damage immediately",
  };
}

function ResourceForm({
  resource,
  onClose,
}: {
  resource?: Resource;
  onClose: () => void;
}) {
  const { categories, createResource, updateResource } = useApp();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResourceFormSchema>({
    resolver: zodResolver(resourceSchema),
    defaultValues: getDefaults(resource),
  });

  const onSubmit = async (values: ResourceFormSchema) => {
    const requirements = values.requirements
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const input = { ...values, requirements };

    const result = resource
      ? await updateResource(resource.id, input)
      : await createResource(input);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Resource name"
          htmlFor="name"
          required
          error={errors.name?.message}
        >
          <Input
            id="name"
            placeholder="e.g. Sony A7 IV mirrorless camera"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>
        <FormField
          label="Category"
          htmlFor="categoryId"
          required
          error={errors.categoryId?.message}
        >
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="categoryId"
                  aria-invalid={Boolean(errors.categoryId)}
                >
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        htmlFor="description"
        required
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          placeholder="What is included, and what is it best used for?"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Location"
          htmlFor="location"
          required
          error={errors.location?.message}
        >
          <Input
            id="location"
            placeholder="e.g. Media Store, Level 2"
            aria-invalid={Boolean(errors.location)}
            {...register("location")}
          />
        </FormField>
        <FormField
          label="Status"
          htmlFor="status"
          required
          error={errors.status?.message}
        >
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {RESOURCE_STATUS_META[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Total units"
          htmlFor="totalQuantity"
          required
          error={errors.totalQuantity?.message}
        >
          <Input
            id="totalQuantity"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.totalQuantity)}
            {...register("totalQuantity", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          label="Available units"
          htmlFor="availableQuantity"
          required
          error={errors.availableQuantity?.message}
          hint="Must be less than or equal to the total."
        >
          <Input
            id="availableQuantity"
            type="number"
            min={0}
            aria-invalid={Boolean(errors.availableQuantity)}
            {...register("availableQuantity", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField
        label="Image URL"
        htmlFor="image"
        required
        error={errors.image?.message}
        hint="Use a hosted image URL. Local files are not uploaded in this demo."
      >
        <Input
          id="image"
          type="url"
          placeholder="https://images.unsplash.com/..."
          aria-invalid={Boolean(errors.image)}
          {...register("image")}
        />
      </FormField>

      <FormField
        label="Usage instructions"
        htmlFor="instructions"
        required
        error={errors.instructions?.message}
      >
        <Textarea
          id="instructions"
          aria-invalid={Boolean(errors.instructions)}
          {...register("instructions")}
        />
      </FormField>

      <FormField
        label="Booking requirements"
        htmlFor="requirements"
        required
        error={errors.requirements?.message}
        hint="One requirement per line."
      >
        <Textarea
          id="requirements"
          aria-invalid={Boolean(errors.requirements)}
          {...register("requirements")}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : resource
              ? "Save changes"
              : "Add resource"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  resource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit resource" : "Add a resource"}
          </DialogTitle>
          <DialogDescription>
            {resource
              ? "Update inventory details, availability, and collection information."
              : "Add new equipment to the shared catalogue."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ResourceForm
            key={resource?.id ?? "new-resource"}
            resource={resource}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
