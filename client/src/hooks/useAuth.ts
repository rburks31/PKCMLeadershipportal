import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // In development mode, automatically provide admin access
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && !user && !isLoading) {
    // Return a mock admin user for development
    const mockAdminUser = {
      id: "dev-admin",
      email: "admin@dev.local",
      firstName: "Development",
      lastName: "Admin",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      user: mockAdminUser,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
