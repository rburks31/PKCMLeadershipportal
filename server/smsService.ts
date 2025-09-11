import Twilio from 'twilio';
import { replaceMergeFields, MergeFieldContext, SMS_TEMPLATES as MERGE_FIELD_SMS_TEMPLATES } from './mergeFields';

// Initialize Twilio client
let twilioClient: Twilio.Twilio | null = null;

function getTwilioClient(): Twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set');
    }
    
    twilioClient = Twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

interface SMSOptions {
  to: string;
  message: string;
  mediaUrl?: string[]; // For MMS
  mergeFieldContext?: MergeFieldContext;
}

interface TemplatedSMSOptions {
  to: string;
  templateKey: keyof typeof MERGE_FIELD_SMS_TEMPLATES;
  mergeFieldContext: MergeFieldContext;
  mediaUrl?: string[];
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Validate phone number format (E.164)
function isValidPhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

// Format phone number to E.164 if needed
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If starts with 1 and has 11 digits (US format), add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If has 10 digits (US format without country code), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already has +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Default: add + if not present
  return `+${digits}`;
}

export async function sendSMS(options: SMSOptions): Promise<SMSResponse> {
  try {
    let { to, message, mediaUrl, mergeFieldContext } = options;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER must be set');
    }
    
    // Apply merge fields if context is provided
    if (mergeFieldContext) {
      message = replaceMergeFields(message, mergeFieldContext);
    }
    
    // Format and validate phone number
    const formattedTo = formatPhoneNumber(to);
    
    if (!isValidPhoneNumber(formattedTo)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }
    
    console.log(`📱 Sending ${mediaUrl ? 'MMS' : 'SMS'} to ${formattedTo}: ${message}`);
    console.log(`📞 From Twilio number: ${twilioPhoneNumber}`);
    
    const client = getTwilioClient();
    const messageData: any = {
      body: message,
      to: formattedTo,
      from: twilioPhoneNumber,
    };
    
    // Add media URLs for MMS
    if (mediaUrl && mediaUrl.length > 0) {
      messageData.mediaUrl = mediaUrl;
    }
    
    const twilioMessage = await client.messages.create(messageData);
    
    console.log(`✅ ${mediaUrl ? 'MMS' : 'SMS'} sent successfully: ${twilioMessage.sid}`);
    console.log(`📊 Message status: ${twilioMessage.status}, Price: ${twilioMessage.price}`);
    
    return {
      success: true,
      messageId: twilioMessage.sid
    };
    
  } catch (error: any) {
    console.error('❌ Twilio SMS/MMS error:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS/MMS'
    };
  }
}

export async function sendMMS(to: string, message: string, mediaUrls: string[]): Promise<SMSResponse> {
  return await sendSMS({
    to,
    message,
    mediaUrl: mediaUrls
  });
}

// Send SMS using predefined templates with merge fields
export async function sendTemplatedSMS(options: TemplatedSMSOptions): Promise<SMSResponse> {
  const template = MERGE_FIELD_SMS_TEMPLATES[options.templateKey];
  if (!template) {
    console.error(`SMS template ${options.templateKey} not found`);
    return {
      success: false,
      error: 'Template not found'
    };
  }
  
  return await sendSMS({
    to: options.to,
    message: template,
    mediaUrl: options.mediaUrl,
    mergeFieldContext: options.mergeFieldContext
  });
}

// Send bulk SMS to multiple recipients
export async function sendBulkSMS(recipients: string[], message: string, mergeFieldContext?: MergeFieldContext): Promise<SMSResponse[]> {
  console.log(`Sending bulk SMS to ${recipients.length} recipients`);
  
  const results: SMSResponse[] = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendSMS({ 
        to: recipient, 
        message,
        mergeFieldContext 
      });
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      console.error(`Failed to send SMS to ${recipient}:`, error);
      results.push({
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Bulk SMS completed: ${successCount}/${recipients.length} successful`);
  
  return results;
}

// Predefined message templates for the PKCM platform
export const SMS_TEMPLATES = {
  WELCOME: (userName: string) => 
    `Welcome to PKCM Leadership and Ministry Class, ${userName}! Your account is ready. Visit our platform to start your spiritual journey.`,
    
  COURSE_ENROLLMENT: (userName: string, courseName: string) =>
    `Hi ${userName}! You've been enrolled in "${courseName}". Access your lessons and start growing in faith today.`,
    
  LESSON_REMINDER: (userName: string, lessonTitle: string) =>
    `${userName}, don't forget to complete your lesson: "${lessonTitle}". Continue your spiritual growth journey!`,
    
  ASSIGNMENT_DUE: (userName: string, assignmentName: string, dueDate: string) =>
    `Hi ${userName}! Reminder: "${assignmentName}" is due on ${dueDate}. Complete it to stay on track.`,
    
  CERTIFICATE_EARNED: (userName: string, courseName: string) =>
    `Congratulations ${userName}! You've earned your certificate for "${courseName}". Your dedication to spiritual growth is inspiring!`,
    
  LIVE_CLASS_REMINDER: (userName: string, className: string, startTime: string) =>
    `${userName}, your live class "${className}" starts ${startTime}. Join us for interactive learning and fellowship!`,
    
  PRAYER_REQUEST_RECEIVED: (userName: string) =>
    `${userName}, we've received your prayer request. Our community is praying for you. God hears every prayer.`,
    
  DISCUSSION_REPLY: (userName: string, topicTitle: string) =>
    `${userName}, someone replied to your discussion in "${topicTitle}". Check it out and continue the conversation!`
};

// Send welcome SMS to new user
export async function sendWelcomeSMS(phoneNumber: string, userName: string): Promise<SMSResponse> {
  return await sendSMS({
    to: phoneNumber,
    message: SMS_TEMPLATES.WELCOME(userName)
  });
}

// Send course enrollment notification SMS
export async function sendCourseEnrollmentSMS(phoneNumber: string, userName: string, courseName: string): Promise<SMSResponse> {
  return await sendSMS({
    to: phoneNumber,
    message: SMS_TEMPLATES.COURSE_ENROLLMENT(userName, courseName)
  });
}

// Send lesson reminder SMS
export async function sendLessonReminderSMS(phoneNumber: string, userName: string, lessonTitle: string): Promise<SMSResponse> {
  return await sendSMS({
    to: phoneNumber,
    message: SMS_TEMPLATES.LESSON_REMINDER(userName, lessonTitle)
  });
}

// Send certificate earned SMS
export async function sendCertificateEarnedSMS(phoneNumber: string, userName: string, courseName: string): Promise<SMSResponse> {
  return await sendSMS({
    to: phoneNumber,
    message: SMS_TEMPLATES.CERTIFICATE_EARNED(userName, courseName)
  });
}

// Send live class reminder SMS
export async function sendLiveClassReminderSMS(phoneNumber: string, userName: string, className: string, startTime: string): Promise<SMSResponse> {
  return await sendSMS({
    to: phoneNumber,
    message: SMS_TEMPLATES.LIVE_CLASS_REMINDER(userName, className, startTime)
  });
}