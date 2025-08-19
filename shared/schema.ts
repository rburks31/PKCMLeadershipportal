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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  imageUrl: varchar("image_url"),
  isPublished: boolean("is_published").default(false),
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
  issuedAt: timestamp("issued_at").defaultNow(),
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
  }),
  replies: many(discussions),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, createdAt: true });
export const insertDiscussionSchema = createInsertSchema(discussions).omit({ id: true, createdAt: true });

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
