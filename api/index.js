import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  otp: String,
  otpExpires: Date,
  tempPasswordHash: String, // Used during registration or password reset
  
  // Profile Data
  fullName: String,
  mobileNumber: String,
  height: String,
  weight: String,
  timezone: String,
  ageRange: String,
  gender: String,
  occupation: String,
  
  // Schedule
  wakeUpTime: String,
  sleepTime: String,
  activeHours: String,
  preferredReminderTime: String,
  
  // Notifications
  notificationsEnabled: { type: Boolean, default: true },
  reminderFrequency: { type: String, default: 'Once' },
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  
  // Motivation
  whyBuildingHabits: String,
  biggestChallenge: String,
  motivationStyle: String,
  
  // UI Preferences
  theme: { type: String, default: 'Dark' },
  dashboardStyle: { type: String, default: 'Minimal' },
  weekStartsOn: { type: String, default: 'Monday' }
});
const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiry = () => new Date(Date.now() + 10 * 60000); // 10 mins

const getEmailTemplate = (title, message, otp) => `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #051424; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #1c2b3c;">
  <div style="background-color: #0d1c2d; padding: 24px; text-align: center; border-bottom: 1px solid #1c2b3c;">
    <h1 style="margin: 0; color: #4edea3; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">HB Habits</h1>
  </div>
  <div style="padding: 32px 24px;">
    <h2 style="margin-top: 0; color: #d4e4fa; font-size: 20px;">${title}</h2>
    <p style="color: #c6c6cd; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
      ${message}
    </p>
    <div style="background-color: #122131; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(78, 222, 163, 0.2);">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4edea3;">${otp}</span>
    </div>
    <p style="color: #798098; font-size: 14px; text-align: center;">
      This code will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
  <div style="padding: 20px; text-align: center; border-top: 1px solid #1c2b3c;">
    <p style="margin: 0; color: #798098; font-size: 12px;">© ${new Date().getFullYear()} HB Habits. All rights reserved.</p>
  </div>
</div>
`;

// Middleware to authenticate JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 1. LOGIN (Standard Email/Password, No OTP)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. REGISTER REQUEST (Sends OTP)
app.post('/api/register/request', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user && user.passwordHash) {
      return res.status(400).json({ error: 'Account already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    if (!user) {
      user = new User({ email, passwordHash: 'PENDING' }); // placeholder
    }
    user.tempPasswordHash = hash;
    user.otp = otp;
    user.otpExpires = otpExpiry();
    await user.save();

    await transporter.sendMail({
      from: `"HB Habits" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your HB Habits OTP Code',
      html: getEmailTemplate('Welcome to HB Habits!', 'Please use the following OTP to verify your email address and complete your registration.', otp)
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 3. REGISTER VERIFY (Validates OTP, Creates Account)
app.post('/api/register/verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.passwordHash = user.tempPasswordHash;
    user.tempPasswordHash = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. FORGOT PASSWORD REQUEST (Sends OTP)
app.post('/api/password/forgot', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.otp = generateOtp();
    user.otpExpires = otpExpiry();
    await user.save();

    await transporter.sendMail({
      from: `"HB Habits" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Reset your HB Habits Password',
      html: getEmailTemplate('Password Reset Request', 'We received a request to reset your password. Please use the following OTP to proceed.', user.otp)
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 5. FORGOT PASSWORD RESET (Validates OTP, Updates Password)
app.post('/api/password/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. DELETE ACCOUNT REQUEST (Sends OTP, requires Auth)
app.post('/api/account/delete/request', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.otp = generateOtp();
    user.otpExpires = otpExpiry();
    await user.save();

    await transporter.sendMail({
      from: `"HB Habits" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Confirm Account Deletion - HB Habits',
      html: getEmailTemplate('Account Deletion Request', 'You have requested to delete your account. <strong>WARNING: This action is irreversible.</strong> Please use the following OTP to confirm deletion.', user.otp)
    });

    res.json({ message: 'OTP sent for deletion confirmation' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. DELETE ACCOUNT VERIFY (Validates OTP, Deletes Account, requires Auth)
app.post('/api/account/delete/verify', authMiddleware, async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Immediately wipe user from DB
    await User.deleteOne({ email: req.user.email });
    // Note: We would also delete habit logs here if they were in MongoDB

    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 8. GET PROFILE
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-passwordHash -tempPasswordHash -otp -otpExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. UPDATE PROFILE
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Whitelist fields to update
    const updatableFields = [
      'fullName', 'mobileNumber', 'height', 'weight', 'timezone', 'ageRange', 'gender', 'occupation',
      'wakeUpTime', 'sleepTime', 'activeHours', 'preferredReminderTime',
      'notificationsEnabled', 'reminderFrequency', 'channels',
      'whyBuildingHabits', 'biggestChallenge', 'motivationStyle',
      'theme', 'dashboardStyle', 'weekStartsOn'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

export default app;
