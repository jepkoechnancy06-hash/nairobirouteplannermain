import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck, MapPin, Target, Route, Users, BarChart3, ArrowRight,
  Zap, Shield, Globe, Package, ChevronRight, Star,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Interactive GIS Mapping",
    description: "Visualize shop locations on an interactive map with custom boundaries for Huruma and Mathare areas.",
  },
  {
    icon: Route,
    title: "AI Route Optimization",
    description: "Automatically plan the most efficient delivery routes to save time and fuel costs.",
  },
  {
    icon: Users,
    title: "Fleet Management",
    description: "Track drivers and vehicles in real-time with status updates and smart assignment tools.",
  },
  {
    icon: Target,
    title: "Performance Targets",
    description: "Set and monitor daily, weekly, or monthly targets for your drivers to boost productivity.",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Analytics",
    description: "Get demand forecasts, driver insights, and optimization suggestions powered by AI.",
  },
  {
    icon: Package,
    title: "Order-to-Delivery Pipeline",
    description: "End-to-end order management from placement through dispatch to payment confirmation.",
  },
];

const stats = [
  { label: "Delivery Routes Optimized", value: "2,400+" },
  { label: "Active Retail Outlets", value: "850+" },
  { label: "Daily Dispatches", value: "120+" },
  { label: "Time Saved per Route", value: "35%" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Veew Distributors</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="#features">Features</a>
            </Button>
            <Button asChild data-testid="button-login">
              <Link href="/login">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute top-40 right-0 h-[300px] w-[300px] rounded-full bg-accent/[0.06] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Route Optimization
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Smarter Deliveries for
            <span className="relative ml-3">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nairobi
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Streamline your distribution operations with intelligent route planning,
            real-time fleet tracking, and AI-driven analytics. Built for distributors
            in Huruma and Mathare.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg shadow-primary/20" data-testid="button-get-started">
              <Link href="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <a href="#features">
                See How It Works
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>Real-time GPS Tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span>AI Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage deliveries
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A complete platform built specifically for distributors operating in urban Nairobi
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="flex flex-col p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to optimize your routes?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join distributors across Nairobi who are saving time, fuel, and money
            with intelligent route planning.
          </p>
          <Button size="lg" asChild className="mt-8 h-12 px-8 text-base shadow-lg shadow-primary/20">
            <Link href="/login">
              Start Now -- It's Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">Veew Distributors</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span>&copy; {new Date().getFullYear()} Veew Distributors</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
