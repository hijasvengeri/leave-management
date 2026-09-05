// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//   Card,
//   Row,
//   Col,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   message,
// } from "antd";

// export default function HRDashboard() {
//   const [staff, setStaff] = useState<any[]>([]);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [open, setOpen] = useState(false);

//   const [form] = Form.useForm();

//   // ================= STAFF FETCH =================
//   const fetchStaff = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("role", "staff");

//     setStaff(data || []);
//   };

//   // ================= LEAVE FETCH =================
//   const fetchLeaves = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("status", "pending");

//     setLeaves(data || []);
//   };

//   useEffect(() => {
//     fetchStaff();
//     fetchLeaves();
//   }, []);

//   // ================= CREATE STAFF =================
//   const createStaff = async (values: any) => {
//     const { error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .insert([
//         {
//           username: values.username,
//           password_hash: values.password,
//           full_name: values.full_name,
//           employee_code: values.employee_code,
//           role: "staff",
//           designation: values.designation,
//           active: true,
//         },
//       ]);

//     if (error) {
//       message.error(error.message);
//       return;
//     }

//     message.success("Staff created");
//     setOpen(false);
//     form.resetFields();
//     fetchStaff();
//   };

//   // ================= STAFF TABLE =================
//   const staffColumns = [
//     { title: "Name", dataIndex: "full_name" },
//     { title: "Username", dataIndex: "username" },
//     { title: "Code", dataIndex: "employee_code" },
//     { title: "Designation", dataIndex: "designation" },
//     {
//       title: "Status",
//       dataIndex: "active",
//       render: (v: boolean) => (v ? "Active" : "Inactive"),
//     },
//   ];

//   // ================= LEAVE TABLE =================
//   const leaveColumns = [
//     { title: "Employee", dataIndex: "employee_name" },
//     { title: "Type", dataIndex: "type" },
//     { title: "Reason", dataIndex: "reason" },
//     { title: "Status", dataIndex: "status" },
//   ];

//   return (
//     <div style={{ padding: 20 }}>
//       {/* STATS */}
//       <Row gutter={16}>
//         <Col span={6}>
//           <Card title="Total Staff">{staff.length}</Card>
//         </Col>
//         <Col span={6}>
//           <Card title="Pending Leaves">{leaves.length}</Card>
//         </Col>
//         <Col span={6}>
//           <Card title="Active Staff">
//             {staff.filter((s) => s.active).length}
//           </Card>
//         </Col>
//       </Row>

//       {/* STAFF SECTION */}
//       <div style={{ marginTop: 30 }}>
//         <h2>Staff Management</h2>

//         <Button type="primary" onClick={() => setOpen(true)}>
//           ➕ Add Staff
//         </Button>

//         <Table
//           style={{ marginTop: 10 }}
//           dataSource={staff}
//           columns={staffColumns}
//           rowKey="id"
//         />
//       </div>

//       {/* LEAVE SECTION */}
//       <div style={{ marginTop: 40 }}>
//         <h2>Pending Leave Requests</h2>

//         <Table
//           dataSource={leaves}
//           columns={leaveColumns}
//           rowKey="id"
//         />
//       </div>

//       {/* CREATE STAFF MODAL */}
//       <Modal
//         title="Create Staff"
//         open={open}
//         onCancel={() => setOpen(false)}
//         onOk={() => form.submit()}
//       >
//         <Form form={form} layout="vertical" onFinish={createStaff}>
//           <Form.Item
//             name="full_name"
//             label="Full Name"
//             rules={[{ required: true }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="username"
//             label="Username"
//             rules={[{ required: true }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="password"
//             label="Password"
//             rules={[{ required: true }]}
//           >
//             <Input.Password />
//           </Form.Item>

//           <Form.Item
//             name="employee_code"
//             label="Employee Code"
//             rules={[{ required: true }]}
//           >
//             <Input />
//           </Form.Item>

//           <Form.Item
//             name="designation"
//             label="Designation"
//           >
//             <Input />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }













"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Row, Col, List, Tag } from "antd";
import dayjs from "dayjs";

