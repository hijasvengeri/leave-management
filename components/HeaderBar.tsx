"use client";

import {
  Layout,
  Button,
} from "antd";

import {
  useRouter,
} from "next/navigation";

const {
  Header,
} = Layout;

export default function
HeaderBar() {

  const router =
    useRouter();

  const logout =
    async () => {

      document.cookie =
        `${process.env.NEXT_PUBLIC_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

      router.push(
        "/login"
      );
    };

  return (
    <Header
      style={{
        background:
          "#fff",
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
      }}
    >
      <h3>
        Leave
        Management
      </h3>

      <Button
        danger
        onClick={
          logout
        }
      >
        Logout
      </Button>
    </Header>
  );
}