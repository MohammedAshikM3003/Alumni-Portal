import type { Request, Response } from 'express';
import Payment from '../models/payment.js';
import { getRazorpayClient, verifyRazorpaySignature } from '../utils/razorpay.js';
import { findCoordinatorForUser } from '../utils/coordinatorResolver.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?._id) {
			res.status(401).json({ success: false, message: 'Unauthorized request' });
			return;
		}

		const { amount, purpose = '' } = req.body;

		const numericAmount = Number(amount);
		if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
			res.status(400).json({ success: false, message: 'Enter a valid amount' });
			return;
		}

		const trimmedPurpose = String(purpose).trim();
		if (!trimmedPurpose) {
			res.status(400).json({ success: false, message: 'Donation purpose is required' });
			return;
		}

		if (trimmedPurpose.length > 200) {
			res.status(400).json({ success: false, message: 'Donation purpose must be within 200 characters' });
			return;
		}

		const amountInPaise = Math.round(numericAmount * 100);
		const razorpay = getRazorpayClient();
		const shortUserId = String(req.user._id).slice(-8);
		const receipt = `don_${Date.now()}_${shortUserId}`;

		console.log('Creating Razorpay order:', { amount: amountInPaise, currency: 'INR', receipt });

		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: 'INR',
			receipt,
			notes: {
				userId: String(req.user._id),
				donationPurpose: trimmedPurpose,
			},
		});

		console.log('Razorpay order created:', order.id);

		// Create pending payment record to link Razorpay order with user
		const paymentRecord = await Payment.create({
			user: req.user._id,
			amount: numericAmount,
			currency: 'INR',
			purpose: trimmedPurpose,
			status: 'created',
			razorpayOrderId: order.id,
		});

		console.log('Payment record created (pending):', paymentRecord._id);

		res.status(201).json({
			success: true,
			order: {
				id: order.id,
				amount: order.amount,
				currency: order.currency || 'INR',
			},
			keyId: process.env.RAZORPAY_KEY_ID,
			amount: numericAmount,
			currency: 'INR',
		});
	} catch (error: any) {
		console.error('createOrder failed:', error);

		if (error?.message === 'Razorpay keys are not configured') {
			res.status(500).json({ success: false, message: 'Payment gateway configuration is missing on server' });
			return;
		}

		if (error?.statusCode) {
			res.status(502).json({ success: false, message: error.error?.description || error.message || 'Payment gateway request failed' });
			return;
		}

		res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
	}
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			razorpay_order_id: orderId,
			razorpay_payment_id: paymentId,
			razorpay_signature: signature,
		} = req.body;

		console.log('Verifying payment:', { orderId, paymentId, signature: signature ? 'present' : 'missing' });

		if (!orderId || !paymentId || !signature) {
			res.status(400).json({ success: false, message: 'Missing payment verification fields' });
			return;
		}

		const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
		console.log('Signature valid:', isValid);

		if (!isValid) {
			// Update payment status to failed if signature is invalid
			await Payment.findOneAndUpdate(
				{ razorpayOrderId: orderId },
				{ status: 'failed' },
				{ returnDocument: 'after' }
			);

			res.status(400).json({ success: false, message: 'Invalid payment signature' });
			return;
		}

		// Update existing payment record to mark as paid
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

		if (!payment) {
			console.error('Payment record not found for order:', orderId);
			res.status(400).json({ success: false, message: 'Payment record not found' });
			return;
		}

		console.log('Payment updated to paid:', payment._id);

		res.status(200).json({ success: true, message: 'Payment verified', payment });
	} catch (error: any) {
		console.error('Payment verification error:', error);
		res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
	}
};

