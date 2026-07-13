import Razorpay from "razorpay";

let razorpayInstance: InstanceType<typeof Razorpay>;

export const getRazorpay = (): InstanceType<typeof Razorpay> => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
  }
  return razorpayInstance;
};

export default getRazorpay;
