// "use client";

// import { useEffect, useState } from "react";
// import { Table, Tag, Card, Space, Typography, message } from "antd";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const { Text } = Typography;

// export default function MyLeavesHistory() {
//   const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [userId, setUserId] = useState<string | null>(null);

//   // 1. Get the logged-in staff user's ID from local storage
//   useEffect(() => {
//     const sessionUser = JSON.parse(localStorage.getItem("user") || "{}");
//     if (sessionUser?.id) {
//       setUserId(sessionUser.id);
//     } else {
//       message.error("User session not found. Please log in again.");
//       setLoading(false);
//     }
//   }, []);

//   // 2. Fetch leave records for this specific employee
//   const fetchMyLeaveHistory = async (employeeId: string) => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("id, leave_date, half, type, status, reason, handover_name, created_at")
//         .eq("employee_id", employeeId)
//         .order("leave_date", { ascending: false }); // Newest leave requests first

//       if (error) throw error;
//       setLeaveHistory(data || []);
//     } catch (err: any) {
//       console.error("Error fetching history:", err.message);
//       message.error("Failed to load leave history.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (userId) {
//       fetchMyLeaveHistory(userId);
//     }
//   }, [userId]);

//   // 3. Define Table Columns
//   const columns = [
//     {
//       title: "Applied Date",
//       dataIndex: "created_at",
//       key: "created_at",
//       render: (date: string) => dayjs(date).format("DD-MM-YYYY HH:mm"),
//     },
//     {
//       title: "Leave Date",
//       dataIndex: "leave_date",
//       key: "leave_date",
//       render: (date: string) => <b>{dayjs(date).format("DD-MM-YYYY")}</b>,
//     },
//     {
//       title: "Duration",
//       dataIndex: "half",
//       key: "half",
//       render: (half: string) => {
//         if (half === "1H") return <Tag color="blue">First Half</Tag>;
//         if (half === "2H") return <Tag color="purple">Second Half</Tag>;
//         return <Tag color="cyan">Full Day</Tag>;
//       },
//     },
//     {
//       title: "Allocation Type",
//       dataIndex: "type",
//       key: "type",
//       render: (type: string) => (
//         <Tag color={type === "LOP" ? "red" : "geekblue"}>
//           {type.replace("_", " ")}
//         </Tag>
//       ),
//     },
//     {
//       title: "Handover Duty To",
//       dataIndex: "handover_name",
//       key: "handover_name",
//       render: (name: string) => name || <Text type="secondary">None</Text>,
//     },
//     {
//       title: "Reason",
//       dataIndex: "reason",
//       key: "reason",
//       ellipsis: true, // Prevents layout breaking for long text strings
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       fixed: "right" as const,
//       render: (status: string) => {
//         let color = "gold"; // Default: pending
//         let text = "PENDING";

//         if (status === "approved") {
//           color = "green";
//           text = "APPROVED";
//         } else if (status === "rejected") {
//           color = "red";
//           text = "REJECTED";
//         }

//         return (
//           <Tag color={color} style={{ fontWeight: "bold" }}>
//             {text}
//           </Tag>
//         );
//       },
//     },
//   ];

//   return (
//     <Card 
//       title="My Leaves Application History" 
//       style={{ margin: "20px 0", borderRadius: 8, border: "1px solid #ddd" }}
//     >
//       <Table
//         dataSource={leaveHistory}
//         columns={columns}
//         rowKey="id"
//         loading={loading}
//         pagination={{ pageSize: 5 }}
//         locale={{ emptyText: "You haven't submitted any leave forms yet." }}
//       />
//     </Card>
//   );
// }














"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Card, Space, Typography, message, Tabs } from "antd";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const { Text } = Typography;

