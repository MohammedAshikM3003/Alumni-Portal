import express, { json } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

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


// --- Start the Server ---
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});