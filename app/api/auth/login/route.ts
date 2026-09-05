// import {
//   NextRequest,
//   NextResponse,
// }
// from "next/server";

// import {
//   loginUser,
// }
// from "@/lib/auth";

// export async function POST(
//   req: NextRequest
// ) {

//   try {

//     const body =
//       await req.json();

//     const user =
//       await loginUser(
//         body.username,
//         body.password
//       );

//     return NextResponse.json(
//       {
//         success: true,
//         role:
//           user.role,
//       }
//     );

//   } catch (
//     error: any
//   ) {

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error.message,
//       },
//       {
//         status: 401,
//       }
//     );
//   }
// }









// import {
//   NextRequest,
//   NextResponse,
// }
// from "next/server";

// import {
//   loginUser,
// }
// from "@/lib/auth";

// export async function POST(
//   req: NextRequest
// ) {

//   try {

//     const body =
//       await req.json();

//     const user =
//       await loginUser(
//         body.username,
//         body.password
//       );

//     return NextResponse.json(
//       {
//         success: true,
//         role:
//           user.role,
//       }
//     );

//   } catch (
//     error: any
//   ) {

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error.message,
//       },
//       {
//         status: 401,
//       }
//     );
//   }
// }










import { loginUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const user = await loginUser(
      body.username,
      body.password
    );

    // const response = NextResponse.json({
    //   success: true,
    //   role: user.role,
    // });

        const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,   // 🔥 ADD THIS
        role: user.role,
      },
    });

    // ✅ IMPORTANT: set cookie
    response.cookies.set("user", JSON.stringify({
      id: user.id,
      username: user.username,
      full_name: user.full_name,   // 🔥 ADD THIS
      role: user.role,
    }));


    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 401 }
    );
  }
}