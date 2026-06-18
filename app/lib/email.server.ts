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
    // 一時デバッグ: 本番の環境変数の状態を確認（SMTP_PASS の値は出さず、設定有無と文字数のみ）
    console.error('SMTP config (debug):', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.MAIL_FROM,
      admin: process.env.ADMIN_EMAIL,
      passSet: Boolean(process.env.SMTP_PASS),
      passLength: process.env.SMTP_PASS?.length ?? 0,
    });
    throw error;
  }
};
