"use server";

import prisma from "../../lib/prisma";
import { sign, getSession } from "../../lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData) {
  const username = formData.get("username");
  const password = formData.get("password");
  const role = formData.get("role") || "admin";

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  try {
    let user = null;
    let userRole = role;

    if (role === "cashier") {
      user = await prisma.cashier.findUnique({
        where: { username },
      });
    } else {
      user = await prisma.admin.findUnique({
        where: { username },
      });
      // Fallback: if not found as admin, try cashier
      if (!user) {
        user = await prisma.cashier.findUnique({
          where: { username },
        });
        if (user) userRole = "cashier";
      }
    }

    if (!user || user.password !== password) {
      return { error: "Invalid username or password" };
    }

    const userId = userRole === "cashier" ? user.CashierID : user.AdminID;

    // Sign JWT
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await sign({ userId, username: user.username, role: userRole, expires });

    // Set cookie
    (await cookies()).set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true, role: userRole };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/");
}

export async function updateAccount(formData) {
  const username = formData.get("username");
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");

  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { AdminID: session.userId },
    });

    if (!admin || admin.password !== currentPassword) {
      return { error: "Incorrect current password" };
    }

    const updatedData = {
      username: username || admin.username,
    };

    if (newPassword) {
      updatedData.password = newPassword;
    }

    await prisma.admin.update({
      where: { AdminID: session.userId },
      data: updatedData,
    });

    return { success: true };
  } catch (error) {
    console.error("Update account error:", error);
    return { error: "Failed to update account" };
  }
}
