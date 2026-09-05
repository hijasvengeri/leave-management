"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FileAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ color: "white", textAlign: "center", padding: 16 }}>
          HR PANEL
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          onClick={(item) => router.push(item.key)}
          items={[
            {
              key: "/dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: "/dashboard/apply",
              icon: <FileAddOutlined />,
              label: "Apply Leave",
            },
            {
              key: "/dashboard/team",
              icon: <TeamOutlined />,
              label: "Team Leaves",
            },
            {
              key: "/dashboard/approvals",
              icon: <CheckCircleOutlined />,
              label: "Approvals",
            },
          ]}
        />
      </Sider>

      {/* MAIN */}
      <Layout>
        <Header style={{ background: "#fff", paddingLeft: 20 }}>
          Leave Management System
        </Header>

        <Content style={{ margin: 20 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}