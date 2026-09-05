// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Card, Table, Button, Tag, Space, message } from "antd";

// export default function HRApprovals() {
//   const [leaves, setLeaves] = useState<any[]>([]);

//   const fetchLeaves = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .order("created_at", { ascending: false });

//     setLeaves(data || []);
//   };

//   useEffect(() => {
//     fetchLeaves();
//   }, []);

//   const updateStatus = async (id: string, status: string) => {
//     const { error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .update({ status })
//       .eq("id", id);

//     if (error) {
//       message.error(error.message);
//       return;
//     }

//     message.success(`Leave ${status}`);
//     fetchLeaves();
//   };

//   const columns = [
//     { title: "Employee", dataIndex: "employee_name" },
//     { title: "Type", dataIndex: "type" },
//     { title: "Reason", dataIndex: "reason" },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (v: string) => {
//         let color = "default";
//         if (v === "pending") color = "orange";
//         if (v === "approved") color = "green";
//         if (v === "rejected") color = "red";
//         return <Tag color={color}>{v}</Tag>;
//       },
//     },
//     {
//       title: "Action",
//       render: (_: any, record: any) => (
//         <Space>
//           {record.status === "pending" ? (
//             <>
//               <Button
//                 type="primary"
//                 onClick={() => updateStatus(record.id, "approved")}
//               >
//                 Approve
//               </Button>

//               <Button
//                 danger
//                 onClick={() => updateStatus(record.id, "rejected")}
//               >
//                 Reject
//               </Button>
//             </>
//           ) : (
//             <span style={{ color: "#888" }}>No actions</span>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: 20 }}>
//       <Card title="HR Leave Approval System">
//         <Table
//           dataSource={leaves}
//           columns={columns}
//           rowKey="id"
//         />
//       </Card>
//     </div>
//   );
// }
















// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Card, Table, Button, Tag, Space, message, Tabs } from "antd";
// import { ArrowRightOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";

// export default function HRApprovals() {
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<string>("pending");

//   const fetchLeaves = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       // ==========================================================
//       // GROUP 1H AND 2H ENTRIES FOR THE VISUAL UI
//       // ==========================================================
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
//       message.error(err.message || "Failed to query system entries");
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

//       message.success(`Status updated to ${status.replace("_", " ")} successfully.`);
//       fetchLeaves();
//     } catch (error: any) {
//       message.error(error.message);
//     }
//   };

//   // ==========================================================
//   // CLIENT-SIDE FILTERING BASED ON ACTIVE TAB (UPDATED)
//   // ==========================================================
//   const filteredLeaves = leaves.filter((leave) => {
//     if (activeTab === "pending") return leave.status === "pending";
//     // CHANGED: Management tab now catches both "forwarded" and "Unauthorized_Leave" statuses
//     if (activeTab === "management") {
//       return leave.status === "forwarded" || leave.status === "Unauthorized_Leave";
//     }
//     if (activeTab === "approved") return leave.status === "approved" || leave.status === "taken";
//     return true;
//   });