export const getMyPayments = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}
		const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
		res.status(200).json({ success: true, payments });
	} catch {
		res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user || !['coordinator', 'admin'].includes(req.user.role)) {
			res.status(403).json({ success: false, message: 'Access denied' });
			return;
		}

		const payments = await Payment.find()
			.populate<{ user: { email: string; name: string; userId: string } }>('user', 'name email userId')
			.sort({ createdAt: -1 });

		const { default: Alumni } = await import('../models/alumni.js');

		// Bulk fetch alumni branches by email
		const emails = Array.from(
			new Set(payments.map(p => p.user?.email?.toLowerCase()).filter(Boolean))
		);

		const alumniList = await Alumni.find({ email: { $in: emails } }).select('email branch');
		const alumniBranchMap = new Map<string, string>();
		for (const alumni of alumniList) {
			if (alumni.email && alumni.branch) {
				alumniBranchMap.set(alumni.email.toLowerCase(), alumni.branch);
			}
		}

		const paymentsWithBranch = payments.map(payment => {
			const pObj = payment.toObject() as any;
			const userEmail = payment.user?.email?.toLowerCase();
			pObj.department = userEmail ? (alumniBranchMap.get(userEmail) || '') : '';
			return pObj;
		});

		res.status(200).json({ success: true, payments: paymentsWithBranch });
	} catch (error) {
		console.error('Error fetching all payments:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user || !['coordinator', 'admin'].includes(req.user.role)) {
			res.status(403).json({ success: false, message: 'Access denied' });
			return;
		}

		const payment = await Payment.findById(req.params.id)
			.populate('user', 'name email userId');

		if (!payment) {
			res.status(404).json({ success: false, message: 'Payment not found' });
			return;
		}

		res.status(200).json({ success: true, payment });
	} catch {
		res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
	}
};

export const deletePayment = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		const payment = await Payment.findById(id);

		if (!payment) {
			res.status(404).json({ success: false, message: 'Payment not found' });
			return;
		}

		// Only allow deletion if payment status is 'created' (pending)
		if (payment.status !== 'created') {
			res.status(400).json({
				success: false,
				message: 'Only pending donations can be deleted'
			});
			return;
		}

		// Only allow users to delete their own payments
		if (payment.user.toString() !== req.user._id.toString()) {
			res.status(403).json({
				success: false,
				message: 'You can only delete your own payments'
			});
			return;
		}

		await Payment.findByIdAndDelete(id);

		res.status(200).json({
			success: true,
			message: 'Donation deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting payment:', error);
		res.status(500).json({ success: false, message: 'Failed to delete donation' });
	}
};

export const getDepartmentPayments = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user || !['coordinator', 'admin'].includes(req.user.role)) {
			res.status(403).json({ success: false, message: 'Access denied' });
			return;
		}

		// If admin, return all payments
		if (req.user.role === 'admin') {
			await getAllPayments(req, res);
			return;
		}

		// For coordinators, get department
		const coordinator = await findCoordinatorForUser(req.user);
		const department = coordinator?.department || '';

		if (!department) {
			res.status(400).json({
				success: false,
				message: 'Coordinator department not found',
			});
			return;
		}

		// Normalize department name for case-insensitive comparison
		const normalizedDepartment = department.trim().toLowerCase();

		const payments = await Payment.find()
			.populate<{ user: { email: string } }>('user', 'name email userId')
			.sort({ createdAt: -1 });

		// Import Alumni model to check branch
		const { default: Alumni } = await import('../models/alumni.js');

		// Filter by coordinator's department
		const departmentPayments = [];
		for (const payment of payments) {
			try {
				const alumni = await Alumni.findOne({
					email: payment.user?.email?.toLowerCase(),
				}).select('branch');

				const normalizedBranch = (alumni?.branch || '').trim().toLowerCase();
				if (normalizedBranch === normalizedDepartment) {
					departmentPayments.push(payment);
				}
			} catch (err) {
				console.error('Error checking alumni for payment:', err);
			}
		}

		res.status(200).json({
			success: true,
			payments: departmentPayments,
			total: departmentPayments.length,
			department,
		});
	} catch (error) {
		console.error('Error fetching department payments:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};
