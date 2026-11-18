"use client";

import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-provider";
import type { Category } from "@/types/category";
import {
  categorySchema,
  type CategoryFormSchema,
} from "../utils/category-schema";

function CategoryForm({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const { createCategory, updateCategory } = useApp();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
    },
  });

  const onSubmit = async (values: CategoryFormSchema) => {
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Category name"
        htmlFor="category-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="category-name"
          placeholder="e.g. Audio & Visual"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormField>
      <FormField
        label="Description"
        htmlFor="category-description"
        required
        error={errors.description?.message}
        hint="Explain what equipment belongs in this category."
      >
        <Textarea
          id="category-description"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : category
              ? "Save changes"
              : "Add category"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit category" : "Add a category"}
          </DialogTitle>
          <DialogDescription>
            Categories keep the catalogue easy to browse and report on.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <CategoryForm
            key={category?.id ?? "new-category"}
            category={category}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
