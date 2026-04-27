const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf-8');

// Fix syntax error in getEmailTemplate
serverCode = serverCode.replace(/\\`/g, '`');
serverCode = serverCode.replace(/\\\$/g, '$');

// Replace registration email
serverCode = serverCode.replace(
  /\s*await transporter\.sendMail\(\{[\s\S]*?subject: 'Your HB Habits OTP Code',[\s\S]*?\}\);/g,
  `
    await transporter.sendMail({
      from: \`"HB Habits" <\${process.env.EMAIL_FROM}>\`,
      to: email,
      subject: 'Your HB Habits OTP Code',
      html: getEmailTemplate('Welcome to HB Habits!', 'Please use the following OTP to verify your email address and complete your registration.', otp)
    });`
);

// Replace password forgot email
serverCode = serverCode.replace(
  /\s*await transporter\.sendMail\(\{[\s\S]*?subject: 'Reset your Daily Momentum Password',[\s\S]*?\}\);/g,
  `
    await transporter.sendMail({
      from: \`"HB Habits" <\${process.env.EMAIL_FROM}>\`,
      to: email,
      subject: 'Reset your HB Habits Password',
      html: getEmailTemplate('Password Reset Request', 'We received a request to reset your password. Please use the following OTP to proceed.', user.otp)
    });`
);

// Replace delete account email
serverCode = serverCode.replace(
  /\s*await transporter\.sendMail\(\{[\s\S]*?subject: 'Confirm Account Deletion',[\s\S]*?\}\);/g,
  `
    await transporter.sendMail({
      from: \`"HB Habits" <\${process.env.EMAIL_FROM}>\`,
      to: user.email,
      subject: 'Confirm Account Deletion - HB Habits',
      html: getEmailTemplate('Account Deletion Request', 'You have requested to delete your account. <strong>WARNING: This action is irreversible.</strong> Please use the following OTP to confirm deletion.', user.otp)
    });`
);

fs.writeFileSync('server.js', serverCode);
console.log('Fixed server.js');
