import {
  users,
  courses,
  modules,
  lessons,
  enrollments,
  lessonProgress,
  discussions,
  quizzes,
  quizAttempts,
  certificates,
  type User,
  type UpsertUser,
  type Course,
  type Module,
  type Lesson,
  type Enrollment,
  type LessonProgress,
  type Discussion,
  type InsertCourse,
  type InsertModule,
  type InsertLesson,
  type InsertEnrollment,
  type InsertLessonProgress,
  type InsertDiscussion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithModules(id: number): Promise<any>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Module operations
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  
  // Lesson operations
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Enrollment operations
  getUserEnrollments(userId: string): Promise<any[]>;
  enrollUser(enrollment: InsertEnrollment): Promise<Enrollment>;
  isUserEnrolled(userId: string, courseId: number): Promise<boolean>;
  
  // Progress operations
  getUserLessonProgress(userId: string, lessonId: number): Promise<LessonProgress | undefined>;
  updateLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;
  getCourseProgress(userId: string, courseId: number): Promise<any>;
  
  // Discussion operations
  getLessonDiscussions(lessonId: number): Promise<any[]>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user - cascade deletes will handle related data
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isPublished, true));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseWithModules(id: number): Promise<any> {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        instructor: true,
        modules: {
          orderBy: asc(modules.orderIndex),
          with: {
            lessons: {
              orderBy: asc(lessons.orderIndex),
            },
          },
        },
      },
    });
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  // Module operations
  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.orderIndex));
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  // Lesson operations
  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.orderIndex));
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  // Enrollment operations
  async getUserEnrollments(userId: string): Promise<any[]> {
    return await db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      with: {
        course: true,
      },
    });
  }

  async enrollUser(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async isUserEnrolled(userId: string, courseId: number): Promise<boolean> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return !!enrollment;
  }

  // Progress operations
  async getUserLessonProgress(userId: string, lessonId: number): Promise<LessonProgress | undefined> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async updateLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const [updatedProgress] = await db
      .insert(lessonProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          isCompleted: progress.isCompleted,
          progressPercentage: progress.progressPercentage,
          completedAt: progress.completedAt,
        },
      })
      .returning();
    return updatedProgress;
  }

  async getCourseProgress(userId: string, courseId: number): Promise<any> {
    const result = await db.execute(sql`
      WITH course_lessons AS (
        SELECT l.id as lesson_id
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id = ${courseId}
      ),
      user_progress AS (
        SELECT 
          COUNT(*) as completed_lessons,
          AVG(CASE WHEN lp.is_completed THEN 100 ELSE lp.progress_percentage END) as avg_progress
        FROM course_lessons cl
        LEFT JOIN lesson_progress lp ON cl.lesson_id = lp.lesson_id AND lp.user_id = ${userId}
      )
      SELECT 
        cl_count.total_lessons,
        COALESCE(up.completed_lessons, 0) as completed_lessons,
        COALESCE(up.avg_progress, 0) as progress_percentage
      FROM (SELECT COUNT(*) as total_lessons FROM course_lessons) cl_count
      CROSS JOIN user_progress up
    `);

    return result.rows[0];
  }

  // Discussion operations
  async getLessonDiscussions(lessonId: number): Promise<any[]> {
    return await db.query.discussions.findMany({
      where: and(eq(discussions.lessonId, lessonId), sql`${discussions.parentId} IS NULL`),
      with: {
        user: true,
        replies: {
          with: {
            user: true,
          },
        },
      },
      orderBy: desc(discussions.createdAt),
    });
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [newDiscussion] = await db.insert(discussions).values(discussion).returning();
    return newDiscussion;
  }
}

export const storage = new DatabaseStorage();
