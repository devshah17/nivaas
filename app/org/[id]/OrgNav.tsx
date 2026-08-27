"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/components/OrgProvider";
import { ArrowLeft, Users, Settings, Package, Home, Receipt, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function OrgNav() {
  const pathname = usePathname();
  const { org, role, status } = useOrg();

  const baseUrl = `/org/${org._id}`;

  const navItems = [
    { name: "Dashboard", href: baseUrl, icon: Home, show: true },
    { name: "Tiffins", href: `${baseUrl}/tiffins`, icon: Package, show: true },
    { name: "Rentals", href: `${baseUrl}/rentals`, icon: Home, show: true },
    { name: "Bills", href: `${baseUrl}/bills`, icon: Receipt, show: true },
    { name: "Members", href: `${baseUrl}/members`, icon: Users, show: role === "admin" },
    { name: "Settings", href: `${baseUrl}/settings`, icon: Settings, show: role === "admin" },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <header className="bg-background border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger 
                render={
                  <Button variant="ghost" size="icon" className="md:hidden" />
                }
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2 truncate">
                    {org.name}
                    {role === "admin" && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Admin</Badge>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1 mt-6">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={buttonVariants({ variant: isActive ? "secondary" : "ghost", className: "justify-start h-10 px-2" })}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link 
              href="/dashboard"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:flex shrink-0 -ml-2 text-muted-foreground" })}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>

            <div className="hidden sm:block h-4 w-px bg-border shrink-0"></div>
            
            <div className="font-semibold text-foreground truncate flex items-center gap-2">
              <span className="truncate max-w-37.5 sm:max-w-xs">{org.name}</span>
              {role === "admin" && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] px-1 py-0 h-4">
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {status === true && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border hidden md:block">
          <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tabs">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex items-center transition-colors
                    ${isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 mr-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
