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

function generateExpireCookies(name: string, host: string): string[] {
  const expired = "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  const results: string[] = [
    `${name}=; ${expired}; SameSite=Lax`,
    `${name}=; ${expired}; SameSite=Lax; Secure`,
  ];

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const cleanHost = host.split(":")[0];
    results.push(`${name}=; ${expired}; Domain=${cleanHost}; SameSite=Lax`);
    results.push(`${name}=; ${expired}; Domain=${cleanHost}; SameSite=Lax; Secure`);

    if (cleanHost.startsWith("www.")) {
      const rootDomain = cleanHost.replace(/^www\./, "");
      results.push(`${name}=; ${expired}; Domain=${rootDomain}; SameSite=Lax`);
      results.push(`${name}=; ${expired}; Domain=${rootDomain}; SameSite=Lax; Secure`);
      results.push(`${name}=; ${expired}; Domain=.${rootDomain}; SameSite=Lax`);
      results.push(`${name}=; ${expired}; Domain=.${rootDomain}; SameSite=Lax; Secure`);
    } else {
      results.push(`${name}=; ${expired}; Domain=.${cleanHost}; SameSite=Lax`);
      results.push(`${name}=; ${expired}; Domain=.${cleanHost}; SameSite=Lax; Secure`);
    }
  }

  return results;
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

async function handleSignOut(request: Request) {
  try {
    try {
      await signOut({ redirect: false });
    } catch {
      /* ignore */
    }

    const { searchParams } = new URL(request.url);
    const to = searchParams.get("callbackUrl") || "/auth/signin";
    const host = request.headers.get("host") || "";

    const headers = new Headers({
      "Content-Type": "application/json",
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
      for (const cookieStr of generateExpireCookies(name, host)) {
        headers.append("Set-Cookie", cookieStr);
      }
    }

    if (request.method === "POST" || request.headers.get("accept")?.includes("application/json")) {
      return new Response(JSON.stringify({ success: true, redirect: to }), {
        status: 200,
        headers,
      });
    }

    headers.set("Location", to);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("Signout route error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  return handleSignOut(request);
}

export async function POST(request: Request) {
  return handleSignOut(request);
}
