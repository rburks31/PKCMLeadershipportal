import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  boolean,
  jsonb,
  index,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, instructor, admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  preferences: jsonb("preferences"), // user settings and preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  imageUrl: varchar("image_url"),
  price: integer("price"), // price in cents
  isPublished: boolean("is_published").default(false),
  prerequisites: text("prerequisites").array(),
  tags: text("tags").array(),
  difficulty: varchar("difficulty"), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours"),
  dripContent: boolean("drip_content").default(false),
  releaseSchedule: jsonb("release_schedule"), // schedule for drip content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url"),
  duration: integer("duration"), // in seconds
  orderIndex: integer("order_index").notNull(),
  content: text("content"),
  resourcesUrl: varchar("resources_url"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  isCompleted: boolean("is_completed").default(false),
  progressPercentage: integer("progress_percentage").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"), // for replies
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  questions: jsonb("questions").notNull(), // JSON array of questions
  passingScore: integer("passing_score").default(70),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").notNull(),
  answers: jsonb("answers").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  certificateUrl: varchar("certificate_url"),
  templateId: integer("template_id"),
  issuedAt: timestamp("issued_at").defaultNow(),
});

// New tables for admin functionality
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").default("USD"),
  status: varchar("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: varchar("payment_method"), // stripe, paypal, etc.
  transactionId: varchar("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  targetAudience: varchar("target_audience").default("all"), // all, students, instructors
  courseId: integer("course_id").references(() => courses.id), // null for global announcements
  isPublished: boolean("is_published").default(false),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // announcement, achievement, reminder, system
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // additional data like course_id, lesson_id
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentLibrary = pgTable("content_library", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(), // video, pdf, image, audio
  fileSize: integer("file_size"), // in bytes
  tags: text("tags").array(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // create, update, delete, login, etc.
  resourceType: varchar("resource_type").notNull(), // user, course, lesson, etc.
  resourceId: varchar("resource_id"),
  details: jsonb("details"), // additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseReviews = pgTable("course_reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instructorAssignments = pgTable("instructor_assignments", {
  id: serial("id").primaryKey(),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  permissions: text("permissions").array(), // create, edit, grade, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: varchar("category"), // branding, email, payments, etc.
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  discussions: many(discussions),
  quizAttempts: many(quizAttempts),
  certificates: many(certificates),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  certificates: many(certificates),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(lessonProgress),
  discussions: many(discussions),
  quizzes: many(quizzes),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [lessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [discussions.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [discussions.userId],
    references: [users.id],
  }),
  parent: one(discussions, {
    fields: [discussions.parentId],
    references: [discussions.id],
    relationName: "discussionParent"
  }),
  replies: many(discussions, {
    relationName: "discussionParent"
  }),
}));

// Live Classes
export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  instructorId: varchar("instructor_id", { length: 255 }).references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // duration in minutes
  platform: varchar("platform", { length: 50 }).notNull(), // 'zoom' or 'google_meet'
  meetingId: varchar("meeting_id", { length: 255 }),
  meetingUrl: text("meeting_url"),
  meetingPassword: varchar("meeting_password", { length: 100 }),
  status: varchar("status", { length: 50 }).default("scheduled").notNull(), // scheduled, live, completed, cancelled
  maxAttendees: integer("max_attendees").default(100),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Live Class Attendees
export const liveClassAttendees = pgTable("live_class_attendees", {
  id: serial("id").primaryKey(),
  liveClassId: integer("live_class_id").references(() => liveClasses.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).default("registered").notNull(), // registered, attended, missed
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  attendanceDuration: integer("attendance_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow()
});

// Live Class Resources
export const liveClassResources = pgTable("live_class_resources", {
  id: serial("id").primaryKey(),
  liveClassId: integer("live_class_id").references(() => liveClasses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // presentation, document, video, link
  url: text("url").notNull(),
  description: text("description"),
  uploadedBy: varchar("uploaded_by", { length: 255 }).references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations for live classes
export const liveClassesRelations = relations(liveClasses, ({ one, many }) => ({
  course: one(courses, {
    fields: [liveClasses.courseId],
    references: [courses.id],
  }),
  instructor: one(users, {
    fields: [liveClasses.instructorId],
    references: [users.id],
  }),
  attendees: many(liveClassAttendees),
  resources: many(liveClassResources),
}));

export const liveClassAttendeesRelations = relations(liveClassAttendees, ({ one }) => ({
  liveClass: one(liveClasses, {
    fields: [liveClassAttendees.liveClassId],
    references: [liveClasses.id],
  }),
  user: one(users, {
    fields: [liveClassAttendees.userId],
    references: [users.id],
  }),
}));

export const liveClassResourcesRelations = relations(liveClassResources, ({ one }) => ({
  liveClass: one(liveClasses, {
    fields: [liveClassResources.liveClassId],
    references: [liveClasses.id],
  }),
  uploadedByUser: one(users, {
    fields: [liveClassResources.uploadedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, createdAt: true });
export const insertDiscussionSchema = createInsertSchema(discussions).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertCourseReviewSchema = createInsertSchema(courseReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInstructorAssignmentSchema = createInsertSchema(instructorAssignments).omit({ id: true, createdAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export const insertLiveClassSchema = createInsertSchema(liveClasses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLiveClassAttendeeSchema = createInsertSchema(liveClassAttendees).omit({ id: true, createdAt: true });
export const insertLiveClassResourceSchema = createInsertSchema(liveClassResources).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ContentLibrary = typeof contentLibrary.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type CourseReview = typeof courseReviews.$inferSelect;
export type InstructorAssignment = typeof instructorAssignments.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type LiveClass = typeof liveClasses.$inferSelect;
export type LiveClassAttendee = typeof liveClassAttendees.$inferSelect;
export type LiveClassResource = typeof liveClassResources.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertCourseReview = z.infer<typeof insertCourseReviewSchema>;
export type InsertInstructorAssignment = z.infer<typeof insertInstructorAssignmentSchema>;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type InsertLiveClass = z.infer<typeof insertLiveClassSchema>;
export type InsertLiveClassAttendee = z.infer<typeof insertLiveClassAttendeeSchema>;
export type InsertLiveClassResource = z.infer<typeof insertLiveClassResourceSchema>;
