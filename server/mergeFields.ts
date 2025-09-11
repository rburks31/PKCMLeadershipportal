import { User, Course, Lesson } from "@shared/schema";

// Available merge fields organized by context
export const MERGE_FIELDS = {
  USER: [
    { field: '{firstName}', description: 'User\'s first name' },
    { field: '{lastName}', description: 'User\'s last name' },
    { field: '{fullName}', description: 'User\'s full name (first + last)' },
    { field: '{email}', description: 'User\'s email address' },
    { field: '{username}', description: 'User\'s username' },
    { field: '{phoneNumber}', description: 'User\'s phone number' },
    { field: '{role}', description: 'User\'s role (Student, Instructor, Admin)' }
  ],
  COURSE: [
    { field: '{courseName}', description: 'Course title' },
    { field: '{courseDescription}', description: 'Course description' },
    { field: '{instructorName}', description: 'Course instructor\'s name' },
    { field: '{courseDifficulty}', description: 'Course difficulty level' },
    { field: '{estimatedHours}', description: 'Estimated course duration' }
  ],
  LESSON: [
    { field: '{lessonTitle}', description: 'Lesson title' },
    { field: '{lessonDescription}', description: 'Lesson description' },
    { field: '{lessonDuration}', description: 'Lesson duration in minutes' }
  ],
  SYSTEM: [
    { field: '{platformName}', description: 'Platform name' },
    { field: '{currentDate}', description: 'Current date' },
    { field: '{currentTime}', description: 'Current time' },
    { field: '{supportEmail}', description: 'Support contact email' },
    { field: '{loginUrl}', description: 'Login page URL' }
  ]
} as const;

// Get all available merge fields
export function getAllMergeFields() {
  return [
    ...MERGE_FIELDS.USER,
    ...MERGE_FIELDS.COURSE,
    ...MERGE_FIELDS.LESSON,
    ...MERGE_FIELDS.SYSTEM
  ];
}

// Context data interface
export interface MergeFieldContext {
  user?: Partial<User> | null;
  course?: Partial<Course> | null;
  lesson?: Partial<Lesson> | null;
  instructor?: Partial<User> | null;
  system?: {
    platformName?: string;
    supportEmail?: string;
    currentDate?: string;
    currentTime?: string;
    loginUrl?: string;
  };
  customData?: Record<string, any>;
}

// Replace merge fields in a text string
export function replaceMergeFields(text: string, context: MergeFieldContext): string {
  let result = text;
  
  // User fields
  if (context.user) {
    result = result.replace(/{firstName}/g, context.user.firstName || 'Student');
    result = result.replace(/{lastName}/g, context.user.lastName || '');
    result = result.replace(/{fullName}/g, `${context.user.firstName || 'Student'} ${context.user.lastName || ''}`.trim());
    result = result.replace(/{email}/g, context.user.email || '');
    result = result.replace(/{username}/g, context.user.username || '');
    result = result.replace(/{phoneNumber}/g, formatPhoneForDisplay(context.user.phoneNumber) || '');
    result = result.replace(/{role}/g, context.user.role ? capitalizeRole(context.user.role) : 'Student');
  }
  
  // Course fields
  if (context.course) {
    result = result.replace(/{courseName}/g, context.course.title || '');
    result = result.replace(/{courseDescription}/g, context.course.description || '');
    result = result.replace(/{courseDifficulty}/g, context.course.difficulty ? capitalizeFirst(context.course.difficulty) : '');
    result = result.replace(/{estimatedHours}/g, context.course.estimatedHours ? `${context.course.estimatedHours} hours` : '');
  }
  
  // Instructor fields
  if (context.instructor) {
    result = result.replace(/{instructorName}/g, `${context.instructor.firstName || ''} ${context.instructor.lastName || ''}`.trim() || 'Instructor');
  }
  
  // Lesson fields
  if (context.lesson) {
    result = result.replace(/{lessonTitle}/g, context.lesson.title || '');
    result = result.replace(/{lessonDescription}/g, context.lesson.description || '');
    result = result.replace(/{lessonDuration}/g, context.lesson.duration ? `${Math.round(context.lesson.duration / 60)} minutes` : '');
  }
  
  // System fields - use provided context or defaults
  const now = new Date();
  const domains = process.env.REPLIT_DOMAINS;
  const baseUrl = domains ? `https://${domains.split(',')[0]}` : 'http://localhost:5000';
  
  if (context.system) {
    result = result.replace(/{platformName}/g, context.system.platformName || 'PKCM Leadership and Ministry Class');
    result = result.replace(/{currentDate}/g, context.system.currentDate || now.toLocaleDateString());
    result = result.replace(/{currentTime}/g, context.system.currentTime || now.toLocaleTimeString());
    result = result.replace(/{supportEmail}/g, context.system.supportEmail || process.env.SENDGRID_VERIFIED_SENDER || 'support@pkcm.org');
    result = result.replace(/{loginUrl}/g, context.system.loginUrl || `${baseUrl}/auth`);
  } else {
    // Fallback to defaults if no system context provided
    result = result.replace(/{platformName}/g, 'PKCM Leadership and Ministry Class');
    result = result.replace(/{currentDate}/g, now.toLocaleDateString());
    result = result.replace(/{currentTime}/g, now.toLocaleTimeString());
    result = result.replace(/{supportEmail}/g, process.env.SENDGRID_VERIFIED_SENDER || 'support@pkcm.org');
    result = result.replace(/{loginUrl}/g, `${baseUrl}/auth`);
  }
  
  // Custom data fields
  if (context.customData) {
    Object.entries(context.customData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });
  }
  
  return result;
}

