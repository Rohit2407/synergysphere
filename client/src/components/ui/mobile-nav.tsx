import { Folder, CheckSquare, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Folder, label: "Projects" },
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/team", icon: Users, label: "Team" },
  ];

  return (
    <nav className="md:hidden bg-card border-b border-border">
      <div className="flex">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            href={path}
            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
              location === path
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`mobile-nav-${label.toLowerCase()}`}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
