import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireLogin() {
  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value;

  if (!user) {
    redirect("/login");
  }

  return user;
}