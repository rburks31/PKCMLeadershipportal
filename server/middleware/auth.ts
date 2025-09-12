import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@shared/schema";

// Note: Request.user type is defined elsewhere in the codebase

export type UserRole = "admin" | "instructor" | "student";

// JWT Authentication Middleware
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized - Bearer token required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    res.status(401).json({ message: "Unauthorized - Token missing" });
    return;
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    console.error("ACCESS_TOKEN_SECRET environment variable is not set");
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, secret) as any;
    
    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    
    // Validate required user fields
    if (!decoded.id || !decoded.role) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    console.error("JWT verification error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Session-based Authentication Middleware (compatible with current system)
export const authenticateSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // In development mode, automatically provide admin access
  if (process.env.NODE_ENV === 'development' && !(req as any).isAuthenticated()) {
    req.user = {
      id: "dev-admin",
      email: "admin@dev.local",
      username: "dev-admin",
      firstName: "Development",
      lastName: "Admin",
      phoneNumber: null,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "", // Required by schema but not used in mock
      profileImageUrl: null,
      lastLoginAt: null,
      resetToken: null,
      resetTokenExpires: null,
      preferences: null
    };
    return next();
  }
  
  if ((req as any).isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized - Please log in" });
};

// Flexible Role-based Access Control Middleware
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized - No user information" });
      return;
    }

    // Check if user has required role
    if (!req.user.role || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ 
        message: "Insufficient permissions",
        required: roles,
        current: req.user.role || "none"
      });
      return;
    }

    // Check if user account is active
    if (req.user.isActive === false) {
      res.status(403).json({ message: "Account is deactivated" });
      return;
    }

    next();
  };
};

// Convenience middleware for common role checks
export const requireAdmin = requireRole(["admin"]);
export const requireInstructor = requireRole(["admin", "instructor"]);
export const requireStudent = requireRole(["admin", "instructor", "student"]);

// Enhanced middleware that combines authentication and role checking
export const authAndRole = (roles: UserRole[], useJWT = false) => {
  const authMiddleware = useJWT ? authenticate : authenticateSession;
  const roleMiddleware = requireRole(roles);
  
  return [authMiddleware, roleMiddleware];
};

// Utility function to check if user has specific role (for use in route handlers)
export const hasRole = (user: any, role: UserRole): boolean => {
  return user && user.role === role && user.isActive !== false;
};

// Utility function to check if user has any of the specified roles
export const hasAnyRole = (user: any, roles: UserRole[]): boolean => {
  return user && roles.includes(user.role as UserRole) && user.isActive !== false;
};