export default function HRDashboard() {
    const [staff, setStaff] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);

    // ================= FETCH STAFF =================
    const fetchStaff = async () => {
        const { data } = await supabase
            .schema("leave_management")
            .from("employees")
            .select("*")
            .eq("role", "staff");

        setStaff(data || []);
    };

    // ================= FETCH LEAVES =================
    const fetchLeaves = async () => {
        const { data } = await supabase
            .schema("leave_management")
            .from("leaves")
            .select("*")


        setLeaves(data || []);
    };

    useEffect(() => {
        fetchStaff();
        fetchLeaves();
    }, []);

    // ================= DATE FILTERS =================
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    const todayLeaves = leaves.filter(
        (l) => l.leave_date === today
    );

    const tomorrowLeaves = leaves.filter(
        (l) => l.leave_date === tomorrow
    );

    // const pendingLeavesCount = leaves.filter(
    //     (l) => l.status === "pending"
    // ).length;
    const pendingLeavesCount = Array.from(
        new Set(
            leaves
                .filter((l) => l.status === "pending")
                .map((l) => `${l.employee_id}-${l.leave_date}`)
        )
    ).length;

    // Collapse multiple half-day rows into one per employee per day
    const getUniqueLeaves = (leavesArray: any[]) => {
        const map = new Map();
        leavesArray.forEach((item) => {
            const key = `${item.employee_id}-${item.leave_date}`;
            if (!map.has(key)) {
                map.set(key, { ...item, displayHalf: item.half, hasPending: item.status === 'pending' });
            } else {
                const existing = map.get(key);
                if (existing.half !== item.half) {
                    existing.displayHalf = "Full Day";
                }
                // If any part of the day is pending, mark the whole entry as pending
                if (item.status === 'pending') {
                    existing.hasPending = true;
                }
            }
        });
        return Array.from(map.values());
    };

    const uniqueToday = getUniqueLeaves(todayLeaves);
    const uniqueTomorrow = getUniqueLeaves(tomorrowLeaves);


    return (
        <div style={{ padding: 20 }}>
            {/* ================= KPI CARDS ================= */}
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <h3>Active Staff</h3>
                        <h2>{staff.filter((s) => s.active).length}</h2>
                    </Card>
                </Col>

                <Col span={6}>
                    <Card>
                        <h3>Pending Leaves</h3>
                        <h2>{pendingLeavesCount}</h2>
                    </Card>
                </Col>

                <Col span={6}>
                    <Card>
                        <h3>Today Leaves</h3>
                        <h2>{todayLeaves.length}</h2>
                    </Card>
                </Col>

                <Col span={6}>
                    <Card>
                        <h3>Tomorrow Leaves</h3>
                        <h2>{tomorrowLeaves.length}</h2>
                    </Card>
                </Col>
            </Row>

            {/* ================= TODAY LEAVES ================= */}
            <Row gutter={16} style={{ marginTop: 20 }}>
                <Col span={12}>
                    <Card title="📅 Today Leave Staff">
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {todayLeaves.length === 0 ? (
                                <div style={{ color: "#888" }}>No leaves today</div>
                            ) : (
                                todayLeaves.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: 12,
                                            border: "1px solid #eee",
                                            borderRadius: 10,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        {/* LEFT SIDE */}
                                        <div>
                                            <b>{item.employee_name}</b>

                                            <div style={{ fontSize: 12, color: "#666" }}>
                                                {item.type} • {item.reason}
                                            </div>

                                            {/* NEW INFO */}
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                <span style={{ color: "#1677ff" }}>
                                                    Dept: {item.department || "N/A"}
                                                </span>
                                                {" | "}
                                                <span style={{ color: "#fa541c" }}>
                                                    Handover: {item.handover_name || "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* RIGHT TAG */}
                                        <div style={{ fontSize: 12, color: "#fa8c16", fontWeight: 600 }}>
                                            TODAY
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="📅 Tomorrow Leave Staff">
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {uniqueTomorrow.length === 0 ? (
                                <div style={{ color: "#888" }}>No leaves tomorrow</div>
                            ) : (
                                uniqueTomorrow.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: 12,
                                            border: "1px solid #eee",
                                            borderRadius: 10,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <b>{item.employee_name}</b>
                                            <div style={{ fontSize: 12, color: "#666" }}>
                                                {item.displayHalf} • {item.reason}
                                            </div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                <span style={{ color: "#1677ff" }}>Dept: {item.department || "N/A"}</span>
                                                {" | "}
                                                <span style={{ color: "#13c2c2" }}>Handover: {item.handover_name || "N/A"}</span>
                                            </div>
                                        </div>

                                        {/* RIGHT TAG */}
                                        <div style={{
                                            fontSize: 11,
                                            color: item.hasPending ? "#ff4d4f" : "#1677ff", // Red if pending, Blue if approved
                                            fontWeight: 700
                                        }}>
                                            {item.hasPending ? "WITHOUT APPROVAL" : "TOMORROW"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}



