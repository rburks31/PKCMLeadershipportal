import { User, Course, Lesson } from "@shared/schema";

type MergeRuntimeContext = {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    phoneNumber?: string;
    role?: string;
  };
  course?: {
    name?: string;
    description?: string;
    instructorName?: string;
    difficulty?: string;
    estimatedHours?: number;
  };
  lesson?: {
    title?: string;
    description?: string;
    duration?: number;
  };
  system?: {
    platformName?: string;
    supportEmail?: string;
    loginUrl?: string;
  };
};

export const MERGE_FIELD_HANDLERS: Record<
  string, 
  (context: MergeRuntimeContext) => string
> = {
  "{firstName}": (ctx) => ctx.user?.firstName || "Member",
  "{lastName}": (ctx) => ctx.user?.lastName || "",
  "{fullName}": (ctx) => 
    `${ctx.user?.firstName || "Member"} ${ctx.user?.lastName || ""}`.trim(),
  "{email}": (ctx) => ctx.user?.email || "",
  "{username}": (ctx) => ctx.user?.username || "",
  "{phoneNumber}": (ctx) => ctx.user?.phoneNumber || "",
  "{role}": (ctx) => ctx.user?.role || "Member",
  "{courseName}": (ctx) => ctx.course?.name || "the course",
  "{courseDescription}": (ctx) => ctx.course?.description || "",
  "{instructorName}": (ctx) => ctx.course?.instructorName || "our instructor",
  "{courseDifficulty}": (ctx) => ctx.course?.difficulty || "",
  "{estimatedHours}": (ctx) => ctx.course?.estimatedHours?.toString() || "",
  "{lessonTitle}": (ctx) => ctx.lesson?.title || "the lesson",
  "{lessonDescription}": (ctx) => ctx.lesson?.description || "",
  "{lessonDuration}": (ctx) => ctx.lesson?.duration?.toString() || "",
  "{platformName}": () => "PKCM Leadership and Ministry Class",
  "{currentDate}": () => new Date().toLocaleDateString(),
  "{currentTime}": () => new Date().toLocaleTimeString(),
  "{supportEmail}": () => process.env.SENDGRID_VERIFIED_SENDER || "support@pkcm.org",
  "{loginUrl}": () => {
    const domains = process.env.REPLIT_DOMAINS;
    const baseUrl = domains ? `https://${domains.split(',')[0]}` : 'http://localhost:5000';
    return `${baseUrl}/auth`;
  },
};

// Helper function to convert legacy context to runtime context
function convertToRuntimeContext(context: MergeFieldContext | MergeRuntimeContext): MergeRuntimeContext {
  // If it's already a runtime context, return as is
  if ('user' in context && context.user && 'firstName' in (context.user as any)) {
    return context as MergeRuntimeContext;
  }
  
  // Convert legacy context
  const legacyContext = context as MergeFieldContext;
  
  return {
    user: legacyContext.user ? {
      firstName: legacyContext.user.firstName || undefined,
      lastName: legacyContext.user.lastName || undefined,
      email: legacyContext.user.email || undefined,
      username: legacyContext.user.username || undefined,
      phoneNumber: legacyContext.user.phoneNumber || undefined,
      role: legacyContext.user.role || undefined,
    } : undefined,
    course: legacyContext.course ? {
      name: legacyContext.course.title || undefined,
      description: legacyContext.course.description || undefined,
      instructorName: legacyContext.instructor?.firstName && legacyContext.instructor?.lastName 
        ? `${legacyContext.instructor.firstName} ${legacyContext.instructor.lastName}`.trim()
        : legacyContext.instructor?.firstName || undefined,
      difficulty: legacyContext.course.difficulty || undefined,
      estimatedHours: legacyContext.course.estimatedHours || undefined,
    } : undefined,
    lesson: legacyContext.lesson ? {
      title: legacyContext.lesson.title || undefined,
      description: legacyContext.lesson.description || undefined,
      duration: legacyContext.lesson.duration || undefined,
    } : undefined,
    system: legacyContext.system || undefined,
  };
}

export function replaceMergeFields(
  text: string, 
  context: MergeFieldContext | MergeRuntimeContext
): string {
  const runtimeContext = convertToRuntimeContext(context);
  
  return Object.entries(MERGE_FIELD_HANDLERS).reduce(
    (result, [field, handler]) => 
      result.replace(new RegExp(field.replace(/[{}]/g, '\\$&'), "g"), () => handler(runtimeContext)),
    text
  );
}

// Validate merge fields in content
export function validateMergeFields(content: string): string[] {
  const invalidFields: string[] = [];
  const fieldRegex = /{(\w+)}/g;
  
  let match;
  while ((match = fieldRegex.exec(content)) !== null) {
    if (!MERGE_FIELD_HANDLERS[match[0]]) {
      invalidFields.push(match[0]);
    }
  }
  
  return invalidFields;
}

// Get all available merge fields for UI components
export function getAllMergeFields() {
  return Object.keys(MERGE_FIELD_HANDLERS).map(field => ({
    field,
    description: getMergeFieldDescription(field)
  }));
}

