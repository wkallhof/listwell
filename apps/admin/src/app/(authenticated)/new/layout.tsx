import type { ReactNode } from "react";
import { NewListingProvider } from "@/lib/new-listing-context";

interface NewListingLayoutProps {
  readonly children: ReactNode;
}

export default function NewListingLayout({ children }: NewListingLayoutProps) {
  return <NewListingProvider>{children}</NewListingProvider>;
}
