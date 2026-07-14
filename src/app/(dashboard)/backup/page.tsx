import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Backup" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Backup"
      icon="DatabaseBackup"
      description="Data backups and restore points."
    />
  );
}
