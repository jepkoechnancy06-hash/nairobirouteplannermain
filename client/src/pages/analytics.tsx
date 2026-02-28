import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import {
  Brain,
  TrendingUp,
  Route,
  Users,
  Store,
  Target,
  BarChart3,
  Sparkles,
  RefreshCw,
  FileText,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Clock
} from "lucide-react";

interface DashboardData {
  summary: {
    totalShops: number;
    activeShops: number;
    totalDrivers: number;
    availableDrivers: number;
    totalRoutes: number;
    completedRoutes: number;
    inProgressRoutes: number;
    overallProgress: number;
    totalDistance: number;
  };
  shopsByCategory: { retail: number; wholesale: number; kiosk: number };
  driversByStatus: { available: number; onRoute: number; offDuty: number };
  routesByStatus: { planned: number; inProgress: number; completed: number };
}

interface RouteOptimizationResult {
  optimizedOrder: string[];
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  fuelSaved: number;
  suggestions: string[];
}

interface DemandForecast {
  shopId: string;
  shopName: string;
  predictedDemand: "high" | "medium" | "low";
  confidence: number;
  recommendedDeliveryDate: string;
  insights: string[];
}

interface DriverPerformance {
  driverId: string;
  driverName: string;
  efficiencyScore: number;
  deliverySuccessRate: number;
  avgDeliveryTime: number;
  insights: string[];
  recommendations: string[];
}

