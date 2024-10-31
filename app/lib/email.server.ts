import nodemailer from 'nodemailer';

type EmailData = {
  to: string;
  subject: string;
  text: string;
};

export const sendEmail = async ({ to, subject, text }: EmailData) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();

    const result = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });

    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};
