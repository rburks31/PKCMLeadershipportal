import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import {
  Landing,
  Home,
  Course,
  Lesson,
  AdminPanel,
  SMSManagement,
  LiveClasses,
  Events,
  AuthPage,
  Profile,
  UserManagement,
  NotFound,
  AccessDenied,
  LoadingSpinner
} from "@/pages";

// Create a higher-order component for role-based access
const withRoleProtection = (
  Component: React.ComponentType,
  allowedRoles: UserRole[] = ["admin"]
) => {
  return () => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [_, navigate] = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate("/auth");
      } else if (
        isAuthenticated &&
        user &&
        !allowedRoles.includes(user.role as UserRole)
      ) {
        navigate("/access-denied");
      }
    }, [isAuthenticated, isLoading, user, navigate]);

    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return null;
    if (!allowedRoles.includes(user?.role as UserRole)) return <AccessDenied />;

    return <Component />;
  };
};

// Route configuration
const ROUTES = [
  { path: "/", component: Landing, public: true },
  { path: "/auth", component: AuthPage, public: true },
  { path: "/home", component: Home },
  { path: "/courses/:courseId", component: Course },
  { path: "/lessons/:lessonId", component: Lesson },
  { path: "/live-classes", component: LiveClasses },
  { path: "/events", component: Events },
  { path: "/profile", component: Profile },
  { path: "/admin", component: withRoleProtection(AdminPanel, ["admin"]) },
  { path: "/admin/sms", component: withRoleProtection(SMSManagement, ["admin"]) },
  { path: "/admin/users", component: withRoleProtection(UserManagement, ["admin"]) },
  { path: "/access-denied", component: AccessDenied, public: true },
];

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, navigate] = useLocation();

  // Automatic redirection logic
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Handle redirect after login
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
        return;
      }
      
      // Auto-redirect based on location and role
      if (location === "/" || location === "/auth") {
        if (user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      }
    }
  }, [isAuthenticated, isLoading, user, location, navigate]);

  return (
    <Switch>
      {ROUTES.map(({ path, component: Component, public: isPublic }) => (
        <Route key={path} path={path}>
          {() => {
            if (isLoading) return <LoadingSpinner />;
            if (isPublic || isAuthenticated) return <Component />;
            return <AuthPage />;
          }}
        </Route>
      ))}
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}