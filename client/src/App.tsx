import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Course from "@/pages/course";
import Lesson from "@/pages/lesson";
import AdminPanel from "@/pages/admin";
import LiveClasses from "@/pages/live-classes";
import AuthPage from "@/pages/auth-page";

function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination in localStorage
      localStorage.setItem('redirectAfterLogin', '/admin');
      navigate('/auth');
    } else if (isAuthenticated && user && (user as any)?.role === 'admin') {
      // Clear redirect if we're already on admin and authenticated
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth via useEffect
  }

  if ((user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, navigate] = useLocation();

  // Handle redirect after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else if ((user as any)?.role === 'admin' && location === '/') {
        // Auto-redirect admins to admin panel from home
        navigate('/admin');
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/admin" component={AuthPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/courses/:courseId" component={Course} />
          <Route path="/lessons/:lessonId" component={Lesson} />
          <Route path="/live-classes" component={LiveClasses} />
          <Route path="/admin" component={ProtectedAdminRoute} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
