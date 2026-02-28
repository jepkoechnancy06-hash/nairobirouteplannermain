import { useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
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
};

const sectionNames: Record<string, string> = {
  admin: "Administration",
};

export function PageBreadcrumb() {
  const [location] = useLocation();

  if (location === "/") return null;

  const segments = location.split("/").filter(Boolean);
  const pageName = routeNames[location] || segments[segments.length - 1];

  const parentPath = segments.length > 1 ? `/${segments[0]}` : undefined;
  const parentName = parentPath
    ? sectionNames[segments[0]] || routeNames[parentPath] || segments[0]
    : undefined;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {parentName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={parentPath!}>{parentName}</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
