import Link from "next/link";
import { MapPin, Shield, Crown } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Rating from "@/components/ui/Rating";
import type { BreederProfile, Breed } from "@/types/database";

interface BreederCardProps {
  breeder: BreederProfile & { breeds?: Breed[] };
}

export default function BreederCard({ breeder }: BreederCardProps) {
  return (
    <Link href={`/allevatori/${breeder.slug}`}>
      <Card hover className="h-full">
        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-50">
          {breeder.cover_image_url ? (
            <img
              src={breeder.cover_image_url}
              alt={breeder.kennel_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🐕</span>
            </div>
          )}
          {false && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="space-y-3">
          {/* Logo + Name */}
          <div className="flex items-start gap-3 -mt-8 relative">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              {breeder.logo_url ? (
                <img
                  src={breeder.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">🏠</span>
              )}
            </div>
            <div className="pt-8">
              <h3 className="font-semibold text-foreground leading-tight">
                {breeder.kennel_name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {breeder.city ? `${breeder.city}, ` : ""}
                {breeder.province} ({breeder.region})
              </div>
            </div>
          </div>

          {/* Rating */}
          {breeder.review_count > 0 && (
            <Rating
              value={breeder.average_rating}
              size="sm"
              showValue
              count={breeder.review_count}
            />
          )}

          {/* Breeds */}
          {breeder.breeds && breeder.breeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {breeder.breeds.slice(0, 3).map((breed) => (
                <Badge key={breed.id} variant="outline">
                  {breed.name_it}
                </Badge>
              ))}
              {breeder.breeds.length > 3 && (
                <Badge variant="outline">+{breeder.breeds.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Certifications */}
          <div className="flex items-center gap-2">
            {breeder.enci_verified && (
              <Badge variant="primary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                ENCI
              </Badge>
            )}
            {breeder.year_established && (
              <span className="text-xs text-muted-foreground">
                Dal {breeder.year_established}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
