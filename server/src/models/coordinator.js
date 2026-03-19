import { Schema, model } from 'mongoose';

const coordinatorSchema = new Schema(
	{
		// Reference to User collection for authentication
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		staffId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		designation: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		department: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		// Role/responsibilities in the system
		roles: [{
			type: String,
			enum: ['coordinator', 'hod', 'admin_assistant', 'senior_coordinator'],
			default: ['coordinator']
		}],
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		phone: {
			type: String,
			trim: true,
			maxlength: 20,
		},
		location: {
			type: String,
			trim: true,
			maxlength: 200,
		},
		status: {
			type: String,
			enum: ['Active', 'Inactive', 'On Leave'],
			default: 'Active',
		},
		joinDate: {
			type: Date,
			required: true,
		},
		personalInfo: {
			dob: {
				type: Date,
			},
			gender: {
				type: String,
				enum: ['Male', 'Female', 'Other'],
			},
			bloodGroup: {
				type: String,
				maxlength: 5,
			},
			address: {
				type: String,
				maxlength: 500,
			},
		},
		education: [
			{
				degree: {
					type: String,
					trim: true,
				},
				institution: {
					type: String,
					trim: true,
				},
				year: {
					type: String,
					trim: true,
				},
			},
		],
		experience: {
			type: String,
			trim: true,
			maxlength: 200,
		},
		publications: {
			type: Number,
			default: 0,
		},
		patents: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Index for faster queries (staffId already indexed via unique: true)
coordinatorSchema.index({ department: 1 });
coordinatorSchema.index({ email: 1 });
coordinatorSchema.index({ roles: 1 });

const Coordinator = model('Coordinator', coordinatorSchema, 'coordinators');

export default Coordinator;