// Validate that a text contains only valid merge fields
export function validateMergeFields(text: string): { isValid: boolean; invalidFields: string[] } {
  const mergeFieldPattern = /{([^}]+)}/g;
  const matches = text.match(mergeFieldPattern) || [];
  const allValidFields = new Set<string>(getAllMergeFields().map(field => field.field as string));
  
  const invalidFields = matches.filter(match => !allValidFields.has(match));
  
  return {
    isValid: invalidFields.length === 0,
    invalidFields
  };
}

// Get merge fields found in text
export function extractMergeFields(text: string): string[] {
  const mergeFieldPattern = /{([^}]+)}/g;
  const matches = text.match(mergeFieldPattern) || [];
  return Array.from(new Set(matches)); // Remove duplicates
}

// Helper functions
function formatPhoneForDisplay(phoneNumber: string | null): string {
  if (!phoneNumber) return '';
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phoneNumber;
}

function capitalizeRole(role: string): string {
  if (role === 'admin') return 'Administrator';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Predefined message templates with merge fields
export const MESSAGE_TEMPLATES = {
  WELCOME_EMAIL: {
    subject: 'Welcome to {platformName}, {firstName}!',
    html: `
      <h1>Welcome to {platformName}</h1>
      <p>Hello {fullName},</p>
      <p>Welcome to our learning platform! We're excited to have you join our community.</p>
      <p><strong>Your Account Details:</strong></p>
      <ul>
        <li>Name: {fullName}</li>
        <li>Email: {email}</li>
        <li>Role: {role}</li>
      </ul>
      <p>You can access your account at: <a href="{loginUrl}">{loginUrl}</a></p>
      <p>If you have any questions, please contact us at {supportEmail}</p>
      <p>Blessings,<br>The {platformName} Team</p>
    `,
    text: `
Welcome to {platformName}

Hello {fullName},

Welcome to our learning platform! We're excited to have you join our community.

Your Account Details:
- Name: {fullName}
- Email: {email}
- Role: {role}

You can access your account at: {loginUrl}

If you have any questions, please contact us at {supportEmail}

Blessings,
The {platformName} Team
    `
  },
  
  COURSE_ENROLLMENT: {
    subject: 'Enrolled in {courseName}',
    text: `Hi {firstName}! You've been enrolled in "{courseName}". Access your lessons and start your learning journey today. Visit {loginUrl} to get started.`
  },
  
  LESSON_REMINDER: {
    subject: 'Complete your lesson: {lessonTitle}',
    text: `{firstName}, don't forget to complete your lesson: "{lessonTitle}" from {courseName}. Continue your spiritual growth journey at {loginUrl}`
  },
  
  ASSIGNMENT_DUE: {
    subject: 'Assignment Due Reminder',
    text: `Hi {firstName}! Your assignment is due soon. Complete it to stay on track with {courseName}. Login at {loginUrl}`
  },
  
  LIVE_CLASS_REMINDER: {
    subject: 'Live Class Starting Soon',
    text: `{firstName}, your live class starts soon. Join us for interactive learning and fellowship! Access at {loginUrl}`
  }
};

// SMS-specific templates (shorter for SMS character limits)
export const SMS_TEMPLATES = {
  WELCOME: `Welcome to {platformName}, {firstName}! Your account is ready. Visit {loginUrl}`,
  COURSE_ENROLLMENT: `Hi {firstName}! Enrolled in "{courseName}". Start learning at {loginUrl}`,
  LESSON_REMINDER: `{firstName}, complete "{lessonTitle}" from {courseName}. Visit {loginUrl}`,
  ASSIGNMENT_DUE: `Hi {firstName}! Assignment due soon for {courseName}. Login at {loginUrl}`,
  LIVE_CLASS_REMINDER: `{firstName}, live class starting soon! Join at {loginUrl}`
};