require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Medicine = require('../models/Medicine');
const Test = require('../models/Test');

(async () => {
  await connectDB();
  const email = 'demo@doctor.com';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      password_hash: await User.hashPassword('demo1234'),
      full_name: 'Dr. Demo',
    });
    await DoctorProfile.create({ user_id: user._id, doctor_name: 'Dr. Demo', email });
  }
  const meds = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Metformin'];
  await Medicine.insertMany(
    meds.map((n) => ({ user_id: user._id, name: n, type: 'Tablet' })),
    { ordered: false }
  ).catch(() => {});
  const tests = ['CBC', 'Urine Routine', 'Blood Sugar (Fasting)', 'Chest X-Ray'];
  await Test.insertMany(
    tests.map((n) => ({ user_id: user._id, name: n, category: n.includes('X-Ray') ? 'Imaging' : 'Blood' })),
    { ordered: false }
  ).catch(() => {});
  console.log('Seed complete. Login: demo@doctor.com / demo1234');
  process.exit(0);
})();