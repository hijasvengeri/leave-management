// import {
//   NextRequest,
//   NextResponse,
// }
// from "next/server";

// import jwt from "jsonwebtoken";

// const JWT_SECRET =
// process.env.JWT_SECRET!;

// export function middleware(
//   req: NextRequest
// ) {

//   const token =
//     req.cookies.get(
//       process.env
//         .COOKIE_NAME!
//     )?.value;

//   const path =
//     req.nextUrl.pathname;

//   const publicRoutes =
//     [
//       "/login",
//     ];

//   if (
//     publicRoutes.includes(
//       path
//     )
//   ) {
//     return NextResponse.next();
//   }

//   if (!token) {

//     return NextResponse.redirect(
//       new URL(
//         "/login",
//         req.url
//       )
//     );
//   }

//   try {

//     const user: any =
//       jwt.verify(
//         token,
//         JWT_SECRET
//       );

//     if (
//       path.startsWith(
//         "/admin"
//       ) &&
//       user.role !==
//         "admin"
//     ) {

//       return NextResponse.redirect(
//         new URL(
//           "/login",
//           req.url
//         )
//       );
//     }

//     if (
//       path.startsWith(
//         "/hr"
//       ) &&
//       user.role !==
//         "hr"
//     ) {

//       return NextResponse.redirect(
//         new URL(
//           "/login",
//           req.url
//         )
//       );
//     }

//     if (
//       path.startsWith(
//         "/staff"
//       ) &&
//       user.role !==
//         "staff"
//     ) {

//       return NextResponse.redirect(
//         new URL(
//           "/login",
//           req.url
//         )
//       );
//     }

//     return NextResponse.next();

//   } catch {

//     return NextResponse.redirect(
//       new URL(
//         "/login",
//         req.url
//       )
//     );
//   }
// }

// export const config =
// {
//   matcher: [
//     "/",
//     "/admin/:path*",
//     "/hr/:path*",
//     "/staff/:path*",
//   ],
// };











// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(req: NextRequest) {
//   const user = req.cookies.get("user")?.value;

//   const isLogin = req.nextUrl.pathname === "/login";

//   if (!user && !isLogin) {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/admin/:path*", "/hr/:path*", "/staff/:path*"],
// };





import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const user = req.cookies.get("user")?.value;

  console.log("MIDDLEWARE:", req.nextUrl.pathname, "USER:", user);

  if (!user && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next).*)"],
};