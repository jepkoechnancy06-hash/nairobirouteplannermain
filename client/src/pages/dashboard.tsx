import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { MapView } from "@/components/map-view";
import {
  Store, Truck, Route, Target, TrendingUp, Clock, MapPin, ClipboardList,
  PackageCheck, CreditCard, Plus, ArrowRight, Activity,
} from "lucide-react";
import type { Shop, Driver, Route as RouteType, Target as TargetType } from "@shared/schema";
import { fetchList } from "@/lib/queryClient";

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Button variant="outline" size="sm" asChild className="h-9 gap-2">
      <Link href={href}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

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

  const activeShops = shops.filter((s) => s.status === "active").length;
  const availableDrivers = drivers.filter((d) => d.status === "available").length;
  const onRouteDrivers = drivers.filter((d) => d.status === "on_route").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRoutes = routes.filter((r) => r.date === todayStr);
  const completedRoutes = routes.filter((r) => r.status === "completed").length;

  const currentTargets = targets.filter(
    (t) => t.startDate <= todayStr && t.endDate >= todayStr
  );
  const totalTargetShops = currentTargets.reduce((s, t) => s + t.targetShops, 0);
  const totalCompletedShops = currentTargets.reduce((s, t) => s + t.completedShops, 0);
  const targetProgress = totalTargetShops > 0 ? Math.round((totalCompletedShops / totalTargetShops) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
      {/* Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of operations in Huruma & Mathare
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/shops" icon={Plus} label="Add Shop" />
          <QuickAction href="/orders" icon={ClipboardList} label="New Order" />
          <QuickAction href="/dispatch" icon={PackageCheck} label="Dispatch" />
        </div>
      </div>

      {/* Primary Stats */}
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
          value={todayRoutes.length}
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

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orders"
          value={orders.length}
          subtitle={`${(orders as any[]).filter((o) => o.status === "pending").length} pending`}
          icon={ClipboardList}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Dispatches"
          value={(dispatches as any[]).filter((d) => d.status !== "completed").length}
          subtitle={`${(dispatches as any[]).filter((d) => d.status === "packing").length} packing, ${(dispatches as any[]).filter((d) => d.status === "in_transit" || d.status === "flagged_off").length} in transit`}
          icon={PackageCheck}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Order Value"
          value={`KES ${(orders as any[]).reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()}`}
          subtitle={`${(orders as any[]).filter((o) => o.status === "delivered" || o.status === "paid").length} delivered`}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard
          title="Payments"
          value={`KES ${(payments as any[]).filter((p) => p.status === "confirmed").reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}`}
          subtitle={`${(payments as any[]).filter((p) => p.status === "pending" || p.status === "received").length} pending`}
          icon={CreditCard}
          iconColor="text-emerald-500"
        />
      </div>

      {/* Map & Targets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Coverage Area</CardTitle>
              <CardDescription>Shop locations in Huruma & Mathare</CardDescription>
            </div>
            <Badge variant="outline" className="font-normal">
              <MapPin className="mr-1 h-3 w-3" />
              {shops.length} locations
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-72 overflow-hidden rounded-b-lg">
              <MapView
                shops={shops.slice(0, 10)}
                drivers={drivers.filter((d) => d.currentLatitude && d.currentLongitude)}
                showAreaBoundaries={true}
                height="100%"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Active Targets</CardTitle>
              <CardDescription>Driver performance tracking</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
              <Link href="/targets">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentTargets.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">No active targets</p>
                <p className="text-xs text-muted-foreground">Set targets to track driver progress</p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href="/targets">Create Target</Link>
                </Button>
              </div>
            ) : (
              currentTargets.slice(0, 4).map((target) => {
                const driver = drivers.find((d) => d.id === target.driverId);
                const shopPct = Math.round((target.completedShops / target.targetShops) * 100);
                const deliveryPct = Math.round((target.completedDeliveries / target.targetDeliveries) * 100);

                return (
                  <div key={target.id} className="space-y-2.5 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{driver?.name || "Unknown Driver"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{target.period} target</p>
                        </div>
                      </div>
                      <Badge variant={shopPct >= 80 ? "default" : shopPct >= 50 ? "secondary" : "outline"}>
                        {shopPct}%
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Shops visited</span>
                        <span className="tabular-nums">{target.completedShops}/{target.targetShops}</span>
                      </div>
                      <Progress value={shopPct} className="h-1.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Deliveries</span>
                        <span className="tabular-nums">{target.completedDeliveries}/{target.targetDeliveries}</span>
                      </div>
                      <Progress value={deliveryPct} className="h-1.5" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Shops */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Shops</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
              <Link href="/shops">View All <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {shops.length === 0 ? (
              <EmptyState icon={Store} message="No shops added yet" />
            ) : (
              shops.slice(0, 5).map((shop) => (
                <div key={shop.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50" data-testid={`recent-shop-${shop.id}`}>
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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Driver Status</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
              <Link href="/drivers">View All <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {drivers.length === 0 ? (
              <EmptyState icon={Truck} message="No drivers added yet" />
            ) : (
              drivers.slice(0, 5).map((driver) => {
                const statusColor =
                  driver.status === "available" ? "text-green-600 bg-green-500/10" :
                  driver.status === "on_route" ? "text-blue-600 bg-blue-500/10" :
                  "text-gray-600 bg-gray-500/10";
                const [textColor, bgColor] = statusColor.split(" ");

                return (
                  <div key={driver.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50" data-testid={`driver-status-${driver.id}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColor}`}>
                      <Truck className={`h-4 w-4 ${textColor}`} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">{driver.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{driver.vehicleType} - {driver.vehiclePlate}</p>
                    </div>
                    <Badge variant={driver.status === "available" ? "default" : "secondary"} className="text-xs capitalize">
                      {driver.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Today's Routes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Today's Routes</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
              <Link href="/routes">View All <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayRoutes.length === 0 ? (
              <EmptyState icon={Route} message="No routes planned for today" />
            ) : (
              todayRoutes.slice(0, 5).map((route) => {
                const driver = drivers.find((d) => d.id === route.driverId);
                const statusColor =
                  route.status === "completed" ? "text-green-600 bg-green-500/10" :
                  route.status === "in_progress" ? "text-blue-600 bg-blue-500/10" :
                  "text-gray-600 bg-gray-500/10";
                const [textColor, bgColor] = statusColor.split(" ");

                return (
                  <div key={route.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50" data-testid={`route-${route.id}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColor}`}>
                      <Route className={`h-4 w-4 ${textColor}`} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">{route.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {driver?.name || "Unassigned"} - {route.shopIds.length} stops
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
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

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
