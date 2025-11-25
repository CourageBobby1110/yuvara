"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

interface FavoriteItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    slug: string;
  };
  selectedSize?: string;
  selectedColor?: string;
  createdAt: string;
}

export default function AdminFavoritesPage() {
  const { formatPrice } = useCurrency();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/admin/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else {
        toast.error("Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Error fetching favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (item: FavoriteItem) => {
    if (!confirm(`Send promotional email to ${item.user.name}?`)) return;

    const rateNGN = 1500; // Default rate if context not available, but we can try to get it from context if exposed
    const priceInNGN = item.product.price * rateNGN;

    setSendingEmail(item._id);
    try {
      const res = await fetch("/api/admin/favorites/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: item.user.email,
          userName: item.user.name,
          productName: item.product.name,
          productImage: item.product.images[0],
          productPrice: priceInNGN,
          productSlug: item.product.slug,
        }),
      });

      if (res.ok) {
        toast.success(`Email sent to ${item.user.email}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error sending email");
    } finally {
      setSendingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Favorites</h1>
        <p className="text-gray-600">
          View and manage items users have added to their wishlist.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Variant
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Date Added
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {favorites.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No favorites found.
                  </td>
                </tr>
              ) : (
                favorites.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.product.images[0] || "/placeholder.png"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.product.price)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {item.selectedSize && (
                          <span className="inline-block mr-2 px-2 py-1 bg-gray-100 rounded text-xs">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                            Color: {item.selectedColor}
                          </span>
                        )}
                        {!item.selectedSize && !item.selectedColor && "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSendEmail(item)}
                        disabled={sendingEmail === item._id}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingEmail === item._id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            Sending...
                          </>
                        ) : (
                          "Send Email"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
