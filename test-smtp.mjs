import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, ADMIN_EMAIL } = process.env;
console.log('SMTP設定:', {
  host: SMTP_HOST, port: SMTP_PORT, user: SMTP_USER,
  from: MAIL_FROM, admin: ADMIN_EMAIL, passSet: Boolean(SMTP_PASS),
});

const transporter = nodemailer.createTransport({
  host: SMTP_HOST, port: Number(SMTP_PORT), secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  await transporter.verify();
  console.log('✅ verify() 成功: SMTP接続・認証OK');
} catch (e) {
  console.error('❌ verify() 失敗:', { code: e.code, command: e.command, response: e.response, message: e.message });
  process.exit(1);
}

// 第1引数に宛先を渡すと実送信もテスト（任意）
const to = process.argv[2];
if (to) {
  try {
    const r = await transporter.sendMail({ from: MAIL_FROM, to, subject: 'SMTP疎通テスト', text: 'テスト送信です。' });
    console.log('✅ sendMail 成功:', r.response, r.messageId);
  } catch (e) {
    console.error('❌ sendMail 失敗:', { code: e.code, response: e.response, message: e.message });
  }
}
