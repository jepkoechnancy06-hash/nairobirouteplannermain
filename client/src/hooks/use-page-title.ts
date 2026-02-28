import { useEffect } from "react";
import { useLocation } from "wouter";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/map": "Map View",
  "/shops": "Shops",
  "/drivers": "Drivers",
  "/routes": "Routes",
  "/targets": "Targets",
  "/analytics": "AI Analytics",
  "/admin": "Admin Overview",
  "/admin/users": "User Management",
  "/admin/settings": "Settings",
  "/backup": "Backup",
  "/process-map": "Process Map",
  "/orders": "Orders",
  "/dispatch": "Dispatch",
  "/reports": "Reports",
  "/products": "Products",
  "/inventory": "Inventory",
  "/suppliers": "Suppliers",
  "/procurement": "Procurement",
  "/salespersons": "Salespersons",
  "/payments": "Payments",
  "/privacy-policy": "Privacy Policy",
  "/login": "Sign In",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
};

const APP_NAME = "Veew Distributors";

export function usePageTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const title = pageTitles[location];
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [location]);
}
