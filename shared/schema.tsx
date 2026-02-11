import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, jsonb, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users and sessions tables for Replit Auth)
export * from "./models/auth";

// Export chat models (conversations and messages tables for AI chat)
export * from "./models/chat";

// Shops table - retail outlets in the Huruma/Mathare area
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerName: text("owner_name"),
  phone: text("phone"),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  category: text("category").notNull().default("retail"), // retail, wholesale, kiosk
  status: text("status").notNull().default("active"), // active, inactive, pending
  addedBy: varchar("added_by"),
  notes: text("notes"),
});

export const insertShopSchema = createInsertSchema(shops).omit({ id: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;

// Drivers table - fleet management
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  vehicleType: text("vehicle_type").notNull(), // motorcycle, van, truck
  vehiclePlate: text("vehicle_plate"),
  status: text("status").notNull().default("available"), // available, on_route, off_duty
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Routes table - planned delivery routes
export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  driverId: varchar("driver_id"),
  shopIds: text("shop_ids").array().notNull().default(sql`'{}'::text[]`),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed
  estimatedDistance: real("estimated_distance"),
  estimatedTime: integer("estimated_time"), // in minutes
  date: text("date").notNull(),
});

export const insertRouteSchema = createInsertSchema(routes).omit({ id: true });
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

// Targets table - management targets for drivers
export const targets = pgTable("targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  targetShops: integer("target_shops").notNull(),
  targetDeliveries: integer("target_deliveries").notNull(),
  completedShops: integer("completed_shops").notNull().default(0),
  completedDeliveries: integer("completed_deliveries").notNull().default(0),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
});

export const insertTargetSchema = createInsertSchema(targets).omit({ id: true });
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type Target = typeof targets.$inferSelect;

// GeoJSON types for the Huruma/Mathare area
export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name?: string;
    description?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Point" | "LineString" | "Polygon" | "MultiPolygon";
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// AI Analytics - Route optimization suggestions
export const routeOptimizations = pgTable("route_optimizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id"),
  originalDistance: real("original_distance"),
  optimizedDistance: real("optimized_distance"),
  timeSaved: integer("time_saved"), // minutes saved
  fuelSaved: real("fuel_saved"), // liters saved
  suggestions: jsonb("suggestions"), // AI-generated route suggestions
  optimizedShopOrder: text("optimized_shop_order").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertRouteOptimizationSchema = createInsertSchema(routeOptimizations).omit({ id: true, createdAt: true });
export type InsertRouteOptimization = z.infer<typeof insertRouteOptimizationSchema>;
export type RouteOptimization = typeof routeOptimizations.$inferSelect;

// AI Analytics - Demand forecasts for shops
export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").notNull(),
  forecastDate: text("forecast_date").notNull(),
  predictedDemand: text("predicted_demand").notNull(), // high, medium, low
  confidence: real("confidence"), // 0-100 confidence score
  recommendedDeliveryDate: text("recommended_delivery_date"),
  insights: jsonb("insights"), // AI-generated insights
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({ id: true, createdAt: true });
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;
export type DemandForecast = typeof demandForecasts.$inferSelect;

// AI Analytics - Driver performance insights
export const driverInsights = pgTable("driver_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  efficiencyScore: real("efficiency_score"), // 0-100
  deliverySuccessRate: real("delivery_success_rate"), // percentage
  avgDeliveryTime: integer("avg_delivery_time"), // minutes
  insights: jsonb("insights"), // AI-generated performance insights
  recommendations: jsonb("recommendations"), // AI recommendations for improvement
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDriverInsightSchema = createInsertSchema(driverInsights).omit({ id: true, createdAt: true });
export type InsertDriverInsight = z.infer<typeof insertDriverInsightSchema>;
export type DriverInsight = typeof driverInsights.$inferSelect;

// AI Analytics - Overall analytics reports
export const analyticsReports = pgTable("analytics_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: text("report_type").notNull(), // route_optimization, demand_forecast, driver_performance, fleet_overview
  title: text("title").notNull(),
  summary: text("summary"),
  data: jsonb("data"), // Report data in JSON format
  insights: jsonb("insights"), // AI-generated insights
  generatedAt: timestamp("generated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({ id: true, generatedAt: true });
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;

// Backups table - track backup history
export const backups = pgTable("backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // manual, scheduled
  filename: text("filename").notNull(),
  size: integer("size"), // size in bytes
  recordCount: integer("record_count"), // total records backed up
  status: text("status").notNull().default("completed"), // completed, failed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });
export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;
