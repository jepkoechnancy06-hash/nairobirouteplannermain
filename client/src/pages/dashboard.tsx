import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { MapView } from "@/components/map-view";
import { Store, Truck, Route, Target, TrendingUp, Clock, MapPin, ClipboardList, PackageCheck, CreditCard } from "lucide-react";
import type { Shop, Driver, Route as RouteType, Target as TargetType } from "@shared/schema";
import { fetchList } from "@/lib/queryClient";

export default function Dashboard() {
  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery<RouteType[]>({
    queryKey: ["/api/routes"],
  });

  const { data: targets = [], isLoading: targetsLoading } = useQuery<TargetType[]>({
    queryKey: ["/api/targets"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => fetchList("/api/orders"),
  });

  const { data: dispatches = [] } = useQuery({
    queryKey: ["/api/dispatches"],
    queryFn: () => fetchList("/api/dispatches"),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: () => fetchList("/api/payments"),
  });

  const isLoading = shopsLoading || driversLoading || routesLoading || targetsLoading;

  // Calculate statistics
  const activeShops = shops.filter(s => s.status === "active").length;
  const availableDrivers = drivers.filter(d => d.status === "available").length;
  const onRouteDrivers = drivers.filter(d => d.status === "on_route").length;
  const todayRoutes = routes.filter(r => r.date === new Date().toISOString().split("T")[0]).length;
  const completedRoutes = routes.filter(r => r.status === "completed").length;

  // Calculate target progress
  const currentTargets = targets.filter(t => {
    const today = new Date().toISOString().split("T")[0];
    return t.startDate <= today && t.endDate >= today;
  });

  const totalTargetShops = currentTargets.reduce((sum, t) => sum + t.targetShops, 0);
  const totalCompletedShops = currentTargets.reduce((sum, t) => sum + t.completedShops, 0);
  const targetProgress = totalTargetShops > 0 ? Math.round((totalCompletedShops / totalTargetShops) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Veew Distributors operations in Huruma/Mathare
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Shops"
          value={shops.length}
          subtitle={`${activeShops} active`}
          icon={Store}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Drivers"
          value={drivers.length}
          subtitle={`${availableDrivers} available, ${onRouteDrivers} on route`}
          icon={Truck}
          iconColor="text-accent"
        />
        <StatCard
          title="Today's Routes"
          value={todayRoutes}
          subtitle={`${completedRoutes} completed overall`}
          icon={Route}
          iconColor="text-chart-3"
        />
        <StatCard
          title="Target Progress"
          value={`${targetProgress}%`}
          subtitle={`${totalCompletedShops} of ${totalTargetShops} shops`}
          icon={Target}
          iconColor="text-chart-4"
        />
      </div>

      {/* Order & Dispatch Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={orders.filter((o: any) => o.createdAt && new Date(o.createdAt).toDateString() === new Date().toDateString()).length || orders.length}
          subtitle={`${orders.filter((o: any) => o.status === "pending").length} pending`}
          icon={ClipboardList}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Dispatches"
          value={dispatches.filter((d: any) => d.status !== "completed").length}
          subtitle={`${dispatches.filter((d: any) => d.status === "packing").length} packing, ${dispatches.filter((d: any) => d.status === "in_transit" || d.status === "flagged_off").length} in transit`}
          icon={PackageCheck}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Order Value"
          value={`KES ${orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()}`}
          subtitle={`${orders.filter((o: any) => o.status === "delivered" || o.status === "paid").length} delivered`}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard
          title="Payments"
          value={`KES ${payments.filter((p: any) => p.status === "confirmed").reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}`}
          subtitle={`${payments.filter((p: any) => p.status === "pending" || p.status === "received").length} pending confirmation`}
          icon={CreditCard}
          iconColor="text-emerald-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-medium">Coverage Area</CardTitle>
            <Badge variant="outline" className="font-normal">
              <MapPin className="mr-1 h-3 w-3" />
              Huruma/Mathare
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-72 overflow-hidden rounded-b-lg">
              <MapView
                shops={shops.slice(0, 10)}
                drivers={drivers.filter(d => d.currentLatitude && d.currentLongitude)}
                showAreaBoundaries={true}
                height="100%"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-medium">Active Targets</CardTitle>
            <Badge variant="secondary" className="font-normal">
              {currentTargets.length} active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTargets.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <Target className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No active targets</p>
                <p className="text-xs text-muted-foreground">Set targets for your drivers to track progress</p>
              </div>
            ) : (
              currentTargets.slice(0, 4).map((target) => {
                const driver = drivers.find(d => d.id === target.driverId);
                const shopProgress = Math.round((target.completedShops / target.targetShops) * 100);
                const deliveryProgress = Math.round((target.completedDeliveries / target.targetDeliveries) * 100);
                
                return (
                  <div key={target.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{driver?.name || "Unknown Driver"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{target.period} target</p>
                        </div>
                      </div>
                      <Badge variant={shopProgress >= 80 ? "default" : "secondary"}>
                        {shopProgress}%
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Shops visited</span>
                        <span>{target.completedShops}/{target.targetShops}</span>
                      </div>
                      <Progress value={shopProgress} className="h-1.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Deliveries</span>
                        <span>{target.completedDeliveries}/{target.targetDeliveries}</span>
                      </div>
                      <Progress value={deliveryProgress} className="h-1.5" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Shops */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Recent Shops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shops.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <Store className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No shops added yet</p>
              </div>
            ) : (
              shops.slice(0, 5).map((shop) => (
                <div key={shop.id} className="flex items-center gap-3" data-testid={`recent-shop-${shop.id}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{shop.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{shop.address || "No address"}</p>
                  </div>
                  <Badge variant={shop.status === "active" ? "default" : "secondary"} className="text-xs">
                    {shop.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Driver Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Driver Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {drivers.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <Truck className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No drivers added yet</p>
              </div>
            ) : (
              drivers.slice(0, 5).map((driver) => (
                <div key={driver.id} className="flex items-center gap-3" data-testid={`driver-status-${driver.id}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    driver.status === "available" ? "bg-green-500/10" :
                    driver.status === "on_route" ? "bg-blue-500/10" : "bg-gray-500/10"
                  }`}>
                    <Truck className={`h-4 w-4 ${
                      driver.status === "available" ? "text-green-600" :
                      driver.status === "on_route" ? "text-blue-600" : "text-gray-600"
                    }`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{driver.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{driver.vehicleType} - {driver.vehiclePlate}</p>
                  </div>
                  <Badge 
                    variant={driver.status === "available" ? "default" : "secondary"} 
                    className="text-xs capitalize"
                  >
                    {driver.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Routes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Today's Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.filter(r => r.date === new Date().toISOString().split("T")[0]).length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <Route className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No routes planned for today</p>
              </div>
            ) : (
              routes
                .filter(r => r.date === new Date().toISOString().split("T")[0])
                .slice(0, 5)
                .map((route) => {
                  const driver = drivers.find(d => d.id === route.driverId);
                  return (
                    <div key={route.id} className="flex items-center gap-3" data-testid={`route-${route.id}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        route.status === "completed" ? "bg-green-500/10" :
                        route.status === "in_progress" ? "bg-blue-500/10" : "bg-gray-500/10"
                      }`}>
                        <Route className={`h-4 w-4 ${
                          route.status === "completed" ? "text-green-600" :
                          route.status === "in_progress" ? "text-blue-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{route.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {driver?.name || "Unassigned"} - {route.shopIds.length} stops
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {route.estimatedTime}m
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
