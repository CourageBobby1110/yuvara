import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import styles from "./AdminLayout.module.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only permit access to users with 'admin' or 'worker' roles.
  // The session role is kept in sync with the database via the JWT callback in auth.ts
  const userRole = session?.user?.role;
  const isAuthorized = userRole === "admin" || userRole === "worker";

  if (!session || !isAuthorized) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <AdminSidebar />
      <div className={styles.mainWrapper}>
        <AdminHeader />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
