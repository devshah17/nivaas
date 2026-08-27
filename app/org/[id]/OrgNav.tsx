"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/components/OrgProvider";
import { ArrowLeft, Users, Settings, Package, Home, Receipt, Menu, LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NivaasLogo from "@/components/NivaasLogo";

export default function OrgNav() {
  const pathname = usePathname();
  const { org, role, status } = useOrg();

  const baseUrl = `/org/${org._id}`;

  const navItems = [
    { name: "Dashboard", href: baseUrl, icon: LayoutDashboard, show: true },
    { name: "Tiffins", href: `${baseUrl}/tiffins`, icon: Package, show: true },
    { name: "Rentals", href: `${baseUrl}/rentals`, icon: Home, show: true },
    { name: "Bills", href: `${baseUrl}/bills`, icon: Receipt, show: true },
    { name: "Members", href: `${baseUrl}/members`, icon: Users, show: role === "admin" },
    { name: "Settings", href: `${baseUrl}/settings`, icon: Settings, show: role === "admin" },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center gap-4">
          {/* Left: mobile menu + back + org name */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8" />
                }
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="px-5 py-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <NivaasLogo size={24} />
                    <span className="truncate text-sm font-semibold">{org.name}</span>
                    {role === "admin" && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">Admin</Badge>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="px-3 py-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition mb-3"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </Link>
                  <nav className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={buttonVariants({
                            variant: isActive ? "secondary" : "ghost",
                            className: "justify-start h-9 px-2 text-sm",
                          })}
                        >
                          <item.icon className="h-4 w-4 mr-2 shrink-0" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Back link — desktop */}
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden md:flex shrink-0 h-7 px-2 text-muted-foreground -ml-1" })}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Back</span>
            </Link>

            <div className="hidden md:block h-4 w-px bg-border shrink-0" />

            {/* Org name */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate text-sm max-w-37.5 sm:max-w-xs">
                {org.name}
              </span>
              {role === "admin" && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] px-1.5 py-0 h-4 shrink-0">
                  Admin
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Logo mark */}
          <Link href="/dashboard" className="shrink-0 hidden sm:block">
            <NivaasLogo size={28} />
          </Link>
        </div>
      </div>

      {/* Desktop tab nav */}
      {status === true && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border hidden md:block">
          <nav className="flex space-x-0 overflow-x-auto" aria-label="Org navigation">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    whitespace-nowrap py-2.5 px-3 border-b-2 text-xs font-medium flex items-center gap-1.5 transition-colors
                    ${isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Mobile tab nav (only bottom icons when active) */}
      {status === true && (
        <div className="md:hidden border-t border-border overflow-x-auto">
          <nav className="flex px-2" aria-label="Org navigation mobile">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-0
                    ${isActive ? "text-primary" : "text-muted-foreground"}
                  `}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="truncate w-full text-center">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
