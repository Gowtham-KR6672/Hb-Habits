import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await mongoose.model('User', new mongoose.Schema({}, { strict: false })).findOne({ email: 'ictstaff08@gmail.com' });
  console.log('User from DB:', user);
  process.exit(0);
}
checkUser();
