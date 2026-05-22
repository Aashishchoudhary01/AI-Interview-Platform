import razorpay from "../services/razorpay.service.js";
import Payment from "../models/paymentModel.js";
import User from "../models/userModel.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const { planId, amount, credits } = req.body;

        if (!amount || !credits) return res.status(400).json({ message: "Invalid plan data" });

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        await Payment.create({
            userId: req.userId,
            planId,
            amount,
            credits,
            razorpayOrderId: order.id,
            status: "Created"
        });

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: `Failed to create order: ${error.message}` });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) return res.status(404).json({ message: "Payment not found" });

        if (payment.status === "Paid") {
            return res.status(400).json({ message: "Already processed" });
        }

        payment.status = "Paid";
        payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();

        // Update User Credits
        const updatedUser = await User.findByIdAndUpdate(
            payment.userId,
            { $inc: { credits: payment.credits } },
            { new: true }
        );

        return res.status(200).json({ message: "Payment verified", user: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: `Verification failed: ${error.message}` });
    }
};