// "use client";

// import { Layout, Menu } from "antd";
// import {DashboardOutlined,TeamOutlined,FileAddOutlined,CheckCircleOutlined,} from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { usePathname } from "next/navigation";

// const { Header, Sider, Content } = Layout;


// export default function HRLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const [collapsed, setCollapsed] = useState(() => {
//   if (typeof window === "undefined") return false;
//   return localStorage.getItem("hr-collapsed") === "true";
// });

// const handleCollapse = (value: boolean) => {
//   setCollapsed(value);
//   localStorage.setItem("hr-collapsed", String(value));
// };
//   const pathname = usePathname();

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <Sider collapsible collapsed={collapsed} onCollapse={handleCollapse}>
//         <div style={{ color: "white", textAlign: "center", padding: 16 }}>
//           HR PANEL
//         </div>

//         <Menu
//           theme="dark"
//           mode="inline"
//           selectedKeys={[pathname]}
//           onClick={(item) => router.push(item.key)}
//           items={[
//             {
//               key: "/hr",
//               icon: <DashboardOutlined />,
//               label: "Dashboard",
//             },
//             {
//               key: "/hr/staff",
//               icon: <TeamOutlined />,
//               label: "Staff Management",
//             },

//             {
//               key: "/hr/approvals",
//               icon: <CheckCircleOutlined />,
//               label: "Approvals",
//             },
//                         {
//               key: "/hr/verify-attendance",
//               icon: <CheckCircleOutlined />,
//               label: "Verify Attendance",
//             },
//                                     {
//               key: "/hr/earned-leaves",
//               icon: <CheckCircleOutlined />,
//               label: "Earned Leaves",
//             },
//             {
//               key: "/hr/staff-viewer",
//               icon: <CheckCircleOutlined />,
//               label: "Staff Attendace Viewer",
//             },
//                         {
//               key: "/hr/salary-calculator",
//               icon: <CheckCircleOutlined />,
//               label: "Salary Calculator",
//             },
//                                     {
//               key: "/hr/salary-hike",
//               icon: <CheckCircleOutlined />,
//               label: "Salary Hike Calculation",
//             },
//           ]}
//         />
//       </Sider>

//       <Layout>
//         <Header style={{ background: "#fff", paddingLeft: 20 }}>
//           Leave Management System - HR
//         </Header>

//         <Content style={{ margin: 20 }}>{children}</Content>
//       </Layout>
//     </Layout>
//   );
// }
















"use client";

import { Layout, Menu, Breadcrumb, Avatar, Space, Typography, theme } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  AuditOutlined,
  FileDoneOutlined,
  GiftOutlined,
  UsergroupAddOutlined,
  CalculatorOutlined,
  RiseOutlined,
  UserOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("hr-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem("hr-collapsed", String(value));
  };

  const menuItems = [
    {
      key: "/hr",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/hr/staff",
      icon: <TeamOutlined />,
      label: "Staff Management",
    },
    {
      key: "/hr/approvals",
      icon: <AuditOutlined />,
      label: "Approvals",
    },
    {
      key: "/hr/verify-attendance",
      icon: <FileDoneOutlined />,
      label: "Verify Attendance",
    },
    {
      key: "/hr/earned-leaves",
      icon: <GiftOutlined />,
      label: "Earned Leaves",
    },
    {
      key: "/hr/staff-viewer",
      icon: <UsergroupAddOutlined />,
      label: "Staff Attendance Viewer",
    },
    {
      key: "/hr/salary-calculator",
      icon: <CalculatorOutlined />,
      label: "Salary Calculator",
    },
    {
      key: "/hr/salary-hike",
      icon: <RiseOutlined />,
      label: "Salary Hike Calculation",
    },
  ];

  // Derive page title from active route
  const activeItem = menuItems.find((item) => item.key === pathname);
  const currentPageTitle = activeItem ? activeItem.label : "HR Portal";

  if (!mounted) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapse}
        theme="light"
        width={250}
        style={{
          borderRight: "1px solid #edf2f7",
          boxShadow: "2px 0 8px 0 rgba(29, 35, 41, 0.03)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            paddingLeft: collapsed ? 0 : 24,
            borderBottom: "1px solid #f0f0f0",
            transition: "all 0.2s",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            HR
          </div>
          {!collapsed && (
            <Title
              level={5}
              style={{
                margin: "0 0 0 12px",
                color: "#1f2937",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Exor Portal
            </Title>
          )}
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]}
          onClick={(item) => router.push(item.key)}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#ffffff",
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #edf2f7",
            boxShadow: "0 1px 4px rgba(0,21,41,0.04)",
          }}
        >
          <div>
            <Breadcrumb
              items={[
                { title: "HR System" },
                { title: currentPageTitle },
              ]}
            />
          </div>

          <Space size={16}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Leave Management
            </Text>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: "24px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}