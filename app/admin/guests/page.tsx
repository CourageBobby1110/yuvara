"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "../users/AdminUsers.module.css";
import AdminSkeleton from "@/components/AdminSkeleton";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  MapPin,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  UserPlus
} from "lucide-react";

interface Guest {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  image?: string;
  isGuest?: boolean;
  isAffiliate?: boolean;
  affiliateBalance?: number;
  totalEarnings?: number;
  referralCode?: string;
  referredBy?: string | { _id: string; name: string; email: string };
  referralCount?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export default function AdminGuestsPage() {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inviting, setInviting] = useState<string | null>(null);

  // Redesign states for detail panel
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch("/api/admin/guests");
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      }
    } catch (error) {
      console.error("Failed to fetch guests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    setInviting(userId);
    try {
      const res = await fetch("/api/admin/guests/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert("Invite sent successfully!");
      } else {
        alert("Failed to send invite");
      }
    } catch (error) {
      console.error("Error sending invite", error);
    } finally {
      setInviting(null);
    }
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter guests based on search query
  const filteredGuests = useMemo(() => {
    if (!searchQuery) return guests;
    const query = searchQuery.toLowerCase();
    return guests.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [guests, searchQuery]);

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGuests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGuests, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (loading) return <AdminSkeleton variant="table" />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Guest Accounts</h1>

        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search guest shoppers..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Metrics Dashboard Carousel */}
      <div className={styles.statsCarousel}>
        <div className={`${styles.statCard} ${styles.activeStatCard}`}>
          <div className={styles.statIconWrapper} style={{ color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total guest accounts</span>
            <span className={styles.statValue}>{guests.length}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
            <Calendar size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>New guests (this month)</span>
            <span className={styles.statValue}>
              {guests.filter(g => {
                const date = new Date(g.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Guest Cards */}
      <div className={styles.mobileList}>
        {paginatedGuests.map((guest) => (
          <div key={guest._id} className={styles.userCard} onClick={() => setSelectedGuest(guest)}>
            <div className={styles.userCardImageWrapper}>
              {guest.image ? (
                <Image
                  src={guest.image}
                  alt={guest.name || "Guest"}
                  fill
                  sizes="48px"
                  className={styles.userImage}
                />
              ) : (
                <div className={styles.userImageFallback} style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                  {guest.name?.[0]?.toUpperCase() || guest.email?.[0]?.toUpperCase() || "G"}
                </div>
              )}
            </div>
            <div className={styles.userCardContent}>
              <div className={styles.userCardName}>{guest.name || "Guest Shopper"}</div>
              <div className={styles.userCardEmail}>{guest.email}</div>
              <div className={styles.userCardFooter}>
                <span className={`${styles.roleBadge} ${styles.badgeGuest}`}>
                  Guest
                </span>
                <span className={styles.userCardDate}>
                  {new Date(guest.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredGuests.length === 0 && (
          <div className={styles.emptyState}>No guest shoppers found.</div>
        )}
      </div>

      {/* Desktop Responsive Table */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email Address</th>
              <th className={styles.th}>First Ordered</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGuests.map((guest) => (
              <tr key={guest._id} className={styles.tr} onClick={() => setSelectedGuest(guest)}>
                <td className={styles.td}>
                  <span className={styles.userName}>{guest.name || "Guest Shopper"}</span>
                </td>
                <td className={`${styles.td} ${styles.userEmail}`}>
                  {guest.email}
                </td>
                <td className={`${styles.td} ${styles.date}`}>
                  {new Date(guest.createdAt).toLocaleDateString()}
                </td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleSendInvite(guest._id, e)}
                      disabled={inviting === guest._id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: inviting === guest._id ? "#e5e7eb" : "var(--color-luxury-gold)",
                        color: inviting === guest._id ? "#9ca3af" : "#fff",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: inviting === guest._id ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <Mail size={12} />
                      {inviting === guest._id ? "Sending..." : "Setup Invite"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {paginatedGuests.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  No guest accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing {filteredGuests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredGuests.length)} of {filteredGuests.length} guests
        </div>

        <div className={styles.paginationControls}>
          <select
            className={styles.itemsPerPage}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>

          <div className={styles.paginationButtons}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pageButton} style={{ border: "none", background: "transparent" }}>
              {currentPage} / {totalPages || 1}
            </span>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Up Guest Details Bottom Sheet */}
      {selectedGuest && (
        <div className={styles.bottomSheetOverlay} onClick={() => setSelectedGuest(null)}>
          <div className={styles.bottomSheetContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle}></div>
            
            <div className={styles.bottomSheetHeader}>
              <div className={styles.bottomSheetTitleInfo}>
                <div className={styles.bottomSheetAvatarWrapper} style={{ borderColor: "#f59e0b" }}>
                  {selectedGuest.image ? (
                    <Image
                      src={selectedGuest.image}
                      alt={selectedGuest.name || "Guest"}
                      fill
                      sizes="52px"
                      className={styles.userImage}
                    />
                  ) : (
                    <div className={styles.userImageFallback} style={{ backgroundColor: "#f59e0b", color: "#fff", fontSize: "1.25rem" }}>
                      {selectedGuest.name?.[0]?.toUpperCase() || selectedGuest.email?.[0]?.toUpperCase() || "G"}
                    </div>
                  )}
                </div>
                <div className={styles.bottomSheetNameDetails}>
                  <h3 className={styles.bottomSheetTitleName}>
                    {selectedGuest.name || "Guest Shopper"}
                  </h3>
                  <span className={`${styles.roleBadge} ${styles.badgeGuest}`} style={{ alignSelf: "flex-start" }}>
                    Guest Shopper
                  </span>
                </div>
              </div>
              
              <button className={styles.closeButton} onClick={() => setSelectedGuest(null)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.bottomSheetBody}>
              {/* Account Details Section */}
              <div className={styles.bottomSheetSection}>
                <h4 className={styles.bottomSheetSectionTitle}>Account Details</h4>
                
                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>First Order Date</span>
                  <span className={styles.bottomSheetValue}>
                    {new Date(selectedGuest.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Status</span>
                  <span className={styles.bottomSheetValue} style={{ color: "#f59e0b", fontWeight: "700" }}>
                    Temporary Guest Profile
                  </span>
                </div>
              </div>

              {/* Contact & Location Section */}
              <div className={styles.bottomSheetSection}>
                <h4 className={styles.bottomSheetSectionTitle}>Contact & Location</h4>
                
                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Email</span>
                  <span 
                    className={styles.bottomSheetValue} 
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={(e) => handleCopy(selectedGuest.email, "guestEmail", e)}
                  >
                    {selectedGuest.email}
                    {copiedId === "guestEmail" ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
                  </span>
                </div>

                <div className={styles.bottomSheetRow} style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
                  <span className={styles.bottomSheetLabel} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <MapPin size={14} /> Shipping/Billing Address
                  </span>
                  {selectedGuest.address && (selectedGuest.address.street || selectedGuest.address.city) ? (
                    <div className={styles.addressBlock}>
                      {selectedGuest.address.street && <div>{selectedGuest.address.street}</div>}
                      <div>
                        {selectedGuest.address.city && `${selectedGuest.address.city}, `}
                        {selectedGuest.address.state && `${selectedGuest.address.state} `}
                        {selectedGuest.address.zip && selectedGuest.address.zip}
                      </div>
                      {selectedGuest.address.country && <div>{selectedGuest.address.country}</div>}
                    </div>
                  ) : (
                    <div className={styles.addressBlock} style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>
                      No address details recorded for this guest profile.
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Details */}
              {(selectedGuest.referralCode || selectedGuest.referralCount) && (
                <div className={styles.bottomSheetSection}>
                  <h4 className={styles.bottomSheetSectionTitle}>Referral Insights</h4>

                  {selectedGuest.referralCode && (
                    <div className={styles.bottomSheetRow}>
                      <span className={styles.bottomSheetLabel}>Referral Code</span>
                      <span 
                        className={styles.bottomSheetValue}
                        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        onClick={(e) => handleCopy(selectedGuest.referralCode || "", "refCode", e)}
                      >
                        {selectedGuest.referralCode}
                        {copiedId === "refCode" ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
                      </span>
                    </div>
                  )}

                  <div className={styles.bottomSheetRow}>
                    <span className={styles.bottomSheetLabel}>Referrals Tracked</span>
                    <span className={styles.bottomSheetValue}>{selectedGuest.referralCount || 0}</span>
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className={styles.bottomSheetActions} style={{ flexDirection: "column", gap: "0.75rem" }}>
                {isAdmin && (
                  <button
                    onClick={() => handleSendInvite(selectedGuest._id)}
                    disabled={inviting === selectedGuest._id}
                    className={styles.actionBtn}
                    style={{
                      background: inviting === selectedGuest._id ? "#e5e7eb" : "var(--color-luxury-gold)",
                      color: inviting === selectedGuest._id ? "#9ca3af" : "#fff",
                      width: "100%",
                      border: "none",
                    }}
                  >
                    <Mail size={16} />
                    {inviting === selectedGuest._id ? "Sending Invitation..." : "Send Account Setup Invite"}
                  </button>
                )}
                
                <a
                  href={`mailto:${selectedGuest.email}?subject=Message from YuVara Admin`}
                  className={`${styles.actionBtn} ${styles.emailBtn}`}
                  style={{ width: "100%", textAlign: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail size={16} /> Contact via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
