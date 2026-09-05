"use client";

import React, { useState } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FormOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin-collapsed") === "true";
  });

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem("admin-collapsed", String(value));
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={handleCollapse}>
        <div style={{ color: "white", textAlign: "center", padding: 16, fontWeight: "bold" }}>
          {collapsed ? "ADM" : "ADMIN PANEL"}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          onClick={(item) => router.push(item.key)}
          items={[
            {
              key: "/admin",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: "/admin/manual-allocation",
              icon: <FormOutlined />,
              label: "Manual Leave Allocation",
            },
            {
              key: "/admin/approvals",
              icon: <FormOutlined />,
              label: "Leave Approval",
            },
            // {
            //   key: "/admin/settings",
            //   icon: <SettingOutlined />,
            //   label: "System Settings",
            // },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: "#fff", paddingLeft: 20, fontWeight: "600", fontSize: "16px" }}>
          Leave Management System - Admin
        </Header>

        <Content style={{ margin: 20 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}