export default function MyLeavesHistory() {
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");

  // 1. Get the logged-in staff user's ID from local storage
  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (sessionUser?.id) {
      setUserId(sessionUser.id);
    } else {
      message.error("User session not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  // 2. Fetch leave records for this specific employee
  const fetchMyLeaveHistory = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("id, leave_date, half, type, status, reason, handover_name, created_at")
        .eq("employee_id", employeeId)
        .order("leave_date", { ascending: false });

      if (error) throw error;

      // ==========================================================
      // GROUP 1H AND 2H ENTRIES FOR CLEAN VISUAL DISPLAY
      // ==========================================================
      const groupedMap: Record<string, any> = {};

      (data || []).forEach((row) => {
        // Group rows that have matching dates, statuses, and types
        const uniqueGroupKey = `${row.leave_date}_${row.status}_${row.type}_${row.reason}`;

        if (!groupedMap[uniqueGroupKey]) {
          groupedMap[uniqueGroupKey] = {
            ...row,
            displayHalf: row.half,
          };
        } else {
          const existing = groupedMap[uniqueGroupKey];
          if (
            (existing.half === "1H" && row.half === "2H") ||
            (existing.half === "2H" && row.half === "1H")
          ) {
            existing.displayHalf = "Full Day";
          }
        }
      });

      setLeaveHistory(Object.values(groupedMap));
    } catch (err: any) {
      console.error("Error fetching history:", err.message);
      message.error("Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyLeaveHistory(userId);
    }
  }, [userId]);

  // ==========================================================
  // CLIENT-SIDE FILTERING BASED ON ACTIVE TAB
  // ==========================================================
  const filteredLeaves = leaveHistory.filter((leave) => {
    if (activeTab === "unauthorized") {
      return leave.status === "Unauthorized_Leave";
    }
    if (activeTab === "pending") {
      return leave.status === "pending" || leave.status === "forwarded";
    }
    if (activeTab === "approved") {
      return leave.status === "approved" || leave.status === "taken";
    }
    return true;
  });

  // 3. Define Table Columns
  const columns = [
    {
      title: "Applied Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD-MM-YYYY HH:mm"),
    },
    {
      title: "Leave Date",
      dataIndex: "leave_date",
      key: "leave_date",
      render: (date: string) => <b>{dayjs(date).format("DD-MM-YYYY")}</b>,
    },
    {
      title: "Duration",
      dataIndex: "displayHalf",
      key: "displayHalf",
      render: (half: string) => {
        if (half === "1H") return <Tag color="blue">First Half</Tag>;
        if (half === "2H") return <Tag color="purple">Second Half</Tag>;
        return <Tag color="cyan">Full Day</Tag>;
      },
    },
    {
      title: "Allocation Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "LOP" || type === "Unauthorized_Leave" ? "red" : "geekblue"}>
          {type ? type.replace("_", " ") : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Handover Duty To",
      dataIndex: "handover_name",
      key: "handover_name",
      render: (name: string) => name || <Text type="secondary">None</Text>,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      fixed: "right" as const,
      render: (status: string) => {
        let color = "gold";
        let text = status.toUpperCase();

        if (status === "pending") {
          color = "orange";
          text = "PENDING HR";
        } else if (status === "forwarded") {
          color = "blue";
          text = "FORWARDED TO MGMT";
        } else if (status === "approved") {
          color = "green";
          text = "APPROVED";
        } else if (status === "taken") {
          color = "geekblue";
          text = "TAKEN";
        } else if (status === "rejected") {
          color = "red";
          text = "REJECTED";
        } else if (status === "Unauthorized_Leave") {
          color = "magenta";
          text = "UNAUTHORIZED ABSENCE";
        }

        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {text}
          </Tag>
        );
      },
    },
  ];

  // Configure tab labels with dynamic record counters
  const tabItems = [
    {
      key: "unauthorized",
      label: (
        <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
          Unauthorized Leaves ({leaveHistory.filter(l => l.status === "Unauthorized_Leave").length})
        </span>
      ),
    },
    {
      key: "pending",
      label: `Pending Submissions (${leaveHistory.filter(l => l.status === "pending" || l.status === "forwarded").length})`,
    },
    {
      key: "approved",
      label: `Approved Leaves (${leaveHistory.filter(l => l.status === "approved" || l.status === "taken").length})`,
    },
  ];

  return (
    <Card 
      title={<span style={{ fontSize: "18px", fontWeight: 600 }}>My Leaves Dashboard</span>} 
      style={{ margin: "20px 0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => setActiveTab(key)} 
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={filteredLeaves}
        columns={columns}
        rowKey={(record) => `${record.id}_${record.leave_date}`}
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "No leave records found under this tab category." }}
      />
    </Card>
  );
}