import Payment from '../models/payment.js';
import { getRazorpayClient, verifyRazorpaySignature } from '../utils/razorpay.js';

export const createOrder = async (req, res) => {
	try {
		if (!req.user?._id) {
			return res.status(401).json({ success: false, message: 'Unauthorized request' });
		}

		const { amount, purpose = '' } = req.body;

		const numericAmount = Number(amount);
		if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
			return res.status(400).json({ success: false, message: 'Enter a valid amount' });
		}

		const trimmedPurpose = String(purpose).trim();
		if (!trimmedPurpose) {
			return res.status(400).json({ success: false, message: 'Donation purpose is required' });
		}

		if (trimmedPurpose.length > 200) {
			return res.status(400).json({ success: false, message: 'Donation purpose must be within 200 characters' });
		}

		const amountInPaise = Math.round(numericAmount * 100);
		const razorpay = getRazorpayClient();
		const shortUserId = String(req.user._id).slice(-8);
		const receipt = `don_${Date.now()}_${shortUserId}`;

		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: 'INR',
			receipt,
			notes: {
				userId: String(req.user._id),
				donationPurpose: trimmedPurpose,
			},
		});

		await Payment.create({
			user: req.user._id,
			amount: numericAmount,
			currency: 'INR',
			purpose: trimmedPurpose,
			status: 'created',
			razorpayOrderId: order.id,
		});

		return res.status(201).json({
			success: true,
			order,
			keyId: process.env.RAZORPAY_KEY_ID,
			amount: numericAmount,
			currency: 'INR',
		});
	} catch (error) {
		console.error('createOrder failed:', error);

		if (error?.message === 'Razorpay keys are not configured') {
			return res.status(500).json({ success: false, message: 'Payment gateway configuration is missing on server' });
		}

		if (error?.statusCode) {
			return res.status(502).json({ success: false, message: error.error?.description || error.message || 'Payment gateway request failed' });
		}

		return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
	}
};

export const verifyPayment = async (req, res) => {
	try {
		const {
			razorpay_order_id: orderId,
			razorpay_payment_id: paymentId,
			razorpay_signature: signature,
		} = req.body;

		if (!orderId || !paymentId || !signature) {
			return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
		}

		const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
		if (!isValid) {
			await Payment.findOneAndUpdate(
				{ razorpayOrderId: orderId },
				{ status: 'failed' },
				{ returnDocument: 'after' }
			);

			return res.status(400).json({ success: false, message: 'Invalid payment signature' });
		}

		const payment = await Payment.findOneAndUpdate(
			{ razorpayOrderId: orderId },
			{
				status: 'paid',
				razorpayPaymentId: paymentId,
				razorpaySignature: signature,
				paidAt: new Date(),
			},
			{ returnDocument: 'after' }
		);

		return res.status(200).json({ success: true, message: 'Payment verified', payment });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
	}
};

export const getMyPayments = async (req, res) => {
	try {
		const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
		return res.status(200).json({ success: true, payments });
	} catch {
		return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};

export const getAllPayments = async (req, res) => {
	try {
		if (!['coordinator', 'admin'].includes(req.user.role)) {
			return res.status(403).json({ success: false, message: 'Access denied' });
		}

		const payments = await Payment.find()
			.populate('user', 'name email userId')
			.sort({ createdAt: -1 });

		return res.status(200).json({ success: true, payments });
	} catch {
		return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};

export const getPaymentById = async (req, res) => {
	try {
		if (!['coordinator', 'admin'].includes(req.user.role)) {
			return res.status(403).json({ success: false, message: 'Access denied' });
		}

		const payment = await Payment.findById(req.params.id)
			.populate('user', 'name email userId');

		if (!payment) {
			return res.status(404).json({ success: false, message: 'Payment not found' });
		}

		return res.status(200).json({ success: true, payment });
	} catch {
		return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
	}
};
