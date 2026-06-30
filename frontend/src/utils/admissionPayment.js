import API from "../api/api";
import { loadRazorpayScript } from "./razorpay";

export async function payAdmissionOnline({ admission, verifyPhone, onSuccess }) {
  const ok = await loadRazorpayScript();
  if (!ok) throw new Error("Payment gateway failed to load.");

  const { data } = await API.post(`/admissions/${admission._id}/pay-online`, {
    verifyPhone,
  });

  if (data.mock) {
    const confirmed = window.confirm(
      `Test mode: Simulate admission fee payment of ₹${Math.round(data.amount / 100)}?`
    );
    if (!confirmed) throw new Error("Payment cancelled");
    await API.post(`/admissions/${admission._id}/verify-online`, {
      mock: true,
      verifyPhone,
    });
    if (onSuccess) onSuccess();
    return;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "Apex Academy",
      description: data.itemName,
      order_id: data.orderId,
      handler: async (response) => {
        try {
          await API.post(`/admissions/${admission._id}/verify-online`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            verifyPhone,
          });
          if (onSuccess) onSuccess();
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      prefill: {
        name: admission.studentName,
        email: admission.studentEmail || "",
        contact: admission.studentPhone,
      },
      theme: { color: "#0b1f3a" },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      reject(new Error(resp.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
