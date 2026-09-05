// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Card, Table, Button, Tag, Space, message, Tabs, Input, Popconfirm } from "antd";
// import { CheckOutlined, CloseOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";

// export default function AdminApprovalsPage() {
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<string>("management");
//   const [searchText, setSearchText] = useState<string>("");

//   const fetchLeaves = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       // Group 1H and 2H entries for display
//       const groupedMap: Record<string, any> = {};

//       (data || []).forEach((row) => {
//         const uniqueGroupKey = `${row.employee_id}_${row.leave_date}_${row.status}_${row.type}_${row.reason}`;

//         if (!groupedMap[uniqueGroupKey]) {
//           groupedMap[uniqueGroupKey] = {
//             ...row,
//             ids: [row.id],
//             displayHalf: row.half,
//           };
//         } else {
//           const existing = groupedMap[uniqueGroupKey];
//           existing.ids.push(row.id);

//           if (
//             (existing.half === "1H" && row.half === "2H") ||
//             (existing.half === "2H" && row.half === "1H")
//           ) {
//             existing.displayHalf = "Full Day";
//           }
//         }
//       });

//       setLeaves(Object.values(groupedMap));
//     } catch (err: any) {
//       message.error(err.message || "Failed to query leave entries");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeaves();
//   }, []);

//   const updateStatus = async (targetIds: string[], status: string) => {
//     try {
//       const { error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .update({ status })
//         .in("id", targetIds);

//       if (error) throw error;

//       message.success(`Leave status updated to ${status.toUpperCase()} successfully.`);
//       fetchLeaves();
//     } catch (error: any) {
//       message.error(error.message);
//     }
//   };

//   // Client-side Filtering
//   const filteredLeaves = leaves.filter((leave) => {
//     if (searchText.trim() !== "") {
//       const searchLower = searchText.toLowerCase();
//       const matchName = leave.employee_name?.toLowerCase().includes(searchLower);
//       const matchCode = leave.employee_code?.toLowerCase().includes(searchLower);

//       if (!matchName && !matchCode) return false;
//     }

//     if (activeTab === "management") {
//       return leave.status === "forwarded" || leave.status === "Unauthorized_Leave";
//     }
//     if (activeTab === "history") {
//       return (
//         leave.status === "approved" ||
//         leave.status === "rejected" ||
//         leave.status === "LOP"
//       );
//     }
//     return true;
//   });

//   const columns = [
//     {
//       title: "Employee",
//       dataIndex: "employee_name",
//       width: 200,
//       render: (text: string, record: any) => (
//         <div>
//           <span style={{ fontWeight: 600 }}>{text}</span>
//           {record.employee_code && (
//             <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{record.employee_code}</div>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Department",
//       dataIndex: "department",
//       width: 140,
//       render: (dept: string) => dept || "-",
//     },
//     {
//       title: "Leave Date",
//       dataIndex: "leave_date",
//       width: 130,
//       render: (date: string) => (date ? dayjs(date).format("DD-MM-YYYY") : "-"),
//     },
//     {
//       title: "Duration",
//       dataIndex: "displayHalf",
//       width: 110,
//       render: (half: string) => {
//         const color = half === "Full Day" ? "purple" : "cyan";
//         return <Tag color={color}>{half || "Full Day"}</Tag>;
//       },
//     },
//     {
//       title: "Type",
//       dataIndex: "type",
//       width: 120,
//     },
//     {
//       title: "Reason",
//       dataIndex: "reason",
//       width: 280,
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       width: 150,
//       render: (v: string) => {
//         let color = "default";
//         let text = v;
//         if (v === "forwarded") {
//           color = "blue";
//           text = "Awaiting Admin Approval";
//         } else if (v === "Unauthorized_Leave") {
//           color = "magenta";
//           text = "Unauthorized Leave";
//         } else if (v === "approved") {
//           color = "green";
//         } else if (v === "rejected") {
//           color = "red";
//         } else if (v === "LOP") {
//           color = "volcano";
//         }
//         return <Tag color={color}>{text.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Admin Action",
//       width: 240,
//       render: (_: any, record: any) => {
//         const isManagementPending =
//           record.status === "forwarded" || record.status === "Unauthorized_Leave";

