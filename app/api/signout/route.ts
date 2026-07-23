import { signOut } from "@/auth";

/**
 * /api/signout — Clean direct sign-out handler for GET and POST requests.
 * Delegates directly to NextAuth's signOut helper for simple session removal.
 */
async function handleSignOut(request: Request) {
  let to = "/auth/signin";
  try {
    const url = new URL(request.url);
    to = url.searchParams.get("callbackUrl") || to;
  } catch {
    /* fallback to default */
  }

  return await signOut({ redirectTo: to });
}

export async function GET(request: Request) {
  try {
    return await handleSignOut(request);
  } catch (err) {
    console.error("[/api/signout] GET error:", err);
    return new Response(null, {
      status: 302,
      headers: { Location: "/auth/signin" },
    });
  }
}

export async function POST(request: Request) {
  try {
    return await handleSignOut(request);
  } catch (err) {
    console.error("[/api/signout] POST error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
