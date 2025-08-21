import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy - can authenticate with either username or email
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'login', // This will accept either username or email
        passwordField: 'password'
      },
      async (login, password, done) => {
        try {
          // Try to find user by email first, then by username
          let user = await storage.getUserByEmail(login);
          if (!user) {
            user = await storage.getUserByUsername(login);
          }
          
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email/username or password" });
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, username, password, firstName, lastName } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, and password are required" });
      }

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'student'
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Update last login time
        await storage.updateLastLogin(user.id);
        
        res.status(200).json({ 
          id: user.id, 
          email: user.email, 
          username: user.username,
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role 
        });
      });
    })(req, res, next);
  });

  // Logout endpoint - support both GET and POST
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/auth");
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phoneNumber: req.user.phoneNumber,
      role: req.user.role
    });
  });

  // Update user profile
  app.put("/api/user/profile", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const { firstName, lastName, phoneNumber } = req.body;
    const userId = req.user.id;

    storage.updateUserProfile(userId, {
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
    }).then((updatedUser) => {
      res.json(updatedUser);
    }).catch((error) => {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    });
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export { hashPassword };