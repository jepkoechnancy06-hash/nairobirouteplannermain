import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, MapPin, Target, Route, Users, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Veew Distributors</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Login</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Route Optimization for
            <span className="block text-primary">Huruma & Mathare</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Streamline your distribution operations with intelligent route planning, 
            fleet management, and performance tracking designed for the streets of Nairobi.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free to use for your distribution team
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">
            Everything you need to manage deliveries
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Built specifically for distributors operating in urban Nairobi
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Interactive GIS Mapping</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visualize all your shop locations on an interactive map with custom boundaries for Huruma and Mathare areas.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Route className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Smart Route Optimization</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automatically plan the most efficient delivery routes to save time and fuel costs.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Fleet Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track your drivers and vehicles in real-time with status updates and assignment tools.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Performance Targets</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set and monitor daily, weekly, or monthly targets for your drivers to boost productivity.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Real-time Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get instant insights into your operations with live statistics and progress tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Shop Registry</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maintain a complete database of all retail outlets with contact details and GPS coordinates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Veew Distributors. All rights reserved.</p>
          <p className="mt-1">Serving Huruma & Mathare, Nairobi, Kenya</p>
        </div>
      </footer>
    </div>
  );
}
