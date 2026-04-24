const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  // If no SMTP credentials, create Ethereal test account
  if (!process.env.SMTP_USER || process.env.SMTP_USER === '') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal email for development');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log(`   Preview URL: https://ethereal.email/login`);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

module.exports = { createTransporter };