// Get description for a merge field
function getMergeFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    "{firstName}": "User's first name",
    "{lastName}": "User's last name", 
    "{fullName}": "User's full name (first + last)",
    "{email}": "User's email address",
    "{username}": "User's username",
    "{phoneNumber}": "User's phone number",
    "{role}": "User's role (Student, Instructor, Admin)",
    "{courseName}": "Course title",
    "{courseDescription}": "Course description",
    "{instructorName}": "Course instructor's name",
    "{courseDifficulty}": "Course difficulty level",
    "{estimatedHours}": "Estimated course duration",
    "{lessonTitle}": "Lesson title",
    "{lessonDescription}": "Lesson description", 
    "{lessonDuration}": "Lesson duration in minutes",
    "{platformName}": "Platform name",
    "{currentDate}": "Current date",
    "{currentTime}": "Current time",
    "{supportEmail}": "Support contact email",
    "{loginUrl}": "Login page URL"
  };
  
  return descriptions[field] || "Unknown field";
}

// Helper function to format phone numbers for display
function formatPhoneForDisplay(phoneNumber: string | null): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not a standard format
  return phoneNumber;
}

// Helper function to capitalize role names
function capitalizeRole(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin': return 'Administrator';
    case 'instructor': return 'Instructor';
    case 'student': return 'Student';
    default: return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}

// Helper function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Legacy exports for backward compatibility
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

// Context data interface for backward compatibility
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

// Message templates for backward compatibility
export const MESSAGE_TEMPLATES = {
  welcome: {
    subject: "Welcome to {platformName}!",
    text: "Hello {firstName},\n\nWelcome to {platformName}! We're excited to have you join our community.\n\nBest regards,\nThe {platformName} Team",
    html: "<h2>Welcome to {platformName}!</h2><p>Hello {firstName},</p><p>Welcome to {platformName}! We're excited to have you join our community.</p><p>Best regards,<br>The {platformName} Team</p>"
  },
  courseEnrollment: {
    subject: "Enrolled in {courseName}",
    text: "Hello {firstName},\n\nYou have been enrolled in {courseName}.\n\nCourse Details:\n- Instructor: {instructorName}\n- Difficulty: {courseDifficulty}\n- Estimated Hours: {estimatedHours}\n\n{courseDescription}\n\nGet started at: {loginUrl}\n\nBless you,\nThe {platformName} Team",
    html: "<h2>Enrolled in {courseName}</h2><p>Hello {firstName},</p><p>You have been enrolled in <strong>{courseName}</strong>.</p><h3>Course Details:</h3><ul><li><strong>Instructor:</strong> {instructorName}</li><li><strong>Difficulty:</strong> {courseDifficulty}</li><li><strong>Estimated Hours:</strong> {estimatedHours}</li></ul><p>{courseDescription}</p><p><a href='{loginUrl}'>Get started here</a></p><p>Bless you,<br>The {platformName} Team</p>"
  },
  lessonReminder: {
    subject: "Lesson Reminder: {lessonTitle}",
    text: "Hello {firstName},\n\nDon't forget about your upcoming lesson: {lessonTitle}\n\nLesson Duration: {lessonDuration} minutes\n{lessonDescription}\n\nAccess your lesson at: {loginUrl}\n\nBless you,\nThe {platformName} Team",
    html: "<h2>Lesson Reminder: {lessonTitle}</h2><p>Hello {firstName},</p><p>Don't forget about your upcoming lesson: <strong>{lessonTitle}</strong></p><p><strong>Lesson Duration:</strong> {lessonDuration} minutes</p><p>{lessonDescription}</p><p><a href='{loginUrl}'>Access your lesson here</a></p><p>Bless you,<br>The {platformName} Team</p>"
  },
  certificateEarned: {
    subject: "Congratulations! Certificate Earned for {courseName}",
    text: "Hello {firstName},\n\nCongratulations! You have successfully completed {courseName} and earned your certificate.\n\nWe're proud of your dedication and commitment to growing in faith and leadership.\n\nView your certificate at: {loginUrl}\n\nBless you,\nThe {platformName} Team",
    html: "<h2>Congratulations! Certificate Earned</h2><p>Hello {firstName},</p><p>Congratulations! You have successfully completed <strong>{courseName}</strong> and earned your certificate.</p><p>We're proud of your dedication and commitment to growing in faith and leadership.</p><p><a href='{loginUrl}'>View your certificate here</a></p><p>Bless you,<br>The {platformName} Team</p>"
  }
} as const;

// SMS templates for backward compatibility
export const SMS_TEMPLATES = {
  welcome: "Welcome to {platformName}, {firstName}! We're excited to have you join our community. Get started: {loginUrl}",
  courseEnrollment: "Hello {firstName}! You've been enrolled in {courseName} with {instructorName}. Access your course: {loginUrl}",
  lessonReminder: "Hi {firstName}! Don't forget your lesson: {lessonTitle} ({lessonDuration} min). Start learning: {loginUrl}",
  certificateEarned: "Congratulations {firstName}! You've earned your certificate for {courseName}. View it here: {loginUrl}",
  liveClassReminder: "Hi {firstName}! Your live class starts soon. Join here: {loginUrl}",
  announcement: "{firstName}, important update from {platformName}: {message}"
} as const;