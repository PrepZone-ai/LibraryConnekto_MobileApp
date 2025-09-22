import { apiClient } from '../config/api';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<boolean> => {
  try {
    // Use FastAPI email service
    await apiClient.post('/email/send', {
      to,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (
  studentEmail: string,
  studentName: string,
  studentId: string,
  tempPassword: string
): Promise<boolean> => {
  const subject = 'Welcome to Library Conneckto - Your Login Credentials';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to Library Conneckto!</h2>
      <p>Dear ${studentName},</p>
      <p>Your account has been successfully created. Here are your login credentials:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <p><strong>Important:</strong> For security reasons, please change your password when you first log in.</p>
      
      <p>You can log in to your account using these credentials at our student portal.</p>
      
      <p>If you have any questions or need assistance, please contact your library administrator.</p>
      
      <p>Best regards,<br>Library Conneckto Team</p>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (
  studentEmail: string,
  studentName: string,
  resetToken: string
): Promise<boolean> => {
  const subject = 'Library Conneckto - Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Password Reset Request</h2>
      <p>Dear ${studentName},</p>
      <p>We received a request to reset your password. Here is your temporary password:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${resetToken}</p>
      </div>
      
      <p><strong>Important:</strong> For security reasons, please change your password immediately after logging in.</p>
      
      <p>If you did not request this password reset, please contact your library administrator immediately.</p>
      
      <p>Best regards,<br>Library Conneckto Team</p>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
  });
};