//   const columns = [
//     { 
//       title: "Employee", 
//       dataIndex: "employee_name" 
//     },
//     { 
//       title: "Leave Date", 
//       dataIndex: "leave_date",
//       render: (date: string) => date ? dayjs(date).format("DD-MM-YYYY") : "-"
//     },
//     { 
//       title: "Duration", 
//       dataIndex: "displayHalf",
//       render: (half: string) => {
//         const color = half === "Full Day" ? "purple" : "cyan";
//         return <Tag color={color}>{half || "Full Day"}</Tag>;
//       }
//     },
//     { 
//       title: "Type", 
//       dataIndex: "type" 
//     },
//     { 
//       title: "Reason", 
//       dataIndex: "reason" 
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (v: string) => {
//         let color = "default";
//         let text = v;
//         if (v === "pending") color = "orange";
//         if (v === "approved") color = "green";
//         if (v === "rejected") color = "red";
//         if (v === "forwarded") {
//           color = "blue";
//           text = "Forwarded";
//         }
//         if (v === "Unauthorized_Leave") {
//           color = "magenta";
//           text = "Unauthorized Leave";
//         }
//         if (v === "taken") color = "geekblue";
//         return <Tag color={color}>{text.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Action",
//       render: (_: any, record: any) => {
//         const isPendingHR = record.status === "pending";
//         const isManagementScope = record.status === "forwarded" || record.status === "Unauthorized_Leave";

//         return (
//           <Space size="middle">
//             {isPendingHR && (
//               <>
//                 <Button
//                   type="primary"
//                   icon={<CheckOutlined />}
//                   style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
//                   onClick={() => updateStatus(record.ids, "approved")}
//                 >
//                   Approve
//                 </Button>

//                 <Button
//                   type="default"
//                   icon={<ArrowRightOutlined />}
//                   style={{ color: "#096dd9", borderColor: "#096dd9" }}
//                   onClick={() => updateStatus(record.ids, "forwarded")}
//                 >
//                   Forward to Management
//                 </Button>

//                 <Button
//                   danger
//                   icon={<CloseOutlined />}
//                   onClick={() => updateStatus(record.ids, "rejected")}
//                 >
//                   Reject
//                 </Button>
//               </>
//             )}

//             {isManagementScope && (
//               <>
//                 <Button
//                   type="primary"
//                   icon={<CheckOutlined />}
//                   style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
//                   onClick={() => updateStatus(record.ids, "approved")}
//                 >
//                   Management Approve
//                 </Button>
//                 <Button
//                   danger
//                   icon={<CloseOutlined />}
//                   onClick={() => updateStatus(record.ids, "rejected")}
//                 >
//                   Reject
//                 </Button>
//               </>
//             )}

//             {!isPendingHR && !isManagementScope && (
//               <span style={{ color: "#a6a6a6", fontSize: "13px" }}>Processed ({record.status})</span>
//             )}
//           </Space>
//         );
//       },
//     },
//   ];

//   // CHANGED: Live counters calculated according to updated status structures
//   const tabItems = [
//     {
//       key: "pending",
//       label: `Pending HR (${leaves.filter(l => l.status === "pending").length})`,
//     },
//     {
//       key: "management",
//       label: `Management Approval (${
//         leaves.filter(l => l.status === "forwarded" || l.status === "Unauthorized_Leave").length
//       })`,
//     },
//     {
//       key: "approved",
//       label: `Approved / History (${leaves.filter(l => l.status === "approved" || l.status === "taken").length})`,
//     },
//   ];

//   return (
//     <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
//       <Card 
//         title={<span style={{ fontSize: "20px", fontWeight: 600 }}>HR Leave Approval System</span>}
//         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
//       >
//         <Tabs 
//           activeKey={activeTab} 
//           onChange={(key) => setActiveTab(key)} 
//           items={tabItems}
//           style={{ marginBottom: 16 }}
//         />

//         <Table
//           dataSource={filteredLeaves}
//           columns={columns}
//           rowKey={(record) => `${record.employee_id}_${record.leave_date}_${record.status}`}
//           loading={loading}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>
//     </div>
//   );
// }




















// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Card, Table, Button, Tag, Space, message, Tabs } from "antd";
// import { ArrowRightOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";

// export default function HRApprovals() {
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<string>("pending");

//   const fetchLeaves = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       // ==========================================================
//       // GROUP 1H AND 2H ENTRIES FOR THE VISUAL UI
//       // ==========================================================
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
//       message.error(err.message || "Failed to query system entries");
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

//       message.success(`Status updated to ${status.replace("_", " ")} successfully.`);
//       fetchLeaves();
//     } catch (error: any) {
//       message.error(error.message);
//     }
//   };

//   // ==========================================================
//   // CLIENT-SIDE FILTERING BASED ON ACTIVE TAB
//   // ==========================================================
//   const filteredLeaves = leaves.filter((leave) => {
//     if (activeTab === "pending") return leave.status === "pending";
//     if (activeTab === "management") {
//       return leave.status === "forwarded" || leave.status === "Unauthorized_Leave";
//     }
//     if (activeTab === "approved") return leave.status === "approved" || leave.status === "taken";
//     return true;
//   });

//   const columns = [
//     { 
//       title: "Employee", 
//       dataIndex: "employee_name" ,
//       width: activeTab === "management" ? 150 : 200, 
//       render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
//     },
//     { 
//       title: "Leave Date", 
//       dataIndex: "leave_date",
//       width: activeTab === "management" ? 110 : 140,
//       render: (date: string) => date ? dayjs(date).format("DD-MM-YYYY") : "-"
//     },
//     { 
//       title: "Duration", 
//       dataIndex: "displayHalf",
//       render: (half: string) => {
//         const color = half === "Full Day" ? "purple" : "cyan";
//         return <Tag color={color}>{half || "Full Day"}</Tag>;
//       }
//     },
//     { 
//       title: "Type", 
//       dataIndex: "type" 
//     },
//     { 
//       title: "Reason", 
//       dataIndex: "reason" 
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (v: string) => {
//         let color = "default";
//         let text = v;
//         if (v === "pending") color = "orange";
//         if (v === "approved") color = "green";
//         if (v === "rejected") color = "red";
//         if (v === "forwarded") {
//           color = "blue";
//           text = "Forwarded";
//         }
//         if (v === "Unauthorized_Leave") {
//           color = "magenta";
//           text = "Unauthorized Leave";
//         }
//         if (v === "taken") color = "geekblue";
//         return <Tag color={color}>{text.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Action",
//       render: (_: any, record: any) => {
//         const isPendingHR = record.status === "pending";
//         const isManagementScope = record.status === "forwarded" || record.status === "Unauthorized_Leave";

//         return (
//           <Space size="middle">
//             {/* FIXED: Action controls restored to HR Review queue */}
//             {isPendingHR && (
//               <>
//                 <Button
//                   type="primary"
//                   icon={<CheckOutlined />}
//                   style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
//                   onClick={() => updateStatus(record.ids, "approved")}
//                 >
                  
//                 </Button>



//                 <Button
//                   danger
//                   icon={<CloseOutlined />}
//                   onClick={() => updateStatus(record.ids, "rejected")}
//                 >
                  
//                 </Button>

//                                 <Button
//                   type="default"
//                   icon={<ArrowRightOutlined />}
//                   style={{ color: "#096dd9", borderColor: "#096dd9" }}
//                   onClick={() => updateStatus(record.ids, "forwarded")}
//                 >
                  
//                 </Button>
//               </>
//             )}

//             {/* FIXED: Management approval actions removed from HR panel view */}
//             {isManagementScope && (
//               <span style={{ color: "#fa8c16", fontSize: "13px", fontWeight: 500 }}>
//                 Awaiting Admin Action
//               </span>
//             )}

//             {!isPendingHR && !isManagementScope && (
//               <span style={{ color: "#a6a6a6", fontSize: "13px" }}>Processed ({record.status})</span>
//             )}
//           </Space>
//         );
//       },
//     },
//   ];

//   const tabItems = [
//     {
//       key: "pending",
//       label: `Pending HR Review (${leaves.filter(l => l.status === "pending").length})`,
//     },
//     {
//       key: "management",
//       label: `Management Approval (${
//         leaves.filter(l => l.status === "forwarded" || l.status === "Unauthorized_Leave").length
//       })`,
//     },
//     {
//       key: "approved",
//       label: `Approved / History (${leaves.filter(l => l.status === "approved" || l.status === "taken").length})`,
//     },
//   ];

//   return (
//     <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
//       <Card 
//         title={<span style={{ fontSize: "20px", fontWeight: 600 }}>Leave Approval & Control Panel</span>}
//         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
//       >
//         <Tabs 
//           activeKey={activeTab} 
//           onChange={(key) => setActiveTab(key)} 
//           items={tabItems}
//           style={{ marginBottom: 16 }}
//         />

//         <Table
//           dataSource={filteredLeaves}
//           columns={columns}
//           rowKey={(record) => `${record.employee_id}_${record.leave_date}_${record.status}`}
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
import { Card, Table, Button, Tag, Space, message, Tabs, Input } from "antd";
import { ArrowRightOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function HRApprovals() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("pending");
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

      // ==========================================================
      // GROUP 1H AND 2H ENTRIES FOR THE VISUAL UI
      // ==========================================================
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
      message.error(err.message || "Failed to query system entries");
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

      message.success(`Status updated to ${status.replace("_", " ")} successfully.`);
      fetchLeaves();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // ==========================================================
  // CLIENT-SIDE FILTERING BASED ON ACTIVE TAB & SEARCH TEXT
  // ==========================================================
  const filteredLeaves = leaves.filter((leave) => {
    if (searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase();
      const matchName = leave.employee_name?.toLowerCase().includes(searchLower);
      const matchCode = leave.employee_code?.toLowerCase().includes(searchLower);
      
      if (!matchName && !matchCode) return false;
    }

    if (activeTab === "pending") return leave.status === "pending";
    if (activeTab === "management") {
      return leave.status === "forwarded" || leave.status === "Unauthorized_Leave";
    }
    if (activeTab === "approved") return leave.status === "approved" || leave.status === "taken";
    return true;
  });

  const columns = [
    { 
      title: "Employee", 
      dataIndex: "employee_name",
      width: activeTab === "management" ? 150 : 200, 
      render: (text: string, record: any) => (
        <div>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.employee_code && (
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{record.employee_code}</div>
          )}
        </div>
      )
    },
    { 
      title: "Leave Date", 
      dataIndex: "leave_date",
      width: activeTab === "management" ? 120 : 140,
      render: (date: string) => date ? dayjs(date).format("DD-MM-YYYY") : "-"
    },
    { 
      title: "Duration", 
      dataIndex: "displayHalf",
      
      render: (half: string) => {
        const color = half === "Full Day" ? "purple" : "cyan";
        return <Tag color={color}>{half || "Full Day"}</Tag>;
      }
    },
    { 
      title: "Type", 
      dataIndex: "type",
      width: 130
    },
    { 
      title: "Reason", 
      dataIndex: "reason" ,
      width: 300,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (v: string) => {
        let color = "default";
        let text = v;
        if (v === "pending") color = "orange";
        if (v === "approved") color = "green";
        if (v === "rejected") color = "red";
        if (v === "forwarded") {
          color = "blue";
          text = "Forwarded";
        }
        if (v === "Unauthorized_Leave") {
          color = "magenta";
          text = "Unauthorized Leave";
        }
        if (v === "taken") color = "geekblue";
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Action",
      width: 160,
      render: (_: any, record: any) => {
        const isPendingHR = record.status === "pending";
        const isManagementScope = record.status === "forwarded" || record.status === "Unauthorized_Leave";

        return (
          <Space size="middle">
            {isPendingHR && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  onClick={() => updateStatus(record.ids, "approved")}
                >
                  
                </Button>

                <Button
                  type="default"
                  icon={<ArrowRightOutlined />}
                  style={{ color: "#096dd9", borderColor: "#096dd9" }}
                  onClick={() => updateStatus(record.ids, "forwarded")}
                >
                  
                </Button>

                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => updateStatus(record.ids, "rejected")}
                >
                  
                </Button>
              </>
            )}

            {isManagementScope && (
              <span style={{ color: "#fa8c16", fontSize: "13px", fontWeight: 500 }}>
                Awaiting Admin Action
              </span>
            )}

            {!isPendingHR && !isManagementScope && (
              <span style={{ color: "#a6a6a6", fontSize: "13px" }}>Processed ({record.status})</span>
            )}
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: "pending",
      label: `Pending HR Review (${leaves.filter(l => l.status === "pending").length})`,
    },
    {
      key: "management",
      label: `Management Approval (${
        leaves.filter(l => l.status === "forwarded" || l.status === "Unauthorized_Leave").length
      })`,
    },
    {
      key: "approved",
      label: `Approved / History (${leaves.filter(l => l.status === "approved" || l.status === "taken").length})`,
    },
  ];

  // FIXED: Rendered Search Bar as Extra Content for the right-hand corner of the tabs alignment row
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
        title={<span style={{ fontSize: "20px", fontWeight: 600 }}>Leave Approval & Control Panel</span>}
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => setActiveTab(key)} 
          items={tabItems}
          tabBarExtraContent={{ right: renderSearchNode }} // Places it beautifully on the right of the tab items
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={filteredLeaves}
          columns={columns}
          rowKey={(record) => `${record.employee_id}_${record.leave_date}_${record.status}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}