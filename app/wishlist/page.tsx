import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WishlistClient from "./WishlistClient";
import Link from "next/link";

export default async function WishlistPage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">
          Please sign in to view your wishlist
        </h1>
        <Link href="/auth/signin" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  return <WishlistClient />;
}
