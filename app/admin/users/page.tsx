"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./AdminUsers.module.css";
import AdminLoader from "@/components/AdminLoader";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [updating, setUpdating] = useState<string | null>(null);

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

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        alert("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role", error);
    } finally {
      setUpdating(null);
    }
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
      </div>

      {/* Search Bar (Desktop) */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search users..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile User Cards */}
      <div className={styles.mobileList}>
        {filteredUsers.map((user) => (
          <div key={user._id} className={styles.userCard}>
            <div className={styles.userCardImageWrapper}>
              <Image
                src={user.image || "/placeholder-user.jpg"}
                alt={user.name}
                fill
                className={styles.userImage}
              />
            </div>
            <div className={styles.userCardContent}>
              <div className={styles.userCardName}>
                {user.name || "No Name"}
              </div>
              <div className={styles.userCardEmail}>{user.email}</div>
              <div className={styles.userCardFooter}>
                <span className={styles.roleBadge}>{user.role}</span>
                <span className={styles.userCardDate}>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>No users found.</div>
        )}
      </div>

      {/* Desktop Table */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user._id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.item}>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={user.image || "/placeholder-user.jpg"}
                        alt={user.name}
                        fill
                        className={styles.userImage}
                      />
                    </div>
                    <span className={styles.userName}>
                      {user.name || "No Name"}
                    </span>
                  </div>
                </td>
                <td className={`${styles.td} ${styles.userEmail}`}>
                  {user.email}
                </td>
                <td className={styles.td}>
                  {isAdmin ? (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleUpdate(user._id, e.target.value)
                      }
                      disabled={
                        updating === user._id || user._id === session?.user?.id
                      }
                      className={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="worker">Worker</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={styles.roleBadge}>{user.role}</span>
                  )}
                </td>
                <td className={`${styles.td} ${styles.date}`}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing{" "}
            {filteredUsers.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
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

              {/* Simple page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }

                return (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${
                      currentPage === pageNum ? styles.activePage : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

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
      </div>
    </div>
  );
}