interface AnalyticsReport {
  id: string;
  reportType: string;
  title: string;
  summary: string;
  data: Record<string, unknown>;
  insights: string[];
  recommendations?: string[];
  generatedAt: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, testId }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  testId?: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RouteOptimizer() {
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const { toast } = useToast();
  
  const { data: routes, isLoading: routesLoading } = useQuery<{ id: string; name: string; status: string }[]>({
    queryKey: ["/api/routes"],
  });

  const optimizeMutation = useMutation({
    mutationFn: async (routeId: string) => {
      const response = await apiRequest("POST", `/api/analytics/optimize-route/${routeId}`);
      return response.json();
    },
    onSuccess: (data: RouteOptimizationResult) => {
      toast({
        title: "Route Optimized",
        description: `Saved ${data.timeSaved} minutes and ${data.fuelSaved}L of fuel`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/route-optimizations"] });
    },
    onError: () => {
      toast({ title: "Optimization Failed", variant: "destructive" });
    },
  });

  const { data: optimizationHistory } = useQuery<RouteOptimizationResult[]>({
    queryKey: ["/api/analytics/route-optimizations"],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            AI Route Optimization
          </CardTitle>
          <CardDescription>
            Optimize delivery routes using AI to reduce travel time and fuel costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="w-64" data-testid="select-route">
                <SelectValue placeholder="Select a route to optimize" />
              </SelectTrigger>
              <SelectContent>
                {routesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  routes?.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} ({route.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedRoute && optimizeMutation.mutate(selectedRoute)}
              disabled={!selectedRoute || optimizeMutation.isPending}
              data-testid="button-optimize-route"
            >
              {optimizeMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Route
                </>
              )}
            </Button>
          </div>

          {optimizeMutation.data && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Distance</p>
                    <p className="text-lg font-semibold">{optimizeMutation.data.originalDistance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Optimized Distance</p>
                    <p className="text-lg font-semibold text-green-600">{optimizeMutation.data.optimizedDistance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Saved</p>
                    <p className="text-lg font-semibold text-blue-600">{optimizeMutation.data.timeSaved} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Saved</p>
                    <p className="text-lg font-semibold text-emerald-600">{optimizeMutation.data.fuelSaved} L</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">AI Suggestions:</p>
                  <ul className="space-y-1">
                    {optimizeMutation.data.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {optimizationHistory && optimizationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optimization History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimizationHistory.slice(0, 5).map((opt, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Route optimized</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{opt.timeSaved} min saved</span>
                    <span>{opt.fuelSaved}L fuel saved</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DemandForecaster() {
  const { toast } = useToast();

  const forecastAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analytics/forecast-all-shops");
      return response.json();
    },
    onSuccess: (data: DemandForecast[]) => {
      toast({
        title: "Demand Forecast Complete",
        description: `Generated forecasts for ${data.length} shops`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/demand-forecasts"] });
    },
    onError: () => {
      toast({ title: "Forecast Failed", variant: "destructive" });
    },
  });

  const { data: forecasts, isLoading } = useQuery<DemandForecast[]>({
    queryKey: ["/api/analytics/demand-forecasts"],
  });

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            AI Demand Forecasting
          </CardTitle>
          <CardDescription>
            Predict shop restocking needs using AI analysis of delivery patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => forecastAllMutation.mutate()}
            disabled={forecastAllMutation.isPending}
            data-testid="button-forecast-demand"
          >
            {forecastAllMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Forecasts for All Shops
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forecasts && forecasts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="forecast-grid">
          {forecasts.map((forecast) => (
            <Card key={forecast.shopId} data-testid={`card-forecast-${forecast.shopId}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" data-testid={`text-shop-name-${forecast.shopId}`}>{forecast.shopName}</CardTitle>
                  <Badge variant={getDemandColor(forecast.predictedDemand)} data-testid={`badge-demand-${forecast.shopId}`}>
                    {forecast.predictedDemand} demand
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{forecast.confidence}%</span>
                  </div>
                  <Progress value={forecast.confidence} className="h-2" />
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Deliver by: {forecast.recommendedDeliveryDate}</span>
                  </div>
                  {forecast.insights && forecast.insights.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Insights:</p>
                      <ul className="space-y-1">
                        {forecast.insights.slice(0, 2).map((insight, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No forecasts yet. Click "Generate Forecasts" to analyze shop demand.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DriverAnalytics() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const { toast } = useToast();

  const analyzeAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analytics/analyze-all-drivers", { period });
      return response.json();
    },
    onSuccess: (data: DriverPerformance[]) => {
      toast({
        title: "Analysis Complete",
        description: `Analyzed performance for ${data.length} drivers`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/driver-insights"] });
    },
    onError: () => {
      toast({ title: "Analysis Failed", variant: "destructive" });
    },
  });

  const { data: insights, isLoading } = useQuery<DriverPerformance[]>({
    queryKey: ["/api/analytics/driver-insights"],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Driver Performance Analytics
          </CardTitle>
          <CardDescription>
            Analyze driver efficiency and get AI-powered improvement recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-40" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => analyzeAllMutation.mutate()}
              disabled={analyzeAllMutation.isPending}
              data-testid="button-analyze-drivers"
            >
              {analyzeAllMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze All Drivers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="driver-insights-grid">
          {insights.map((driver) => (
            <Card key={driver.driverId} data-testid={`card-driver-${driver.driverId}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" data-testid={`text-driver-name-${driver.driverId}`}>{driver.driverName}</CardTitle>
                  <div className={`text-2xl font-bold ${getScoreColor(driver.efficiencyScore)}`} data-testid={`text-score-${driver.driverId}`}>
                    {driver.efficiencyScore}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Delivery Success</p>
                    <p className="font-semibold">{driver.deliverySuccessRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Delivery Time</p>
                    <p className="font-semibold">{driver.avgDeliveryTime} min</p>
                  </div>
                </div>

                {driver.insights && driver.insights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">AI Insights:</p>
                    <ul className="space-y-1">
                      {driver.insights.slice(0, 2).map((insight, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {driver.recommendations && driver.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {driver.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No driver analytics yet. Click "Analyze All Drivers" to get AI insights.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportsSection() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("fleet_overview");

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analytics/generate-report", { reportType });
      return response.json();
    },
    onSuccess: (data: AnalyticsReport) => {
      toast({
        title: "Report Generated",
        description: data.title,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/reports"] });
    },
    onError: () => {
      toast({ title: "Report Generation Failed", variant: "destructive" });
    },
  });

  const { data: reports, isLoading } = useQuery<AnalyticsReport[]>({
    queryKey: ["/api/analytics/reports"],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Analytics Reports
          </CardTitle>
          <CardDescription>
            Generate comprehensive AI-powered reports for fleet operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-64" data-testid="select-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet_overview">Fleet Overview</SelectItem>
                <SelectItem value="route_optimization">Route Optimization</SelectItem>
                <SelectItem value="demand_forecast">Demand Forecast</SelectItem>
                <SelectItem value="driver_performance">Driver Performance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              data-testid="button-generate-report"
            >
              {generateReportMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generateReportMutation.data && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default">New Report</Badge>
              <CardTitle>{generateReportMutation.data.title}</CardTitle>
            </div>
            <CardDescription>{generateReportMutation.data.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generateReportMutation.data.insights && (
              <div>
                <p className="font-medium mb-2">Key Insights:</p>
                <ul className="space-y-2">
                  {(generateReportMutation.data.insights as string[]).map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {generateReportMutation.data.recommendations && (
              <div>
                <p className="font-medium mb-2">Recommendations:</p>
                <ul className="space-y-2">
                  {generateReportMutation.data.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">Previous Reports</h3>
          {reports.slice(0, 5).map((report) => (
            <Card key={report.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <Badge variant="outline">{report.reportType.replace(/_/g, " ")}</Badge>
                </div>
                <CardDescription>{report.summary}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="AI Analytics Portal"
        description="Powered by advanced AI for route optimization, demand forecasting, and performance insights"
      >
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
          <StatCard
            title="Active Shops"
            value={dashboardData.summary.activeShops}
            subtitle={`of ${dashboardData.summary.totalShops} total`}
            icon={Store}
            testId="card-active-shops"
          />
          <StatCard
            title="Available Drivers"
            value={dashboardData.summary.availableDrivers}
            subtitle={`of ${dashboardData.summary.totalDrivers} total`}
            icon={Users}
            testId="card-available-drivers"
          />
          <StatCard
            title="Routes Completed"
            value={dashboardData.summary.completedRoutes}
            subtitle={`${dashboardData.summary.inProgressRoutes} in progress`}
            icon={Route}
            trend="up"
            testId="card-routes-completed"
          />
          <StatCard
            title="Target Progress"
            value={`${dashboardData.summary.overallProgress}%`}
            subtitle={`${dashboardData.summary.totalDistance.toFixed(1)} km covered`}
            icon={Target}
            trend={dashboardData.summary.overallProgress >= 50 ? "up" : "down"}
            testId="card-target-progress"
          />
        </div>
      )}

      <Tabs defaultValue="routes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes" data-testid="tab-routes">
            <Route className="h-4 w-4 mr-2" />
            Route Optimization
          </TabsTrigger>
          <TabsTrigger value="demand" data-testid="tab-demand">
            <Store className="h-4 w-4 mr-2" />
            Demand Forecast
          </TabsTrigger>
          <TabsTrigger value="drivers" data-testid="tab-drivers">
            <Users className="h-4 w-4 mr-2" />
            Driver Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <RouteOptimizer />
        </TabsContent>

        <TabsContent value="demand">
          <DemandForecaster />
        </TabsContent>

        <TabsContent value="drivers">
          <DriverAnalytics />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
