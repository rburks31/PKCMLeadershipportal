import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmail } from "./emailService";
import { 
  sendSMS, 
  sendMMS, 
  sendBulkSMS, 
  sendWelcomeSMS, 
  sendCourseEnrollmentSMS, 
  sendLessonReminderSMS,
  sendCertificateEarnedSMS,
  sendLiveClassReminderSMS,
  SMS_TEMPLATES 
} from "./smsService";
import { randomBytes } from "crypto";
import { 
  insertCourseSchema, 
  insertDiscussionSchema,
  insertAnnouncementSchema,
  insertPaymentSchema,
  insertContentLibrarySchema,
  insertCourseReviewSchema,
  insertSystemSettingSchema,
  insertLiveClassSchema,
  insertLiveClassAttendeeSchema,
  type User,
  type Course,
  type Payment,
  type Announcement,
  type ContentLibrary,
  type AuditLog,
  type CourseReview,
  type LiveClass,
  type LiveClassAttendee
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  courses,
  modules,
  lessons,
  enrollments, 
  lessonProgress, 
  discussions, 
  payments,
  announcements,
  notifications,
  contentLibrary,
  auditLogs,
  courseReviews,
  instructorAssignments,
  systemSettings,
  liveClasses,
  liveClassAttendees,
  liveClassResources,
  adminActivities,
  adminOnboarding
} from "@shared/schema";
import { eq, desc, sql, count, avg, and, asc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - now using local auth instead of Replit auth
  setupAuth(app);

  // Password reset routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, return success even if user doesn't exist
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await storage.setPasswordResetToken(email, resetToken, resetTokenExpires);

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);

      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update user's password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      // Clear the reset token
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });



  // Enrollment routes
  app.post("/api/courses/:id/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const courseId = parseInt(req.params.id);
      
      const isEnrolled = await storage.isUserEnrolled(userId, courseId);
      if (isEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      await storage.enrollUser({ userId, courseId });
      res.json({ message: "Successfully enrolled" });
    } catch (error) {
      console.error("Error enrolling user:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.get("/api/my-courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Lesson routes
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Progress routes
  app.get("/api/courses/:courseId/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const courseId = parseInt(req.params.courseId);
      const progress = await storage.getCourseProgress(userId, courseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/lessons/:lessonId/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lessonId = parseInt(req.params.lessonId);
      const { isCompleted, progressPercentage } = req.body;
      
      const progress = await storage.updateLessonProgress({
        userId,
        lessonId,
        isCompleted,
        progressPercentage,
        completedAt: isCompleted ? new Date() : null,
      });

      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Discussion routes
  app.get("/api/lessons/:lessonId/discussions", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const discussions = await storage.getLessonDiscussions(lessonId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.post("/api/lessons/:lessonId/discussions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lessonId = parseInt(req.params.lessonId);
      
      const validatedData = insertDiscussionSchema.parse({
        lessonId,
        userId,
        content: req.body.content,
        parentId: req.body.parentId || null,
      });

      const discussion = await storage.createDiscussion(validatedData);
      res.json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });

  // Admin middleware to check admin role
  const isAdmin = async (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user has admin role directly from the user object
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.adminUser = user;
    next();
  };

  // ==== ADMIN ROUTES ====

  // Test Email endpoint
  app.post("/api/admin/test-email", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required" });
      }

      const emailSent = await sendWelcomeEmail(email, "Test User", "admin");
      
      if (emailSent) {
        res.json({ message: "Test email sent successfully!" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Test SMS endpoint
  app.post("/api/admin/test-sms", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      const smsResult = await sendSMS({ to: phoneNumber, message });
      
      if (smsResult.success) {
        res.json({ message: "Test SMS sent successfully!" });
      } else {
        res.status(500).json({ message: `Failed to send test SMS: ${smsResult.error}` });
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ message: "Failed to send test SMS" });
    }
  });

  // Admin Dashboard Analytics
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ${users}) as total_users,
          (SELECT COUNT(*) FROM ${users} WHERE role = 'student') as student_count,
          (SELECT COUNT(*) FROM ${users} WHERE role = 'instructor') as instructor_count,
          (SELECT COUNT(*) FROM ${courses}) as total_courses,
          (SELECT COUNT(*) FROM ${enrollments}) as total_enrollments,
          (SELECT COUNT(*) FROM ${discussions}) as active_discussions,
          (SELECT AVG(
            CASE 
              WHEN e.completed_at IS NOT NULL THEN 100 
              ELSE COALESCE(
                (SELECT AVG(lp.progress_percentage) 
                 FROM ${lessonProgress} lp 
                 JOIN lessons l ON lp.lesson_id = l.id
                 JOIN modules m ON l.module_id = m.id
                 WHERE m.course_id = e.course_id AND lp.user_id = e.user_id), 0
              )
            END
          ) FROM ${enrollments} e) as completion_rate
      `);
      
      res.json(analytics.rows[0]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // User Management
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userList = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,  // Added missing phoneNumber field
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).orderBy(desc(users.createdAt));
      res.json(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user endpoint
  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        phoneNumber: req.body.phoneNumber || null, // Optional phone number for SMS
        role,
        isActive: true
      });

      // Send welcome email
      console.log(`About to send welcome email to newly created user: ${email}, name: ${firstName} ${lastName}, role: ${role}`);
      try {
        const emailSent = await sendWelcomeEmail(email, `${firstName} ${lastName}`, role);
        if (emailSent) {
          console.log(`✅ Welcome email sent successfully to ${email}`);
        } else {
          console.error(`❌ Failed to send welcome email to ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      // Send welcome SMS if phone number is provided
      if (newUser.phoneNumber) {
        try {
          console.log(`About to send welcome SMS to newly created user: ${newUser.phoneNumber}`);
          const smsResult = await sendWelcomeSMS(newUser.phoneNumber, `${firstName} ${lastName}`);
          if (smsResult.success) {
            console.log(`✅ Welcome SMS sent successfully to ${newUser.phoneNumber}`);
          } else {
            console.error(`❌ Failed to send welcome SMS to ${newUser.phoneNumber}: ${smsResult.error}`);
          }
        } catch (smsError) {
          console.error('❌ Error sending welcome SMS:', smsError);
          // Don't fail user creation if SMS fails
        }
      }

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Delete user endpoint
  app.delete("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user (this will also cascade delete related data like enrollments, progress, etc.)
      await storage.deleteUser(userId);

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;
      
      if (!["student", "instructor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await db.update(users).set({ role }).where(eq(users.id, userId));
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "update_user_role",
        resourceType: "user",
        resourceId: userId,
        details: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      
      // Soft delete - deactivate user instead of removing
      await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "deactivate_user",
        resourceType: "user",
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Course Management
  app.get("/api/admin/courses", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const courseList = await db.query.courses.findMany({
        with: {
          instructor: {
            columns: { firstName: true, lastName: true, email: true }
          },
          modules: {
            with: {
              lessons: true
            }
          }
        },
        orderBy: desc(courses.createdAt)
      });
      
      res.json(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/admin/courses", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { modules: moduleData, ...courseFields } = req.body;
      
      // Get instructor ID from the authenticated user
      const instructorId = req.adminUser?.id || req.user?.id;
      
      console.log("Creating course - instructorId:", instructorId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Course fields:", courseFields);
      
      if (!instructorId) {
        return res.status(400).json({ message: "Unable to identify instructor" });
      }
      
      // Validate course data with instructor ID
      const courseData = insertCourseSchema.parse({
        ...courseFields,
        instructorId
      });
      
      // Create course
      const [newCourse] = await db.insert(courses).values(courseData).returning();
      
      // Create modules and lessons if provided
      if (moduleData && moduleData.length > 0) {
        for (const moduleInfo of moduleData) {
          const [newModule] = await db.insert(modules).values({
            courseId: newCourse.id,
            title: moduleInfo.title,
            description: moduleInfo.description,
            orderIndex: moduleInfo.order || 1,
          }).returning();
          
          // Create lessons for this module
          if (moduleInfo.lessons && moduleInfo.lessons.length > 0) {
            for (const lessonInfo of moduleInfo.lessons) {
              await db.insert(lessons).values({
                moduleId: newModule.id,
                title: lessonInfo.title,
                content: lessonInfo.content,
                videoUrl: lessonInfo.video_url || null,
                orderIndex: lessonInfo.order || 1,
                isPublished: true, // Auto-publish lessons for admin-created courses
              });
            }
          }
        }
      }
      
      // Fetch the complete course with modules and lessons
      const completeNewCourse = await db.query.courses.findFirst({
        where: eq(courses.id, newCourse.id),
        with: {
          instructor: {
            columns: { firstName: true, lastName: true, email: true }
          },
          modules: {
            with: {
              lessons: true
            }
          }
        }
      });
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "create_course",
        resourceType: "course",
        resourceId: newCourse.id.toString(),
        details: { 
          title: newCourse.title,
          modulesCount: moduleData?.length || 0,
          lessonsCount: moduleData?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json(completeNewCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.delete("/api/admin/courses/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      await db.delete(courses).where(eq(courses.id, courseId));
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "delete_course",
        resourceType: "course",
        resourceId: courseId.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  app.patch("/api/admin/courses/:id/publish", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { isPublished } = req.body;
      
      await db.update(courses)
        .set({ isPublished })
        .where(eq(courses.id, courseId));
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser?.id || req.user?.claims?.sub,
        action: isPublished ? "publish_course" : "unpublish_course",
        resourceType: "course",
        resourceId: courseId.toString(),
        details: { isPublished },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      
      res.json({ message: `Course ${isPublished ? 'published' : 'unpublished'} successfully` });
    } catch (error) {
      console.error("Error updating course publish status:", error);
      res.status(500).json({ message: "Failed to update course status" });
    }
  });

  // Student course access endpoints
  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Get course with basic info first
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Only show published courses to non-admin users
      const user = req.user as any;
      if (!course.isPublished && user?.role !== 'admin') {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Get instructor info
      const [instructor] = await db.select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      }).from(users).where(eq(users.id, course.instructorId));
      
      // Get modules with lessons
      const courseModules = await db.select()
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(asc(modules.orderIndex));
      
      // Get lessons for each module
      const modulesWithLessons = await Promise.all(
        courseModules.map(async (module) => {
          const moduleLessons = await db.select()
            .from(lessons)
            .where(and(
              eq(lessons.moduleId, module.id),
              eq(lessons.isPublished, true)
            ))
            .orderBy(asc(lessons.orderIndex));
          
          return {
            ...module,
            lessons: moduleLessons
          };
        })
      );
      
      const courseWithDetails = {
        ...course,
        instructor,
        modules: modulesWithLessons
      };
      
      res.json(courseWithDetails);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Student Progress Tracking
  app.get("/api/admin/progress", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const progressData = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          c.title as course_title,
          e.enrolled_at,
          e.completed_at,
          COUNT(l.id) as total_lessons,
          COUNT(CASE WHEN lp.is_completed THEN 1 END) as completed_lessons,
          AVG(lp.progress_percentage) as avg_progress
        FROM ${users} u
        JOIN ${enrollments} e ON u.id = e.user_id
        JOIN ${courses} c ON e.course_id = c.id
        LEFT JOIN modules m ON c.id = m.course_id
        LEFT JOIN lessons l ON m.id = l.module_id
        LEFT JOIN ${lessonProgress} lp ON l.id = lp.lesson_id AND u.id = lp.user_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.first_name, u.last_name, u.email, c.title, e.enrolled_at, e.completed_at, c.id
        ORDER BY e.enrolled_at DESC
      `);
      
      res.json(progressData.rows);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Payment Management
  app.get("/api/admin/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const paymentsList = await db.execute(sql`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          c.title as course_title
        FROM ${payments} p
        JOIN ${users} u ON p.user_id = u.id
        JOIN ${courses} c ON p.course_id = c.id
        ORDER BY p.created_at DESC
      `);
      
      res.json(paymentsList.rows);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Discussion Management
  app.get("/api/admin/discussions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const discussionsList = await db.execute(sql`
        SELECT 
          d.*,
          u.first_name,
          u.last_name,
          u.email,
          l.title as lesson_title,
          c.title as course_title
        FROM ${discussions} d
        JOIN ${users} u ON d.user_id = u.id
        JOIN lessons l ON d.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN ${courses} c ON m.course_id = c.id
        WHERE d.parent_id IS NULL
        ORDER BY d.created_at DESC
        LIMIT 50
      `);
      
      res.json(discussionsList.rows);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.post("/api/admin/discussions/:id/respond", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { content } = req.body;
      const discussionId = parseInt(req.params.id);
      
      // Get the original discussion to find the lesson ID
      const [originalDiscussion] = await db.select().from(discussions).where(eq(discussions.id, discussionId));
      if (!originalDiscussion) {
        return res.status(404).json({ message: "Discussion not found" });
      }
      
      const response = await db.insert(discussions).values({
        lessonId: originalDiscussion.lessonId,
        userId: req.adminUser.id,
        content,
        parentId: discussionId
      }).returning();
      
      res.json(response[0]);
    } catch (error) {
      console.error("Error responding to discussion:", error);
      res.status(500).json({ message: "Failed to respond to discussion" });
    }
  });

  // Announcements
  app.get("/api/admin/announcements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcementsList = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
      res.json(announcementsList);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/admin/announcements", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { 
        title, 
        message, 
        sendEmail, 
        sendSMS, 
        recipientType, 
        courseId 
      } = req.body;

      // Validate required fields
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }

      if (!sendEmail && !sendSMS) {
        return res.status(400).json({ message: "At least one communication method must be selected" });
      }

      // Get recipients based on type
      let recipients: any[] = [];
      
      if (recipientType === "all") {
        const allUsers = await db.select({
          id: users.id,
          email: users.email,
          phoneNumber: users.phoneNumber,
          firstName: users.firstName,
          lastName: users.lastName,
        }).from(users);
        recipients = allUsers;
      } else if (recipientType === "students") {
        const students = await db.select({
          id: users.id,
          email: users.email,
          phoneNumber: users.phoneNumber,
          firstName: users.firstName,
          lastName: users.lastName,
        }).from(users).where(eq(users.role, "student"));
        recipients = students;
      } else if (recipientType === "instructors") {
        const instructors = await db.select({
          id: users.id,
          email: users.email,
          phoneNumber: users.phoneNumber,
          firstName: users.firstName,
          lastName: users.lastName,
        }).from(users).where(eq(users.role, "instructor"));
        recipients = instructors;
      } else if (recipientType === "course" && courseId) {
        const courseEnrollees = await db.execute(sql`
          SELECT u.id, u.email, u.phone_number, u.first_name, u.last_name
          FROM ${users} u
          INNER JOIN ${enrollments} e ON u.id = e.user_id
          WHERE e.course_id = ${courseId}
        `);
        recipients = courseEnrollees.rows;
      }

      if (recipients.length === 0) {
        return res.status(400).json({ message: "No recipients found for the selected criteria" });
      }

      // Create announcement record
      const [newAnnouncement] = await db.insert(announcements).values({
        title,
        content: message,
        authorId: user.id,
      }).returning();

      let emailsSent = 0;
      let smsSent = 0;

      // Send emails if requested
      if (sendEmail) {
        for (const recipient of recipients) {
          if (recipient.email) {
            try {
              await sendEmail({
                to: recipient.email,
                from: process.env.SENDGRID_VERIFIED_SENDER!,
                subject: `PKCM Announcement: ${title}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                      <h2 style="color: #333; margin-bottom: 20px;">PKCM Leadership and Ministry Class</h2>
                      <h3 style="color: #2563eb; margin-bottom: 15px;">${title}</h3>
                      <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                        <p style="color: #555; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
                      </div>
                      <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Best regards,<br>
                        PKCM Leadership Team
                      </p>
                    </div>
                  </div>
                `,
                text: `PKCM Announcement: ${title}\n\n${message}\n\nBest regards,\nPKCM Leadership Team`
              });
              emailsSent++;
            } catch (error) {
              console.error(`Failed to send email to ${recipient.email}:`, error);
            }
          }
        }
      }

      // Send SMS if requested
      if (sendSMS) {
        for (const recipient of recipients) {
          if (recipient.phoneNumber || recipient.phone_number) {
            const phone = recipient.phoneNumber || recipient.phone_number;
            try {
              await sendSMS(
                phone,
                `PKCM Announcement: ${title}\n\n${message}\n\n- PKCM Leadership Team`
              );
              smsSent++;
            } catch (error) {
              console.error(`Failed to send SMS to ${phone}:`, error);
            }
          }
        }
      }

      // Log the action
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "send_announcement",
        resourceType: "announcement",
        resourceId: newAnnouncement.id.toString(),
        details: { 
          title, 
          recipientType, 
          recipientCount: recipients.length,
          emailsSent,
          smsSent 
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json({
        announcement: newAnnouncement,
        recipientCount: recipients.length,
        emailsSent,
        smsSent,
        message: `Announcement sent successfully to ${recipients.length} recipients`
      });
    } catch (error) {
      console.error("Error sending announcement:", error);
      res.status(500).json({ message: "Failed to send announcement" });
    }
  });

  // Content Library
  app.get("/api/admin/content-library", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const contentList = await db.execute(sql`
        SELECT 
          cl.*,
          u.first_name,
          u.last_name
        FROM ${contentLibrary} cl
        JOIN ${users} u ON cl.uploaded_by = u.id
        ORDER BY cl.created_at DESC
      `);
      
      res.json(contentList.rows);
    } catch (error) {
      console.error("Error fetching content library:", error);
      res.status(500).json({ message: "Failed to fetch content library" });
    }
  });

  // Course Reviews Management
  app.get("/api/admin/reviews", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reviewsList = await db.execute(sql`
        SELECT 
          cr.*,
          u.first_name,
          u.last_name,
          u.email,
          c.title as course_title
        FROM ${courseReviews} cr
        JOIN ${users} u ON cr.user_id = u.id
        JOIN ${courses} c ON cr.course_id = c.id
        ORDER BY cr.created_at DESC
      `);
      
      res.json(reviewsList.rows);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Bulk Actions
  app.post("/api/admin/bulk-enroll", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userIds, courseId } = req.body;
      
      const enrollmentPromises = userIds.map((userId: string) =>
        db.insert(enrollments).values({
          userId,
          courseId: parseInt(courseId)
        }).onConflictDoNothing()
      );
      
      await Promise.all(enrollmentPromises);
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "bulk_enroll",
        resourceType: "enrollment",
        details: { userIds, courseId, count: userIds.length },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.json({ message: `Successfully enrolled ${userIds.length} users` });
    } catch (error) {
      console.error("Error bulk enrolling users:", error);
      res.status(500).json({ message: "Failed to bulk enroll users" });
    }
  });

  // System Settings
  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await db.select().from(systemSettings);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings/:key", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { value } = req.body;
      const key = req.params.key;
      
      await db.insert(systemSettings).values({
        key,
        value,
        updatedBy: req.adminUser.id
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          updatedBy: req.adminUser.id,
          updatedAt: new Date()
        }
      });

      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Test email connection
  app.post("/api/admin/test-email", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { to, subject, message } = req.body;
      
      const success = await sendEmail({
        to: to || "admin@dev.local",
        from: process.env.SENDGRID_VERIFIED_SENDER!,
        subject: subject || "PKCM Email Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">PKCM Email Test</h2>
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <p style="color: #555; line-height: 1.6; margin: 0;">
                  ${message || "This is a test email to verify SendGrid integration is working properly."}
                </p>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                PKCM Platform Team
              </p>
            </div>
          </div>
        `,
        text: `PKCM Email Test\n\n${message || "This is a test email to verify SendGrid integration is working properly."}\n\nBest regards,\nPKCM Platform Team`
      });

      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Test SMS connection
  app.post("/api/admin/test-sms", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { to, message } = req.body;
      
      await sendSMS(
        to || "+1234567890",
        message || "PKCM SMS Test: This is a test message to verify Twilio integration is working properly."
      );

      res.json({ message: "Test SMS sent successfully" });
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ message: "Failed to send test SMS" });
    }
  });

  // Video meeting management endpoints
  app.post("/api/admin/video-meetings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const meetingData = req.body;
      
      // Generate meeting details based on provider
      let meetingDetails = {};
      switch (meetingData.provider) {
        case "zoom":
          meetingDetails = {
            meetingId: `zoom_${Date.now()}`,
            meetingUrl: `https://zoom.us/j/${Date.now()}`,
            meetingPassword: meetingData.requirePassword ? generateRandomPassword() : null,
          };
          break;
        case "meet":
          meetingDetails = {
            meetingId: `meet_${Date.now()}`,
            meetingUrl: `https://meet.google.com/${generateMeetCode()}`,
            meetingPassword: null, // Google Meet doesn't use passwords
          };
          break;
        case "teams":
          meetingDetails = {
            meetingId: `teams_${Date.now()}`,
            meetingUrl: `https://teams.microsoft.com/l/meetup-join/${generateTeamsCode()}`,
            meetingPassword: meetingData.requirePassword ? generateRandomPassword() : null,
          };
          break;
        case "videosdk":
          meetingDetails = {
            meetingId: `videosdk_${Date.now()}`,
            meetingUrl: `https://your-videosdk-domain.com/meeting/${generateRandomCode()}`,
            meetingPassword: meetingData.requirePassword ? generateRandomPassword() : null,
          };
          break;
        default:
          meetingDetails = {
            meetingId: `custom_${Date.now()}`,
            meetingUrl: `https://your-custom-domain.com/meeting/${generateRandomCode()}`,
            meetingPassword: meetingData.requirePassword ? generateRandomPassword() : null,
          };
      }

      const [newMeeting] = await db.insert(videoMeetings).values({
        title: meetingData.meetingTitle,
        description: meetingData.meetingDescription,
        provider: meetingData.provider,
        meetingId: meetingDetails.meetingId,
        meetingUrl: meetingDetails.meetingUrl,
        meetingPassword: meetingDetails.meetingPassword,
        scheduledDateTime: new Date(meetingData.scheduledDateTime),
        duration: meetingData.duration,
        maxParticipants: meetingData.maxParticipants,
        courseId: meetingData.courseId || null,
        instructorId: user.id,
        isRecorded: meetingData.isRecorded,
        requirePassword: meetingData.requirePassword,
        enableWaitingRoom: meetingData.enableWaitingRoom,
        enableChat: meetingData.enableChat,
        enableScreenShare: meetingData.enableScreenShare,
        allowEarlyEntry: meetingData.allowEarlyEntry,
        settings: {
          provider: meetingData.provider,
          originalRequest: meetingData
        }
      }).returning();

      // Log the meeting creation
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "create_video_meeting",
        resourceType: "video_meeting",
        resourceId: newMeeting.id.toString(),
        details: { title: meetingData.meetingTitle, provider: meetingData.provider },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.json({
        message: "Video meeting created successfully",
        meeting: newMeeting,
        title: newMeeting.title
      });
    } catch (error) {
      console.error("Error creating video meeting:", error);
      res.status(500).json({ message: "Failed to create video meeting" });
    }
  });

  // Test video provider connection
  app.post("/api/admin/test-video-provider", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { provider } = req.body;
      
      // Simulate provider connection test
      switch (provider) {
        case "zoom":
          // In a real implementation, you would test the Zoom SDK connection here
          if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
            throw new Error("Zoom SDK credentials not configured");
          }
          break;
        case "meet":
          // Test Google Meet API connection
          if (!process.env.GOOGLE_API_KEY) {
            throw new Error("Google API credentials not configured");
          }
          break;
        case "teams":
          // Test Microsoft Teams API connection
          if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
            throw new Error("Microsoft Teams credentials not configured");
          }
          break;
        case "videosdk":
          // Test VideoSDK connection
          if (!process.env.VIDEOSDK_API_KEY) {
            throw new Error("VideoSDK API credentials not configured");
          }
          break;
        case "custom":
          // For custom implementation, just return success
          break;
        default:
          throw new Error(`Unknown video provider: ${provider}`);
      }

      res.json({ 
        message: `${provider} connection test successful`,
        provider: provider,
        status: "connected"
      });
    } catch (error) {
      console.error(`Error testing ${req.body.provider} connection:`, error);
      res.status(500).json({ 
        message: error.message || "Failed to test video provider connection",
        provider: req.body.provider,
        status: "failed"
      });
    }
  });

  // Get video meetings
  app.get("/api/admin/video-meetings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const meetings = await db.select().from(videoMeetings).orderBy(videoMeetings.scheduledDateTime);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching video meetings:", error);
      res.status(500).json({ message: "Failed to fetch video meetings" });
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await db.execute(sql`
        SELECT 
          al.*,
          u.first_name,
          u.last_name,
          u.email
        FROM ${auditLogs} al
        JOIN ${users} u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);
      
      res.json(logs.rows);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ==== LIVE CLASSES ROUTES ====

  // Get all live classes for a course
  app.get("/api/courses/:courseId/live-classes", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      const classes = await db.query.liveClasses.findMany({
        where: eq(liveClasses.courseId, courseId),
        with: {
          instructor: {
            columns: { firstName: true, lastName: true, email: true }
          },
          attendees: {
            with: {
              user: {
                columns: { firstName: true, lastName: true, email: true }
              }
            }
          }
        },
        orderBy: [liveClasses.scheduledAt]
      });

      res.json(classes);
    } catch (error) {
      console.error("Error fetching live classes:", error);
      res.status(500).json({ message: "Failed to fetch live classes" });
    }
  });

  // Get upcoming live classes for user
  app.get("/api/live-classes/upcoming", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const upcomingClasses = await db.execute(sql`
        SELECT 
          lc.*,
          c.title as course_title,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          lca.status as attendance_status
        FROM ${liveClasses} lc
        JOIN ${courses} c ON lc.course_id = c.id
        JOIN ${users} u ON lc.instructor_id = u.id
        LEFT JOIN ${liveClassAttendees} lca ON lc.id = lca.live_class_id AND lca.user_id = ${userId}
        WHERE lc.scheduled_at > NOW()
        AND (
          lca.user_id IS NOT NULL OR 
          EXISTS (
            SELECT 1 FROM ${enrollments} e 
            WHERE e.course_id = lc.course_id AND e.user_id = ${userId}
          )
        )
        ORDER BY lc.scheduled_at ASC
        LIMIT 10
      `);

      res.json(upcomingClasses.rows);
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      res.status(500).json({ message: "Failed to fetch upcoming classes" });
    }
  });

  // Create a new live class (admin/instructor only)
  app.post("/api/live-classes", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!["admin", "instructor"].includes(user.role)) {
        return res.status(403).json({ message: "Instructor or admin access required" });
      }

      const liveClassData = insertLiveClassSchema.parse(req.body);
      liveClassData.instructorId = user.id;

      // Generate meeting URL based on platform
      let meetingUrl = "";
      let meetingId = "";
      
      if (liveClassData.platform === "zoom") {
        // In a real implementation, you would call Zoom API here
        meetingId = `zoom-${Date.now()}`;
        meetingUrl = `https://zoom.us/j/${meetingId}`;
      } else if (liveClassData.platform === "google_meet") {
        // In a real implementation, you would call Google Meet API here
        meetingId = `meet-${Date.now()}`;
        meetingUrl = `https://meet.google.com/${meetingId}`;
      }

      liveClassData.meetingId = meetingId;
      liveClassData.meetingUrl = meetingUrl;

      const [newClass] = await db.insert(liveClasses).values(liveClassData).returning();

      // Auto-enroll all course participants
      if (liveClassData.courseId) {
        const enrolledUsers = await db.execute(sql`
          SELECT user_id FROM ${enrollments} 
          WHERE course_id = ${liveClassData.courseId}
        `);

        const attendeePromises = enrolledUsers.rows.map((enrollment: any) =>
          db.insert(liveClassAttendees).values({
            liveClassId: newClass.id,
            userId: enrollment.user_id,
            status: "registered"
          })
        );

        await Promise.all(attendeePromises);
      }

      // Log the action
      await db.insert(auditLogs).values({
        userId: user.claims.sub,
        action: "create_live_class",
        resourceType: "live_class",
        resourceId: newClass.id.toString(),
        details: { title: newClass.title, platform: newClass.platform },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json(newClass);
    } catch (error) {
      console.error("Error creating live class:", error);
      res.status(500).json({ message: "Failed to create live class" });
    }
  });

  // Register for a live class
  app.post("/api/live-classes/:id/register", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const liveClassId = parseInt(req.params.id);

      // Check if user is enrolled in the course
      const liveClass = await db.query.liveClasses.findFirst({
        where: eq(liveClasses.id, liveClassId),
        with: { course: true }
      });

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.courseId, liveClass.courseId),
          eq(enrollments.userId, userId)
        )
      });

      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled in the course to join this class" });
      }

      // Register for the class
      await db.insert(liveClassAttendees).values({
        liveClassId,
        userId,
        status: "registered"
      }).onConflictDoUpdate({
        target: [liveClassAttendees.liveClassId, liveClassAttendees.userId],
        set: { status: "registered" }
      });

      res.json({ message: "Successfully registered for live class" });
    } catch (error) {
      console.error("Error registering for live class:", error);
      res.status(500).json({ message: "Failed to register for live class" });
    }
  });

  // Get live class details with meeting link
  app.get("/api/live-classes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const liveClassId = parseInt(req.params.id);

      const liveClass = await db.query.liveClasses.findFirst({
        where: eq(liveClasses.id, liveClassId),
        with: {
          course: true,
          instructor: {
            columns: { firstName: true, lastName: true, email: true }
          },
          resources: true
        }
      });

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      // Check if user is registered
      const attendee = await db.query.liveClassAttendees.findFirst({
        where: and(
          eq(liveClassAttendees.liveClassId, liveClassId),
          eq(liveClassAttendees.userId, userId)
        )
      });

      const userData = await storage.getUser(userId);
      const isInstructor = userData?.role === "admin" || userData?.role === "instructor";

      if (!attendee && !isInstructor) {
        return res.status(403).json({ message: "You are not registered for this class" });
      }

      res.json({
        ...liveClass,
        attendeeStatus: attendee?.status || "not_registered",
        canJoin: isInstructor || (attendee && ["registered", "attended"].includes(attendee.status))
      });
    } catch (error) {
      console.error("Error fetching live class details:", error);
      res.status(500).json({ message: "Failed to fetch live class details" });
    }
  });

  // Update live class status (for instructors)
  app.put("/api/live-classes/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const liveClassId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["scheduled", "live", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const liveClass = await db.query.liveClasses.findFirst({
        where: eq(liveClasses.id, liveClassId)
      });

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      if (!["admin", "instructor"].includes(req.user.role) && liveClass.instructorId !== userId) {
        return res.status(403).json({ message: "Only the instructor or admin can update class status" });
      }

      await db.update(liveClasses)
        .set({ status, updatedAt: new Date() })
        .where(eq(liveClasses.id, liveClassId));

      res.json({ message: "Live class status updated successfully" });
    } catch (error) {
      console.error("Error updating live class status:", error);
      res.status(500).json({ message: "Failed to update live class status" });
    }
  });

  // Record attendance (when user joins)
  app.post("/api/live-classes/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const liveClassId = parseInt(req.params.id);

      await db.update(liveClassAttendees)
        .set({ 
          status: "attended", 
          joinedAt: new Date() 
        })
        .where(and(
          eq(liveClassAttendees.liveClassId, liveClassId),
          eq(liveClassAttendees.userId, userId)
        ));

      res.json({ message: "Attendance recorded" });
    } catch (error) {
      console.error("Error recording attendance:", error);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  // Get live class resources
  app.get("/api/live-classes/:id/resources", isAuthenticated, async (req, res) => {
    try {
      const liveClassId = parseInt(req.params.id);

      const resources = await db.query.liveClassResources.findMany({
        where: eq(liveClassResources.liveClassId, liveClassId),
        with: {
          uploadedByUser: {
            columns: { firstName: true, lastName: true }
          }
        }
      });

      res.json(resources);
    } catch (error) {
      console.error("Error fetching live class resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // Admin: Get all live classes
  app.get("/api/admin/live-classes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const classes = await db.execute(sql`
        SELECT 
          lc.*,
          c.title as course_title,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          COUNT(lca.id) as total_attendees,
          COUNT(CASE WHEN lca.status = 'attended' THEN 1 END) as attended_count
        FROM ${liveClasses} lc
        JOIN ${courses} c ON lc.course_id = c.id
        JOIN ${users} u ON lc.instructor_id = u.id
        LEFT JOIN ${liveClassAttendees} lca ON lc.id = lca.live_class_id
        GROUP BY lc.id, c.title, u.first_name, u.last_name
        ORDER BY lc.scheduled_at DESC
        LIMIT 50
      `);

      res.json(classes.rows);
    } catch (error) {
      console.error("Error fetching admin live classes:", error);
      res.status(500).json({ message: "Failed to fetch live classes" });
    }
  });

  // Admin activity tracking routes
  app.get("/api/admin/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await db.select()
        .from(adminActivities)
        .orderBy(desc(adminActivities.createdAt))
        .limit(50);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/admin/activities", isAuthenticated, async (req, res) => {
    try {
      const { action, entityType, entityId, details } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      const activity = await db.insert(adminActivities).values({
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).returning();
      
      res.json(activity[0]);
    } catch (error) {
      console.error("Error creating admin activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Admin onboarding routes
  app.get("/api/admin/onboarding", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const onboardingSteps = await db.select()
        .from(adminOnboarding)
        .where(eq(adminOnboarding.userId, userId));
      
      res.json(onboardingSteps);
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.post("/api/admin/onboarding/complete", isAuthenticated, async (req, res) => {
    try {
      const { step } = req.body;
      const userId = (req.user as any)?.id;
      
      const onboardingStep = await db.insert(adminOnboarding).values({
        userId,
        step,
        completed: true,
        completedAt: new Date()
      }).returning();
      
      res.json(onboardingStep[0]);
    } catch (error) {
      console.error("Error completing onboarding step:", error);
      res.status(500).json({ message: "Failed to complete onboarding step" });
    }
  });

  // SMS/MMS Management Routes
  
  // Send SMS to individual user
  app.post("/api/admin/sms/send", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, message, mediaUrls } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.phoneNumber) {
        return res.status(400).json({ message: "User does not have a phone number" });
      }
      
      const result = mediaUrls && mediaUrls.length > 0 
        ? await sendMMS(user.phoneNumber, message, mediaUrls)
        : await sendSMS({ to: user.phoneNumber, message });
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId, message: `${mediaUrls ? 'MMS' : 'SMS'} sent successfully` });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  // Send bulk SMS to multiple users
  app.post("/api/admin/sms/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userIds, message, filterByRole } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      let targetUsers: any[] = [];
      
      if (userIds && userIds.length > 0) {
        // Send to specific users
        for (const userId of userIds) {
          const user = await storage.getUser(userId);
          if (user && user.phoneNumber) {
            targetUsers.push(user);
          }
        }
      } else if (filterByRole) {
        // Send to users by role
        const allUsers = await storage.getAllUsers();
        targetUsers = allUsers.filter(user => 
          user.role === filterByRole && user.phoneNumber && user.isActive
        );
      } else {
        // Send to all active users with phone numbers
        const allUsers = await storage.getAllUsers();
        targetUsers = allUsers.filter(user => user.phoneNumber && user.isActive);
      }
      
      if (targetUsers.length === 0) {
        return res.status(400).json({ message: "No users with phone numbers found" });
      }
      
      const phoneNumbers = targetUsers.map(user => user.phoneNumber);
      const results = await sendBulkSMS(phoneNumbers, message);
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        message: `Sent SMS to ${successCount}/${targetUsers.length} users`,
        results: results,
        targetCount: targetUsers.length,
        successCount: successCount
      });
    } catch (error) {
      console.error("Error sending bulk SMS:", error);
      res.status(500).json({ message: "Failed to send bulk SMS" });
    }
  });

  // Get SMS templates
  app.get("/api/admin/sms/templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const templates = Object.keys(SMS_TEMPLATES).map(key => ({
        key,
        name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        template: SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES]
      }));
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  // Admin user management routes
  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { email, username, firstName, lastName, phoneNumber, role, password } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        email,
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        phoneNumber: phoneNumber || null,
        role: role || 'student',
        password: hashedPassword,
      });

      // Send welcome SMS if phone number provided
      if (phoneNumber) {
        try {
          await sendWelcomeSMS(phoneNumber, firstName || username);
        } catch (smsError) {
          console.error("Failed to send welcome SMS:", smsError);
          // Don't fail the user creation if SMS fails
        }
      }

      res.json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/admin/users/bulk", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { users: usersData } = req.body;
      
      if (!Array.isArray(usersData) || usersData.length === 0) {
        return res.status(400).json({ message: "Users array is required" });
      }

      let created = 0;
      let errors = 0;
      const errorMessages = [];

      for (const userData of usersData) {
        try {
          const { email, username, firstName, lastName, phoneNumber, role, password } = userData;
          
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            errors++;
            errorMessages.push(`${email}: User already exists`);
            continue;
          }

          const existingUsername = await storage.getUserByUsername(username);
          if (existingUsername) {
            errors++;
            errorMessages.push(`${username}: Username already exists`);
            continue;
          }

          // Hash password
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);

          await storage.createUser({
            email,
            username,
            firstName: firstName || null,
            lastName: lastName || null,
            phoneNumber: phoneNumber || null,
            role: role || 'student',
            password: hashedPassword,
          });

          // Send welcome SMS if phone number provided
          if (phoneNumber) {
            try {
              await sendWelcomeSMS(phoneNumber, firstName || username);
            } catch (smsError) {
              console.error("Failed to send welcome SMS:", smsError);
            }
          }

          created++;
        } catch (error: any) {
          errors++;
          errorMessages.push(`${userData.email}: ${error.message}`);
        }
      }

      res.json({ created, errors, errorMessages });
    } catch (error: any) {
      console.error("Error in bulk user creation:", error);
      res.status(500).json({ message: "Failed to create users" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const { firstName, lastName, phoneNumber, role } = req.body;

      console.log("Updating user:", userId, "with data:", { firstName, lastName, phoneNumber, role });

      // Update profile information
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
      });

      // Update role if provided
      if (role && role !== updatedUser.role) {
        const [userWithRole] = await db.update(users)
          .set({ role, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();
        
        console.log("Updated user with role:", userWithRole);
        res.json({ ...updatedUser, role: userWithRole.role });
      } else {
        console.log("Updated user profile:", updatedUser);
        res.json(updatedUser);
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;

      // Don't allow deletion of own account
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin route for creating live classes
  app.post("/api/admin/live-classes", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const liveClassData = insertLiveClassSchema.parse(req.body);
      liveClassData.instructorId = user.id;

      // Generate meeting URL based on platform
      let meetingUrl = "";
      let meetingId = "";
      
      if (liveClassData.platform === "zoom") {
        // In a real implementation, you would call Zoom API here
        meetingId = `zoom-${Date.now()}`;
        meetingUrl = `https://zoom.us/j/${meetingId}`;
      } else if (liveClassData.platform === "google_meet") {
        // In a real implementation, you would call Google Meet API here
        meetingId = `meet-${Date.now()}`;
        meetingUrl = `https://meet.google.com/${meetingId}`;
      }

      liveClassData.meetingId = meetingId;
      liveClassData.meetingUrl = meetingUrl;

      const [newClass] = await db.insert(liveClasses).values(liveClassData).returning();

      // Auto-enroll all course participants
      if (liveClassData.courseId) {
        const enrolledUsers = await db.execute(sql`
          SELECT user_id FROM ${enrollments} 
          WHERE course_id = ${liveClassData.courseId}
        `);

        if (enrolledUsers.rows.length > 0) {
          const attendeePromises = enrolledUsers.rows.map((enrollment: any) =>
            db.insert(liveClassAttendees).values({
              liveClassId: newClass.id,
              userId: enrollment.user_id,
              status: "registered"
            })
          );

          await Promise.all(attendeePromises);
        }
      }

      // Log the action
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "create_live_class",
        resourceType: "live_class",
        resourceId: newClass.id.toString(),
        details: { title: newClass.title, platform: newClass.platform },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json(newClass);
    } catch (error) {
      console.error("Error creating live class:", error);
      res.status(500).json({ message: "Failed to create live class" });
    }
  });

  // ===== ADVANCED ADMIN FEATURES API ENDPOINTS =====

  // Advanced Search API
  app.get("/api/admin/search", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { q, type = "all", dateFrom, dateTo, status, sortBy = "relevance", sortOrder = "desc" } = req.query;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results: any[] = [];
      
      // Search users
      if (type === "all" || type === "users") {
        const userResults = await db.execute(sql`
          SELECT 
            id, 
            first_name || ' ' || last_name as title,
            email as description,
            'user' as type,
            created_at as lastModified,
            '/admin/users/' || id as url,
            1.0 as score
          FROM ${users}
          WHERE (first_name ILIKE ${'%' + q + '%'} OR last_name ILIKE ${'%' + q + '%'} OR email ILIKE ${'%' + q + '%'})
          ${status ? sql`AND role = ${status}` : sql``}
          ${dateFrom ? sql`AND created_at >= ${new Date(dateFrom as string)}` : sql``}
          ${dateTo ? sql`AND created_at <= ${new Date(dateTo as string)}` : sql``}
          LIMIT 20
        `);
        results.push(...userResults.rows);
      }

      // Search courses
      if (type === "all" || type === "courses") {
        const courseResults = await db.execute(sql`
          SELECT 
            id,
            title,
            description,
            'course' as type,
            updated_at as lastModified,
            '/admin/courses/' || id as url,
            1.0 as score
          FROM ${courses}
          WHERE (title ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})
          ${status ? sql`AND is_published = ${status === 'published'}` : sql``}
          ${dateFrom ? sql`AND created_at >= ${new Date(dateFrom as string)}` : sql``}
          ${dateTo ? sql`AND created_at <= ${new Date(dateTo as string)}` : sql``}
          LIMIT 20
        `);
        results.push(...courseResults.rows);
      }

      // Search discussions
      if (type === "all" || type === "discussions") {
        const discussionResults = await db.execute(sql`
          SELECT 
            d.id,
            'Discussion: ' || SUBSTRING(d.content, 1, 50) || '...' as title,
            u.first_name || ' ' || u.last_name || ' in ' || l.title as description,
            'discussion' as type,
            d.created_at as lastModified,
            '/admin/discussions/' || d.id as url,
            1.0 as score
          FROM ${discussions} d
          JOIN ${users} u ON d.user_id = u.id
          JOIN lessons l ON d.lesson_id = l.id
          WHERE d.content ILIKE ${'%' + q + '%'}
          ${dateFrom ? sql`AND d.created_at >= ${new Date(dateFrom as string)}` : sql``}
          ${dateTo ? sql`AND d.created_at <= ${new Date(dateTo as string)}` : sql``}
          LIMIT 20
        `);
        results.push(...discussionResults.rows);
      }

      // Sort results
      if (sortBy === "date") {
        results.sort((a, b) => sortOrder === "desc" 
          ? new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          : new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
      } else if (sortBy === "name") {
        results.sort((a, b) => sortOrder === "desc" 
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title));
      }

      res.json({ results, total: results.length });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Search history endpoints
  app.get("/api/admin/recent-searches", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Mock recent searches - in production this would come from a searches table
      const recentSearches = [
        { query: "John Doe", type: "users", resultCount: 3, timestamp: new Date(Date.now() - 3600000) },
        { query: "Leadership Course", type: "courses", resultCount: 1, timestamp: new Date(Date.now() - 7200000) },
        { query: "discussion", type: "discussions", resultCount: 15, timestamp: new Date(Date.now() - 10800000) }
      ];
      res.json(recentSearches);
    } catch (error) {
      console.error("Error fetching recent searches:", error);
      res.status(500).json({ message: "Failed to fetch recent searches" });
    }
  });

  app.get("/api/admin/popular-searches", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Mock popular searches - in production this would be aggregated from searches table
      const popularSearches = [
        { query: "student progress", type: "all" },
        { query: "completed courses", type: "courses" },
        { query: "active users", type: "users" },
        { query: "recent discussions", type: "discussions" }
      ];
      res.json(popularSearches);
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // Bulk Operations API
  app.post("/api/admin/bulk/email", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userIds, subject, message, template } = req.body;
      
      if (!userIds || userIds.length === 0) {
        return res.status(400).json({ message: "User IDs are required" });
      }

      const results = [];
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user && user.email) {
          try {
            await sendEmail({
              to: user.email,
              subject: subject || "Message from PKCM Leadership Platform",
              html: message,
              from: process.env.SENDGRID_VERIFIED_SENDER || "admin@pkcm.org"
            });
            results.push({ userId, email: user.email, status: "sent" });
          } catch (error) {
            results.push({ userId, email: user.email, status: "failed", error: error.message });
          }
        } else {
          results.push({ userId, status: "failed", error: "User not found or no email" });
        }
      }

      res.json({ results, summary: { total: userIds.length, sent: results.filter(r => r.status === "sent").length } });
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      res.status(500).json({ message: "Failed to send bulk emails" });
    }
  });

  app.post("/api/admin/bulk/sms", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      
      if (!userIds || userIds.length === 0) {
        return res.status(400).json({ message: "User IDs are required" });
      }

      const results = [];
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user && user.phoneNumber) {
          try {
            await sendSMS({ to: user.phoneNumber, message });
            results.push({ userId, phoneNumber: user.phoneNumber, status: "sent" });
          } catch (error) {
            results.push({ userId, phoneNumber: user.phoneNumber, status: "failed", error: error.message });
          }
        } else {
          results.push({ userId, status: "failed", error: "User not found or no phone number" });
        }
      }

      res.json({ results, summary: { total: userIds.length, sent: results.filter(r => r.status === "sent").length } });
    } catch (error) {
      console.error("Error sending bulk SMS:", error);
      res.status(500).json({ message: "Failed to send bulk SMS" });
    }
  });

  app.get("/api/admin/export/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const usersList = await db.execute(sql`
        SELECT 
          id,
          email,
          first_name,
          last_name,
          role,
          phone_number,
          created_at,
          updated_at
        FROM ${users}
        ORDER BY created_at DESC
      `);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=users-export.json");
      res.json(usersList.rows);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  // System Health Monitoring API
  app.get("/api/admin/system/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const status = {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      };
      res.json(status);
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ message: "Failed to get system status" });
    }
  });

  app.get("/api/admin/system/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const services = [
        { name: "Database", status: "healthy", responseTime: 15 },
        { name: "Email Service", status: "healthy", responseTime: 120 },
        { name: "SMS Service", status: "healthy", responseTime: 95 },
        { name: "File Storage", status: "healthy", responseTime: 45 }
      ];
      res.json(services);
    } catch (error) {
      console.error("Error getting services status:", error);
      res.status(500).json({ message: "Failed to get services status" });
    }
  });

  app.get("/api/admin/system/metrics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        cpu: Math.random() * 100, // Mock CPU usage
        disk: Math.random() * 100, // Mock disk usage
        network: {
          bytesIn: Math.floor(Math.random() * 1000000),
          bytesOut: Math.floor(Math.random() * 1000000)
        }
      };
      res.json(metrics);
    } catch (error) {
      console.error("Error getting system metrics:", error);
      res.status(500).json({ message: "Failed to get system metrics" });
    }
  });

  app.get("/api/admin/system/performance", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const performance = {
        avgResponseTime: 150 + Math.random() * 100,
        requestsPerMinute: 45 + Math.random() * 20,
        errorRate: Math.random() * 2,
        activeConnections: Math.floor(Math.random() * 50) + 10
      };
      res.json(performance);
    } catch (error) {
      console.error("Error getting performance metrics:", error);
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
