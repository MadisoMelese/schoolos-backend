import nodemailer from "nodemailer";
import env from "../config/env.js";

/**
 * Email Service using Nodemailer
 * Handles sending emails for password reset and other notifications
 */

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  if (transporter) return transporter;

  // Skip email setup if SMTP credentials are not provided
  if (!env.smtp.user || !env.smtp.pass) {
    console.warn("Email service not configured. Set SMTP_USER and SMTP_PASS in environment variables.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return transporter;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
      return true; // Return true to allow development without email
    }

    const resetLink = `${env.clientUrl}/password-reset?token=${resetToken}`;

    const mailOptions = {
      from: `${env.smtp.fromName} <${env.smtp.fromEmail}>`,
      to: email,
      subject: "Password Reset Request - SchoolOS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${userName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              Or copy and paste this link in your browser:<br/>
              <code style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${resetLink}</code>
            </p>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              This link will expire in 1 hour.
            </p>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} SchoolOS. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string,
  tempPassword?: string
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log(`[DEV] Welcome email for ${email}`);
      return true;
    }

    const mailOptions = {
      from: `${env.smtp.fromName} <${env.smtp.fromEmail}>`,
      to: email,
      subject: "Welcome to SchoolOS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to SchoolOS</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${userName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Your account has been created successfully. You can now log in to SchoolOS.
            </p>
            
            ${tempPassword ? `
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #856404; margin: 0;">
                  <strong>Temporary Password:</strong> ${tempPassword}
                </p>
                <p style="color: #856404; margin: 10px 0 0 0; font-size: 12px;">
                  Please change this password after your first login.
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.clientUrl}/login" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Go to Login
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              If you have any questions, please contact support.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} SchoolOS. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};
