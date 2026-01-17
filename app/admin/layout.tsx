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

  if (
    !session ||
    (session.user?.role !== "admin" && session.user?.role !== "worker")
  ) {
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
