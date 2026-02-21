/**
 * Paystack DVA (Dedicated Virtual Account) Helper
 * Creates virtual bank accounts for WhatsApp users to make payments via bank transfer.
 * Falls back to payment links if DVA creation fails.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// ── Create a Paystack Customer ──
export async function createPaystackCustomer(
  email: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  const res = await fetch(`${PAYSTACK_BASE}/customer`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    console.error("Paystack create customer error:", data.message);
    return null;
  }
  return data.data; // { customer_code, id, ... }
}

// ── Create Dedicated Virtual Account ──
export async function createDedicatedVirtualAccount(customerCode: string) {
  const res = await fetch(`${PAYSTACK_BASE}/dedicated_account`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      customer: customerCode,
      preferred_bank: "wema-bank", // Wema Bank (default for Paystack DVA)
    }),
  });

  const data = await res.json();
  if (!data.status) {
    console.error("Paystack DVA creation error:", data.message);
    return null;
  }

  return {
    accountNumber: data.data.account_number,
    bankName: data.data.bank?.name || "Wema Bank",
    accountName: data.data.account_name,
    customerCode,
  };
}

// ── Create a payment link (fallback) ──
export async function createPaymentLink(
  email: string,
  amount: number,
  metadata: Record<string, any> = {}
) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // kobo
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yuvara.netlify.app"}/checkout/callback`,
      metadata,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    console.error("Paystack init error:", data.message);
    return null;
  }
  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    accessCode: data.data.access_code,
  };
}

// ── Verify Payment by Reference ──
export async function verifyPaymentByReference(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  if (data.status && data.data.status === "success") {
    return data.data;
  }
  return null;
}
