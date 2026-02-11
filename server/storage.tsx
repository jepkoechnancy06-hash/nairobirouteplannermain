import { 
  type Shop, type InsertShop,
  type Driver, type InsertDriver,
  type Route, type InsertRoute,
  type Target, type InsertTarget
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Shops
  getAllShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined>;
  deleteShop(id: string): Promise<boolean>;
  
  // Drivers
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;
  
  // Routes
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: string): Promise<boolean>;
  
  // Targets
  getAllTargets(): Promise<Target[]>;
  getTarget(id: string): Promise<Target | undefined>;
  createTarget(target: InsertTarget): Promise<Target>;
  updateTarget(id: string, target: Partial<InsertTarget>): Promise<Target | undefined>;
  deleteTarget(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private shops: Map<string, Shop>;
  private drivers: Map<string, Driver>;
  private routes: Map<string, Route>;
  private targets: Map<string, Target>;

  constructor() {
    this.shops = new Map();
    this.drivers = new Map();
    this.routes = new Map();
    this.targets = new Map();
    
    this.seedData();
  }

  private seedData() {
    const today = new Date().toISOString().split("T")[0];
    
    // Seed some sample shops in Huruma/Mathare area
    const sampleShops: InsertShop[] = [
      { name: "Mama Njeri Kiosk", ownerName: "Grace Njeri", phone: "+254712345678", address: "Huruma Estate Block A", latitude: -1.2585, longitude: 36.8615, category: "kiosk", status: "active" },
      { name: "Mathare General Store", ownerName: "John Kamau", phone: "+254723456789", address: "Mathare 4A", latitude: -1.2565, longitude: 36.8590, category: "retail", status: "active" },
      { name: "Juja Road Wholesale", ownerName: "Peter Ochieng", phone: "+254734567890", address: "Juja Road", latitude: -1.2595, longitude: 36.8650, category: "wholesale", status: "active" },
      { name: "Karibu Mini Mart", ownerName: "Mary Wanjiku", phone: "+254745678901", address: "Huruma Market", latitude: -1.2610, longitude: 36.8600, category: "retail", status: "active" },
      { name: "Baba Junior Shop", ownerName: "James Mwangi", phone: "+254756789012", address: "Mathare North", latitude: -1.2520, longitude: 36.8640, category: "kiosk", status: "pending" },
      { name: "Upendo Store", ownerName: "Elizabeth Akinyi", phone: "+254767890123", address: "Ngei Estate", latitude: -1.2630, longitude: 36.8580, category: "retail", status: "active" },
    ];

    sampleShops.forEach(shop => {
      const id = randomUUID();
      this.shops.set(id, { ...shop, id } as Shop);
    });

    // Seed sample drivers
    const sampleDrivers: InsertDriver[] = [
      { name: "David Omondi", phone: "+254778901234", vehicleType: "motorcycle", vehiclePlate: "KMCA 123A", status: "available", currentLatitude: -1.2590, currentLongitude: 36.8620 },
      { name: "Samuel Kiprop", phone: "+254789012345", vehicleType: "van", vehiclePlate: "KBZ 456B", status: "on_route", currentLatitude: -1.2575, currentLongitude: 36.8605 },
      { name: "Michael Otieno", phone: "+254790123456", vehicleType: "motorcycle", vehiclePlate: "KMCB 789C", status: "available" },
      { name: "Joseph Wafula", phone: "+254701234567", vehicleType: "truck", vehiclePlate: "KCA 012D", status: "off_duty" },
    ];

    const driverIds: string[] = [];
    sampleDrivers.forEach(driver => {
      const id = randomUUID();
      driverIds.push(id);
      this.drivers.set(id, { ...driver, id } as Driver);
    });

    // Seed sample routes
    const shopIds = Array.from(this.shops.keys());
    const sampleRoutes: InsertRoute[] = [
      { name: "Morning Route - Zone A", driverId: driverIds[0], shopIds: shopIds.slice(0, 3), status: "planned", estimatedDistance: 2.5, estimatedTime: 45, date: today },
      { name: "Afternoon Delivery", driverId: driverIds[1], shopIds: shopIds.slice(2, 5), status: "in_progress", estimatedDistance: 3.2, estimatedTime: 55, date: today },
    ];

    sampleRoutes.forEach(route => {
      const id = randomUUID();
      this.routes.set(id, { ...route, id } as Route);
    });

    // Seed sample targets
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const sampleTargets: InsertTarget[] = [
      { driverId: driverIds[0], period: "weekly", targetShops: 30, targetDeliveries: 50, completedShops: 18, completedDeliveries: 32, startDate: today, endDate: endOfWeek.toISOString().split("T")[0] },
      { driverId: driverIds[1], period: "daily", targetShops: 8, targetDeliveries: 15, completedShops: 5, completedDeliveries: 9, startDate: today, endDate: today },
    ];

    sampleTargets.forEach(target => {
      const id = randomUUID();
      this.targets.set(id, { ...target, id } as Target);
    });
  }

  // Shops
  async getAllShops(): Promise<Shop[]> {
    return Array.from(this.shops.values());
  }

  async getShop(id: string): Promise<Shop | undefined> {
    return this.shops.get(id);
  }

  async createShop(insertShop: InsertShop): Promise<Shop> {
    const id = randomUUID();
    const shop: Shop = { ...insertShop, id } as Shop;
    this.shops.set(id, shop);
    return shop;
  }

  async updateShop(id: string, updates: Partial<InsertShop>): Promise<Shop | undefined> {
    const shop = this.shops.get(id);
    if (!shop) return undefined;
    const updated = { ...shop, ...updates };
    this.shops.set(id, updated);
    return updated;
  }

  async deleteShop(id: string): Promise<boolean> {
    return this.shops.delete(id);
  }

  // Drivers
  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = { ...insertDriver, id } as Driver;
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Routes
  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: string): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = randomUUID();
    const route: Route = { ...insertRoute, id } as Route;
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    const updated = { ...route, ...updates };
    this.routes.set(id, updated);
    return updated;
  }

  async deleteRoute(id: string): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Targets
  async getAllTargets(): Promise<Target[]> {
    return Array.from(this.targets.values());
  }

  async getTarget(id: string): Promise<Target | undefined> {
    return this.targets.get(id);
  }

  async createTarget(insertTarget: InsertTarget): Promise<Target> {
    const id = randomUUID();
    const target: Target = { ...insertTarget, id } as Target;
    this.targets.set(id, target);
    return target;
  }

  async updateTarget(id: string, updates: Partial<InsertTarget>): Promise<Target | undefined> {
    const target = this.targets.get(id);
    if (!target) return undefined;
    const updated = { ...target, ...updates };
    this.targets.set(id, updated);
    return updated;
  }

  async deleteTarget(id: string): Promise<boolean> {
    return this.targets.delete(id);
  }
}

export const storage = new MemStorage();
