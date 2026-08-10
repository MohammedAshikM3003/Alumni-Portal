import { Schema, model, type Types, type Document } from 'mongoose';

export interface IJobReference {
  submittedBy: Types.ObjectId;
  companyName: string;
  role: string;
  targetBranch: string;
  vacancies: number;
  location: string;
  workMode: 'offline' | 'online' | 'hybrid';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  rejectedBy?: Types.ObjectId;
  rejectedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IJobReferenceDocument = IJobReference & Document;

const jobReferenceSchema = new Schema<IJobReference>(
	{
		submittedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		companyName: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		role: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		targetBranch: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		vacancies: {
			type: Number,
			required: true,
			min: 1,
		},
		location: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		workMode: {
			type: String,
			enum: ['offline', 'online', 'hybrid'],
			required: true,
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
			index: true,
		},
		approvedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		approvedByName: {
			type: String,
			trim: true,
		},
		rejectedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		rejectedByName: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

const JobReference = model<IJobReference>('JobReference', jobReferenceSchema);

export default JobReference;
