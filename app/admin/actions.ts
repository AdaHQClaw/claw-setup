"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const secret = formData.get("secret")?.toString() ?? "";
  const expected = process.env.ADMIN_SECRET;

  if (!expected || secret !== expected) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_secret", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/admin",
  });

  redirect("/admin");
}
