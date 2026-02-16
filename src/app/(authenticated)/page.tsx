import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImagePlus, MoreVertical } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { FAB } from "@/components/fab";
import { LogoutButton } from "./logout-button";

interface ListingImage {
  id: string;
  blobUrl: string;
  isPrimary: boolean;
}

interface Listing {
  id: string;
  title: string | null;
  status: "DRAFT" | "PROCESSING" | "READY" | "LISTED" | "SOLD" | "ARCHIVED";
  suggestedPrice: number | null;
  pipelineStep: string | null;
  createdAt: string;
  images: ListingImage[];
}

export default async function FeedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/listings`,
    {
      headers: {
        cookie: (await headers()).get("cookie") ?? "",
      },
      cache: "no-store",
    },
  );

  const listings: Listing[] = response.ok ? await response.json() : [];

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 pb-24 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Listings</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {listings.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No listings yet"
          description="Tap + to create your first one"
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const primaryImage = listing.images.find((img) => img.isPrimary);
            return (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                status={listing.status}
                suggestedPrice={listing.suggestedPrice}
                pipelineStep={listing.pipelineStep}
                createdAt={listing.createdAt}
                primaryImageUrl={primaryImage?.blobUrl ?? null}
              />
            );
          })}
        </div>
      )}

      <FAB />
    </main>
  );
}
