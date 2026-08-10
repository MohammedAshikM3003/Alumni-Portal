import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in env");
  process.exit(1);
}

const FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Krishna", "Ishaan", "Shaurya", "Pranav", "Aryan", "Ananya", "Diya", "Ira", "Myra", "Saanvi", "Aanya", "Aadhya", "Riya", "Kavya", "Aditi"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Kumar", "Patel", "Reddy", "Nair", "Iyer", "Rao", "Singh", "Joshi", "Mehta", "Chawla", "Sen", "Bose", "Das", "Roy", "Pillai", "Menon", "Shetty"];
const DEGREES = ["B.E.", "B.Tech", "M.E.", "M.Tech", "MBA", "MCA"];
const BRANCHES = ["Computer Science and Engineering", "Information Technology", "Electronics and Communication Engineering", "Electrical and Electronics Engineering", "Mechanical Engineering", "Civil Engineering"];
const CITIES = ["Tiruchengode", "Salem", "Erode", "Namakkal", "Coimbatore", "Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi"];
const STREETS = ["KSR Kalvi Nagar", "Main Road", "Gandhi Street", "Kamarajar Street", "Netaji Street", "Sathy Road", "Avinashi Road", "Anna Salai"];

const generateRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateAlumniBatch = async () => {
  try {
    console.log("🛰️ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔑 Generating hashed password...");
    // Pre-computed hash for "Password123" to make seeding extremely fast
    const hashedPassword = await bcrypt.hash("Password123", 10);
    console.log("✅ Hashed password ready");

    // We need 100 random registrations
    // Register numbers must be exactly 11 digits (e.g. 20261100001 to 20261100100)
    const prefix = 20261100000;
    
    const usersToInsert = [];
    const alumniToInsert = [];

    console.log("🎲 Generating 100 mock alumni...");
    for (let i = 1; i <= 100; i++) {
      const regNo = String(prefix + i);
      const firstName = generateRandomElement(FIRST_NAMES);
      const lastName = generateRandomElement(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + Math.floor(Math.random() * 100000)}@ksrce.edu`;
      
      const dob = new Date(1995 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const yearFrom = 2012 + Math.floor(Math.random() * 8);
      const yearTo = yearFrom + 4;
      const degree = generateRandomElement(DEGREES);
      const branch = generateRandomElement(BRANCHES);

      const userId = new mongoose.Types.ObjectId();

      const userDoc = {
        _id: userId,
        userId: regNo,
        name,
        email,
        password: hashedPassword,
        role: 'alumni'
      };

      const alumniDoc = {
        userId,
        registerNumber: regNo,
        name,
        fatherName: `${generateRandomElement(FIRST_NAMES)} ${lastName}`,
        email,
        dob,
        yearFrom,
        yearTo,
        degree,
        branch,
        presentAddress: {
          street: generateRandomElement(STREETS),
          city: generateRandomElement(CITIES),
          pinCode: String(638000 + Math.floor(Math.random() * 999)),
          mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`
        },
        permanentAddress: {
          street: generateRandomElement(STREETS),
          city: generateRandomElement(CITIES),
          pinCode: String(638000 + Math.floor(Math.random() * 999)),
          mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`
        },
        hasCompetitiveExams: false,
        competitiveExams: [],
        collegeQualifications: [],
        placementType: generateRandomElement(['On-campus', 'Off-campus', 'Others', 'To be employed', '']),
        designation: Math.random() > 0.3 ? generateRandomElement(['Software Engineer', 'Senior Engineer', 'Project Manager', 'Data Analyst', 'QA Engineer', 'Systems Analyst']) : undefined,
        companyAddress: Math.random() > 0.3 ? generateRandomElement(['TCS, Chennai', 'Infosys, Bangalore', 'Wipro, Coimbatore', 'Cognizant, Coimbatore', 'Accenture, Bangalore']) : undefined,
        employmentRemarks: 'Generated test data',
        isEntrepreneur: false,
        maritalStatus: generateRandomElement(['Single', 'Married', '']),
        knownAlumni: [],
        signature: null,
        profilePhoto: null
      };

      usersToInsert.push(userDoc);
      alumniToInsert.push(alumniDoc);
    }

    console.log("💾 Bulk inserting users into database...");
    await User.insertMany(usersToInsert);
    console.log("✅ Users inserted");

    console.log("💾 Bulk inserting alumni records into database...");
    await Alumni.insertMany(alumniToInsert);
    console.log("✅ Alumni records inserted");

    console.log("🎉 Seeding completed successfully! 100 mock alumni added.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

generateAlumniBatch();
