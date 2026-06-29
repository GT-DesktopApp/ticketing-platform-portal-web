"use client";

import {
  Castle,
  Landmark,
  type LucideIcon,
  PawPrint,
  TrainFront,
  Trees,
} from "lucide-react";

/**
 * Maps an attraction's `type`/`name` to a representative line icon. The Figma
 * uses bespoke monument illustrations; we approximate with Lucide icons keyed by
 * type so every card has a distinct, on-brand glyph (no more blank squares).
 */
const TYPE_ICON: Record<string, LucideIcon> = {
  Ride: TrainFront,
  Fort: Castle,
  Palace: Landmark,
  Zoo: PawPrint,
  Museum: Landmark,
  Heritage: Landmark,
  Garden: Trees,
};

export function AttractionIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = TYPE_ICON[type] ?? Landmark;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
