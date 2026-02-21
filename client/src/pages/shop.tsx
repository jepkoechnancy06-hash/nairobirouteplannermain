import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Plus, MapPin, Phone, User, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Shop, InsertShop } from "@shared/schema";
import { MapView } from "@/components/map-view";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const shopFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: z.enum(["retail", "wholesale", "kiosk"]),
  status: z.enum(["active", "inactive", "pending"]),
  notes: z.string().optional(),
});

type ShopFormData = z.infer<typeof shopFormSchema>;

export default function ShopsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [coordinatesInput, setCoordinatesInput] = useState("-1.259000, 36.862000");
  const [coordinatesError, setCoordinatesError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: "",
      ownerName: "",
      phone: "",
      address: "",
      latitude: -1.2590,
      longitude: 36.8620,
      category: "retail",
      status: "active",
      notes: "",
    },
  });

  const resetForm = () => {
    form.reset();
    setCoordinatesInput("-1.259000, 36.862000");
    setCoordinatesError(null);
    setEditingShop(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertShop) => {
      return apiRequest("POST", "/api/shops", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Shop added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add shop", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertShop> }) => {
      return apiRequest("PATCH", `/api/shops/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Shop updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update shop", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/shops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      toast({ title: "Shop deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete shop", variant: "destructive" });
    },
  });

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (data: ShopFormData) => {
    if (editingShop) {
      updateMutation.mutate({ id: editingShop.id, data });
    } else {
      createMutation.mutate(data as InsertShop);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    form.reset({
      name: shop.name,
      ownerName: shop.ownerName || "",
      phone: shop.phone || "",
      address: shop.address || "",
      latitude: shop.latitude,
      longitude: shop.longitude,
      category: shop.category as "retail" | "wholesale" | "kiosk",
      status: shop.status as "active" | "inactive" | "pending",
      notes: shop.notes || "",
    });
    setCoordinatesInput(`${shop.latitude.toFixed(6)}, ${shop.longitude.toFixed(6)}`);
    setCoordinatesError(null);
    setIsAddDialogOpen(true);
  };

  const handleCoordinatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCoordinatesInput(value);
    setCoordinatesError(null);
    
    // Try to parse coordinates
    const parts = value.split(/[,\s]+/).filter(p => p.trim() !== "");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          form.setValue("latitude", lat);
          form.setValue("longitude", lng);
        } else {
          setCoordinatesError("Invalid range: Latitude must be -90 to 90, Longitude -180 to 180");
        }
      }
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
    setCoordinatesInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCoordinatesError(null);
    setIsMapDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="shops-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Shops</h1>
          <p className="text-muted-foreground">Manage retail outlets in Huruma/Mathare area</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-shop">
              <Plus className="mr-2 h-4 w-4" />
              Add Shop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingShop ? "Edit Shop" : "Add New Shop"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter shop name" data-testid="input-shop-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Owner name" data-testid="input-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+254..." data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street address" data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                            <SelectItem value="kiosk">Kiosk</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location (Coordinates)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={coordinatesInput}
                      onChange={handleCoordinatesChange}
                      placeholder="-1.2590, 36.8620"
                      className="flex-1"
                      data-testid="input-coordinates"
                    />
                    <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" data-testid="button-pick-location">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Pick Location on Map</DialogTitle>
                        </DialogHeader>
                        <div className="h-96">
                          <MapView
                            onMapClick={handleMapClick}
                            showAreaBoundaries={true}
                            height="100%"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Click on the map to select shop location</p>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-muted-foreground">Paste coordinates as "latitude, longitude" (e.g., -1.2590, 36.8620)</p>
                  {coordinatesError && <p className="text-xs text-destructive">{coordinatesError}</p>}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes..." className="resize-none" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-shop"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingShop ? "Update" : "Add Shop")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search shops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="py-1.5 px-3">
          <Store className="mr-1.5 h-3.5 w-3.5" />
          Total: {shops.length}
        </Badge>
        <Badge variant="default" className="py-1.5 px-3">
          Active: {shops.filter(s => s.status === "active").length}
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          Pending: {shops.filter(s => s.status === "pending").length}
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredShops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Store className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No shops found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Add your first shop to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShops.map((shop) => (
                  <TableRow key={shop.id} data-testid={`shop-row-${shop.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{shop.name}</p>
                          {shop.phone && (
                            <p className="text-xs text-muted-foreground">{shop.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{shop.ownerName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{shop.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={shop.status === "active" ? "default" : shop.status === "pending" ? "secondary" : "outline"}
                        className="capitalize"
                      >
                        {shop.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-shop-menu-${shop.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(shop)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(shop.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
