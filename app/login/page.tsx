// "use client";

// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   message,
// } from "antd";

// import {
//   useRouter,
// } from "next/navigation";

// export default function
// LoginPage() {

//   const router =
//     useRouter();

//   const onFinish =
//     async (
//       values: any
//     ) => {

//       const res =
//         await fetch(
//           "/api/auth/login",
//           {
//             method:
//               "POST",

//             headers:
//               {
//                 "Content-Type":
//                   "application/json",
//               },

//             body:
//               JSON.stringify(
//                 values
//               ),
//           }
//         );

//       const data =
//         await res.json();

//       if (
//         !data.success
//       ) {

//         return message.error(
//           data.message
//         );
//       }

//       message.success(
//         "Login Success"
//       );

//       if (
//         data.role ===
//         "admin"
//       ) {
//         router.push(
//           "/admin"
//         );
//       }

//       if (
//         data.role ===
//         "hr"
//       ) {
//         router.push(
//           "/hr"
//         );
//       }

//       if (
//         data.role ===
//         "staff"
//       ) {
//         router.push(
//           "/staff"
//         );
//       }
//     };

//   return (
//     <div
//       style={{
//         height:
//           "100vh",
//         display:
//           "flex",
//         justifyContent:
//           "center",
//         alignItems:
//           "center",
//         background:
//           "#f5f5f5",
//       }}
//     >
//       <Card
//         title="Login"
//         style={{
//           width:
//             400,
//         }}
//       >
//         <Form
//           onFinish={
//             onFinish
//           }
//         >
//           <Form.Item
//             name=
//               "username"
//             rules={[
//               {
//                 required:
//                   true,
//               },
//             ]}
//           >
//             <Input
//               placeholder=
//                 "Username"
//             />
//           </Form.Item>

//           <Form.Item
//             name=
//               "password"
//             rules={[
//               {
//                 required:
//                   true,
//               },
//             ]}
//           >
//             <Input.Password
//               placeholder=
//                 "Password"
//             />
//           </Form.Item>

//           <Button
//             htmlType=
//               "submit"
//             type=
//               "primary"
//             block
//           >
//             Login
//           </Button>

//         </Form>
//       </Card>
//     </div>
//   );
// }












"use client";

import { Form, Input, Button, Card, message } from "antd";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const onFinish = async (values: any) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data);

    if (!data.success) {
      message.error(data.message || "Login failed");
      return;
    }

    message.success("Login successful");

    // ✅ IMPORTANT NAVIGATION LOGIC
    // switch (data.role) {
    //   case "admin":
    //     router.push("/admin");
    //     break;
    //   case "hr":
    //     router.push("/hr");
    //     break;
    //   case "staff":
    //     router.push("/staff");
    //     break;
    //   default:
    //     router.push("/login");
    // }




if (data.success) {
  localStorage.setItem("user", JSON.stringify(data.user));

  // ✅ IMPORTANT NAVIGATION LOGIC
  switch (data.user.role) {
    case "admin":
      router.push("/admin");
      break;

    case "hr":
      router.push("/hr");
      break;

    case "staff":
      router.push("/staff");
      break;

    default:
      router.push("/login");
  }
}
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card title="Login" style={{ width: 350 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}