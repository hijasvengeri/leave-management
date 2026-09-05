// import {
//   NextResponse,
// }
// from "next/server";

// import {
//   getCurrentUser,
// }
// from "@/lib/auth";

// export async function
// GET() {

//   const user =
//     await getCurrentUser();

//   if (!user) {

//     return NextResponse.json(
//       {
//         success:
//           false,
//       },
//       {
//         status: 401,
//       }
//     );
//   }

//   return NextResponse.json(
//     {
//       success:
//         true,
//       user,
//     }
//   );
// }




import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Placeholder for /api/auth/me" });
}
