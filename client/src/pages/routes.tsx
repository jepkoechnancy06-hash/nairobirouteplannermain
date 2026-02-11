import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Route as RouteIcon, Plus, Clock, MapPin, Truck, Wand2, Search, MoreVertical, Pencil, Trash2, Play, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Route, InsertRoute, Shop, Driver } from "@shared/schema";
import { MapView } from "@/components/map-view";
import { optimizeRoute, calculateRouteDistance, estimateTravelTime } from "@/lib/geojson";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const routeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  driverId: z.string().optional(),
  shopIds: z.array(z.string()).min(1, "Select at least one shop"),
  status: z.enum(["planned", "in_progress", "completed"]),
  date: z.string().min(1, "Date is required"),
});

type RouteFormData = z.infer<typeof routeFormSchema>;

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: routes = [], isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const isLoading = routesLoading || shopsLoading || driversLoading;

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      driverId: "",
      shopIds: [],
      status: "planned",
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    form.setValue("shopIds", selectedShopIds);
  }, [selectedShopIds, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertRoute) => {
      return apiRequest("POST", "/api/routes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      setIsAddDialogOpen(false);
      setSelectedShopIds([]);
      form.reset();
      toast({ title: "Route created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create route", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertRoute> }) => {
      return apiRequest("PATCH", `/api/routes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      setEditingRoute(null);
      setSelectedShopIds([]);
      form.reset();
      toast({ title: "Route updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update route", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Route deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete route", variant: "destructive" });
    },
  });

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOptimize = () => {
    if (selectedShopIds.length < 2) {
      toast({ title: "Select at least 2 shops to optimize", variant: "destructive" });
      return;
    }

    const selectedShops = shops.filter(s => selectedShopIds.includes(s.id));
    const optimizedOrder = optimizeRoute(selectedShops);
    setSelectedShopIds(optimizedOrder);
    toast({ title: "Route optimized for shortest path" });
  };

  const handleSubmit = (data: RouteFormData) => {
    const selectedShops = shops.filter(s => data.shopIds.includes(s.id));
    const orderedShops = data.shopIds.map(id => selectedShops.find(s => s.id === id)!).filter(Boolean);
    const distance = calculateRouteDistance(orderedShops);
    const time = estimateTravelTime(distance);

    const submitData: InsertRoute = {
      ...data,
      driverId: data.driverId || undefined,
      estimatedDistance: distance,
      estimatedTime: time,
    };

    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setSelectedShopIds(route.shopIds);
    form.reset({
      name: route.name,
      driverId: route.driverId || "",
      shopIds: route.shopIds,
      status: route.status as "planned" | "in_progress" | "completed",
      date: route.date,
    });
    setIsAddDialogOpen(true);
  };

  const handleStatusChange = (route: Route, newStatus: string) => {
    updateMutation.mutate({ 
      id: route.id, 
      data: { status: newStatus }
    });
  };

  const getRouteShops = (route: Route) => {
    return route.shopIds.map(id => shops.find(s => s.id === id)).filter(Boolean) as Shop[];
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="routes-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Routes</h1>
          <p className="text-muted-foreground">Plan and manage delivery routes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingRoute(null);
            setSelectedShopIds([]);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-route">
              <Plus className="mr-2 h-4 w-4" />
              Create Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingRoute ? "Edit Route" : "Create New Route"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 lg:grid-cols-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Morning Route - Zone A" data-testid="input-route-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="driverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Driver</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-driver">
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {drivers.filter(d => d.status === "available").map(driver => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-route-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Select Shops ({selectedShopIds.length})</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleOptimize}
                        disabled={selectedShopIds.length < 2}
                        data-testid="button-optimize"
                      >
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                        Optimize
                      </Button>
                    </div>
                    <ScrollArea className="h-48 rounded-md border p-3">
                      <div className="space-y-2">
                        {shops.map((shop, index) => {
                          const isSelected = selectedShopIds.includes(shop.id);
                          const orderIndex = selectedShopIds.indexOf(shop.id);
                          return (
                            <label
                              key={shop.id}
                              className="flex items-center gap-3 rounded-md p-2 hover-elevate cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedShopIds([...selectedShopIds, shop.id]);
                                  } else {
                                    setSelectedShopIds(selectedShopIds.filter(id => id !== shop.id));
                                  }
                                }}
                                data-testid={`checkbox-shop-${shop.id}`}
                              />
                              {isSelected && (
                                <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                                  {orderIndex + 1}
                                </Badge>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{shop.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{shop.address || "No address"}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <FormField
                      control={form.control}
                      name="shopIds"
                      render={() => (
                        <FormItem>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedShopIds.length > 0 && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium">Route Summary</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {selectedShopIds.length} stops
                        </span>
                        <span className="flex items-center gap-1">
                          <RouteIcon className="h-3.5 w-3.5" />
                          {calculateRouteDistance(selectedShopIds.map(id => shops.find(s => s.id === id)!).filter(Boolean)).toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          ~{estimateTravelTime(calculateRouteDistance(selectedShopIds.map(id => shops.find(s => s.id === id)!).filter(Boolean)))} min
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingRoute(null);
                      setSelectedShopIds([]);
                      form.reset();
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit-route"
                    >
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingRoute ? "Update" : "Create Route")}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="h-80 lg:h-auto">
                <MapView
                  shops={shops}
                  routeShops={selectedShopIds.map(id => shops.find(s => s.id === id)!).filter(Boolean)}
                  showAreaBoundaries={false}
                  height="100%"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-routes"
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="py-1.5 px-3">
          <RouteIcon className="mr-1.5 h-3.5 w-3.5" />
          Total: {routes.length}
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          Planned: {routes.filter(r => r.status === "planned").length}
        </Badge>
        <Badge className="bg-blue-500 py-1.5 px-3">
          In Progress: {routes.filter(r => r.status === "in_progress").length}
        </Badge>
        <Badge className="bg-green-500 py-1.5 px-3">
          Completed: {routes.filter(r => r.status === "completed").length}
        </Badge>
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <RouteIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No routes found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Create your first route to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => {
            const driver = drivers.find(d => d.id === route.driverId);
            const routeShops = getRouteShops(route);
            return (
              <Card key={route.id} data-testid={`route-card-${route.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{route.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{route.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={
                        route.status === "completed" ? "default" : 
                        route.status === "in_progress" ? "secondary" : "outline"
                      }
                      className={`text-xs ${
                        route.status === "completed" ? "bg-green-500" :
                        route.status === "in_progress" ? "bg-blue-500" : ""
                      }`}
                    >
                      {route.status.replace("_", " ")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-route-menu-${route.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {route.status === "planned" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(route, "in_progress")}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Route
                          </DropdownMenuItem>
                        )}
                        {route.status === "in_progress" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(route, "completed")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Route
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEdit(route)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(route.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">{driver?.name || "Unassigned"}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {route.shopIds.length} stops
                    </span>
                    {route.estimatedDistance && (
                      <span className="flex items-center gap-1">
                        <RouteIcon className="h-3.5 w-3.5" />
                        {route.estimatedDistance.toFixed(1)} km
                      </span>
                    )}
                    {route.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {route.estimatedTime} min
                      </span>
                    )}
                  </div>

                  <div className="h-32 overflow-hidden rounded-md border">
                    <MapView
                      shops={routeShops}
                      routeShops={routeShops}
                      showAreaBoundaries={false}
                      height="100%"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
