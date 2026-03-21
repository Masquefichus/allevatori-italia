import { BreederCardSkeleton } from "@/components/ui/Skeleton";

export default function AllevatoriLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <BreederCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
