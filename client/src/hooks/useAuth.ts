import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string | null;
  isActive: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // In development mode, automatically provide admin access
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && !user && !isLoading) {
    // Return a mock admin user for development
    const mockAdminUser: AuthUser = {
      id: "dev-admin",
      email: "admin@dev.local",
      username: "dev-admin",
      firstName: "Development",
      lastName: "Admin",
      phoneNumber: null,
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
    user: user as AuthUser | null,
    isLoading,
    isAuthenticated: !!user,
  };
}
