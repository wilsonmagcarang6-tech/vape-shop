import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

export async function sign(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verify(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await verify(session);
}

export async function getSessionSafe() {
  try {
    const session = await getSession();
    if (!session) return null;

    const roleRaw = String(session.role || "").toLowerCase();
    const role = roleRaw === "admin" || roleRaw === "cashier" ? roleRaw : null;
    const userId = session.userId ?? session.id ?? null;

    if (!role || !userId) return null;
    return { ...session, role, userId };
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "Forbidden", code: "FORBIDDEN" },
    { status: 403 }
  );
}

export async function requireAuth() {
  const session = await getSessionSafe();
  if (!session) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  return { ok: true as const, session };
}

export async function requireRole(allowedRoles: Array<"admin" | "cashier">) {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  if (!allowedRoles.includes(auth.session.role as "admin" | "cashier")) {
    return { ok: false as const, response: forbiddenResponse() };
  }

  return auth;
}
