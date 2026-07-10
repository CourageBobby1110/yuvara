"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./AdminUsers.module.css";
import AdminLoader from "@/components/AdminLoader";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  ShoppingBag,
  ShieldCheck,
  Mail,
  X,
  MapPin,
  Copy,
  Check,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  createdAt: string;
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

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [updating, setUpdating] = useState<string | null>(null);

  // Redesign filter and details states
  const [filter, setFilter] = useState<"all" | "customers" | "affiliates" | "guests" | "staff">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [roleUpdateTarget, setRoleUpdateTarget] = useState<{ userId: string; newRole: string } | null>(null);
  const [rolePassword, setRolePassword] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdateClick = (userId: string, newRole: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid opening bottom sheet when changing role inline
    }
    if (!isAdmin) return;
    setRoleUpdateTarget({ userId, newRole });
    setRolePassword("");
    setIsRoleModalOpen(true);
  };

  const handleConfirmRoleUpdate = async () => {
    if (!roleUpdateTarget) return;
    if (!rolePassword) {
      alert("Password is required");
      return;
    }
    setIsRoleUpdating(true);
    setUpdating(roleUpdateTarget.userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: roleUpdateTarget.userId,
          role: roleUpdateTarget.newRole,
          password: rolePassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedList = users.map((u) =>
          u._id === roleUpdateTarget.userId ? { ...u, role: roleUpdateTarget.newRole } : u
        );
        setUsers(updatedList);

        // Keep the selected user synced in bottom sheet
        if (selectedUser && selectedUser._id === roleUpdateTarget.userId) {
          setSelectedUser({ ...selectedUser, role: roleUpdateTarget.newRole });
        }

        setIsRoleModalOpen(false);
        setRoleUpdateTarget(null);
        setRolePassword("");
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role", error);
      alert("Something went wrong");
    } finally {
      setIsRoleUpdating(false);
      setUpdating(null);
    }
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamically compute key statistics
  const stats = useMemo(() => {
    const total = users.length;
    const affiliates = users.filter((u) => u.isAffiliate).length;
    const guests = users.filter((u) => u.isGuest).length;
    const staff = users.filter((u) => u.role === "admin" || u.role === "worker").length;
    return { total, affiliates, guests, staff };
  }, [users]);

  // Dynamic filter application
  const filteredUsers = useMemo(() => {
    let result = users;
    if (filter === "customers") {
      result = users.filter((u) => u.role === "user" && !u.isGuest);
    } else if (filter === "affiliates") {
      result = users.filter((u) => u.isAffiliate);
    } else if (filter === "guests") {
      result = users.filter((u) => u.isGuest);
    } else if (filter === "staff") {
      result = users.filter((u) => u.role === "admin" || u.role === "worker");
    }

    if (!searchQuery) return result;

    const query = searchQuery.toLowerCase();
    return result.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.referralCode?.toLowerCase().includes(query)
    );
  }, [users, filter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset page index on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, filter]);

  const getRoleBadgeClass = (role: string, isGuest?: boolean) => {
    if (isGuest) return styles.badgeGuest;
    switch (role) {
      case "admin":
        return styles.badgeAdmin;
      case "worker":
        return styles.badgeWorker;
      default:
        return styles.badgeUser;
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customers</h1>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search by name, email or code..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Metrics Dashboard Carousel */}
      <div className={styles.statsCarousel}>
        <div className={`${styles.statCard} ${filter === "all" ? styles.activeStatCard : ""}`} onClick={() => setFilter("all")}>
          <div className={styles.statIconWrapper}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total customers</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${filter === "affiliates" ? styles.activeStatCard : ""}`} onClick={() => setFilter("affiliates")}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: "rgba(199, 163, 102, 0.15)" }}>
            <Award size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Affiliates</span>
            <span className={styles.statValue}>{stats.affiliates}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${filter === "guests" ? styles.activeStatCard : ""}`} onClick={() => setFilter("guests")}>
          <div className={styles.statIconWrapper} style={{ color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Guest accounts</span>
            <span className={styles.statValue}>{stats.guests}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${filter === "staff" ? styles.activeStatCard : ""}`} onClick={() => setFilter("staff")}>
          <div className={styles.statIconWrapper} style={{ color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Staff members</span>
            <span className={styles.statValue}>{stats.staff}</span>
          </div>
        </div>
      </div>

      {/* Quick Filter Pills Row */}
      <div className={styles.filterContainer}>
        <button
          className={`${styles.filterPill} ${filter === "all" ? styles.activeFilterPill : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${styles.filterPill} ${filter === "customers" ? styles.activeFilterPill : ""}`}
          onClick={() => setFilter("customers")}
        >
          Registered Customers
        </button>
        <button
          className={`${styles.filterPill} ${filter === "affiliates" ? styles.activeFilterPill : ""}`}
          onClick={() => setFilter("affiliates")}
        >
          Affiliates
        </button>
        <button
          className={`${styles.filterPill} ${filter === "guests" ? styles.activeFilterPill : ""}`}
          onClick={() => setFilter("guests")}
        >
          Guests
        </button>
        <button
          className={`${styles.filterPill} ${filter === "staff" ? styles.activeFilterPill : ""}`}
          onClick={() => setFilter("staff")}
        >
          Staff & Workers
        </button>
      </div>

      {/* Mobile-First Customer Card List */}
      <div className={styles.mobileList}>
        {paginatedUsers.map((user) => (
          <div key={user._id} className={styles.userCard} onClick={() => setSelectedUser(user)}>
            <div className={styles.userCardImageWrapper}>
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Customer"}
                  fill
                  sizes="48px"
                  className={styles.userImage}
                />
              ) : (
                <div className={styles.userImageFallback}>
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "C"}
                </div>
              )}
            </div>
            <div className={styles.userCardContent}>
              <div className={styles.userCardName}>{user.name || "No Name Registered"}</div>
              <div className={styles.userCardEmail}>{user.email}</div>
              <div className={styles.userCardFooter}>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role, user.isGuest)}`}>
                  {user.isGuest ? "Guest" : user.role}
                </span>
                <span className={styles.userCardDate}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>No customers found in this list.</div>
        )}
      </div>

      {/* Desktop Responsive Table */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Email Address</th>
              <th className={styles.th}>Role / Status</th>
              <th className={styles.th}>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user._id} className={styles.tr} onClick={() => setSelectedUser(user)}>
                <td className={styles.td}>
                  <div className={styles.item}>
                    <div className={styles.imageWrapper}>
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "Customer"}
                          fill
                          sizes="40px"
                          className={styles.userImage}
                        />
                      ) : (
                        <div className={styles.userImageFallback}>
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "C"}
                        </div>
                      )}
                    </div>
                    <span className={styles.userName}>
                      {user.name || "No Name Registered"}
                    </span>
                  </div>
                </td>
                <td className={`${styles.td} ${styles.userEmail}`}>
                  {user.email}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role, user.isGuest)}`}>
                    {user.isGuest ? "Guest" : user.role}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.date}`}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing{" "}
          {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
          to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
          {filteredUsers.length} customers
        </div>

        <div className={styles.paginationControls}>
          <select
            className={styles.itemsPerPage}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div className={styles.paginationButtons}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            <span
              className={styles.pageButton}
              style={{ border: "none", background: "transparent" }}
            >
              {currentPage} / {totalPages || 1}
            </span>

            <button
              className={styles.pageButton}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Up Customer Details Bottom Sheet (Mobile) & Side Drawer (Desktop) */}
      {selectedUser && (
        <div className={styles.bottomSheetOverlay} onClick={() => setSelectedUser(null)}>
          <div className={styles.bottomSheetContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle}></div>
            
            <div className={styles.bottomSheetHeader}>
              <div className={styles.bottomSheetTitleInfo}>
                <div className={styles.bottomSheetAvatarWrapper}>
                  {selectedUser.image ? (
                    <Image
                      src={selectedUser.image}
                      alt={selectedUser.name || "Customer"}
                      fill
                      sizes="52px"
                      className={styles.userImage}
                    />
                  ) : (
                    <div className={styles.userImageFallback} style={{ fontSize: "1.25rem" }}>
                      {selectedUser.name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || "C"}
                    </div>
                  )}
                </div>
                <div className={styles.bottomSheetNameDetails}>
                  <h3 className={styles.bottomSheetTitleName}>
                    {selectedUser.name || "No Name Registered"}
                  </h3>
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass(selectedUser.role, selectedUser.isGuest)}`} style={{ alignSelf: "flex-start" }}>
                    {selectedUser.isGuest ? "Guest Shopper" : selectedUser.role}
                  </span>
                </div>
              </div>
              
              <button className={styles.closeButton} onClick={() => setSelectedUser(null)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.bottomSheetBody}>
              {/* Account Info Section */}
              <div className={styles.bottomSheetSection}>
                <h4 className={styles.bottomSheetSectionTitle}>Account Details</h4>
                
                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Joined Date</span>
                  <span className={styles.bottomSheetValue}>
                    {new Date(selectedUser.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Account Type</span>
                  <span className={styles.bottomSheetValue}>
                    {selectedUser.isGuest ? "Guest Shopper" : selectedUser.isAffiliate ? "Affiliate Partner" : "Registered User"}
                  </span>
                </div>

                {isAdmin && !selectedUser.isGuest && (
                  <div className={styles.bottomSheetRow} style={{ alignItems: "center", marginTop: "0.25rem" }}>
                    <span className={styles.bottomSheetLabel}>Change Role</span>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleUpdateClick(selectedUser._id, e.target.value)}
                      disabled={updating === selectedUser._id || selectedUser._id === session?.user?.id}
                      className={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="worker">Worker</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Contact & Location Section */}
              <div className={styles.bottomSheetSection}>
                <h4 className={styles.bottomSheetSectionTitle}>Contact & Location</h4>
                
                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Email</span>
                  <span 
                    className={styles.bottomSheetValue} 
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={(e) => handleCopy(selectedUser.email, "email", e)}
                  >
                    {selectedUser.email}
                    {copiedId === "email" ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
                  </span>
                </div>

                <div className={styles.bottomSheetRow} style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
                  <span className={styles.bottomSheetLabel} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <MapPin size={14} /> Shipping/Billing Address
                  </span>
                  {selectedUser.address && (selectedUser.address.street || selectedUser.address.city) ? (
                    <div className={styles.addressBlock}>
                      {selectedUser.address.street && <div>{selectedUser.address.street}</div>}
                      <div>
                        {selectedUser.address.city && `${selectedUser.address.city}, `}
                        {selectedUser.address.state && `${selectedUser.address.state} `}
                        {selectedUser.address.zip && selectedUser.address.zip}
                      </div>
                      {selectedUser.address.country && <div>{selectedUser.address.country}</div>}
                    </div>
                  ) : (
                    <div className={styles.addressBlock} style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>
                      No shipping address registered on account.
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Details */}
              <div className={styles.bottomSheetSection}>
                <h4 className={styles.bottomSheetSectionTitle}>Referral Insights</h4>

                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Referral Code</span>
                  {selectedUser.referralCode ? (
                    <span 
                      className={styles.bottomSheetValue}
                      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      onClick={(e) => handleCopy(selectedUser.referralCode || "", "refCode", e)}
                    >
                      {selectedUser.referralCode}
                      {copiedId === "refCode" ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
                    </span>
                  ) : (
                    <span className={styles.bottomSheetValue} style={{ color: "var(--color-text-light)", fontStyle: "italic" }}>
                      Not assigned
                    </span>
                  )}
                </div>

                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Referrals Tracked</span>
                  <span className={styles.bottomSheetValue}>{selectedUser.referralCount || 0}</span>
                </div>

                <div className={styles.bottomSheetRow}>
                  <span className={styles.bottomSheetLabel}>Referred By</span>
                  <span className={styles.bottomSheetValue}>
                    {typeof selectedUser.referredBy === "object" && selectedUser.referredBy
                      ? (selectedUser.referredBy.name || selectedUser.referredBy.email)
                      : typeof selectedUser.referredBy === "string"
                      ? selectedUser.referredBy
                      : "Direct SignUp"}
                  </span>
                </div>
              </div>

              {/* Affiliate Details */}
              {selectedUser.isAffiliate && (
                <div className={styles.bottomSheetSection}>
                  <h4 className={styles.bottomSheetSectionTitle} style={{ color: "var(--color-luxury-gold)" }}>Affiliate Program</h4>

                  <div className={styles.bottomSheetRow}>
                    <span className={styles.bottomSheetLabel}>Available Balance</span>
                    <span className={styles.bottomSheetValue} style={{ color: "var(--color-luxury-gold)" }}>
                      {formatPrice(selectedUser.affiliateBalance || 0)}
                    </span>
                  </div>

                  <div className={styles.bottomSheetRow}>
                    <span className={styles.bottomSheetLabel}>Total Earnings</span>
                    <span className={styles.bottomSheetValue}>
                      {formatPrice(selectedUser.totalEarnings || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className={styles.bottomSheetActions}>
                <a
                  href={`mailto:${selectedUser.email}?subject=Message from YuVara Admin`}
                  className={`${styles.actionBtn} ${styles.emailBtn}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail size={16} /> Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role password verification modal */}
      {isRoleModalOpen && (
        <div className={styles.modalOverlay}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmRoleUpdate();
            }}
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Confirm Role Change</h2>
            <p className={styles.modalText}>
              Please enter the administrator role update password to modify this user's role.
            </p>
            
            {/* Dummy hidden inputs to prevent browser autofill hijacking the main search input */}
            <input
              type="text"
              name="email"
              autoComplete="username"
              style={{ display: "none" }}
              readOnly
            />
            
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={rolePassword}
              onChange={(e) => setRolePassword(e.target.value)}
              className={styles.passwordInput}
              autoComplete="new-password"
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setRoleUpdateTarget(null);
                  setRolePassword("");
                }}
                className={styles.cancelBtn}
                disabled={isRoleUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.confirmBtn}
                disabled={isRoleUpdating}
              >
                {isRoleUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
