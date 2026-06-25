import { Breadcrumb } from "./breadcrumb";
import { UserMenu } from "./user-menu";

/**
 * Dashboard top bar. Hosts the breadcrumb area (left) and the user menu
 * (right). Kept as a server component shell; the interactive children
 * (`Breadcrumb`, `UserMenu`) are client components.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Breadcrumb />
      <UserMenu />
    </header>
  );
}
