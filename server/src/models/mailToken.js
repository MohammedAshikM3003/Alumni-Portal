import mongoose from 'mongoose';

const { Schema } = mongoose;

const mailTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mailId: {
    type: Schema.Types.ObjectId,
    ref: 'Mail',
    required: true,
    index: true
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  // Removed 'action' field - single token handles both accept and reject
  isTokenValid: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  usedAt: {
    type: Date
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
mailTokenSchema.index({ token: 1, isTokenValid: 1, expiresAt: 1 });
mailTokenSchema.index({ mailId: 1, recipientEmail: 1 });

// Instance method to check if token is valid
mailTokenSchema.methods.isValid = function() {
  return this.isTokenValid && new Date() < this.expiresAt;
};

// Instance method to mark token as used
mailTokenSchema.methods.markAsUsed = function(userAgent = null, ipAddress = null) {
  this.isTokenValid = false;
  this.usedAt = new Date();
  if (userAgent) this.userAgent = userAgent;
  if (ipAddress) this.ipAddress = ipAddress;
  return this.save();
};

// Static method to find valid token
mailTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token,
    isTokenValid: true,
    expiresAt: { $gt: new Date() }
  }).populate('mailId');
};

// Static method to create token with expiration
mailTokenSchema.statics.createToken = function(tokenData) {
  // Set expiration to 7 days from now if not provided
  if (!tokenData.expiresAt) {
    tokenData.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  return this.create(tokenData);
};

const MailToken = mongoose.model('MailToken', mailTokenSchema);

export default MailToken;