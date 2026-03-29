import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ListingDetailLoading() {
  return (
    <div className="pb-28">
      <header className="flex items-center px-5 pb-2 pt-4">
        <Button variant="ghost" size="icon" disabled>
          <ArrowLeft size={20} />
        </Button>
      </header>
      <div className="px-5">
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="mt-4 h-7 w-3/4" />
        <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  );
}