//         return isManagementPending ? (
//           <Space size="small">
//             {/* APPROVE BUTTON */}
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
//               onClick={() => updateStatus(record.ids, "approved")}
//             >
//               Approve
//             </Button>

//             {/* FORCE LOP BUTTON */}
//             <Popconfirm
//               title="Convert to LOP"
//               description="Are you sure you want to mark this request as LOP?"
//               onConfirm={() => updateStatus(record.ids, "LOP")}
//               okText="Yes, LOP"
//               cancelText="No"
//             >
//               <Button
//                 type="default"
//                 icon={<WarningOutlined />}
//                 style={{ color: "#fa8c16", borderColor: "#fa8c16" }}
//               >
//                 LOP
//               </Button>
//             </Popconfirm>

//             {/* REJECT BUTTON */}
//             <Button
//               danger
//               icon={<CloseOutlined />}
//               onClick={() => updateStatus(record.ids, "rejected")}
//             >
//               Reject
//             </Button>
//           </Space>
//         ) : (
//           <span style={{ color: "#a6a6a6", fontSize: "13px" }}>
//             Finalized ({record.status})
//           </span>
//         );
//       },
//     },
//   ];

//   const tabItems = [
//     {
//       key: "management",
//       label: `Forwarded for Approval (${
//         leaves.filter((l) => l.status === "forwarded" || l.status === "Unauthorized_Leave")
//           .length
//       })`,
//     },
//     {
//       key: "history",
//       label: `Processed History (${
//         leaves.filter(
//           (l) => l.status === "approved" || l.status === "rejected" || l.status === "LOP"
//         ).length
//       })`,
//     },
//   ];

//   const renderSearchNode = (
//     <div style={{ paddingBottom: 6, width: 320 }}>
//       <Input
//         placeholder="Search employee name or code..."
//         prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
//         value={searchText}
//         onChange={(e) => setSearchText(e.target.value)}
//         allowClear
//         size="middle"
//       />
//     </div>
//   );

//   return (
//     <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
//       <Card
//         title={
//           <span style={{ fontSize: "20px", fontWeight: 600 }}>
//             Management Approvals & Leave Decision Control
//           </span>
//         }
//         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
//       >
//         <Tabs
//           activeKey={activeTab}
//           onChange={(key) => setActiveTab(key)}
//           items={tabItems}
//           tabBarExtraContent={{ right: renderSearchNode }}
//           style={{ marginBottom: 16 }}
//         />

//         <Table
//           dataSource={filteredLeaves}
//           columns={columns}
//           rowKey={(record) =>
//             `${record.employee_id}_${record.leave_date}_${record.status}_${record.id}`
//           }
//           loading={loading}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>
//     </div>
//   );
// }
















