const isStaticExport = process.env.CAPACITOR_STATIC_EXPORT === "true";

export const revalidate = 0;

/**
 * GET /logout
 * Clears the Auth.js session cookie and redirects to the landing page.
 * After this redirect, req.auth is null so proxy.ts lets / render normally.
 */
export async function GET() {
  if (isStaticExport) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/" });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}
