import nodemailer from "nodemailer";

const getSmtpConfig = () => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const password = String(process.env.SMTP_PASSWORD || "").trim();

  if (!host || !user || !password) {
    return null;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user, pass: password },
  };
};

export const isMailConfigured = () => Boolean(getSmtpConfig());

export const sendPasswordResetEmail = async ({ recipient, resetUrl }) => {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    const error = new Error("Password reset email is not configured. Please contact an administrator.");
    error.statusCode = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const from = String(process.env.SMTP_FROM || smtpConfig.auth.user).trim();

  await transporter.sendMail({
    from,
    to: recipient,
    subject: "Reset your Kavach Workflow password",
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
    html: `<p>Use the link below to reset your Kavach Workflow password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
};
