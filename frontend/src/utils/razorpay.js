import API from "../api/api";

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const UPI_CHECKOUT_CONFIG = {
  display: {
    blocks: {
      upi: {
        name: "Pay with UPI",
        instruments: [{ method: "upi" }],
      },
      other: {
        name: "Cards & Netbanking",
        instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }],
      },
    },
    sequence: ["block.upi", "block.other"],
    preferences: { show_default_blocks: false },
  },
};

export async function startRazorpayCheckout({
  user,
  orderPayload,
  onSuccess,
  preferUpi = false,
}) {
  if (!user) throw new Error("Please login first to purchase.");

  const ok = await loadRazorpayScript();
  if (!ok) throw new Error("Payment gateway failed to load. Check your connection.");

  const { data } = await API.post("/payments/create-order", orderPayload);

  // Local test mode when Razorpay keys are not configured
    if (data.mock) {
      const confirmed = window.confirm(
        `Test mode: Razorpay is not configured yet.\n\nSimulate payment of ₹${Math.round(data.amount / 100)} for "${data.itemName}"?`
      );
      if (!confirmed) throw new Error("Payment cancelled");
      await API.post("/payments/verify-mock", {
      orderId: data.orderId,
      premiumItemId: data.premiumItemId,
      courseId: data.courseId,
    });
    if (onSuccess) await onSuccess(data);
    return data;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "Apex Academy",
      description: data.itemName,
      order_id: data.orderId,
      handler: async function (response) {
        try {
          await API.post("/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            courseId: data.courseId,
            premiumItemId: data.premiumItemId,
          });
          if (onSuccess) await onSuccess(data);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      prefill: { name: user.name, email: user.email },
      theme: { color: "#0b1f3a" },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    };

    if (preferUpi) {
      options.config = UPI_CHECKOUT_CONFIG;
    }

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      reject(new Error(resp.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
