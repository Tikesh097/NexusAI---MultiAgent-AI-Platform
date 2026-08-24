import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, Sparkles, X, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";
import { setUserData } from '../redux/userSlice'
import getCurrentUser from '../features/getCurrentUser'

const gradientAccent = "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "₹199",
    period: "/month",
    credits: "500 Credits",
    icon: Zap,
    popular: false,
    features: ["500 monthly credits", "Standard response speed", "Chat & code agents", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/month",
    credits: "1,000 Credits",
    icon: Sparkles,
    popular: true,
    features: ["1,000 monthly credits", "Priority response speed", "All agents incl. Vision & PDF", "Priority support"],
  },
];

function BillingDrawer({ open, onClose }) {

  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch()

  const handleUpgrade = async (plan) => {
    try {
      console.log("Selected plan:", plan);

      // Create Razorpay order
      const data = await createOrder(plan);

      console.log("Order created:", data);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,

        amount: data?.order?.amount,

        currency: data?.order?.currency,

        name: "NexusAI",

        description: `${data?.plan?.name || plan} Plan`,

        order_id: data?.order?.id,

        handler: async (response) => {
          try {
            console.log("Razorpay response:", response);

            const data = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log("Payment verification:", data);

            if (data?.success) {
              const updatedUser = await getCurrentUser();

              console.log("Updated user from backend:", updatedUser);

              dispatch(setUserData(updatedUser));
            }
          } catch (error) {
            console.error("Payment verification/update error:", error);
          }


        },




        theme: {
          color: "#8B7CFF",
        },
      };

      // Check Razorpay SDK
      if (!window.Razorpay) {
        console.error("Razorpay SDK is not loaded");
        return;
      }

      const razorpay = new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error("Order creation failed:", error);
    }
  };

  const creditsUsed = userData?.credits || 0;
  const creditsTotal = userData?.totalCredits || 100;
  const creditsPct = Math.min(100, Math.max(0, (creditsUsed / (creditsTotal || 1)) * 100));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 backdrop-blur-[2px]"
          />

          {/* Billing Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 h-screen w-full sm:w-[380px] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            style={{
              background: "radial-gradient(140% 100% at 100% 0%, #14151F 0%, #0A0B12 55%, #08090F 100%)",
            }}
          >
            {/* ambient glow */}
            <div
              className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-[0.14] blur-3xl"
              style={{ background: "radial-gradient(circle, #8B7CFF 0%, transparent 70%)" }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div>
                <div className="text-white text-lg font-semibold tracking-tight">
                  Billing
                </div>

                <div className="text-slate-400 text-sm">
                  Plan &amp; Credits
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close billing drawer"
                className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            {/* Current Plan */}
            <div className="relative p-5">
              <div
                className="rounded-2xl border border-white/[0.1] p-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(160deg, rgba(155,140,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex justify-between items-start relative">
                  <div>
                    <p className="text-slate-400 text-[12px] font-medium uppercase tracking-wide">
                      Current Plan
                    </p>

                    <h3 className="text-white text-xl font-bold capitalize mt-0.5">
                      {userData?.plan || "free"}
                    </h3>
                  </div>

                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-white/10"
                    style={{
                      background: "linear-gradient(135deg, rgba(250,204,21,0.18) 0%, rgba(217,119,6,0.18) 100%)",
                    }}
                  >
                    <Crown size={17} className="text-amber-400" />
                  </div>
                </div>

                {/* Credits */}
                <div className="mt-5 relative">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium">Credits</span>

                    <span className="text-slate-300 font-semibold tabular-nums">
                      {creditsUsed}/{creditsTotal}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${creditsPct}%`,
                        background: gradientAccent,
                        boxShadow: "0 0 10px rgba(139,124,255,0.5)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="relative px-5 pb-5 flex-1 overflow-auto space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 px-0.5">
                Upgrade your plan
              </p>

              {PLANS.map((plan) => {
                const Icon = plan.icon;

                return (
                  <div
                    key={plan.id}
                    className="relative rounded-2xl p-4 transition-all duration-200"
                    style={
                      plan.popular
                        ? {
                            border: "1px solid rgba(155,140,255,0.35)",
                            background:
                              "linear-gradient(160deg, rgba(155,140,255,0.12) 0%, rgba(79,143,255,0.05) 100%)",
                            boxShadow: "0 8px 24px -8px rgba(139,124,255,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
                          }
                        : {
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.02)",
                          }
                    }
                  >
                    {plan.popular && (
                      <span
                        className="absolute -top-2.5 right-4 text-[10px] font-semibold text-white px-2.5 py-0.5 rounded-full tracking-wide"
                        style={{
                          background: gradientAccent,
                          boxShadow: "0 2px 10px rgba(139,124,255,0.45)",
                        }}
                      >
                        MOST POPULAR
                      </span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 shrink-0 ring-1 ring-white/5"
                        style={{
                          background: plan.popular
                            ? gradientAccent
                            : "linear-gradient(135deg, rgba(155,140,255,0.2) 0%, rgba(79,143,255,0.2) 100%)",
                        }}
                      >
                        <Icon size={15} className={plan.popular ? "text-white" : "text-[#C1B7FF]"} />
                      </div>

                      <h3 className="text-white font-semibold text-[15px]">
                        {plan.name} Plan
                      </h3>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-3">
                      <p
                        className="text-2xl font-bold"
                        style={{
                          background: gradientAccent,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {plan.price}
                      </p>
                      <span className="text-slate-500 text-[13px]">{plan.period}</span>
                    </div>

                    <p className="text-slate-400 text-sm mt-0.5">
                      {plan.credits}
                    </p>

                    <ul className="mt-3.5 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-300">
                          <Check size={14} className="text-emerald-400 mt-[1.5px] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`group relative mt-4 w-full rounded-xl py-2.5 text-[13.5px] font-semibold text-white transition-all duration-200 ease-out overflow-hidden hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] ${
                        plan.popular ? "" : "border border-white/15 hover:border-[#9B8CFF]/40"
                      }`}
                      style={
                        plan.popular
                          ? {
                              background: gradientAccent,
                              boxShadow: "0 4px 16px rgba(139,124,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                            }
                          : { background: "rgba(255,255,255,0.05)" }
                      }
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="relative">Upgrade to {plan.name}</span>
                    </button>
                  </div>
                );
              })}

              <p className="text-center text-[11px] text-slate-600 pt-1 pb-2 leading-relaxed">
                Secure checkout powered by Razorpay. Cancel or change plans anytime.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BillingDrawer;