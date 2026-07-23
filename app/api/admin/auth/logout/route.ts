import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearAdminCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: "rewardhub_admin_session",
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

export async function POST(
  request: NextRequest
) {
  const token = request.cookies.get(
    "rewardhub_admin_session"
  )?.value;

  try {
    if (token) {
      const rewardHubUrl = new URL(
        "/api/rewardhub",
        request.nextUrl.origin
      );

      await fetch(rewardHubUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
  action: "adminLogout",
  token,
  userAgent:
    request.headers.get(
      "user-agent"
    ) || "",
  ipAddress:
    request.headers.get(
      "x-forwarded-for"
    ) ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "",
}),
      });
    }
  } catch (error) {
    console.error(
      "Admin logout backend error:",
      error
    );
  }

  const response = NextResponse.json({
    success: true,
    loggedOut: true,
  });

  return clearAdminCookie(response);
}