"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Table, Button, Tag, Space, message, Tabs, Input, Popconfirm } from "antd";
import { CheckOutlined, CloseOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function AdminApprovalsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("forwarded");
  const [searchText, setSearchText] = useState<string>("");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group 1H and 2H entries for display
      const groupedMap: Record<string, any> = {};

      (data || []).forEach((row) => {
        const uniqueGroupKey = `${row.employee_id}_${row.leave_date}_${row.status}_${row.type}_${row.reason}`;

        if (!groupedMap[uniqueGroupKey]) {
          groupedMap[uniqueGroupKey] = {
            ...row,
            ids: [row.id],
            displayHalf: row.half,
          };
        } else {
          const existing = groupedMap[uniqueGroupKey];
          existing.ids.push(row.id);

          if (
            (existing.half === "1H" && row.half === "2H") ||
            (existing.half === "2H" && row.half === "1H")
          ) {
            existing.displayHalf = "Full Day";
          }
        }
      });

      setLeaves(Object.values(groupedMap));
    } catch (err: any) {
      message.error(err.message || "Failed to query leave entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateStatus = async (targetIds: string[], status: string) => {
    try {
      const { error } = await supabase
        .schema("leave_management")
        .from("leaves")
        .update({ status })
        .in("id", targetIds);

      if (error) throw error;

      message.success(`Leave status updated to ${status.toUpperCase()} successfully.`);
      fetchLeaves();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // Client-side Filtering per Tab
  const filteredLeaves = leaves.filter((leave) => {
    if (searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase();
      const matchName = leave.employee_name?.toLowerCase().includes(searchLower);
      const matchCode = leave.employee_code?.toLowerCase().includes(searchLower);

      if (!matchName && !matchCode) return false;
    }

    if (activeTab === "forwarded") {
      return leave.status === "forwarded";
    }
    if (activeTab === "unauthorized") {
      return leave.status === "Unauthorized_Leave";
    }
    if (activeTab === "history") {
      return (
        leave.status === "approved" ||
        leave.status === "rejected" ||
        leave.status === "LOP"
      );
    }
    return true;
  });

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee_name",
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <span style={{ fontWeight: 600 }}>{text}</span>
          {record.employee_code && (
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{record.employee_code}</div>
          )}
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      width: 140,
      render: (dept: string) => dept || "-",
    },
    {
      title: "Leave Date",
      dataIndex: "leave_date",
      width: 130,
      render: (date: string) => (date ? dayjs(date).format("DD-MM-YYYY") : "-"),
    },
    {
      title: "Duration",
      dataIndex: "displayHalf",
      width: 110,
      render: (half: string) => {
        const color = half === "Full Day" ? "purple" : "cyan";
        return <Tag color={color}>{half || "Full Day"}</Tag>;
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 120,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      width: 280,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      render: (v: string) => {
        let color = "default";
        let text = v;
        if (v === "forwarded") {
          color = "blue";
          text = "Forwarded by HR";
        } else if (v === "Unauthorized_Leave") {
          color = "magenta";
          text = "Unauthorized Leave";
        } else if (v === "approved") {
          color = "green";
        } else if (v === "rejected") {
          color = "red";
        } else if (v === "LOP") {
          color = "volcano";
        }
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Admin Action",
      width: 240,
      render: (_: any, record: any) => {
        const isManagementPending =
          record.status === "forwarded" || record.status === "Unauthorized_Leave";

        return isManagementPending ? (
          <Space size="small">
            {/* APPROVE BUTTON */}
            <Button
              type="primary"
              icon={<CheckOutlined />}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              onClick={() => updateStatus(record.ids, "approved")}
            >
              Approve
            </Button>

            {/* FORCE LOP BUTTON */}
            <Popconfirm
              title="Convert to LOP"
              description="Are you sure you want to mark this request as LOP?"
              onConfirm={() => updateStatus(record.ids, "LOP")}
              okText="Yes, LOP"
              cancelText="No"
            >
              <Button
                type="default"
                icon={<WarningOutlined />}
                style={{ color: "#fa8c16", borderColor: "#fa8c16" }}
              >
                LOP
              </Button>
            </Popconfirm>

            {/* REJECT BUTTON */}
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => updateStatus(record.ids, "rejected")}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <span style={{ color: "#a6a6a6", fontSize: "13px" }}>
            Finalized ({record.status})
          </span>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: "forwarded",
      label: `Forwarded by HR (${
        leaves.filter((l) => l.status === "forwarded").length
      })`,
    },
    {
      key: "unauthorized",
      label: `Unauthorized Leaves (${
        leaves.filter((l) => l.status === "Unauthorized_Leave").length
      })`,
    },
    {
      key: "history",
      label: `Processed History (${
        leaves.filter(
          (l) => l.status === "approved" || l.status === "rejected" || l.status === "LOP"
        ).length
      })`,
    },
  ];

  const renderSearchNode = (
    <div style={{ paddingBottom: 6, width: 320 }}>
      <Input
        placeholder="Search employee name or code..."
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        size="middle"
      />
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <Card
        title={
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            Management Approvals & Leave Decision Control
          </span>
        }
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          tabBarExtraContent={{ right: renderSearchNode }}
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={filteredLeaves}
          columns={columns}
          rowKey={(record) =>
            `${record.employee_id}_${record.leave_date}_${record.status}_${record.id}`
          }
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}