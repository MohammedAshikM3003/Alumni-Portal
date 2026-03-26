import { Schema, model } from 'mongoose';
import crypto from 'crypto';

const registrationTokenSchema = new Schema(
	{
		token: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		isUsed: {
			type: Boolean,
			default: false,
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: { expireAfterSeconds: 0 }, // TTL index for auto-cleanup
		},
		usedAt: {
			type: Date,
		},
		userAgent: {
			type: String,
		},
		ipAddress: {
			type: String,
		},
		prefilledData: {
			type: Schema.Types.Mixed,
			default: null,
		},
	},
	{ timestamps: true }
);

// Instance method: Check if token is valid
registrationTokenSchema.methods.isValid = function () {
	return !this.isUsed && this.expiresAt > new Date();
};

// Instance method: Mark token as used
registrationTokenSchema.methods.markAsUsed = async function (userAgent, ipAddress) {
	this.isUsed = true;
	this.usedAt = new Date();
	this.userAgent = userAgent;
	this.ipAddress = ipAddress;
	await this.save();
};

// Static method: Find valid token
registrationTokenSchema.statics.findValidToken = async function (token) {
	const tokenRecord = await this.findOne({
		token,
		isUsed: false,
		expiresAt: { $gt: new Date() },
	});
	return tokenRecord;
};

// Static method: Create token with expiry (default 2 days)
registrationTokenSchema.statics.createToken = async function (email, prefilledData = null, expiryDays = 2) {
	const token = crypto.randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

	const tokenRecord = await this.create({
		token,
		email,
		expiresAt,
		prefilledData,
	});

	return tokenRecord;
};

const RegistrationToken = model('RegistrationToken', registrationTokenSchema, 'registrationTokens');

export default RegistrationToken;
