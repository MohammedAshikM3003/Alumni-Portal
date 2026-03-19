import mongoose from 'mongoose';
import dns from 'node:dns';

let gfsBucket;

const configureMongoSrvDns = (mongoUri) => {
    if (!mongoUri?.startsWith('mongodb+srv://')) {
        return;
    }

    const dnsServers = (process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

    if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
    }
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI?.trim();

        configureMongoSrvDns(mongoUri);

        const conn = await mongoose.connect(mongoUri);
        console.log(`🛰️  MongoDB Connected: ${conn.connection.host}`);

        gfsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
            bucketName: 'uploads',
        });
    } catch (error) {
        console.error(`🛰️  Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export const getGridFSBucket = () => gfsBucket;

export default connectDB;