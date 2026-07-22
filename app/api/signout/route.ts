import { signOut } from "@/auth";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function generateExpireCookies(name: string): string[] {
  // Emit both Secure and non-Secure headers to guarantee deletion across HTTP/HTTPS proxy setups
  const base = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  return [base, `${base}; Secure`];
}

function isAuthCookie(name: string): boolean {
  const l = name.toLowerCase();
  return (
    AUTH_COOKIE_NAMES.includes(name) ||
    l.includes("authjs") ||
    l.includes("next-auth") ||
    l.includes("session") ||
    l.includes("csrf") ||
    l.includes("callback-url")
  );
}

export async function GET(request: Request) {
  try {
    // Attempt NextAuth internal signOut (clears server-side session state if present)
    try {
      await signOut({ redirect: false });
    } catch {
      /* ignore if session already non-existent or redirect thrown */
    }

    const { searchParams } = new URL(request.url);
    const to = searchParams.get("callbackUrl") || "/";

    const headers = new Headers({
      Location: to,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    });

    const cookiesToClear = new Set<string>(AUTH_COOKIE_NAMES);

    const cookieHeader = request.headers.get("cookie") || "";
    for (const pair of cookieHeader.split(";")) {
      const name = pair.split("=")[0]?.trim();
      if (name && isAuthCookie(name)) {
        cookiesToClear.add(name);
      }
    }

    for (const name of cookiesToClear) {
      for (const cookieStr of generateExpireCookies(name)) {
        headers.append("Set-Cookie", cookieStr);
      }
    }

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("Signout route error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
