import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Store, Truck, Route, Target, Map, Brain, Database,
  ClipboardList, PackageCheck, FileBarChart, Users, Settings, Package,
  Warehouse, Building2, ShoppingCart, UserCheck, CreditCard, GitBranch,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const pages = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, group: "Main" },
  { name: "Map View", path: "/map", icon: Map, group: "Main" },
  { name: "Shops", path: "/shops", icon: Store, group: "Main" },
  { name: "Drivers", path: "/drivers", icon: Truck, group: "Main" },
  { name: "Salespersons", path: "/salespersons", icon: UserCheck, group: "Main" },
  { name: "Process Map", path: "/process-map", icon: GitBranch, group: "Operations" },
  { name: "Orders", path: "/orders", icon: ClipboardList, group: "Operations" },
  { name: "Dispatch", path: "/dispatch", icon: PackageCheck, group: "Operations" },
  { name: "Payments", path: "/payments", icon: CreditCard, group: "Operations" },
  { name: "Reports", path: "/reports", icon: FileBarChart, group: "Operations" },
  { name: "Products", path: "/products", icon: Package, group: "Inventory" },
  { name: "Inventory", path: "/inventory", icon: Warehouse, group: "Inventory" },
  { name: "Suppliers", path: "/suppliers", icon: Building2, group: "Inventory" },
  { name: "Procurement", path: "/procurement", icon: ShoppingCart, group: "Inventory" },
  { name: "Routes", path: "/routes", icon: Route, group: "Planning" },
  { name: "Targets", path: "/targets", icon: Target, group: "Planning" },
  { name: "AI Analytics", path: "/analytics", icon: Brain, group: "Planning" },
];

const adminPages = [
  { name: "Admin Overview", path: "/admin", icon: LayoutDashboard, group: "Admin" },
  { name: "User Management", path: "/admin/users", icon: Users, group: "Admin" },
  { name: "Settings", path: "/admin/settings", icon: Settings, group: "Admin" },
  { name: "Backup", path: "/backup", icon: Database, group: "Admin" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setLocation(path);
      setOpen(false);
    },
    [setLocation]
  );

  const allPages = isAdmin ? [...pages, ...adminPages] : pages;
  const groups = Array.from(new Set(allPages.map((p) => p.group)));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search pages...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group, i) => (
            <div key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {allPages
                  .filter((p) => p.group === group)
                  .map((page) => (
                    <CommandItem
                      key={page.path}
                      value={page.name}
                      onSelect={() => navigate(page.path)}
                    >
                      <page.icon className="mr-2 h-4 w-4" />
                      <span>{page.name}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
