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

export function replaceMergeFields(
  text: string, 
  context: MergeRuntimeContext
): string {
  return Object.entries(MERGE_FIELD_HANDLERS).reduce(
    (result, [field, handler]) => 
      result.replace(new RegExp(field.replace(/[{}]/g, '\\$&'), "g"), () => handler(context)),
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