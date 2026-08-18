import axios from "axios";
import { PLANS } from "../config/Plans.js";
import razorpay from "../config/razorPay.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";

// ===============================
// CREATE RAZORPAY ORDER
// ===============================
export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    const userId = req.headers["x-user-id"];

    const selectedPlan = PLANS[plan];

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan Not Found",
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
    });

    // Save payment in database
    await Payment.create({
      userId,
      orderId: order.id,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      plan: selectedPlan.id,
      currency: order.currency,
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
      plan: selectedPlan,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: `Create order error: ${error.message}`,
    });
  }
};

// ===============================
// VERIFY RAZORPAY PAYMENT
// ===============================
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    console.log("================================");
    console.log("RAZORPAY PAYMENT VERIFICATION");
    console.log("================================");

    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Signature:", razorpay_signature);

    // Check required payment details
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details",
      });
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    console.log("Generated Signature:", generatedSignature);
    console.log("Received Signature:", razorpay_signature);

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      console.log("❌ Signature verification failed");

      return res.status(400).json({
        success: false,
        message: "Payment Verification Failed",
      });
    }

    console.log("✅ Signature verified");

    // Find payment in database
    const payment = await Payment.findOne({
      orderId: razorpay_order_id,
    });

    if (!payment) {
      console.log("❌ Payment not found");

      return res.status(400).json({
        success: false,
        message: "Payment Not Found",
      });
    }

    console.log("✅ Payment found:", payment._id);

    // Update payment
    payment.status = "paid";
    payment.paymentId = razorpay_payment_id;

    await payment.save();

    console.log("✅ Payment status updated");

    // Update user plan and credits
    await axios.post(
      `${process.env.AUTH_SERVICE}/update-plan`,
      {
        userId: payment.userId,
        plan: payment.plan,
        credits: payment.credits,
      }
    );

    console.log("✅ User plan updated");

    return res.status(200).json({
      success: true,
      message: "Payment Verified Successfully",
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: `Verify payment error: ${error.message}`,
    });
  }
};