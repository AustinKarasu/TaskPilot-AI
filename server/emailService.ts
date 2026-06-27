/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from "nodemailer";

// Gmail SMTP configuration details
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || "zevrylofficial@gmail.com",
    pass: process.env.SMTP_PASS || "pwik rbcs zsxs cjwt"
  }
});

const FROM_EMAIL = "CivicPulse <demo@civicpulse.gov.in>";

export async function sendContactNotification(name: string, email: string, subject: string, message: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: "zevrylofficial@gmail.com",
    replyTo: email,
    subject: `[CivicPulse Contact Us] ${subject}`,
    text: `You have received a new message from the contact form.

Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #06b6d4; margin-top: 0;">New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="border-left: 3px solid #06b6d4; padding-left: 10px; font-style: italic; color: #cbd5e1; white-space: pre-wrap;">${message}</div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendNewsletterConfirmation(email: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to CivicPulse — Subscription Confirmed",
    text: `Thank you for subscribing to CivicPulse announcements and newsletters!

We will keep you updated with the latest infrastructure audits, resolving progress, and civic points opportunities in your neighborhood.

Best regards,
The CivicPulse Team
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h2 style="color: #06b6d4; margin-top: 0;">Subscription Confirmed!</h2>
        <p>Thank you for subscribing to CivicPulse announcements and newsletters.</p>
        <p>You will now receive direct notifications about:</p>
        <ul>
          <li>Hyperlocal infrastructure audit highlights</li>
          <li>Critical municipal bulletins and road closures</li>
          <li>Civic points double-reward streaks</li>
        </ul>
        <p>Best regards,<br><strong>The CivicPulse Team</strong></p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetLink(email: string, token: string) {
  const resetLink = `http://localhost:3000/login?resetToken=${token}`;
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: "Reset Your CivicPulse Password",
    text: `Please use the following link to reset your CivicPulse account password:
${resetLink}

This link is valid for 1 hour.
If you did not request this, please ignore this email.
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h2 style="color: #06b6d4; margin-top: 0;">Reset Your Password</h2>
        <p>You requested a password reset for your CivicPulse account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #4f46e5); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; border: none;">Reset Password</a>
        </div>
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; color: #a5f3fc; font-family: monospace;">${resetLink}</p>
        <p>If you did not make this request, please ignore this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendAdmin2FACode(email: string, code: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: "Your CivicPulse Admin 2FA Code",
    text: `Your administrator security verification code is: ${code}

This code is valid for 5 minutes.
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h2 style="color: #ef4444; margin-top: 0;">Admin Security Desk Login</h2>
        <p>A login request to the Administrator Board was detected. Use the security verification code below to authorize this session:</p>
        <div style="font-size: 32px; font-family: monospace; font-weight: bold; background: #0f172a; border: 1px dashed #ef4444; padding: 15px; text-align: center; color: #f87171; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code is valid for 5 minutes.</p>
        <p>If you did not initiate this login request, please update your account password immediately.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendIssueStatusUpdate(email: string, issueTitle: string, status: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `[CivicPulse Alert] Ticket Status Updated to ${status.toUpperCase()}`,
    text: `An issue you follow: "${issueTitle}" has been updated to ${status.toUpperCase()}.

Check the dashboard for details.
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #06b6d4; margin-top: 0;">Issue Status Alert</h3>
        <p>An issue you are following has changed status.</p>
        <p><strong>Title:</strong> ${issueTitle}</p>
        <p><strong>New Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #10b981;">${status}</span></p>
        <p>Thank you for contributing to your neighborhood's safety!</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendIssueReported(email: string, issueTitle: string, issueId: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `[CivicPulse Confirm] Report Submitted: ${issueTitle}`,
    text: `Your civic report "${issueTitle}" (ID: ${issueId}) has been successfully submitted to CivicPulse.
    
We have registered this ticket and notified the relevant municipal departments. You will receive email notifications as the status changes.

Thank you for helping improve our community!
`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #06b6d4; margin-top: 0;">Civic Report Received</h3>
        <p>Your report has been successfully filed with CivicPulse.</p>
        <p><strong>Ticket ID:</strong> ${issueId}</p>
        <p><strong>Title:</strong> ${issueTitle}</p>
        <p>Our municipal team will review and assign it to the corresponding service department shortly. You can track progress directly from the dashboard.</p>
        <p>Thank you for contributing to your neighborhood!</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendAnnouncementNotification(email: string, title: string, content: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `[CivicPulse Announcement] ${title}`,
    text: `CivicPulse News: ${title}\n\n${content}\n\nBest regards,\nThe CivicPulse Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #f59e0b; margin-top: 0;">Municipal Broadcast Announcement</h3>
        <h2 style="color: #ffffff; font-size: 18px; margin: 10px 0;">${title}</h2>
        <div style="color: #cbd5e1; line-height: 1.6; font-size: 14px; white-space: pre-wrap; margin-bottom: 20px;">
          ${content}
        </div>
        <p style="font-size: 12px; color: #64748b; border-t: 1px solid #1e293b; padding-top: 12px; margin-top: 20px;">
          You received this notification because you subscribed to the CivicPulse neighborhood newsletters.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendSupportTicketResolved(email: string, ticketId: string, subject: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `[CivicPulse Support] Ticket Resolved: ${ticketId}`,
    text: `Hello,\n\nYour support ticket ${ticketId} regarding "${subject}" has been marked as RESOLVED by our administrators.\n\nThank you for contacting CivicPulse support.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #10b981; margin-top: 0;">Support Ticket Resolved</h3>
        <p>Your support request has been successfully processed and resolved by our helpdesk.</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #0f172a; border-left: 3px solid #10b981; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; color: #cbd5e1;">
          Status: <strong style="color: #34d399; text-transform: uppercase;">Resolved</strong>
        </div>
        <p>If you have further questions, please feel free to open a new support request.</p>
        <p>Best regards,<br><strong>CivicPulse Helpdesk</strong></p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendSupportTicketCreated(email: string, ticketId: string, name: string, subject: string, message: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `[CivicPulse Support] Ticket Created: ${ticketId}`,
    text: `Hello ${name},\n\nYour support ticket has been successfully registered with CivicPulse.\n\nTicket ID: ${ticketId}\nSubject: ${subject}\nMessage:\n${message}\n\nOur support desk will review and respond to your request shortly.\n\nBest regards,\nThe CivicPulse Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #020617; color: #f1f5f9; padding: 24px;">
        <h3 style="color: #06b6d4; margin-top: 0;">Support Ticket Registered</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your support ticket has been successfully registered with our helpdesk.</p>
        <div style="background: #0f172a; border-left: 3px solid #06b6d4; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; color: #cbd5e1;">
          <strong>Ticket ID:</strong> ${ticketId}<br>
          <strong>Subject:</strong> ${subject}<br>
          <strong>Status:</strong> <span style="color: #34d399; text-transform: uppercase;">Open</span>
        </div>
        <p><strong>Your Message:</strong></p>
        <div style="border-left: 3px solid #1e293b; padding-left: 10px; font-style: italic; color: #cbd5e1; white-space: pre-wrap; font-size: 13px;">${message}</div>
        <p style="margin-top: 20px;">Our support desk will review your inquiry and get back to you within 12 hours.</p>
        <p>Best regards,<br><strong>CivicPulse Helpdesk</strong></p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

