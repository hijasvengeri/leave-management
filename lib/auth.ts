// import bcrypt from "bcryptjs";

// import { cookies }
// from "next/headers";

// import { supabase }
// from "./supabase";

// import {
//   generateToken,
//   verifyToken,
// }
// from "./jwt";

// const COOKIE_NAME =
// process.env.COOKIE_NAME!;

// export async function
// loginUser(
//   username: string,
//   password: string
// ) {

//   console.log(
//     "LOGIN USERNAME:",
//     username
//   );

//   const {
//     data: users,
//     error,
//   } = await supabase
//     .schema(
//       "leave_management"
//     )
//     .from(
//       "employees"
//     )
//     .select("*");

//   console.log(
//     "ALL USERS:",
//     users
//   );

//   console.log(
//     "DB ERROR:",
//     error
//   );

//   if (
//     error
//   ) {
//     throw new Error(
//       error.message
//     );
//   }

//   const user =
//     users?.find(
//       (
//         x
//       ) =>
//         x.username
//           .trim()
//           .toLowerCase() ===
//         username
//           .trim()
//           .toLowerCase()
//     );

//   console.log(
//     "FOUND USER:",
//     user
//   );

//   if (!user) {
//     throw new Error(
//       "Invalid username"
//     );
//   }

//   const passwordMatch =
//     await bcrypt.compare(
//       password,
//       user.password_hash
//     );

//   console.log(
//     "PASSWORD MATCH:",
//     passwordMatch
//   );

//   if (
//     !passwordMatch
//   ) {
//     throw new Error(
//       "Invalid password"
//     );
//   }

//   const token =
//     generateToken({
//       id: user.id,
//       username:
//         user.username,
//       role:
//         user.role,
//     });

//   const cookieStore =
//     await cookies();

//   cookieStore.set(
//     COOKIE_NAME,
//     token,
//     {
//       httpOnly: true,
//       secure:
//         process.env
//           .NODE_ENV ===
//         "production",
//       sameSite:
//         "lax",
//       path: "/",
//       maxAge:
//         60 *
//         60 *
//         24 *
//         7,
//     }
//   );

//   return user;
// }

// export async function
// logoutUser() {

//   const cookieStore =
//     await cookies();

//   cookieStore.delete(
//     COOKIE_NAME
//   );
// }

// export async function
// getCurrentUser() {

//   const cookieStore =
//     await cookies();

//   const token =
//     cookieStore.get(
//       COOKIE_NAME
//     )?.value;

//   if (!token)
//     return null;

//   return verifyToken(
//     token
//   );
// }










// import { supabase } from "./supabase";

// /* LOGIN */
// export async function loginUser(username: string, password: string) {
//   const { data: user, error } = await supabase
//     .schema("leave_management")
//     .from("employees")
//     .select("*")
//     .eq("username", username)
//     .single();

//   if (error || !user) throw new Error("User not found");

//   if (password.trim() !== user.password_hash.trim()) {
//     throw new Error("Invalid password");
//   }

//   return user;
// }

// /* SESSION (TEMP) */
// export function getCurrentUser() {
//   if (typeof window === "undefined") return null;

//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// }











// import { supabase } from "./supabase";

// export async function loginUser(username: string, password: string) {
//   const { data: user, error } = await supabase
//     .schema("leave_management")
//     .from("employees")
//     .select("*")
//     .eq("username", username)
//     .single();

//   if (error || !user) {
//     throw new Error("User not found");
//   }

//   if (password.trim() !== user.password_hash.trim()) {
//     throw new Error("Invalid password");
//   }

//   return user;
// }

import { supabase } from "./supabase";

export async function loginUser(username: string, password: string) {
  const { data: user, error } = await supabase
    .schema("leave_management")
    .from("employees")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  if (password.trim() !== user.password_hash.trim()) {
    throw new Error("Invalid password");
  }

  return user;
}

// 🟢 ADD THIS MISSING FUNCTION AT THE BOTTOM:
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return true;
}
