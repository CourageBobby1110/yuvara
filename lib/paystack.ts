export const initializePayment = async (
  email: string,
  amount: number,
  callbackUrl: string,
  metadata: any = {}
) => {
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          callback_url: callbackUrl,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to initialize payment");
    }

    const data = await response.json();
    return data.data; // Contains authorization_url, access_code, reference
  } catch (error) {
    console.error("Paystack initialization error:", error);
    throw error;
  }
};

export const verifyPayment = async (reference: string) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === true && data.data.status === "success") {
      return data.data; // Return full transaction data
    }

    return null;
  } catch (error) {
    console.error("Paystack verification error:", error);
    return null;
  }
};
