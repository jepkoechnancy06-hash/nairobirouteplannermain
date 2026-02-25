/**
 * Hybrid Storage System
 * 
 * Handles both in-memory and database storage seamlessly.
 * Falls back to in-memory for non-critical operations when database is unavailable.
 */

import { 
  type Shop, type InsertShop,
  type Driver, type InsertDriver,
  type Route, type InsertRoute,
  type Target, type InsertTarget,
  type Product, type InsertProduct,
  type Inventory, type InsertInventory,
  type StockMovement, type InsertStockMovement,
  type Supplier, type InsertSupplier,
  type Procurement, type InsertProcurement,
  type Salesperson, type InsertSalesperson,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Dispatch, type InsertDispatch,
  type Parcel, type InsertParcel,
  type Payment, type InsertPayment,
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

// In-memory storage fallback
class MemStorage {
  private shops: Map<string, Shop> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private routes: Map<string, Route> = new Map();
  private targets: Map<string, Target> = new Map();
  private products: Map<string, Product> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private stockMovements: Map<string, StockMovement> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private procurements: Map<string, Procurement> = new Map();
  private salespersons: Map<string, Salesperson> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();
  private dispatches: Map<string, Dispatch> = new Map();
  private parcels: Map<string, Parcel> = new Map();
  private payments: Map<string, Payment> = new Map();

  // Helper methods
  private generateId(): string {
    return randomUUID();
  }

  private now(): Date {
    return new Date();
  }

  // Shops
  async getAllShops(): Promise<Shop[]> {
    return Array.from(this.shops.values());
  }

  async getShop(id: string): Promise<Shop | undefined> {
    return this.shops.get(id);
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const id = this.generateId();
    const newShop: Shop = { ...shop, id, createdAt: this.now(), updatedAt: this.now() };
    this.shops.set(id, newShop);
    return newShop;
  }

  async updateShop(id: string, updates: Partial<InsertShop>): Promise<Shop | undefined> {
    const shop = this.shops.get(id);
    if (!shop) return undefined;
    const updatedShop = { ...shop, ...updates, updatedAt: this.now() };
    this.shops.set(id, updatedShop);
    return updatedShop;
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

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = this.generateId();
    const newDriver: Driver = { ...driver, id, createdAt: this.now(), updatedAt: this.now() };
    this.drivers.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updatedDriver = { ...driver, ...updates, updatedAt: this.now() };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
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

  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.generateId();
    const newRoute: Route = { ...route, id, createdAt: this.now(), updatedAt: this.now() };
    this.routes.set(id, newRoute);
    return newRoute;
  }

  async updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    const updatedRoute = { ...route, ...updates, updatedAt: this.now() };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
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

  async createTarget(target: InsertTarget): Promise<Target> {
    const id = this.generateId();
    const newTarget: Target = { ...target, id, createdAt: this.now(), updatedAt: this.now() };
    this.targets.set(id, newTarget);
    return newTarget;
  }

  async updateTarget(id: string, updates: Partial<InsertTarget>): Promise<Target | undefined> {
    const target = this.targets.get(id);
    if (!target) return undefined;
    const updatedTarget = { ...target, ...updates, updatedAt: this.now() };
    this.targets.set(id, updatedTarget);
    return updatedTarget;
  }

  async deleteTarget(id: string): Promise<boolean> {
    return this.targets.delete(id);
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.generateId();
    const newProduct: Product = { ...product, id, createdAt: this.now(), updatedAt: this.now() };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updatedProduct = { ...product, ...updates, updatedAt: this.now() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Inventory
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventory(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = this.generateId();
    const newInventory: Inventory = { ...inventory, id, createdAt: this.now(), updatedAt: this.now() };
    this.inventory.set(id, newInventory);
    return newInventory;
  }

  async updateInventory(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const inventory = this.inventory.get(id);
    if (!inventory) return undefined;
    const updatedInventory = { ...inventory, ...updates, updatedAt: this.now() };
    this.inventory.set(id, updatedInventory);
    return updatedInventory;
  }

  async deleteInventory(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  // Stock Movements
  async getAllStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values());
  }

  async getStockMovement(id: string): Promise<StockMovement | undefined> {
    return this.stockMovements.get(id);
  }

  async createStockMovement(stockMovement: InsertStockMovement): Promise<StockMovement> {
    const id = this.generateId();
    const newStockMovement: StockMovement = { ...stockMovement, id, createdAt: this.now() };
    this.stockMovements.set(id, newStockMovement);
    return newStockMovement;
  }

  async deleteStockMovement(id: string): Promise<boolean> {
    return this.stockMovements.delete(id);
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.generateId();
    const newSupplier: Supplier = { ...supplier, id, createdAt: this.now(), updatedAt: this.now() };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    const updatedSupplier = { ...supplier, ...updates, updatedAt: this.now() };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Procurements
  async getAllProcurements(): Promise<Procurement[]> {
    return Array.from(this.procurements.values());
  }

  async getProcurement(id: string): Promise<Procurement | undefined> {
    return this.procurements.get(id);
  }

  async createProcurement(procurement: InsertProcurement): Promise<Procurement> {
    const id = this.generateId();
    const newProcurement: Procurement = { ...procurement, id, createdAt: this.now(), updatedAt: this.now() };
    this.procurements.set(id, newProcurement);
    return newProcurement;
  }

  async updateProcurement(id: string, updates: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const procurement = this.procurements.get(id);
    if (!procurement) return undefined;
    const updatedProcurement = { ...procurement, ...updates, updatedAt: this.now() };
    this.procurements.set(id, updatedProcurement);
    return updatedProcurement;
  }

  async deleteProcurement(id: string): Promise<boolean> {
    return this.procurements.delete(id);
  }

  // Salespersons
  async getAllSalespersons(): Promise<Salesperson[]> {
    return Array.from(this.salespersons.values());
  }

  async getSalesperson(id: string): Promise<Salesperson | undefined> {
    return this.salespersons.get(id);
  }

  async createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson> {
    const id = this.generateId();
    const newSalesperson: Salesperson = { ...salesperson, id, createdAt: this.now(), updatedAt: this.now() };
    this.salespersons.set(id, newSalesperson);
    return newSalesperson;
  }

  async updateSalesperson(id: string, updates: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    const salesperson = this.salespersons.get(id);
    if (!salesperson) return undefined;
    const updatedSalesperson = { ...salesperson, ...updates, updatedAt: this.now() };
    this.salespersons.set(id, updatedSalesperson);
    return updatedSalesperson;
  }

  async deleteSalesperson(id: string): Promise<boolean> {
    return this.salespersons.delete(id);
  }

  // Orders
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.generateId();
    const newOrder: Order = { ...order, id, createdAt: this.now(), updatedAt: this.now() };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updatedOrder = { ...order, ...updates, updatedAt: this.now() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Order Items
  async getAllOrderItems(): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values());
  }

  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.generateId();
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  async updateOrderItem(id: string, updates: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;
    const updatedOrderItem = { ...orderItem, ...updates };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Dispatches
  async getAllDispatches(): Promise<Dispatch[]> {
    return Array.from(this.dispatches.values());
  }

  async getDispatch(id: string): Promise<Dispatch | undefined> {
    return this.dispatches.get(id);
  }

  async createDispatch(dispatch: InsertDispatch): Promise<Dispatch> {
    const id = this.generateId();
    const newDispatch: Dispatch = { ...dispatch, id, createdAt: this.now(), updatedAt: this.now() };
    this.dispatches.set(id, newDispatch);
    return newDispatch;
  }

  async updateDispatch(id: string, updates: Partial<InsertDispatch>): Promise<Dispatch | undefined> {
    const dispatch = this.dispatches.get(id);
    if (!dispatch) return undefined;
    const updatedDispatch = { ...dispatch, ...updates, updatedAt: this.now() };
    this.dispatches.set(id, updatedDispatch);
    return updatedDispatch;
  }

  async deleteDispatch(id: string): Promise<boolean> {
    return this.dispatches.delete(id);
  }

  // Parcels
  async getAllParcels(): Promise<Parcel[]> {
    return Array.from(this.parcels.values());
  }

  async getParcel(id: string): Promise<Parcel | undefined> {
    return this.parcels.get(id);
  }

  async createParcel(parcel: InsertParcel): Promise<Parcel> {
    const id = this.generateId();
    const newParcel: Parcel = { ...parcel, id, createdAt: this.now(), updatedAt: this.now() };
    this.parcels.set(id, newParcel);
    return newParcel;
  }

  async updateParcel(id: string, updates: Partial<InsertParcel>): Promise<Parcel | undefined> {
    const parcel = this.parcels.get(id);
    if (!parcel) return undefined;
    const updatedParcel = { ...parcel, ...updates, updatedAt: this.now() };
    this.parcels.set(id, updatedParcel);
    return updatedParcel;
  }

  async deleteParcel(id: string): Promise<boolean> {
    return this.parcels.delete(id);
  }

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.generateId();
    const newPayment: Payment = { ...payment, id, createdAt: this.now(), updatedAt: this.now() };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    const updatedPayment = { ...payment, ...updates, updatedAt: this.now() };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }
}

export class HybridStorage implements IStorage {
  private databaseStorage: IStorage | null = null;
  private memoryStorage: IStorage = new MemStorage();
  private useDatabase: boolean = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    const hasDatabaseUrl = process.env.DATABASE_URL;
    
    if (hasDatabaseUrl) {
      try {
        const { DatabaseStorage } = await import("./database-storage");
        this.databaseStorage = new DatabaseStorage();
        this.useDatabase = true;
        console.log("✅ Database storage initialized successfully");
      } catch (error) {
        console.error("⚠️  Failed to initialize database storage, falling back to memory:", error instanceof Error ? error.message : String(error));
        this.useDatabase = false;
      }
    } else {
      console.warn("⚠️  No DATABASE_URL provided, using in-memory storage only");
      this.useDatabase = false;
    }
  }

  private getStorage(): IStorage {
    return this.useDatabase && this.databaseStorage ? this.databaseStorage : this.memoryStorage;
  }

  // Forward all methods to the appropriate storage
  async getAllShops(): Promise<Shop[]> {
    return this.getStorage().getAllShops();
  }

  async getShop(id: string): Promise<Shop | undefined> {
    return this.getStorage().getShop(id);
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    return this.getStorage().createShop(shop);
  }

  async updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined> {
    return this.getStorage().updateShop(id, shop);
  }

  async deleteShop(id: string): Promise<boolean> {
    return this.getStorage().deleteShop(id);
  }

  async getAllDrivers(): Promise<Driver[]> {
    return this.getStorage().getAllDrivers();
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.getStorage().getDriver(id);
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    return this.getStorage().createDriver(driver);
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    return this.getStorage().updateDriver(id, driver);
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.getStorage().deleteDriver(id);
  }

  async getAllRoutes(): Promise<Route[]> {
    return this.getStorage().getAllRoutes();
  }

  async getRoute(id: string): Promise<Route | undefined> {
    return this.getStorage().getRoute(id);
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    return this.getStorage().createRoute(route);
  }

  async updateRoute(id: string, route: Partial<InsertRoute>): Promise<Route | undefined> {
    return this.getStorage().updateRoute(id, route);
  }

  async deleteRoute(id: string): Promise<boolean> {
    return this.getStorage().deleteRoute(id);
  }

  async getAllTargets(): Promise<Target[]> {
    return this.getStorage().getAllTargets();
  }

  async getTarget(id: string): Promise<Target | undefined> {
    return this.getStorage().getTarget(id);
  }

  async createTarget(target: InsertTarget): Promise<Target> {
    return this.getStorage().createTarget(target);
  }

  async updateTarget(id: string, target: Partial<InsertTarget>): Promise<Target | undefined> {
    return this.getStorage().updateTarget(id, target);
  }

  async deleteTarget(id: string): Promise<boolean> {
    return this.getStorage().deleteTarget(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.getStorage().getAllProducts();
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.getStorage().getProduct(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.getStorage().createProduct(product);
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.getStorage().updateProduct(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.getStorage().deleteProduct(id);
  }

  async getAllInventory(): Promise<Inventory[]> {
    return this.getStorage().getAllInventory();
  }

  async getInventory(id: string): Promise<Inventory | undefined> {
    return this.getStorage().getInventory(id);
  }

  async createInventory(inventory: InsertInventory): Promise<Inventory> {
    return this.getStorage().createInventory(inventory);
  }

  async updateInventory(id: string, inventory: Partial<InsertInventory>): Promise<Inventory | undefined> {
    return this.getStorage().updateInventory(id, inventory);
  }

  async deleteInventory(id: string): Promise<boolean> {
    return this.getStorage().deleteInventory(id);
  }

  async getAllStockMovements(): Promise<StockMovement[]> {
    return this.getStorage().getAllStockMovements();
  }

  async getStockMovement(id: string): Promise<StockMovement | undefined> {
    return this.getStorage().getStockMovement(id);
  }

  async createStockMovement(stockMovement: InsertStockMovement): Promise<StockMovement> {
    return this.getStorage().createStockMovement(stockMovement);
  }

  async deleteStockMovement(id: string): Promise<boolean> {
    return this.getStorage().deleteStockMovement(id);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return this.getStorage().getAllSuppliers();
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.getStorage().getSupplier(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    return this.getStorage().createSupplier(supplier);
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    return this.getStorage().updateSupplier(id, supplier);
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.getStorage().deleteSupplier(id);
  }

  async getAllProcurements(): Promise<Procurement[]> {
    return this.getStorage().getAllProcurements();
  }

  async getProcurement(id: string): Promise<Procurement | undefined> {
    return this.getStorage().getProcurement(id);
  }

  async createProcurement(procurement: InsertProcurement): Promise<Procurement> {
    return this.getStorage().createProcurement(procurement);
  }

  async updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    return this.getStorage().updateProcurement(id, procurement);
  }

  async deleteProcurement(id: string): Promise<boolean> {
    return this.getStorage().deleteProcurement(id);
  }

  async getAllSalespersons(): Promise<Salesperson[]> {
    return this.getStorage().getAllSalespersons();
  }

  async getSalesperson(id: string): Promise<Salesperson | undefined> {
    return this.getStorage().getSalesperson(id);
  }

  async createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson> {
    return this.getStorage().createSalesperson(salesperson);
  }

  async updateSalesperson(id: string, salesperson: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    return this.getStorage().updateSalesperson(id, salesperson);
  }

  async deleteSalesperson(id: string): Promise<boolean> {
    return this.getStorage().deleteSalesperson(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.getStorage().getAllOrders();
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.getStorage().getOrder(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return this.getStorage().createOrder(order);
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    return this.getStorage().updateOrder(id, order);
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.getStorage().deleteOrder(id);
  }

  async getAllOrderItems(): Promise<OrderItem[]> {
    return this.getStorage().getAllOrderItems();
  }

  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    return this.getStorage().getOrderItem(id);
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    return this.getStorage().createOrderItem(orderItem);
  }

  async updateOrderItem(id: string, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    return this.getStorage().updateOrderItem(id, orderItem);
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    return this.getStorage().deleteOrderItem(id);
  }

  async getAllDispatches(): Promise<Dispatch[]> {
    return this.getStorage().getAllDispatches();
  }

  async getDispatch(id: string): Promise<Dispatch | undefined> {
    return this.getStorage().getDispatch(id);
  }

  async createDispatch(dispatch: InsertDispatch): Promise<Dispatch> {
    return this.getStorage().createDispatch(dispatch);
  }

  async updateDispatch(id: string, dispatch: Partial<InsertDispatch>): Promise<Dispatch | undefined> {
    return this.getStorage().updateDispatch(id, dispatch);
  }

  async deleteDispatch(id: string): Promise<boolean> {
    return this.getStorage().deleteDispatch(id);
  }

  async getAllParcels(): Promise<Parcel[]> {
    return this.getStorage().getAllParcels();
  }

  async getParcel(id: string): Promise<Parcel | undefined> {
    return this.getStorage().getParcel(id);
  }

  async createParcel(parcel: InsertParcel): Promise<Parcel> {
    return this.getStorage().createParcel(parcel);
  }

  async updateParcel(id: string, parcel: Partial<InsertParcel>): Promise<Parcel | undefined> {
    return this.getStorage().updateParcel(id, parcel);
  }

  async deleteParcel(id: string): Promise<boolean> {
    return this.getStorage().deleteParcel(id);
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.getStorage().getAllPayments();
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.getStorage().getPayment(id);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    return this.getStorage().createPayment(payment);
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    return this.getStorage().updatePayment(id, payment);
  }

  async deletePayment(id: string): Promise<boolean> {
    return this.getStorage().deletePayment(id);
  }
}
