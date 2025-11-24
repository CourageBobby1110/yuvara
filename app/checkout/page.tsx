"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Checkout.module.css";

interface ShippingRate {
  state: string;
  fee: number;
  country: string;
}

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const { items, totalPrice } = useCartStore();
  const { formatPrice, exchangeRates } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedStateFee, setSelectedStateFee] = useState(0);
  const [saveAddress, setSaveAddress] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "Nigeria",
  });

  // Force session update on mount
  useEffect(() => {
    update();
    fetchUserProfile();
  }, []);

  // Fetch rates when country changes
  useEffect(() => {
    fetchShippingRates(formData.country);
  }, [formData.country]);

  // Redirect if empty cart
  useEffect(() => {
    useCartStore.persist.rehydrate();
    if (items.length === 0) {
      // router.push("/");
    }
  }, [items, router]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.address && Object.keys(data.address).length > 0) {
          setFormData((prev) => ({
            ...prev,
            ...data.address,
            // Ensure country defaults to Nigeria if missing, or use saved
            country: data.address.country || "Nigeria",
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: session.user.email || "" }));
    }
  }, [session]);

  const fetchShippingRates = async (country: string) => {
    try {
      const res = await fetch(`/api/shipping?country=${country}`);
      if (res.ok) {
        const data = await res.json();
        setShippingRates(data);
        // Reset state selection if country changes
        if (formData.state) {
          // Check if current state exists in new rates, if not reset
          const exists = data.find(
            (r: ShippingRate) => r.state === formData.state
          );
          if (!exists) {
            setSelectedStateFee(0);
          } else {
            setSelectedStateFee(exists.fee);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch shipping rates", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "state") {
      const rate = shippingRates.find((r) => r.state === value);
      setSelectedStateFee(rate ? rate.fee : 0);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode) return;

    const totalUSD = totalPrice();
    const rateNGN = exchangeRates["NGN"] || 1500;
    const amountInNGN = totalUSD * rateNGN;

    try {
      const res = await fetch("/api/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: amountInNGN }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
      }
    } catch (err) {
      setCouponError("Failed to verify coupon");
    }
  };

  const calculateTotal = () => {
    const subtotal = totalPrice();
    const rateNGN = exchangeRates["NGN"] || 1500;
    const shippingInUSD = selectedStateFee / rateNGN;

    let total = subtotal + shippingInUSD;

    if (appliedCoupon) {
      const discountInUSD = appliedCoupon.discountAmount / rateNGN;
      total -= discountInUSD;
    }

    return Math.max(0, total);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout");
      return;
    }

    // Validate state selection if rates exist for the country
    if (shippingRates.length > 0 && !formData.state) {
      alert("Please select a state/region");
      return;
    }

    setLoading(true);

    try {
      // Save address if checked
      if (saveAddress) {
        await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: formData }),
        });
      }

      const totalUSD = totalPrice();
      const rateNGN = exchangeRates["NGN"] || 1500;

      // Final calculation in NGN
      let amountInNGN = totalUSD * rateNGN;
      amountInNGN += selectedStateFee;

      if (appliedCoupon) {
        amountInNGN -= appliedCoupon.discountAmount;
      }

      amountInNGN = Math.max(0, amountInNGN);

      // 1. Initialize Payment
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInNGN,
          email: session?.user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // 2. Store order details
      localStorage.setItem(
        "yuvara_pending_order",
        JSON.stringify({
          cartItems: items,
          shippingAddress: formData,
          total: amountInNGN, // Store final NGN total
          shippingFee: selectedStateFee,
          couponCode: appliedCoupon?.code,
          discountAmount: appliedCoupon?.discountAmount,
        })
      );

      // 3. Redirect to Paystack
      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <div className={styles.emptyCartContent}>
          <div className={styles.emptyIconWrapper}>
            <svg
              className={styles.emptyIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className={styles.emptyTitle}>Your cart is empty</h1>
          <p className={styles.emptyText}>
            Looks like you haven't added anything yet.
          </p>
          <button
            onClick={() => router.push("/")}
            className={styles.returnButton}
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  const rateNGN = exchangeRates["NGN"] || 1500;
  const shippingInUSD = selectedStateFee / rateNGN;
  const discountInUSD = appliedCoupon
    ? appliedCoupon.discountAmount / rateNGN
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Checkout</h1>
          <p className={styles.subtitle}>Complete your purchase securely.</p>
        </div>

        <div className={styles.grid}>
          {/* Order Summary - Left Side on Desktop */}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryHeader}>
                <span>Order Summary</span>
                <span className={styles.itemCount}>{items.length} items</span>
              </h2>

              <div className={`${styles.itemsList} custom-scrollbar`}>
                {items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        className={styles.image}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <div>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemQty}>Qty: {item.quantity}</p>
                      </div>
                      <p className={styles.itemPrice}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className={styles.couponSection}>
                <label className={styles.couponLabel}>Coupon Code</label>
                <div className={styles.couponInputGroup}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className={styles.couponInput}
                    placeholder="Enter code"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className={styles.applyButton}
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className={styles.errorText}>{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className={styles.successText}>
                    Coupon applied! You saved {formatPrice(discountInUSD)}
                  </p>
                )}
              </div>

              <div className={styles.totalsSection}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Shipping ({formData.state || "Select State"})</span>
                  <span>
                    {selectedStateFee > 0
                      ? formatPrice(shippingInUSD)
                      : "Calculated at next step"}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className={styles.discountRow}>
                    <span>Discount</span>
                    <span>-{formatPrice(discountInUSD)}</span>
                  </div>
                )}
                <div className={styles.grandTotalRow}>
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Form - Right Side on Desktop */}
          <div className={styles.formSection}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Shipping Information</h2>

              <form onSubmit={handleCheckout} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className="sm:col-span-2">
                    <label className={styles.label}>Street Address</label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className={styles.label}>City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Country</label>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className={styles.select}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>State / Province</label>
                    {shippingRates.length > 0 ? (
                      <select
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="">Select State</option>
                        {shippingRates.map((rate) => (
                          <option key={rate.state} value={rate.state}>
                            {rate.state}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="State"
                      />
                    )}
                  </div>

                  <div>
                    <label className={styles.label}>ZIP / Postal Code</label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="10001"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={styles.label}>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <p className={styles.helperText}>
                      ⚠️ Please ensure this email is correct. Your order
                      confirmation and updates will be sent here.
                    </p>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={styles.label}>
                      Phone Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        Save this address for future orders
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.submitSection}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                  >
                    {loading ? (
                      <>
                        <svg
                          className={styles.spinner}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : status === "unauthenticated" ? (
                      "Sign in to Pay"
                    ) : (
                      `Pay ${formatPrice(calculateTotal())}`
                    )}
                  </button>
                  <p className={styles.secureText}>
                    Secure payment powered by Paystack. Your data is encrypted.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
