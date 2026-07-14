// config/email.js
import nodemailer from 'nodemailer';

let transporter = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
    console.log('✅ Email service configured');
  } else {
    console.log('⚠️ Email credentials not provided. Email notifications disabled.');
  }
} catch (error) {
  console.error('❌ Email configuration error:', error.message);
}

// ✅ Test connection on startup
if (transporter) {
  transporter.verify(function(error, success) {
    if (error) {
      console.error('❌ Email transporter error:', error);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
}

export const sendVerificationEmail = async (email, verificationToken, userName) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  if (!transporter) {
    console.log('📧 Verification email would be sent to:', email);
    console.log('🔗 Verify link:', verifyUrl);
    console.log('⚠️ Email not sent - configure EMAIL_USER and EMAIL_PASS in .env');
    return true;
  }

  const mailOptions = {
    from: `"Artizio Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Artizio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #d97706; margin: 0;">ArtVault</h1>
          <p style="color: #92400e; font-size: 18px;">Verify Your Email Address</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
          <p style="color: #333; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; line-height: 1.6;">Welcome to ArtVault! Please confirm your email address to activate your account and start exploring or sharing artwork.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't create this account, you can safely ignore this email.</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #92400e; font-size: 12px;">
          <p>&copy; 2026 Artizio. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Verification email send error:', error.message);
    return false;
  }
};

export const sendResetPasswordEmail = async (email, resetToken, userName) => {
  if (!transporter) {
    console.log('📧 Email would be sent to:', email);
    console.log('🔗 Reset link:', `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
    console.log('⚠️ Email not sent - configure EMAIL_USER and EMAIL_PASS in .env');
    return true;
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Artizio Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Artizio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #d97706; margin: 0;">ArtVault</h1>
          <p style="color: #92400e; font-size: 18px;">Password Reset Request</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
          <p style="color: #333; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password for your Artizio account. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">This link will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email or contact support.</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #92400e; font-size: 12px;">
          <p>&copy; 2026 Artizio. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

export const sendPasswordResetSuccess = async (email, userName) => {
  if (!transporter) {
    console.log('📧 Success email would be sent to:', email);
    console.log('⚠️ Email not sent - configure EMAIL_USER and EMAIL_PASS in .env');
    return true;
  }

  const mailOptions = {
    from: `"Artizio Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Changed Successfully - Artizio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #d97706; margin: 0;">ArtVault</h1>
          <p style="color: #92400e; font-size: 18px;">Password Changed Successfully</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
          <p style="color: #333; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; line-height: 1.6;">Your password has been successfully changed.</p>
          <p style="color: #666; line-height: 1.6;">If you did not make this change, please contact support immediately.</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #92400e; font-size: 12px;">
          <p>&copy; 2026 Artizio. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Success email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Success email send error:', error.message);
    // ✅ Don't throw - just log the error
    return false;
  }
};