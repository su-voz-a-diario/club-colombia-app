import { NextResponse } from "next/server";
import { getSessionCookieNamesToClear, getSessionCookieOptions, getSessionCookieName } from "@/lib/authSession";
import { createVerifiedSessionCookie, getVerifiedSessionFromRequest } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearSessionCookies(response) {
  for (const cookieName of getSessionCookieNamesToClear()) {
    response.cookies.set(cookieName, "", {
      ...getSessionCookieOptions(),
      maxAge: 0
    });
  }
}

export async function GET(request) {
  try {
    const session = await getVerifiedSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error al verificar sesión segura:", error);
    return NextResponse.json({ error: "Sesión inválida o configuración incompleta" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken es obligatorio" }, { status: 400 });
    }

    const { sessionCookie, session } = await createVerifiedSessionCookie(idToken);
    const response = NextResponse.json({ success: true, ...session });
    response.cookies.set(getSessionCookieName(), sessionCookie, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Error al crear sesión Firebase:", error);
    return NextResponse.json({ error: "No se pudo crear la sesión segura" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}
