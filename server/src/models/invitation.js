import { Schema, model } from 'mongoose';

const invitationSchema = new Schema(
	{
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		sender: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		subject: {
			type: String,
			required: true,
			trim: true,
			maxlength: 500,
		},
		eventDate: {
			type: Date,
			required: true,
		},
		eventTime: {
			type: String,
			required: true,
			trim: true,
		},
		venue: {
			type: String,
			required: true,
			trim: true,
			maxlength: 300,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2000,
		},
		flyer: {
			type: Schema.Types.ObjectId,
			ref: 'fs.files',
			default: null,
		},
	},
	{ timestamps: true }
);

const Invitation = model('Invitation', invitationSchema);

export default Invitation;
