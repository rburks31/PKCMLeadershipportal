import { db } from './db';
import { users, courses, enrollments } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export interface GroupMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
}

export class GroupService {
  // Get course as a group with all enrolled members
  static async getGroupWithMembers(groupId: string): Promise<Group> {
    try {
      // For now, treat course enrollments as groups
      const courseId = parseInt(groupId);
      
      if (isNaN(courseId)) {
        throw new Error('Invalid group ID format');
      }

      // Get course details
      const course = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (course.length === 0) {
        throw new Error('Course not found');
      }

      // Get enrolled members
      const members = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phoneNumber,
          role: users.role
        })
        .from(users)
        .innerJoin(enrollments, eq(enrollments.userId, users.id))
        .where(eq(enrollments.courseId, courseId));

      return {
        id: groupId,
        name: course[0].title,
        description: course[0].description || undefined,
        members: members.map(member => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          role: member.role
        }))
      };
    } catch (error) {
      console.error('Error getting group with members:', error);
      throw error;
    }
  }

  // Get all users with a specific role as a group
  static async getUsersByRole(role: string): Promise<Group> {
    try {
      const roleUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phoneNumber,
          role: users.role
        })
        .from(users)
        .where(eq(users.role, role));

      return {
        id: role,
        name: `All ${role.charAt(0).toUpperCase() + role.slice(1)}s`,
        description: `Group containing all users with ${role} role`,
        members: roleUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }))
      };
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get all active users as a group
  static async getAllActiveUsers(): Promise<Group> {
    try {
      const activeUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phoneNumber,
          role: users.role
        })
        .from(users)
        .where(eq(users.isActive, true));

      return {
        id: 'all-active',
        name: 'All Active Users',
        description: 'Group containing all active users',
        members: activeUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }))
      };
    } catch (error) {
      console.error('Error getting all active users:', error);
      throw error;
    }
  }
}

// Helper function to build merge field context from a group member
export function buildMergeContext(member: GroupMember) {
  return {
    user: {
      firstName: member.firstName || "Member",
      lastName: member.lastName || "",
      email: member.email || "",
      username: member.email || "",
      phoneNumber: member.phone || "",
      role: member.role || "student"
    },
    system: {
      platformName: "PKCM Leadership and Ministry Class",
      supportEmail: process.env.SENDGRID_VERIFIED_SENDER || "support@pkcm.org",
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      loginUrl: (() => {
        const domains = process.env.REPLIT_DOMAINS;
        const baseUrl = domains ? `https://${domains.split(',')[0]}` : 'http://localhost:5000';
        return `${baseUrl}/auth`;
      })()
    }
  };
}