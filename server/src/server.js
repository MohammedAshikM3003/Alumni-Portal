import express, { json } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';

// Load environment variables from a .env file
config();

// Initialize the Express application
const app = express();

// --- Middleware ---
app.use(cors());
app.use(json());

// Database Connection
connectDB();


// --- Routes ---
app.use('/api/auth', authRoutes);

app.use('/api/feedback', feedbackRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/jobs', jobRoutes);

app.use('/api/invitations', invitationRoutes);

app.use('/api/coordinators', coordinatorRoutes);

app.use('/api/departments', departmentRoutes);


// --- Start the Server ---
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});