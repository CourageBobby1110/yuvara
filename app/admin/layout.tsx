import AdminSidebar from "@/components/AdminSidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-12 lg:ml-[280px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
