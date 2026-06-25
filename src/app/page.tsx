import { redirect } from "next/navigation";

import { DEFAULT_LOGIN_REDIRECT } from "@/lib/constants/routes";

/**
 * Root route. The app has no public landing page (internal tool), so we send
 * users straight to the dashboard. The middleware then redirects unauthenticated
 * users to the login page, so this single redirect covers both states.
 */
export default function RootPage() {
  redirect(DEFAULT_LOGIN_REDIRECT);
}
