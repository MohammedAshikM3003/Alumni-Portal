import { Schema, model } from 'mongoose';

const paymentSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 1,
		},
		currency: {
			type: String,
			default: 'INR',
		},
		purpose: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		status: {
			type: String,
			enum: ['created', 'paid', 'failed'],
			default: 'created',
			index: true,
		},
		razorpayOrderId: {
			type: String,
			required: true,
			unique: true,
		},
		razorpayPaymentId: {
			type: String,
			default: null,
			sparse: true,
		},
		razorpaySignature: {
			type: String,
			default: null,
		},
		paidAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

const Payment = model('Payment', paymentSchema);

export default Payment;
