import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, Plus, Truck, TrendingUp, Search, MoreVertical, Pencil, Trash2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Target as TargetType, InsertTarget, Driver } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const targetFormSchema = z.object({
  driverId: z.string().min(1, "Select a driver"),
  period: z.enum(["daily", "weekly", "monthly"]),
  targetShops: z.number().min(1, "Must be at least 1"),
  targetDeliveries: z.number().min(1, "Must be at least 1"),
  completedShops: z.number().min(0),
  completedDeliveries: z.number().min(0),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type TargetFormData = z.infer<typeof targetFormSchema>;

export default function TargetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetType | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: targets = [], isLoading: targetsLoading } = useQuery<TargetType[]>({
    queryKey: ["/api/targets"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const isLoading = targetsLoading || driversLoading;

  const form = useForm<TargetFormData>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      driverId: "",
      period: "daily",
      targetShops: 10,
      targetDeliveries: 20,
      completedShops: 0,
      completedDeliveries: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTarget) => {
      return apiRequest("POST", "/api/targets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Target created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create target", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTarget> }) => {
      return apiRequest("PATCH", `/api/targets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      setEditingTarget(null);
      form.reset();
      toast({ title: "Target updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update target", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/targets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      toast({ title: "Target deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete target", variant: "destructive" });
    },
  });

  const filteredTargets = targets.filter(target => {
    const driver = drivers.find(d => d.id === target.driverId);
    return driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           target.period.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSubmit = (data: TargetFormData) => {
    if (editingTarget) {
      updateMutation.mutate({ id: editingTarget.id, data });
    } else {
      createMutation.mutate(data as InsertTarget);
    }
  };

  const handleEdit = (target: TargetType) => {
    setEditingTarget(target);
    form.reset({
      driverId: target.driverId,
      period: target.period as "daily" | "weekly" | "monthly",
      targetShops: target.targetShops,
      targetDeliveries: target.targetDeliveries,
      completedShops: target.completedShops,
      completedDeliveries: target.completedDeliveries,
      startDate: target.startDate,
      endDate: target.endDate,
    });
    setIsAddDialogOpen(true);
  };

  const getTargetStatus = (target: TargetType) => {
    const today = new Date().toISOString().split("T")[0];
    if (today > target.endDate) return "expired";
    if (today < target.startDate) return "upcoming";
    return "active";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
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
    <div className="space-y-6 p-6" data-testid="targets-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Targets</h1>
          <p className="text-muted-foreground">Set and track driver performance targets</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingTarget(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-target">
              <Plus className="mr-2 h-4 w-4" />
              Set Target
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTarget ? "Edit Target" : "Set New Target"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {drivers.map(driver => (
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-period">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetShops"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Shops</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-target-shops" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetDeliveries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Deliveries</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-target-deliveries" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {editingTarget && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="completedShops"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completed Shops</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-completed-shops" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="completedDeliveries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completed Deliveries</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-completed-deliveries" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingTarget(null);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-target"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingTarget ? "Update" : "Set Target")}
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
          placeholder="Search targets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-targets"
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="py-1.5 px-3">
          <Target className="mr-1.5 h-3.5 w-3.5" />
          Total: {targets.length}
        </Badge>
        <Badge className="bg-green-500 py-1.5 px-3">
          Active: {targets.filter(t => getTargetStatus(t) === "active").length}
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          Upcoming: {targets.filter(t => getTargetStatus(t) === "upcoming").length}
        </Badge>
      </div>

      {/* Targets Grid */}
      {filteredTargets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No targets found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Set your first target to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => {
            const driver = drivers.find(d => d.id === target.driverId);
            const status = getTargetStatus(target);
            const shopProgress = Math.round((target.completedShops / target.targetShops) * 100);
            const deliveryProgress = Math.round((target.completedDeliveries / target.targetDeliveries) * 100);
            const avgProgress = Math.round((shopProgress + deliveryProgress) / 2);
            
            return (
              <Card key={target.id} data-testid={`target-card-${target.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      status === "active" ? "bg-green-500/10" :
                      status === "upcoming" ? "bg-blue-500/10" : "bg-gray-500/10"
                    }`}>
                      <Truck className={`h-5 w-5 ${
                        status === "active" ? "text-green-600" :
                        status === "upcoming" ? "text-blue-600" : "text-gray-600"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{driver?.name || "Unknown"}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{target.period} target</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={status === "active" ? "default" : "secondary"}
                      className={`text-xs ${
                        status === "active" ? "bg-green-500" :
                        status === "upcoming" ? "bg-blue-500" : ""
                      }`}
                    >
                      {status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-target-menu-${target.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(target)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(target.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {target.startDate} - {target.endDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      {avgProgress}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Shops Visited</span>
                        <span className="font-medium">{target.completedShops}/{target.targetShops}</span>
                      </div>
                      <Progress 
                        value={shopProgress} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Deliveries Made</span>
                        <span className="font-medium">{target.completedDeliveries}/{target.targetDeliveries}</span>
                      </div>
                      <Progress 
                        value={deliveryProgress} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  {avgProgress >= 100 && (
                    <div className="flex items-center justify-center gap-2 rounded-md bg-green-500/10 p-2 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      Target Achieved!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
