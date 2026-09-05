"use client";

import { Layout, Menu } from "antd";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DashboardOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ color: "white", padding: 16, textAlign: "center" }}>
          STAFF PANEL
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          onClick={(item) => router.push(item.key)}
          items={[
            {
              key: "/staff",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: "/staff/history",
              icon: <HistoryOutlined />,
              label: "My Leaves",
            },
          ]}
        />
      </Sider>

      {/* MAIN */}
      <Layout>
        <Header style={{ background: "#fff", paddingLeft: 20 }}>
          Staff Portal
        </Header>

        <Content style={{ margin: 20 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}