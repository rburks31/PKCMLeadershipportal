import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware/errorHandler";
import rateLimit from "express-rate-limit";

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));
app.use(compression());
app.disable("x-powered-by");

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later",
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Enhanced logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, path, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Capture response JSON for API endpoints
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
  if (path.startsWith("/api")) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get("Content-Length") || 0;
    
    if (path.startsWith("/api")) {
      let logLine = `[${new Date().toISOString()}] ${method} ${path} ${statusCode} ${duration}ms ${contentLength}b - ${ip}`;
      
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        if (jsonStr.length > 80) {
          logLine += ` :: ${jsonStr.slice(0, 79)}…`;
        } else {
          logLine += ` :: ${jsonStr}`;
        }
      }
      
      log(logLine);
    } else if (process.env.NODE_ENV === "development") {
      // Log static file requests in development only
      log(`[${new Date().toISOString()}] ${method} ${path} ${statusCode} ${duration}ms - ${ip}`);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Apply rate limiting only in production or when explicitly enabled
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_RATE_LIMIT === "true") {
      app.use("/api", apiLimiter);
      log("🛡️  Rate limiting enabled for API routes");
    }
    
    // Use centralized error handling
    app.use(errorHandler);
    
    // Environment-based setup
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      log("🔧 Development mode: Vite middleware enabled");
    } else {
      serveStatic(app);
      log("📦 Production mode: Serving static files");
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ 
      port, 
      host: "0.0.0.0",
      reusePort: true 
    }, () => {
      log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
      log(`🔐 Security headers enabled with Helmet`);
      log(`⚡ Compression enabled`);
      log(`📊 Enhanced logging active`);
      log(`🛡️  Error handling middleware configured`);
      
      if (process.env.NODE_ENV === "production") {
        log(`🌐 Server ready for production traffic`);
      } else {
        log(`🔧 Development server ready with hot reload`);
      }
    });
  } catch (error: any) {
    log(`❌ Server startup failed: ${error.message}`);
    if (error.stack) {
      log(`📍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
})();