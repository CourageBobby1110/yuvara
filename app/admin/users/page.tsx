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

  const handleRoleUpdateClick = (userId: string, newRole: string) => {
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
        setUsers(
          users.map((u) => (u._id === roleUpdateTarget.userId ? { ...u, role: roleUpdateTarget.newRole } : u)),
        );
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

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query),
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

        {/* Search Bar */}
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
      </div>

      {/* Mobile User Cards */}
      <div className={styles.mobileList}>
        {paginatedUsers.map((user) => (
          <div key={user._id} className={styles.userCard}>
            <div className={styles.userCardImageWrapper}>
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className={styles.userImage}
                />
              ) : (
                <div className={styles.userImageFallback}>
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className={styles.userCardContent}>
              <div className={styles.userCardName}>
                {user.name || "No Name"}
              </div>
              <div className={styles.userCardEmail}>{user.email}</div>
              <div className={styles.userCardFooter}>
                {isAdmin ? (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleUpdateClick(user._id, e.target.value)}
                    disabled={
                      updating === user._id || user._id === session?.user?.id
                    }
                    className={styles.roleSelect}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                  >
                    <option value="user">User</option>
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={styles.roleBadge}>{user.role}</span>
                )}
                <span className={styles.userCardDate}>
                  {new Date(user.createdAt).toLocaleDateString()}
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
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className={styles.userImage}
                        />
                      ) : (
                        <div className={styles.userImageFallback}>
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
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
                        handleRoleUpdateClick(user._id, e.target.value)
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
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing{" "}
          {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
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

      {isRoleModalOpen && (
        <div className={styles.modalOverlay}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmRoleUpdate();
            }}
            className={styles.modalContent}
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
