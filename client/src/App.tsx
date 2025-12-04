import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { MobileNav } from "@/components/ui/mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ProjectDetail from "@/pages/project-detail";
import { Tasks } from "@/pages/tasks";
import { Team } from "@/pages/team";
import NotFound from "@/pages/not-found";

// 👇 import the theme toggle component
import ThemeToggle from "@/components/ThemeToggle";

function AppHeader() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <i className="fas fa-sphere text-primary-foreground"></i>
              </div>
              <h1 className="text-xl font-bold text-foreground hidden sm:block">
                SynergySphere
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-projects"
              >
                Projects
              </Link>
              <Link
                href="/tasks"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                data-testid="nav-tasks"
              >
                My Tasks
              </Link>
              <Link
                href="/team"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                data-testid="nav-team"
              >
                Team
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {/* 👇 Theme toggle button */}
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {user.fullName}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem data-testid="menu-profile">
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-preferences">
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive"
                    data-testid="menu-logout"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      {isMobile && <MobileNav />}
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetail} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      <Route path="/team">
        <ProtectedRoute component={Team} />
      </Route>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;