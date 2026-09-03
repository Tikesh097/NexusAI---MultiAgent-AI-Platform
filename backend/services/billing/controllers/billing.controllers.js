import axios from "axios";
import crypto from "crypto";

import { PLANS } from "../config/Plans.js";
import razorpay from "../config/razorPay.js";
import Payment from "../models/payment.model.js";

// ===============================
// CREATE RAZORPAY ORDER
// ===============================

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const selectedPlan = PLANS[plan];

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
    });

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
  let claimedPayment = null;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

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

    // Generate expected Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Safely compare signatures
    const generatedBuffer = Buffer.from(generatedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const signatureIsValid =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    /*
     * Atomically claim the payment.
     * Only one request can change it to "processing".
     */
    claimedPayment = await Payment.findOneAndUpdate(
      {
        orderId: razorpay_order_id,
        status: {
          $in: ["created", "pending", "failed"],
        },
      },
      {
        $set: {
          status: "processing",
          paymentId: razorpay_payment_id,
        },
      },
      {
        new: true,
      },
    );

    if (!claimedPayment) {
      const existingPayment = await Payment.findOne({
        orderId: razorpay_order_id,
      });

      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      if (existingPayment.status === "paid") {
        return res.status(409).json({
          success: false,
          message: "Payment already verified",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Payment verification is already being processed",
      });
    }

    // Update the user's plan and credits through protected internal route
    await axios.post(
      `${process.env.AUTH_SERVICE}/internal/update-plan`,
      {
        userId: claimedPayment.userId,
        plan: claimedPayment.plan,
        credits: claimedPayment.credits,
        paymentId: razorpay_payment_id,
      },
      {
        headers: {
          "x-internal-service-secret":
            process.env.BILLING_SERVICE_SECRET,

          // Auth service must use this to prevent duplicate credits
          "x-idempotency-key": razorpay_payment_id,
        },
        timeout: 10000,
      },
    );

    // Mark payment paid only after Auth service succeeds
    claimedPayment.status = "paid";
    claimedPayment.paymentId = razorpay_payment_id;
    claimedPayment.paidAt = new Date();

    await claimedPayment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error(
      "Verify payment error:",
      error.response?.data || error.message,
    );

    // Allow retry if updating the Auth service failed
    if (claimedPayment?._id) {
      await Payment.updateOne(
        {
          _id: claimedPayment._id,
          status: "processing",
        },
        {
          $set: {
            status: "failed",
          },
        },
      ).catch((updateError) => {
        console.error(
          "Failed to reset payment status:",
          updateError.message,
        );
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};