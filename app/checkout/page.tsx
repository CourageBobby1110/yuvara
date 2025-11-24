"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 inline-block">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto"
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
          <h1 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h1>
          <p className="text-gray-500">
            Looks like you haven't added anything yet.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-block bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
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
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-500">Complete your purchase securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Order Summary - Left Side on Desktop */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-sm font-normal text-gray-500">
                  {items.length} items
                </span>
              </h2>

              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="mb-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1 rounded-lg border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-black focus:ring-black"
                    placeholder="Enter code"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className="text-green-600 text-xs mt-1">
                    Coupon applied! You saved {formatPrice(discountInUSD)}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping ({formData.state || "Select State"})</span>
                  <span>
                    {selectedStateFee > 0
                      ? formatPrice(shippingInUSD)
                      : "Calculated at next step"}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(discountInUSD)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Form - Right Side on Desktop */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State / Province
                    </label>
                    {shippingRates.length > 0 ? (
                      <select
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
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
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                        placeholder="State"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                      placeholder="10001"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      ⚠️ Please ensure this email is correct. Your order
                      confirmation and updates will be sent here.
                    </p>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black focus:bg-white transition-all duration-200"
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">
                        Save this address for future orders
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  <p className="text-center text-xs text-gray-400 mt-4">
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
