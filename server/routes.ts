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
        role,
        isActive: true
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
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
      const instructorId = req.adminUser?.id || req.user?.claims?.sub;
      
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
      const userId = req.user.claims.sub;
      
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
      if (!user || !user.claims || !user.claims.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userData = await storage.getUser(user.claims.sub);
      if (!userData || !["admin", "instructor"].includes(userData.role)) {
        return res.status(403).json({ message: "Instructor or admin access required" });
      }

      const liveClassData = insertLiveClassSchema.parse(req.body);
      liveClassData.instructorId = user.claims.sub;

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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

      const userData = await storage.getUser(userId);
      if (!userData || (!["admin", "instructor"].includes(userData.role) && liveClass.instructorId !== userId)) {
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
      const userId = req.user.claims.sub;
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
      const userId = (req.user as any)?.claims?.sub;
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
      const userId = (req.user as any)?.claims?.sub;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
