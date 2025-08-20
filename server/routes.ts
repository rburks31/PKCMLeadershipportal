import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCourseSchema, 
  insertDiscussionSchema,
  insertAnnouncementSchema,
  insertPaymentSchema,
  insertContentLibrarySchema,
  insertCourseReviewSchema,
  insertSystemSettingSchema,
  type User,
  type Course,
  type Payment,
  type Announcement,
  type ContentLibrary,
  type AuditLog,
  type CourseReview
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  courses, 
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
  systemSettings
} from "@shared/schema";
import { eq, desc, sql, count, avg, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseWithModules(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Enrollment routes
  app.post("/api/courses/:id/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
    if (!user || !user.claims || !user.claims.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userData = await storage.getUser(user.claims.sub);
    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.adminUser = userData;
    next();
  };

  // ==== ADMIN ROUTES ====

  // Admin Dashboard Analytics
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM ${users}) as total_users,
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
      const userList = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
      const courseData = insertCourseSchema.parse(req.body);
      courseData.instructorId = req.adminUser.id; // Default to admin as instructor
      
      const [newCourse] = await db.insert(courses).values(courseData).returning();
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "create_course",
        resourceType: "course",
        resourceId: newCourse.id.toString(),
        details: { title: newCourse.title },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json(newCourse);
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

  app.post("/api/admin/announcements", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      announcementData.authorId = req.adminUser.id;
      
      const [newAnnouncement] = await db.insert(announcements).values(announcementData).returning();
      
      // Log the action
      await db.insert(auditLogs).values({
        userId: req.adminUser.id,
        action: "create_announcement",
        resourceType: "announcement",
        resourceId: newAnnouncement.id.toString(),
        details: { title: newAnnouncement.title },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
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

  const httpServer = createServer(app);
  return httpServer;
}
