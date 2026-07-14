import type { Metadata } from "next";

import { AttractionManagement } from "@/modules/attractions/components/attraction-management";

export const metadata: Metadata = { title: "Attraction Management" };

/**
 * Attraction Management route. The interactive screen (list / add-edit / bulk
 * upload) is a client component; this server page is just the route entry.
 */
export default function Page() {
  return <AttractionManagement />;
}
