import mongoose from 'mongoose';

const { Schema } = mongoose;

const mailResponseSchema = new Schema({
  mailId: {
    type: Schema.Types.ObjectId,
    ref: 'Mail',
    required: true,
    index: true
  },
  tokenId: {
    type: Schema.Types.ObjectId,
    ref: 'MailToken',
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
  action: {
    type: String,
    enum: ['accept', 'reject'],
    required: true
  },
  responseData: {
    // Form data for accept responses
    fullName: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    companyName: {
      type: String,
      trim: true
    },
    mobileNo: {
      type: String,
      trim: true
    },
    personalEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    officialEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    batchYear: {
      startYear: {
        type: Number,
        min: 2000,
        max: 2100
      },
      endYear: {
        type: Number,
        min: 2000,
        max: 2100
      }
    },
    // For reject responses
    rejectionReason: {
      type: String,
      trim: true
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
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

// Compound indexes for efficient queries
mailResponseSchema.index({ mailId: 1, recipientEmail: 1 });
mailResponseSchema.index({ action: 1, submittedAt: -1 });
mailResponseSchema.index({ recipientEmail: 1, submittedAt: -1 });

// Instance method to get formatted response
mailResponseSchema.methods.getFormattedResponse = function() {
  const response = {
    id: this._id,
    mailId: this.mailId,
    recipientEmail: this.recipientEmail,
    action: this.action,
    submittedAt: this.submittedAt
  };

  if (this.action === 'accept' && this.responseData) {
    response.alumniInfo = {
      fullName: this.responseData.fullName,
      designation: this.responseData.designation,
      companyName: this.responseData.companyName,
      contactInfo: {
        mobile: this.responseData.mobileNo,
        personalEmail: this.responseData.personalEmail,
        officialEmail: this.responseData.officialEmail,
        location: this.responseData.location
      },
      batch: this.responseData.batchYear
    };
  } else if (this.action === 'reject' && this.responseData?.rejectionReason) {
    response.rejectionReason = this.responseData.rejectionReason;
  }

  return response;
};

// Static method to get responses for a specific mail
mailResponseSchema.statics.getResponsesForMail = function(mailId) {
  return this.find({ mailId })
    .populate('mailId', 'title content senderId senderName')
    .populate('tokenId', 'token createdAt')
    .sort({ submittedAt: -1 });
};

// Static method to get acceptance rate for a mail
mailResponseSchema.statics.getMailStats = async function(mailId) {
  const responses = await this.aggregate([
    { $match: { mailId: mongoose.Types.ObjectId(mailId) } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    accepted: 0,
    rejected: 0,
    acceptanceRate: 0
  };

  responses.forEach(response => {
    stats.total += response.count;
    if (response._id === 'accept') {
      stats.accepted = response.count;
    } else if (response._id === 'reject') {
      stats.rejected = response.count;
    }
  });

  if (stats.total > 0) {
    stats.acceptanceRate = Math.round((stats.accepted / stats.total) * 100);
  }

  return stats;
};

// Static method to create response with validation
mailResponseSchema.statics.createResponse = function(responseData) {
  // Validate required fields based on action
  if (responseData.action === 'accept') {
    const requiredFields = ['fullName', 'mobileNo', 'personalEmail'];
    const missingFields = requiredFields.filter(field =>
      !responseData.responseData || !responseData.responseData[field]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for accept response: ${missingFields.join(', ')}`);
    }
  }

  return this.create(responseData);
};

const MailResponse = mongoose.model('MailResponse', mailResponseSchema);

export default MailResponse;