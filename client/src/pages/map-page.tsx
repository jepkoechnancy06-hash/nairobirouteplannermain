import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapView } from "@/components/map-view";
import { PageHeader } from "@/components/page-header";
import { Store, Search, Layers, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { Shop, Driver } from "@shared/schema";

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showShops, setShowShops] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const isLoading = shopsLoading || driversLoading;

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedShops = showShops ? filteredShops : [];
  const displayedDrivers = showDrivers ? drivers : [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 border-b px-6 py-4">
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-80 border-r p-4">
            <Skeleton className="h-10 w-full" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="map-page">
      <div className="shrink-0 border-b px-6 py-4 bg-background">
        <PageHeader
          title="Map"
          description="View shops and drivers on the map"
        />
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r bg-background">
          {/* Search and Filters */}
          <div className="space-y-3 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-shops"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showShops ? "default" : "outline"}
              size="sm"
              onClick={() => setShowShops(!showShops)}
              data-testid="button-toggle-shops"
            >
              {showShops ? <Eye className="mr-1.5 h-3 w-3" /> : <EyeOff className="mr-1.5 h-3 w-3" />}
              Shops ({shops.length})
            </Button>
            <Button
              variant={showDrivers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDrivers(!showDrivers)}
              data-testid="button-toggle-drivers"
            >
              {showDrivers ? <Eye className="mr-1.5 h-3 w-3" /> : <EyeOff className="mr-1.5 h-3 w-3" />}
              Drivers ({drivers.filter(d => d.currentLatitude).length})
            </Button>
            <Button
              variant={showBoundaries ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowBoundaries(!showBoundaries)}
              data-testid="button-toggle-boundaries"
            >
              <Layers className="mr-1.5 h-3 w-3" />
              Areas
            </Button>
          </div>
        </div>

        {/* Shop List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Store className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "No shops match your search" : "No shops added yet"}
                </p>
              </div>
            ) : (
              filteredShops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShop(shop)}
                  className={`w-full rounded-md p-3 text-left transition-colors hover-elevate ${
                    selectedShop?.id === shop.id ? "bg-primary/10" : ""
                  }`}
                  data-testid={`shop-list-item-${shop.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{shop.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {shop.address || `${shop.latitude.toFixed(4)}, ${shop.longitude.toFixed(4)}`}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant={shop.status === "active" ? "default" : "secondary"} className="text-xs">
                          {shop.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {shop.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Selected Shop Details */}
        {selectedShop && (
          <div className="border-t bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{selectedShop.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedShop.category}</p>
              </div>
              <Badge variant={selectedShop.status === "active" ? "default" : "secondary"}>
                {selectedShop.status}
              </Badge>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {selectedShop.ownerName && (
                <p><span className="text-muted-foreground">Owner:</span> {selectedShop.ownerName}</p>
              )}
              {selectedShop.phone && (
                <p><span className="text-muted-foreground">Phone:</span> {selectedShop.phone}</p>
              )}
              {selectedShop.address && (
                <p><span className="text-muted-foreground">Address:</span> {selectedShop.address}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedShop.latitude.toFixed(6)}, {selectedShop.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Map */}
        <div className="flex-1">
          <MapView
            shops={displayedShops}
            drivers={displayedDrivers}
            selectedShopId={selectedShop?.id}
            onShopClick={setSelectedShop}
            showAreaBoundaries={showBoundaries}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
