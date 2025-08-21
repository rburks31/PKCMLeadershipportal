import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    console.log(`Sending email via SendGrid from ${params.from} to ${params.to} with subject: ${params.subject}`);
    
    await mailService.send(emailData);
    console.log(`✅ Email sent successfully to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body,
      fullResponse: error.response,
      stack: error.stack
    });
    
    // Log the full error details for troubleshooting
    if (error.response?.body?.errors) {
      console.error('SendGrid specific errors:', error.response.body.errors);
    }
    return false;
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string, userRole: string): Promise<boolean> {
  console.log(`Starting to send welcome email to: ${userEmail}, name: ${userName}, role: ${userRole}`);
  
  const domains = process.env.REPLIT_DOMAINS;
  const loginUrl = domains 
    ? `https://${domains.split(',')[0]}/api/login`
    : 'https://your-platform.replit.app/api/login';

  console.log(`Login URL: ${loginUrl}, REPLIT_DOMAINS: ${domains}`);

  const subject = "Welcome to PKCM Leadership and Ministry Class";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to PKCM Leadership and Ministry Class</h1>
                <p>Empowering every follower of Jesus to grow in faith</p>
            </div>
            
            <div class="content">
                <h2>Hello ${userName}!</h2>
                
                <p>Welcome to Promise Kingdom Community Ministries Leadership and Ministry Class! We're excited to have you join our community of faith and learning.</p>
                
                <p><strong>Your Account Details:</strong></p>
                <ul>
                    <li><strong>Email:</strong> ${userEmail}</li>
                    <li><strong>Role:</strong> ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</li>
                </ul>
                
                <h3>Getting Started:</h3>
                <ol>
                    <li>Click the login button below to access the platform</li>
                    <li>You'll be able to sign in using your Replit account</li>
                    <li>Once logged in, you can explore courses and begin your learning journey</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Access Your Learning Platform</a>
                </div>
                
                <h3>What You Can Expect:</h3>
                <ul>
                    <li>📚 Comprehensive biblical leadership training</li>
                    <li>🎥 Video lessons and interactive content</li>
                    <li>💬 Discussion forums with fellow learners</li>
                    <li>📈 Track your progress and earn certificates</li>
                    <li>🙏 Community support and prayer</li>
                </ul>
                
                <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>
                
                <p>Blessings,<br>
                <strong>PKCM Leadership Team</strong></p>
            </div>
            
            <div class="footer">
                <p>Promise Kingdom Community Ministries<br>
                Equipping saints for the work of ministry</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to PKCM Leadership and Ministry Class!

Hello ${userName},

Welcome to Promise Kingdom Community Ministries Leadership and Ministry Class! We're excited to have you join our community of faith and learning.

Your Account Details:
- Email: ${userEmail}
- Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}

Getting Started:
1. Visit: ${loginUrl}
2. Sign in using your Replit account
3. Explore courses and begin your learning journey

What You Can Expect:
- Comprehensive biblical leadership training
- Video lessons and interactive content
- Discussion forums with fellow learners
- Track your progress and earn certificates
- Community support and prayer

If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.

Blessings,
PKCM Leadership Team

Promise Kingdom Community Ministries
Equipping saints for the work of ministry
  `;

  // Use a verified sender email - in SendGrid you need to verify the sender
  // For development, we'll try using a generic email that might work
  const senderEmail = process.env.SENDGRID_VERIFIED_SENDER || 'test@example.com';
  
  console.log(`Attempting to send email with from: ${senderEmail}, to: ${userEmail}`);
  
  const result = await sendEmail({
    to: userEmail,
    from: senderEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });
  
  console.log(`Email send result: ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/auth?reset=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>PKCM Leadership and Ministry Class</p>
            </div>
            
            <div class="content">
                <h2>Reset Your Password</h2>
                
                <p>We received a request to reset your password for your PKCM Leadership and Ministry Class account.</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Your Password</a>
                </div>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged unless you click the link above</li>
                </ul>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
                    <a href="${resetUrl}">${resetUrl}</a>
                </p>
            </div>
            
            <div class="footer">
                <p>PKCM Leadership and Ministry Class<br>
                This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request - PKCM Leadership and Ministry Class

We received a request to reset your password for your PKCM Leadership and Ministry Class account.

To reset your password, visit: ${resetUrl}

Important:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged unless you click the link above

PKCM Leadership and Ministry Class
This is an automated message, please do not reply.
  `;

  const senderEmail = process.env.SENDGRID_VERIFIED_SENDER || 'test@example.com';
  
  return await sendEmail({
    to: email,
    from: senderEmail,
    subject: 'Reset Your Password - PKCM Leadership Class',
    html: htmlContent,
    text: textContent,
  });
}