"use client";

import {
  Layout,
  Menu,
} from "antd";

import {
  UserOutlined,
} from "@ant-design/icons";

import HeaderBar
from "./HeaderBar";

const {
  Sider,
  Content,
} = Layout;

export default function
AppLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <Layout
      style={{
        minHeight:
          "100vh",
      }}
    >
      <Sider>

        <div
          style={{
            color:
              "white",
            textAlign:
              "center",
            padding:
              20,
          }}
        >
          Leave App
        </div>

        <Menu
          theme="dark"
          mode="inline"
          items={[
            {
              key:
                "1",
              icon:
                <UserOutlined />,
              label:
                "Dashboard",
            },
          ]}
        />
      </Sider>

      <Layout>

        <HeaderBar />

        <Content
          style={{
            padding:
              24,
          }}
        >
          {children}
        </Content>

      </Layout>
    </Layout>
  );
}