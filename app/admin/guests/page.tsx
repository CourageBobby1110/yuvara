"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import styles from "../users/AdminUsers.module.css";
import AdminLoader from "@/components/AdminLoader";
import { Search, ChevronLeft, ChevronRight, Mail } from "lucide-react";

interface Guest {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminGuestsPage() {
  const { data: session } = useSession();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inviting, setInviting] = useState<string | null>(null);

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

  const handleSendInvite = async (userId: string) => {
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

  // Filter guests based on search query
  const filteredGuests = useMemo(() => {
    if (!searchQuery) return guests;
    const query = searchQuery.toLowerCase();
    return guests.filter(
      (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
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

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Guest Accounts</h1>

        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search guests..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>First Ordered</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGuests.map((guest) => (
              <tr key={guest._id} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.userName}>{guest.name || "Guest Shopper"}</span>
                </td>
                <td className={`${styles.td} ${styles.userEmail}`}>
                  {guest.email}
                </td>
                <td className={`${styles.td} ${styles.date}`}>
                  {new Date(guest.createdAt).toLocaleDateString()}
                </td>
                <td className={styles.td}>
                  <button
                    onClick={() => handleSendInvite(guest._id)}
                    disabled={inviting === guest._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: inviting === guest._id ? "#ccc" : "#000",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: inviting === guest._id ? "not-allowed" : "pointer"
                    }}
                  >
                    <Mail size={16} />
                    {inviting === guest._id ? "Sending..." : "Send Setup Invite"}
                  </button>
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
    </div>
  );
}
