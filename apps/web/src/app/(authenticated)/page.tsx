import { redirect } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { FAB } from "@/components/fab";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { UserAvatarLink } from "@/components/user-avatar-link";

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
  const [response, meResponse] = await Promise.all([
    apiFetch("/api/listings"),
    apiFetch("/api/me"),
  ]);

  if (response.status === 401 || meResponse.status === 401) {
    redirect("/login");
  }

  const listings: Listing[] = response.ok ? await response.json() : [];
  const me: { name: string | null; image: string | null } = meResponse.ok
    ? await meResponse.json()
    : { name: null, image: null };

  return (
    <PullToRefresh>
      <main className="mx-auto min-h-svh w-full max-w-xl px-5 pb-24 pt-[max(env(safe-area-inset-top,0px)+0.5rem,2rem)]">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Listings</h1>
          <UserAvatarLink name={me.name} image={me.image} />
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
    </PullToRefresh>
  );
}
