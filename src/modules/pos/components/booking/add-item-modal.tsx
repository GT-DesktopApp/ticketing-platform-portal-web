"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/modules/pos/components/booking/image-upload";
import { useCategoryTypes } from "@/modules/pos/hooks/use-pos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  categoryTypeId: string;
  salesPrice: string;
  barcode: string;
  image: string | null;
}

interface FormErrors {
  name?: string;
  salesPrice?: string;
}

const EMPTY: FormState = {
  name: "",
  categoryTypeId: "",
  salesPrice: "",
  barcode: "",
  image: null,
};

/**
 * New Ticket Category dialog (NOT an inventory/product form).
 *
 * Fields ONLY: Category Name*, Category Type (dynamic), Sales Price*, Barcode,
 * Image Upload. No Sales/Purchase Unit, Opening Cost, Stock, or Track-Stock —
 * those concepts don't apply to ticket categories. Required: Name + Sales Price.
 */
export function AddItemModal({ open, onOpenChange }: Props) {
  const { data: categoryTypes = [] } = useCategoryTypes();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Category name is required.";
    const price = parseFloat(form.salesPrice);
    if (!form.salesPrice.trim() || Number.isNaN(price) || price <= 0) {
      next.salesPrice = "Enter a valid sales price.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    // Persisting a new category is a later milestone; the validated payload is:
    //   { name, categoryTypeId, salesPrice (rupees), barcode, image }
    // Close + reset for now.
    setForm(EMPTY);
    setErrors({});
    onOpenChange(false);
  }

  function handleCancel() {
    setForm(EMPTY);
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogHeader
          className="px-6 py-4"
          style={{ background: "var(--pos-amber)" }}
        >
          <DialogTitle className="text-white">New Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Category Name <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Indian Adult (2-way)"
            />
            {errors.name && (
              <p className="text-[12px] text-[#DC2626]">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category Type</Label>
            <Select
              value={form.categoryTypeId}
              onValueChange={(v) => set("categoryTypeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category type" />
              </SelectTrigger>
              <SelectContent>
                {categoryTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-price">
              Sales Price <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="cat-price"
              type="number"
              min="0"
              step="0.01"
              value={form.salesPrice}
              onChange={(e) => set("salesPrice", e.target.value)}
              placeholder="0.00"
            />
            {errors.salesPrice && (
              <p className="text-[12px] text-[#DC2626]">{errors.salesPrice}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-barcode">Barcode</Label>
            <Input
              id="cat-barcode"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImageUpload
              value={form.image}
              onChange={(img) => set("image", img)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button className="pos-btn-amber font-semibold" onClick={handleSave}>
              Save Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
