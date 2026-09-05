// // "use client";

// // import { useEffect, useState } from "react";
// // import { supabase } from "@/lib/supabase";
// // import { Card, Row, Col, Button, Modal, Form, Input, Select, Table, Tag, message } from "antd";
// // import dayjs from "dayjs";

// // export default function StaffDashboard() {
// //     const [leaves, setLeaves] = useState<any[]>([]);
// //     const [team, setTeam] = useState<any[]>([]);
// //     const [open, setOpen] = useState(false);
// //     const [form] = Form.useForm();
// //     const [departments, setDepartments] = useState<any[]>([]);

// //     // ================= FETCH LEAVES =================
// //     const fetchLeaves = async () => {
// //         const { data } = await supabase
// //             .schema("leave_management")
// //             .from("leaves")
// //             .select("*");

// //         setLeaves(data || []);
// //     };

// //     useEffect(() => {
// //         fetchLeaves();
// //     }, []);


// //     // ================= FETCH DEPARTMENTS =================

// //     const fetchDepartments = async () => {
// //         const { data } = await supabase
// //             .schema("leave_management")
// //             .from("departments")
// //             .select("*");

// //         setDepartments(data || []);
// //     };


// //     useEffect(() => {
// //         fetchLeaves();
// //         fetchDepartments();
// //     }, []);



// //     // ================= APPLY LEAVE =================
// //     const submitLeave = async (values: any) => {
// //         const { error } = await supabase
// //             .schema("leave_management")
// //             .from("leaves")
// //             .insert([
// //                 {
// //                     employee_name: values.employee_name,
// //                     department: values.department,
// //                     type: values.type,
// //                     reason: values.reason,
// //                     leave_date: values.leave_date,
// //                     handover_person: values.handover_person,
// //                     status: "pending",
// //                 },
// //             ]);

// //         if (error) {
// //             message.error(error.message);
// //             return;
// //         }

// //         message.success("Leave applied");
// //         setOpen(false);
// //         form.resetFields();
// //         fetchLeaves();
// //     };

// //     const pending = leaves.filter((l) => l.status === "pending");
// //     const approved = leaves.filter((l) => l.status === "approved");

// //     const columns = [
// //         { title: "Type", dataIndex: "type" },
// //         { title: "Date", dataIndex: "leave_date" },
// //         { title: "Reason", dataIndex: "reason" },
// //         {
// //             title: "Status",
// //             dataIndex: "status",
// //             render: (v: string) => {
// //                 let color = v === "approved" ? "green" : v === "pending" ? "orange" : "red";
// //                 return <Tag color={color}>{v}</Tag>;
// //             },
// //         },
// //     ];

// //     return (
// //         <div>
// //             {/* ================= KPI CARDS ================= */}
// //             <Row gutter={16}>
// //                 <Col span={8}>
// //                     <Card title="Total Leaves">{leaves.length}</Card>
// //                 </Col>

// //                 <Col span={8}>
// //                     <Card title="Pending">{pending.length}</Card>
// //                 </Col>

// //                 <Col span={8}>
// //                     <Card title="Approved">{approved.length}</Card>
// //                 </Col>
// //             </Row>

// //             {/* ================= ACTION ================= */}
// //             <Card style={{ marginTop: 20 }}>
// //                 <Button type="primary" onClick={() => setOpen(true)}>
// //                     Apply Leave
// //                 </Button>
// //             </Card>

// //             {/* ================= TABLE ================= */}
// //             <Card style={{ marginTop: 20 }} title="My Leaves">
// //                 <Table dataSource={leaves} columns={columns} rowKey="id" />
// //             </Card>

// //             {/* ================= MODAL FORM ================= */}
// //             <Modal
// //                 title="Apply Leave"
// //                 open={open}
// //                 onCancel={() => setOpen(false)}
// //                 onOk={() => form.submit()}
// //             >
// //                 <Form form={form} layout="vertical" onFinish={submitLeave}>
// //                     <Form.Item name="employee_name" label="Name" rules={[{ required: true }]}>
// //                         <Input />
// //                     </Form.Item>

// //                     <Form.Item name="department" label="Department">
// //                         <Select
// //                             options={departments.map((d) => ({
// //                                 value: d.department_name,
// //                                 label: d.department_name,
// //                             }))}
// //                         />
// //                     </Form.Item>

// //                     <Form.Item name="type" label="Leave Type">
// //                         <Select
// //                             options={[
// //                                 { value: "Sick", label: "Sick" },
// //                                 { value: "Casual", label: "Casual" },
// //                             ]}
// //                         />
// //                     </Form.Item>

// //                     <Form.Item name="reason" label="Reason">
// //                         <Input.TextArea />
// //                     </Form.Item>

// //                     <Form.Item name="leave_date" label="Date">
// //                         <Input type="date" />
// //                     </Form.Item>

// //                     <Form.Item name="handover_person" label="Handover To">
// //                         <Input placeholder="Enter name" />
// //                     </Form.Item>
// //                 </Form>
// //             </Modal>
// //         </div>
// //     );
// // }



















// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Card, Row, Col, Button, Modal, Form, Input, Select, Table, Tag, message } from "antd";

// export default function StaffDashboard() {
//     const [leaves, setLeaves] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [form] = Form.useForm();

//     const [user, setUser] = useState<any>(null);

//     // ================= GET LOGGED USER =================
//     useEffect(() => {
//         const u = JSON.parse(localStorage.getItem("user") || "{}");
//         setUser(u);
//     }, []);

//     // ================= FETCH ONLY MY LEAVES =================
//     const fetchLeaves = async (empId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("*")
//             .eq("employee_id", empId)   // 🔥 KEY FIX
//             .order("created_at", { ascending: false });

//         if (!error) {
//             setLeaves(data || []);
//         }
//     };

//     useEffect(() => {
//         if (user?.id) {
//             fetchLeaves(user.id);
//         }
//     }, [user]);

//     // ================= APPLY LEAVE =================
//     const submitLeave = async (values: any) => {
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .insert([
//                 {
//                     employee_id: user.id,   // 🔥 IMPORTANT FIX
//                     type: values.type,
//                     reason: values.reason,
//                     leave_date: values.leave_date,
//                     handover_person: values.handover_person,
//                     status: "pending",
//                 },
//             ]);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Leave applied");

//         setOpen(false);
//         form.resetFields();

//         fetchLeaves(user.id); // 🔥 refresh only my data
//     };

//     const pending = leaves.filter((l) => l.status === "pending");
//     const approved = leaves.filter((l) => l.status === "approved");

//     const columns = [
//         { title: "Type", dataIndex: "type" },
//         { title: "Date", dataIndex: "leave_date" },
//         { title: "Reason", dataIndex: "reason" },
//         {
//             title: "Status",
//             dataIndex: "status",
//             render: (v: string) => {
//                 let color =
//                     v === "approved" ? "green" : v === "pending" ? "orange" : "red";
//                 return <Tag color={color}>{v}</Tag>;
//             },
//         },
//     ];

//     return (

//         <div>
//             <div style={{ marginBottom: 20 }}>
//                 <h2 style={{ margin: 0 }}>
//                     👋 Hi, {user?.full_name || "Staff"}
//                 </h2>
//                 <p style={{ color: "gray" }}>
//                     Welcome to your dashboard
//                 </p>
//             </div>
//             {/* ================= KPIs ================= */}
//             <Row gutter={16}>
//                 <Col span={8}>
//                     <Card title="Total Leaves">{leaves.length}</Card>
//                 </Col>

//                 <Col span={8}>
//                     <Card title="Pending">{pending.length}</Card>
//                 </Col>

//                 <Col span={8}>
//                     <Card title="Approved">{approved.length}</Card>
//                 </Col>
//             </Row>

//             {/* ================= ACTION ================= */}
//             <Card style={{ marginTop: 20 }}>
//                 <Button type="primary" onClick={() => setOpen(true)}>
//                     ➕ Apply Leave
//                 </Button>
//             </Card>

//             {/* ================= TABLE ================= */}
//             <Card style={{ marginTop: 20 }} title="My Leaves">
//                 <Table dataSource={leaves} columns={columns} rowKey="id" />
//             </Card>

//             {/* ================= MODAL ================= */}
//             <Modal
//                 title="Apply Leave"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//             >
//                 <Form form={form} layout="vertical" onFinish={submitLeave}>
//                     <Form.Item name="type" label="Leave Type" rules={[{ required: true }]}>
//                         <Select
//                             options={[
//                                 { value: "Sick", label: "Sick" },
//                                 { value: "Casual", label: "Casual" },
//                             ]}
//                         />
//                     </Form.Item>

//                     <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
//                         <Input.TextArea />
//                     </Form.Item>

//                     <Form.Item name="leave_date" label="Date" rules={[{ required: true }]}>
//                         <Input type="date" style={{ width: "100%" }} />
//                     </Form.Item>

//                     <Form.Item name="handover_person" label="Handover To">
//                         <Input placeholder="Enter name" />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }




















// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Table, Tag } from "antd";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const months = [
//   "APR", "MAY", "JUN", "JUL",
//   "AUG", "SEP", "OCT", "NOV",
//   "DEC", "JAN", "FEB", "MAR",
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [leaveSummary, setLeaveSummary] = useState<any[]>([]);

//   // ================= LOAD USER =================
//   useEffect(() => {
//     const u = JSON.parse(
//       localStorage.getItem("user") || "{}"
//     );

//     setUser(u);
//   }, []);

//   // ================= FETCH EMPLOYEE =================
//   const fetchEmployee = async (id: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();

//     setEmployee(data);
//   };

//   // ================= FETCH STAFF LEAVES =================
//   const fetchLeaves = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("status", "approved");

//     const summary = months.map((month) => {
//       const monthLeaves =
//         data?.filter((leave) => {
//           const leaveMonth =
//             dayjs(leave.leave_date)
//               .format("MMM")
//               .toUpperCase();

//           return leaveMonth === month;
//         }) || [];

//       return {
//         month,
//         casual:
//           monthLeaves.filter(
//             (l) => l.type === "Casual"
//           ).length,

//         sick:
//           monthLeaves.filter(
//             (l) => l.type === "Sick"
//           ).length,

//         earned:
//           monthLeaves.filter(
//             (l) => l.type === "Earned"
//           ).length,

//         lop:
//           monthLeaves.filter(
//             (l) => l.type === "LOP"
//           ).length,
//       };
//     });

//     setLeaveSummary(summary);
//   };

//   useEffect(() => {
//     if (user?.id) {
//       fetchEmployee(user.id);
//       fetchLeaves(user.id);
//     }
//   }, [user]);

//   const columns = [
//     {
//       title: "Month",
//       dataIndex: "month",
//     },
//     {
//       title: "Casual Leave",
//       dataIndex: "casual",
//     },
//     {
//       title: "Sick Leave",
//       dataIndex: "sick",
//     },
//     {
//       title: "Earned Leave",
//       dataIndex: "earned",
//     },
//     {
//       title: "LOP",
//       dataIndex: "lop",
//     },
//   ];

//   return (
//     <div style={{ padding: 20 }}>
//       {/* HEADER */}
//       <Card
//         style={{
//           marginBottom: 20,
//           borderRadius: 16,
//         }}
//       >
//         <h2>
//           👋 Hi, {employee?.full_name}
//         </h2>

//         <Row gutter={16}>
//           <Col span={6}>
//             <p>
//               <b>Employee ID:</b><br />
//               {employee?.employee_code}
//             </p>
//           </Col>

//           <Col span={6}>
//             <p>
//               <b>Department:</b><br />
//               {employee?.department}
//             </p>
//           </Col>

//           <Col span={6}>
//             <p>
//               <b>Joining Date:</b><br />
//               {employee?.joining_date}
//             </p>
//           </Col>

//           <Col span={6}>
//             <p>
//               <b>Status:</b><br />
//               <Tag color="green">
//                 Active
//               </Tag>
//             </p>
//           </Col>
//         </Row>
//       </Card>

//       {/* PDF STYLE LEAVE RECORD */}
//       <Card
//         title="Employee Leave Record"
//         style={{
//           borderRadius: 16,
//         }}
//       >
//         <Table
//           columns={columns}
//           dataSource={leaveSummary}
//           pagination={false}
//           rowKey="month"
//         />
//       </Card>
//     </div>
//   );
// }















// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Tag, Spin, Tooltip } from "antd";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 },
//   { name: "MAY", index: 4 },
//   { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 },
//   { name: "AUG", index: 7 },
//   { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 },
//   { name: "NOV", index: 10 },
//   { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 },
//   { name: "FEB", index: 1 },
//   { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const u = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(u);
//   }, []);

//   useEffect(() => {
//     if (user?.id) {
//       Promise.all([
//         fetchEmployee(user.id),
//         fetchLeaves(user.id),
//         fetchElCredits(user.id)
//       ]).finally(() => setLoading(false));
//     }
//   }, [user]);

//   const fetchEmployee = async (id: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     setEmployee(data);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("status", "approved");
//     setLeaves(data || []);
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);
//     setElCredits(data || []);
//   };

//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;
//     const joinDate = dayjs(employee.joining_date);
//     const joinYear = joinDate.year();
//     const joinMonth = joinDate.month();

//     let targetYear = joinYear;
//     if (monthIndex < 3 && joinMonth >= 3) targetYear = joinYear + 1;
//     if (monthIndex >= 3 && joinMonth < 3) targetYear = joinYear - 1;

//     const targetDate = dayjs().month(monthIndex).year(targetYear).startOf("month");
//     return joinDate.isAfter(targetDate, "month");
//   };

//   const getLeaveDates = (monthName: string, type: "Casual" | "Sick", half: "1H" | "2H") => {
//     return leaves
//       .filter((l) => {
//         const d = dayjs(l.leave_date);
//         const mName = d.format("MMM").toUpperCase();
//         return mName === monthName && l.type === type && l.half === half;
//       })
//       .map((l) => dayjs(l.leave_date).format("DD-MM-YYYY"))
//       .join(", ");
//   };

//   const getLopCount = (monthName: string, monthIndex: number) => {
//     if (isMonthStruck(monthIndex)) return "NA";
//     return leaves.filter((l) => {
//       const mName = dayjs(l.leave_date).format("MMM").toUpperCase();
//       return mName === monthName && l.type === "LOP";
//     }).length;
//   };

//   const getMonthlyElData = (monthName: string) => {
//     const taken = leaves.filter(l => dayjs(l.leave_date).format("MMM").toUpperCase() === monthName && l.type === "Earned").length;
//     const available = elCredits.filter(c => dayjs(c.credit_date).format("MMM").toUpperCase() === monthName).reduce((acc, curr) => acc + curr.count, 0);
//     return { taken, available };
//   };

//   const totalClTaken = leaves.filter(l => l.type === "Casual").length;
//   const totalSlTaken = leaves.filter(l => l.type === "Sick").length;
//   const totalElTaken = leaves.filter(l => l.type === "Earned").length;
//   const totalAvailableEl = elCredits.reduce((acc, curr) => acc + curr.count, 0);
//   const remainingElForEncash = Math.max(0, totalAvailableEl - totalElTaken);
//   const isEligibleForEncashment = totalClTaken === 0 && totalSlTaken === 0 && totalElTaken === 0;

//   if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       <Card style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }} title="Employee Information">
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name || "Hijas KV"}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department || "Purchase"}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code || "EXPU1042026"}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : "01-06-2026"}</Col>
//         </Row>
//       </Card>

//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="EMPLOYEE LEAVE RECORD">
//         {/* Casual Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none", textDecoration: isMonthStruck(m.index) ? "line-through" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, wordBreak: "break-all" }}>{getLeaveDates(m.name, "Casual", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, wordBreak: "break-all" }}>{getLeaveDates(m.name, "Casual", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Sick Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none", textDecoration: isMonthStruck(m.index) ? "line-through" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20 }}>{getLeaveDates(m.name, "Sick", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20 }}>{getLeaveDates(m.name, "Sick", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Earned Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Earned Leave OVERVIEW</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const elData = getMonthlyElData(m.name);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                   <div style={{ display: "flex", flexDirection: "column", fontSize: "10px", padding: 4 }}>
//                     <div style={{ borderBottom: "1px solid #eee" }}><b>T:</b> {isMonthStruck(m.index) ? "0" : elData.taken}</div>
//                     <div><b>A:</b> {isMonthStruck(m.index) ? "0" : elData.available}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Loss of Pay */}
//         <div style={{ marginBottom: 10 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const lopCount = getLopCount(m.name, m.index);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", padding: 6, background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                   <div style={{ fontWeight: "bold", color: typeof lopCount === "number" && lopCount > 0 ? "red" : "inherit" }}>
//                     {lopCount} {lopCount !== "NA" ? "DAYS" : ""}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </Card>

//       {/* Side-by-Side Tables */}
//       <Row gutter={16}>
//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="EL DETAILS (Available)">
//             <div style={{ maxHeight: 250, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>MONTH</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {elCredits.map((credit, idx) => (
//                     <tr key={credit.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(credit.credit_date).format("MMM").toUpperCase()}</td>
//                       <td>{dayjs(credit.credit_date).format("DD/MM/YYYY")}</td>
//                       <td>{credit.count}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>

//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="EL DETAILS (Taken)">
//             <div style={{ maxHeight: 250, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>MONTH</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaves.filter(l => l.type === "Earned").map((leave, idx) => (
//                     <tr key={leave.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(leave.leave_date).format("MMM").toUpperCase()}</td>
//                       <td>{dayjs(leave.leave_date).format("DD/MM/YYYY")}</td>
//                       <td>1</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>

//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="LOP DETAILS">
//             <div style={{ maxHeight: 250, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaves.filter(l => l.type === "LOP").map((leave, idx) => (
//                     <tr key={leave.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(leave.leave_date).format("DD/MM/YYYY")}</td>
//                       <td>1</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       <Card style={{ marginTop: 20, borderRadius: 8, border: "1px solid #000", background: "#fffdf0" }} title="Pending Leave Details (PLD) & Encashment">
//         <Row gutter={16} align="middle">
//           <Col span={16}>
//             <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
//               * <b>PLD Rules:</b> PLD = Unclaimed (CL + SL + EL) evaluated at end of Financial Year.<br />
//               * LOP is strictly applied after complete exhaustion of all monthly tracking balances.
//             </p>
//           </Col>
//           <Col span={8} style={{ textAlign: "right" }}>
//             <Tooltip title="Eligible for encashment only if zero leaves (CL, SL, EL) were claimed all year.">
//               <div>
//                 <span style={{ marginRight: 10, fontWeight: "bold" }}>Encashment Status:</span>
//                 {isEligibleForEncashment ? (
//                   <Tag color="gold" style={{ fontSize: "14px", padding: "4px 8px" }}>
//                     ELIGIBLE ({remainingElForEncash} EL Days)
//                   </Tag>
//                 ) : (
//                   <Tag color="default" style={{ fontSize: "12px" }}>NOT ELIGIBLE</Tag>
//                 )}
//               </div>
//             </Tooltip>
//           </Col>
//         </Row>
//       </Card>

//     </div>
//   );
// }














// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Tag, Spin, Tooltip, Button, Modal, DatePicker, Radio, Form, Input, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 },
//   { name: "MAY", index: 4 },
//   { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 },
//   { name: "AUG", index: 7 },
//   { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 },
//   { name: "NOV", index: 10 },
//   { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 },
//   { name: "FEB", index: 1 },
//   { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Popup Window States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     const u = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(u);
//   }, []);

//   const refreshData = () => {
//     if (user?.id) {
//       setLoading(true);
//       Promise.all([
//         fetchEmployee(user.id),
//         fetchLeaves(user.id),
//         fetchElCredits(user.id)
//       ]).finally(() => setLoading(false));
//     }
//   };

//   useEffect(() => {
//     refreshData();
//   }, [user]);

//   const fetchEmployee = async (id: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     setEmployee(data);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("status", "approved");
//     setLeaves(data || []);
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);
//     setElCredits(data || []);
//   };

//   // Popup Window Submission Logic with Date Range Generation
//   const handleApplyLeave = async (values: any) => {
//     if (!values.dateRange || values.dateRange.length !== 2) {
//       message.error("Please select a valid date range.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const startDate = values.dateRange[0];
//       const endDate = values.dateRange[1];
//       const leaveRows: any[] = [];

//       // Loop through all days between the start date and end date comprehensively
//       let currentDate = startDate;
//       while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//         const formattedDate = currentDate.format("YYYY-MM-DD");

//         if (values.half === "Full") {
//           // Full day breaks into both halves to match matrix structure
//           leaveRows.push(
//             {
//               employee_id: employee.id,
//               leave_date: formattedDate,
//               half: "1H",
//               type: "Pending_Allocation",
//               status: "pending",
//               reason: values.reason
//             },
//             {
//               employee_id: employee.id,
//               leave_date: formattedDate,
//               half: "2H",
//               type: "Pending_Allocation",
//               status: "pending",
//               reason: values.reason
//             }
//           );
//         } else {
//           // Single half choice (1H or 2H) applied day-by-day across the range
//           leaveRows.push({
//             employee_id: employee.id,
//             leave_date: formattedDate,
//             half: values.half,
//             type: "Pending_Allocation",
//             status: "pending",
//             reason: values.reason
//           });
//         }
//         currentDate = currentDate.add(1, "day");
//       }

//       const { error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .insert(leaveRows);

//       if (error) throw error;

//       message.success(`Leave request for ${leaveRows.filter(r => r.half === "1H").length} day(s) submitted successfully!`);
//       setIsModalOpen(false);
//       form.resetFields();
//       refreshData();
//     } catch (err: any) {
//       message.error(err.message || "Failed to submit leave request.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;
//     const joinDate = dayjs(employee.joining_date);
//     const joinYear = joinDate.year();
//     const joinMonth = joinDate.month();

//     let targetYear = joinYear;
//     if (monthIndex < 3 && joinMonth >= 3) targetYear = joinYear + 1;
//     if (monthIndex >= 3 && joinMonth < 3) targetYear = joinYear - 1;

//     const targetDate = dayjs().month(monthIndex).year(targetYear).startOf("month");
//     return joinDate.isAfter(targetDate, "month");
//   };

//   const getLeaveDates = (monthName: string, type: "Casual" | "Sick", half: "1H" | "2H") => {
//     return leaves
//       .filter((l) => {
//         const d = dayjs(l.leave_date);
//         const mName = d.format("MMM").toUpperCase();
//         return mName === monthName && l.type === type && l.half === half;
//       })
//       .map((l) => dayjs(l.leave_date).format("DD-MM"))
//       .join(", ");
//   };

//   const getLopCount = (monthName: string, monthIndex: number) => {
//     if (isMonthStruck(monthIndex)) return "NA";
//     return leaves.filter((l) => {
//       const mName = dayjs(l.leave_date).format("MMM").toUpperCase();
//       return mName === monthName && l.type === "LOP";
//     }).length;
//   };

//   const getMonthlyElData = (monthName: string) => {
//     const taken = leaves.filter(l => dayjs(l.leave_date).format("MMM").toUpperCase() === monthName && l.type === "Earned").length;
//     const available = elCredits.filter(c => dayjs(c.credit_date).format("MMM").toUpperCase() === monthName).reduce((acc, curr) => acc + curr.count, 0);
//     return { taken, available };
//   };

//   const totalClTaken = leaves.filter(l => l.type === "Casual").length;
//   const totalSlTaken = leaves.filter(l => l.type === "Sick").length;
//   const totalElTaken = leaves.filter(l => l.type === "Earned").length;
//   const totalAvailableEl = elCredits.reduce((acc, curr) => acc + curr.count, 0);
//   const remainingElForEncash = Math.max(0, totalAvailableEl - totalElTaken);
//   const isEligibleForEncashment = totalClTaken === 0 && totalSlTaken === 0 && totalElTaken === 0;

//   if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       {/* EMPLOYEE INFORMATION HEADER */}
//       <Card 
//         style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }} 
//         title="Employee Information"
//         extra={
//           <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
//             Apply Leave
//           </Button>
//         }
//       >[cite: 1]
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name || "Hijas KV"}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department || "Purchase"}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code || "EXPU1042026"}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : "01-06-2026"}</Col>
//         </Row>
//       </Card>

//       {/* MATRIX LEAVE RECORD */}
//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="EMPLOYEE LEAVE RECORD (HR FINAL ALLOCATION)">
//         {/* Casual Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none", textDecoration: isMonthStruck(m.index) ? "line-through" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{getLeaveDates(m.name, "Casual", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{getLeaveDates(m.name, "Casual", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Sick Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none", textDecoration: isMonthStruck(m.index) ? "line-through" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{getLeaveDates(m.name, "Sick", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{getLeaveDates(m.name, "Sick", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Earned Leave Summary */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Earned Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const elData = getMonthlyElData(m.name);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                   <div style={{ display: "flex", flexDirection: "column", fontSize: "11px", padding: 4 }}>
//                     <div style={{ borderBottom: "1px solid #eee", color: "#1677ff" }}><b>Days Taken:</b> {isMonthStruck(m.index) ? "0" : elData.taken}</div>
//                     <div style={{ color: "#52c41a" }}><b>Available:</b> {isMonthStruck(m.index) ? "0" : elData.available}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Loss of Pay Counter */}
//         <div style={{ marginBottom: 10 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const lopCount = getLopCount(m.name, m.index);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", padding: 6, background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                   <div style={{ fontWeight: "bold", color: typeof lopCount === "number" && lopCount > 0 ? "red" : "inherit" }}>
//                     {lopCount} {lopCount !== "NA" ? "DAYS" : ""}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </Card>

//       {/* LOWER DATA TABLES */}
//       <Row gutter={16}>
//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="EL DETAILS (Available)">
//             <div style={{ maxHeight: 220, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>MONTH</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {elCredits.map((credit, idx) => (
//                     <tr key={credit.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(credit.credit_date).format("MMM").toUpperCase()}</td>
//                       <td>{dayjs(credit.credit_date).format("DD/MM/YYYY")}</td>
//                       <td>{credit.count}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>

//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="EL DETAILS (Taken)">
//             <div style={{ maxHeight: 220, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>MONTH</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaves.filter(l => l.type === "Earned").map((leave, idx) => (
//                     <tr key={leave.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(leave.leave_date).format("MMM").toUpperCase()}</td>
//                       <td>{dayjs(leave.leave_date).format("DD/MM/YYYY")}</td>
//                       <td>1</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>

//         <Col span={8}>
//           <Card size="small" style={{ border: "1px solid #000", borderRadius: 8 }} title="LOP DETAILS">
//             <div style={{ maxHeight: 220, overflowY: "auto", fontSize: "12px" }}>
//               <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr style={{ borderBottom: "1px solid #000" }}>
//                     <th>SL No</th><th>DATE</th><th>COUNT</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaves.filter(l => l.type === "LOP").map((leave, idx) => (
//                     <tr key={leave.id} style={{ borderBottom: "1px solid #eee" }}>
//                       <td>{idx + 1}</td>
//                       <td>{dayjs(leave.leave_date).format("DD/MM/YYYY")}</td>
//                       <td>1</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       {/* FOOTER SUMMARY BOX */}
//       <Card style={{ marginTop: 20, borderRadius: 8, border: "1px solid #000", background: "#fffdf0" }} title="Pending Leave Details (PLD) & Encashment">
//         <Row gutter={16} align="middle">
//           <Col span={16}>
//             <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
//               * <b>PLD Rules:</b> PLD = Unclaimed (CL + SL + EL) evaluated at end of Financial Year.<br />
//               * LOP is considered only after exhaustion of monthly balances.
//             </p>
//           </Col>
//           <Col span={8} style={{ textAlign: "right" }}>
//             <Tooltip title="Eligible for encashment only if zero leaves (CL, SL, EL) were claimed all year.">
//               <div>
//                 <span style={{ marginRight: 10, fontWeight: "bold" }}>Encashment Status:</span>
//                 {isEligibleForEncashment ? (
//                   <Tag color="gold" style={{ fontSize: "14px", padding: "4px 8px" }}>
//                     ELIGIBLE ({remainingElForEncash} EL Days)
//                   </Tag>
//                 ) : (
//                   <Tag color="default" style={{ fontSize: "12px" }}>NOT ELIGIBLE</Tag>
//                 )}
//               </div>
//             </Tooltip>
//           </Col>
//         </Row>
//       </Card>

//       {/* POPUP WINDOW: APPLY LEAVE MODAL (UPDATED FOR MULTI-DAY RANGE & REASON) */}
//       <Modal
//         title="Apply for Leave"
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         okText="Submit Application"
//         confirmLoading={submitting}
//         onOk={() => form.submit()}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleApplyLeave}
//           initialValues={{ half: "Full" }}
//           style={{ marginTop: 20 }}
//         >
//           {/* Range Selection Picker - perfect for 1 day or multiple consecutive days */}
//           <Form.Item
//             name="dateRange"
//             label="Select Leave Date Range"
//             rules={[{ required: true, message: "Please select your leave date range" }]}
//           >
//             <DatePicker.RangePicker 
//               style={{ width: "100%" }} 
//               format="DD-MM-YYYY" 
//             />
//           </Form.Item>

//           {/* Shift Selector */}
//           <Form.Item
//             name="half"
//             label="Leave Duration Type"
//             rules={[{ required: true }]}
//             help="Note: Half-day selection applies to all dates in the range above."
//           >
//             <Radio.Group optionType="button" buttonStyle="solid">
//               <Radio.Button value="Full">Full Day</Radio.Button>
//               <Radio.Button value="1H">First Half (1H)</Radio.Button>
//               <Radio.Button value="2H">Second Half (2H)</Radio.Button>
//             </Radio.Group>
//           </Form.Item>

//           {/* Mandatory Reason for Leave */}
//           <Form.Item
//             name="reason"
//             label="Reason for Leave"
//             rules={[{ required: true, message: "Please explain the reason for this leave request" }]}
//           >
//             <Input.TextArea 
//               rows={3} 
//               placeholder="e.g., Medical treatment / Personal family matter..." 
//               maxLength={250}
//               showCount
//             />
//           </Form.Item>
//         </Form>
//       </Modal>

//     </div>
//   );
// }















// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Tag, Spin, Tooltip, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [allEmployees, setAllEmployees] = useState<any[]>([]); // To populate handover dropdown
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Popup Window States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     const u = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(u);
//   }, []);

//   const refreshData = () => {
//     if (user?.id) {
//       setLoading(true);
//       Promise.all([
//         fetchEmployee(user.id),
//         fetchAllEmployees(),
//         fetchLeaves(user.id),
//         fetchElCredits(user.id)
//       ]).finally(() => setLoading(false));
//     }
//   };

//   useEffect(() => {
//     refreshData();
//   }, [user]);

//   const fetchEmployee = async (id: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     setEmployee(data);
//   };

//   // Fetches all employees globally to filter down for handovers
//   const fetchAllEmployees = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("id, full_name, department");
//     setAllEmployees(data || []);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("status", "approved");
//     setLeaves(data || []);
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);
//     setElCredits(data || []);
//   };

//   // Filter list to only show peers in the exact same department (excluding yourself)
//   const departmentPeers = allEmployees.filter(
//     (emp) => emp.department === employee?.department && emp.id !== employee?.id
//   );

//   // Popup Window Submission Logic
//   const handleApplyLeave = async (values: any) => {
//     if (!values.dateRange || values.dateRange.length !== 2) {
//       message.error("Please select a valid date range.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const startDate = values.dateRange[0];
//       const endDate = values.dateRange[1];
//       const leaveRows: any[] = [];

//       // Find selected handover person's text name string
//       const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//       const handoverName = handoverPerson ? handoverPerson.full_name : "";

//       let currentDate = startDate;
//       while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//         const formattedDate = currentDate.format("YYYY-MM-DD");

//         const baseRow = {
//           employee_id: employee.id,
//           employee_name: employee.full_name || "Hijas KV", // Saving Employee Name
//           department: employee.department || "Purchase",    // Saving Department Name
//           handover_name: handoverName,                       // Saving Handover Person Name
//           leave_date: formattedDate,
//           type: "Pending_Allocation",
//           status: "pending",
//           reason: values.reason
//         };

//         if (values.half === "Full") {
//           leaveRows.push(
//             { ...baseRow, half: "1H" },
//             { ...baseRow, half: "2H" }
//           );
//         } else {
//           leaveRows.push({ ...baseRow, half: values.half });
//         }
//         currentDate = currentDate.add(1, "day");
//       }

//       const { error } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .insert(leaveRows);

//       if (error) throw error;

//       message.success("Leave application submitted successfully with handover details!");
//       setIsModalOpen(false);
//       form.resetFields();
//       refreshData();
//     } catch (err: any) {
//       message.error(err.message || "Failed to submit leave request.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Structural calculations for rendering grids remain unchanged...
//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;
//     const joinDate = dayjs(employee.joining_date);
//     const joinYear = joinDate.year(); const joinMonth = joinDate.month();
//     let targetYear = joinYear;
//     if (monthIndex < 3 && joinMonth >= 3) targetYear = joinYear + 1;
//     if (monthIndex >= 3 && joinMonth < 3) targetYear = joinYear - 1;
//     const targetDate = dayjs().month(monthIndex).year(targetYear).startOf("month");
//     return joinDate.isAfter(targetDate, "month");
//   };

//   const getLeaveDates = (monthName: string, type: "Casual" | "Sick", half: "1H" | "2H") => {
//     return leaves
//       .filter((l) => {
//         const d = dayjs(l.leave_date);
//         const mName = d.format("MMM").toUpperCase();
//         return mName === monthName && l.type === type && l.half === half;
//       })
//       .map((l) => dayjs(l.leave_date).format("DD-MM"))
//       .join(", ");
//   };

//   const getLopCount = (monthName: string, monthIndex: number) => {
//     if (isMonthStruck(monthIndex)) return "NA";
//     return leaves.filter((l) => {
//       const mName = dayjs(l.leave_date).format("MMM").toUpperCase();
//       return mName === monthName && l.type === "LOP";
//     }).length;
//   };

//   const getMonthlyElData = (monthName: string) => {
//     const taken = leaves.filter(l => dayjs(l.leave_date).format("MMM").toUpperCase() === monthName && l.type === "Earned").length;
//     const available = elCredits.filter(c => dayjs(c.credit_date).format("MMM").toUpperCase() === monthName).reduce((acc, curr) => acc + curr.count, 0);
//     return { taken, available };
//   };

//   if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       {/* HEADER INFORMATION PANEL */}
//       <Card 
//         style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }} 
//         title="Employee Information"
//         extra={
//           <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
//             Apply Leave
//           </Button>
//         }
//       >[cite: 1]
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name || "Hijas KV"}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department || "Purchase"}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code || "EXPU1042026"}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : "01-06-2026"}</Col>
//         </Row>
//       </Card>

//       {/* RENDER MATRICES (Casual, Sick, EL, LOP) */}
//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="EMPLOYEE LEAVE RECORD (HR FINAL ALLOCATION)">
//         {/* Casual Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{getLeaveDates(m.name, "Casual", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{getLeaveDates(m.name, "Casual", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Sick Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{getLeaveDates(m.name, "Sick", "1H")}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{getLeaveDates(m.name, "Sick", "2H")}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Earned Leave */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Earned Leave</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const elData = getMonthlyElData(m.name);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                   <div style={{ display: "flex", flexDirection: "column", fontSize: "11px", padding: 4 }}>
//                     <div style={{ borderBottom: "1px solid #eee", color: "#1677ff" }}><b>T:</b> {isMonthStruck(m.index) ? "0" : elData.taken}</div>
//                     <div style={{ color: "#52c41a" }}><b>A:</b> {isMonthStruck(m.index) ? "0" : elData.available}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Loss of Pay */}
//         <div style={{ marginBottom: 10 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => {
//               const lopCount = getLopCount(m.name, m.index);
//               return (
//                 <div key={m.name} style={{ borderRight: "1px solid #000", padding: 6, background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                   <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                   <div style={{ fontWeight: "bold", color: typeof lopCount === "number" && lopCount > 0 ? "red" : "inherit" }}>
//                     {lopCount} {lopCount !== "NA" ? "DAYS" : ""}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </Card>

//       {/* POPUP LEAVE APPLICATION FORM */}
//       <Modal
//         title="Apply for Leave"
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         okText="Submit Application"
//         confirmLoading={submitting}
//         onOk={() => form.submit()}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleApplyLeave}
//           initialValues={{ half: "Full" }}
//           style={{ marginTop: 20 }}
//         >
//           {/* Range Selection Picker */}
//           <Form.Item
//             name="dateRange"
//             label="Select Leave Date Range"
//             rules={[{ required: true, message: "Please select your leave date range" }]}
//           >
//             <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//           </Form.Item>

//           {/* Shift Selector */}
//           <Form.Item name="half" label="Leave Duration Type" rules={[{ required: true }]}>
//             <Radio.Group optionType="button" buttonStyle="solid">
//               <Radio.Button value="Full">Full Day</Radio.Button>
//               <Radio.Button value="1H">First Half (1H)</Radio.Button>
//               <Radio.Button value="2H">Second Half (2H)</Radio.Button>
//             </Radio.Group>
//           </Form.Item>

//           {/* DYNAMIC HANDOVER DROPDOWN FILTERED BY DEPARTMENT */}
//           <Form.Item
//             name="handover_id"
//             label={`Handover Person (Filtered by: ${employee?.department || "Your Department"})`}
//             rules={[{ required: true, message: "Please select a team member to cover your duties" }]}
//           >
//             <Select 
//               showSearch
//               placeholder="Search colleague name..."
//               optionFilterProp="children"
//             >
//               {departmentPeers.map((emp) => (
//                 <Select.Option key={emp.id} value={emp.id}>
//                   {emp.full_name}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>

//           {/* Reason text area */}
//           <Form.Item
//             name="reason"
//             label="Reason for Leave"
//             rules={[{ required: true, message: "Please explain the reason for this leave request" }]}
//           >
//             <Input.TextArea rows={3} placeholder="Provide a brief explanation..." maxLength={250} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>

//     </div>
//   );
// }

















// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [allEmployees, setAllEmployees] = useState<any[]>([]);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();

//   // TypeScript-Safe Layout Allocation State Maps
//   const [uiMap, setUiMap] = useState<{
//     casual: Record<number, Record<string, string>>;
//     sick: Record<number, Record<string, string>>;
//     lop: Record<number, { count: number; dates: string[] }>;
//     earned: Record<number, { taken: number; available: number; dates: string[] }>;
//   }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//   useEffect(() => {
//     const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(savedUser);
//     if (savedUser?.id) {
//       refreshData(savedUser.id);
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const refreshData = async (userId?: string) => {
//     const targetId = userId || user?.id;
//     if (!targetId) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);

//     try {
//       const empData = await fetchEmployee(targetId);
//       await fetchAllEmployees();
//       const leavesData = await fetchLeaves(targetId);
//       const creditsData = await fetchElCredits(targetId);

//       if (empData) {
//         processLeaveAllocations(empData, leavesData, creditsData);
//       }
//     } catch (err) {
//       console.error("Dashboard calculation sequence encountered an error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployee = async (id: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     if (error) return null;
//     setEmployee(data);
//     return data;
//   };

//   const fetchAllEmployees = async () => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("id, full_name, department");
//     if (!error) setAllEmployees(data || []);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .order("leave_date", { ascending: true })
//       .order("half", { ascending: true }); // Crucial for chronological processing order

//     const validLeaves = data || [];
//     setLeaves(validLeaves);
//     return validLeaves;
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);

//     const validCredits = data || [];
//     setElCredits(validCredits);
//     return validCredits;
//   };

//   // CHRONOLOGICAL FIFO ACCUMULATION ENGINE
//   const processLeaveAllocations = (emp: any, allLeaves: any[], credits: any[]) => {
//     if (!emp?.joining_date) return;

//     const joinDate = dayjs(emp.joining_date);

//     // 1. Generate available dynamic balancing slots starting from join month
//     const casualPool: Array<{ monthIndex: number; half: string; usedDate: string | null }> = [];
//     const sickPool: Array<{ monthIndex: number; half: string; usedDate: string | null }> = [];

//     let loopDate = joinDate.startOf("month");
//     const endOfCalendarBoundary = dayjs().endOf("year");

//     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//       const mIdx = loopDate.month();

//       // Base Rule: 1 Casual Day (1H + 2H) and 1 Sick Day (1H + 2H) initialized per eligible month
//       casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//       sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });

//       loopDate = loopDate.add(1, "month");
//     }

//     // Prepare structural maps
//     const allocatedCasual: Record<number, Record<string, string>> = {};
//     const allocatedSick: Record<number, Record<string, string>> = {};
//     const allocatedLop: Record<number, { count: number; dates: string[] }> = {};
//     const allocatedEarned: Record<number, { taken: number; available: number; dates: string[] }> = {};

//     FINANCIAL_MONTHS.forEach(m => {
//       allocatedCasual[m.index] = { "1H": "", "2H": "" };
//       allocatedSick[m.index] = { "1H": "", "2H": "" };
//       allocatedLop[m.index] = { count: 0, dates: [] };

//       // Accumulate Holiday Bonuses given out by company
//       const monthlyCredits = credits
//         .filter(c => c.credit_date && dayjs(c.credit_date).month() === m.index)
//         .reduce((acc, curr) => acc + Number(curr.count || 0), 0);

//       allocatedEarned[m.index] = { taken: 0, available: monthlyCredits, dates: [] };
//     });

//     // 2. Consume entries forward through the time stream
//     allLeaves.forEach((leave) => {
//       // CRITICAL GUARD: Only process and allocate leaves into the cards if status is strictly "taken"
//       if (leave.status !== "taken") {
//         return; 
//       }

//       const leaveDay = dayjs(leave.leave_date);
//       const leaveMonthIdx = leaveDay.month();
//       const displayDayStr = leaveDay.format("DD/M");

//       // Check for oldest open Casual Leave assignment bucket
//       const freeCasualSlot = casualPool.find(slot => 
//         !slot.usedDate && 
//         slot.half === leave.half && 
//         !dayjs().month(slot.monthIndex).startOf("month").isAfter(leaveDay, "day")
//       );
//       if (freeCasualSlot) {
//         freeCasualSlot.usedDate = leave.leave_date;
//         allocatedCasual[freeCasualSlot.monthIndex][leave.half] = displayDayStr;
//         return;
//       }

//       // Check for oldest open Sick Leave assignment bucket
//       const freeSickSlot = sickPool.find(slot => 
//         !slot.usedDate && 
//         slot.half === leave.half && 
//         !dayjs().month(slot.monthIndex).startOf("month").isAfter(leaveDay, "day")
//       );
//       if (freeSickSlot) {
//         freeSickSlot.usedDate = leave.leave_date;
//         allocatedSick[freeSickSlot.monthIndex][leave.half] = displayDayStr;
//         return;
//       }

//       // Check for available Holiday Bonus credits (Earned Leaves)
//       const availableElMonth = FINANCIAL_MONTHS.find(m => allocatedEarned[m.index].available > allocatedEarned[m.index].taken);
//       if (availableElMonth) {
//         allocatedEarned[availableElMonth.index].taken += 0.5;
//         allocatedEarned[availableElMonth.index].dates.push(displayDayStr);
//         return;
//       }

//       // If all balances are fully depleted, default back to Loss of Pay (LOP)
//       allocatedLop[leaveMonthIdx].count += 0.5;
//       allocatedLop[leaveMonthIdx].dates.push(displayDayStr);
//     });

//     setUiMap({ casual: allocatedCasual, sick: allocatedSick, lop: allocatedLop, earned: allocatedEarned });
//   };

//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;
//     const joinDate = dayjs(employee.joining_date);
//     const targetDate = dayjs().month(monthIndex).year(joinDate.year()).startOf("month");
//     return joinDate.isAfter(targetDate, "month");
//   };

//   const handleApplyLeave = async (values: any) => {
//     if (!values.dateRange || values.dateRange.length !== 2) {
//       message.error("Please select a valid date range.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const startDate = values.dateRange[0];
//       const endDate = values.dateRange[1];
//       const leaveRows: any[] = [];
//       const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//       const handoverName = handoverPerson ? handoverPerson.full_name : "";

//       let currentDate = startDate;
//       while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//         const formattedDate = currentDate.format("YYYY-MM-DD");

//         const baseRow = {
//           employee_id: employee.id,
//           employee_name: employee.full_name, 
//           department: employee.department,    
//           handover_name: handoverName,                      
//           leave_date: formattedDate,
//           type: "Pending_Allocation", // FIXED: "type" is now initialized as Pending_Allocation
//           status: "pending", 
//           reason: values.reason
//         };

//         if (values.half === "Full") {
//           leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//         } else {
//           leaveRows.push({ ...baseRow, half: values.half });
//         }
//         currentDate = currentDate.add(1, "day");
//       }

//       const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//       if (error) throw error;

//       message.success("Leave request submitted for review successfully!");
//       setIsModalOpen(false);
//       form.resetFields();
//       refreshData();
//     } catch (err: any) {
//       message.error(err.message || "Failed to save leave records.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const departmentPeers = allEmployees.filter(
//     (emp) => emp.department === employee?.department && emp.id !== employee?.id
//   );

//   if (loading) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//         <Spin size="large" />
//         <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//       <Card 
//         style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }} 
//         title="Employee Information Dashboard"
//         extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
//       >
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//         </Row>
//       </Card>

//       {/* RENDER GRID INTERFACE */}
//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//         {/* 1. Casual Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.[ "1H" ]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.[ "2H" ]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 2. Sick Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.[ "1H" ]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.[ "2H" ]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Holiday Working Bonus (Earned Leave Ledger)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", flexDirection: "column", fontSize: "11px", padding: 4 }}>
//                   <div style={{ color: "#1677ff" }}><b>T (Used):</b> {uiMap.earned[m.index]?.taken}</div>
//                   <div style={{ color: "#52c41a" }}><b>A (Bonus):</b> {uiMap.earned[m.index]?.available}</div>
//                   <div style={{ fontSize: "9px", color: "#1677ff", minHeight: 15, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                     {uiMap.earned[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.earned[m.index].dates)).join(",")}` : ""}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 4. Loss Of Pay Residual Balancer */}
//         <div>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", padding: 6, background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                   {uiMap.lop[m.index]?.count} DAYS
//                 </div>
//                 <div style={{ fontSize: "9px", color: "red", minHeight: 15, fontWeight: "bold" }}>
//                   {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(",")}` : ""}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </Card>

//       {/* DIALOG APPLICATION WINDOWS */}
//       <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//         <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//           <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//             <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//           </Form.Item>
//           <Form.Item name="half" label="Day Span Allocation">
//             <Radio.Group optionType="button" buttonStyle="solid">
//               <Radio.Button value="Full">Full Day</Radio.Button>
//               <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//               <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//             </Radio.Group>
//           </Form.Item>
//           <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//             <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//               {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//             </Select>
//           </Form.Item>
//           <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//             <Input.TextArea rows={3} maxLength={250} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }































// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [allEmployees, setAllEmployees] = useState<any[]>([]);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();

//   // TypeScript-Safe Layout Allocation State Maps
//   const [uiMap, setUiMap] = useState<{
//     casual: Record<number, Record<string, string>>;
//     sick: Record<number, Record<string, string>>;
//     lop: Record<number, { count: number; dates: string[] }>;
//     earned: Record<number, { taken: number; available: number; dates: string[]; creditDates: string[]; consumeDates: string[]; }>;
//   }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//   useEffect(() => {
//     const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(savedUser);
//     if (savedUser?.id) {
//       refreshData(savedUser.id);
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const refreshData = async (userId?: string) => {
//     const targetId = userId || user?.id;
//     if (!targetId) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);

//     try {
//       const empData = await fetchEmployee(targetId);
//       await fetchAllEmployees();
//       const leavesData = await fetchLeaves(targetId);
//       const creditsData = await fetchElCredits(targetId);

//       if (empData) {
//         processLeaveAllocations(empData, leavesData, creditsData);
//       }
//     } catch (err) {
//       console.error("Dashboard calculation sequence encountered an error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployee = async (id: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     if (error) return null;
//     setEmployee(data);
//     return data;
//   };

//   const fetchAllEmployees = async () => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("id, full_name, department");
//     if (!error) setAllEmployees(data || []);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .order("leave_date", { ascending: true })
//       .order("half", { ascending: true }); // Crucial for chronological processing order

//     const validLeaves = data || [];
//     setLeaves(validLeaves);
//     return validLeaves;
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);

//     const validCredits = data || [];
//     setElCredits(validCredits);
//     return validCredits;
//   };

//   // CHRONOLOGICAL FIFO ACCUMULATION ENGINE
//   const processLeaveAllocations = (emp: any, allLeaves: any[], credits: any[]) => {
//     // 1. Initialize UI maps as before
//     const allocatedCasual: any = {}, allocatedSick: any = {}, allocatedLop: any = {}, allocatedEarned: any = {};

//     // ... (Keep your existing initialization logic for maps) ...
//     FINANCIAL_MONTHS.forEach(m => {
//       allocatedCasual[m.index] = { "1H": [], "2H": [] };
//       allocatedSick[m.index] = { "1H": [], "2H": [] };
//       allocatedLop[m.index] = { count: 0, dates: [] };
//       allocatedEarned[m.index] = { taken: 0, available: 0, creditDates: [], consumeDates: [] };
//     });

//     credits.forEach((credit) => {

//       const month =
//         dayjs(
//           credit.credit_date
//         ).month();

//       allocatedEarned[
//         month
//       ].available +=
//         Number(
//           credit.count || 0
//         );

//       allocatedEarned[
//         month
//       ].creditDates.push(
//         dayjs(
//           credit.credit_date
//         ).format("DD/M")
//       );

//     });

//     // 2. Separate leaves into those with and without assigned types
//     const leavesWithTypes = allLeaves.filter(l => l.allocated_type);
//     const legacyLeaves = allLeaves.filter(l => !l.allocated_type && l.status === "taken");

//     // 3. Process records WITH allocated_type (New Logic)
//     leavesWithTypes.forEach((row) => {
//       const m = dayjs(row.leave_date).month();
//       const d = dayjs(row.leave_date).format("DD/M");

//       if (row.allocated_type === "casual_1H") allocatedCasual[m]["1H"].push(d);
//       else if (row.allocated_type === "casual_2H") allocatedCasual[m]["2H"].push(d);
//       else if (row.allocated_type === "sick_1H") allocatedSick[m]["1H"].push(d);
//       else if (row.allocated_type === "sick_2H") allocatedSick[m]["2H"].push(d);
//       else if (row.allocated_type === "earned") { allocatedEarned[m].taken += 0.5; allocatedEarned[m].consumeDates.push(d); }
//       else if (row.allocated_type === "lop") { allocatedLop[m].count += 0.5; allocatedLop[m].dates.push(d); }
//     });

//     // 4. Process records WITHOUT allocated_type (Original FIFO Engine)
//     // Simply paste your original "Consume entries forward through the time stream" logic here,
//     // but update it to write into the same 'allocatedCasual', 'allocatedSick', etc. objects.
//     // ... (Your original FIFO loop goes here) ...

//     setUiMap({ casual: allocatedCasual, sick: allocatedSick, lop: allocatedLop, earned: allocatedEarned });
//   };

//   // const isMonthStruck = (monthIndex: number) => {
//   //   if (!employee?.joining_date) return false;
//   //   const joinDate = dayjs(employee.joining_date);
//   //   const targetDate = dayjs().month(monthIndex).year(joinDate.year()).startOf("month");
//   //   return joinDate.isAfter(targetDate, "month");
//   // };



//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;

//     const joinDate = dayjs(employee.joining_date);

//     const financialStartYear =
//       joinDate.month() >= 3
//         ? joinDate.year()
//         : joinDate.year() - 1;

//     const monthYear =
//       monthIndex >= 3
//         ? financialStartYear
//         : financialStartYear + 1;

//     const targetMonth = dayjs()
//       .year(monthYear)
//       .month(monthIndex)
//       .startOf("month");

//     return targetMonth.isBefore(
//       joinDate.startOf("month"),
//       "month"
//     );
//   };

//   const handleApplyLeave = async (values: any) => {
//     if (!values.dateRange || values.dateRange.length !== 2) {
//       message.error("Please select a valid date range.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const startDate = values.dateRange[0];
//       const endDate = values.dateRange[1];
//       const leaveRows: any[] = [];
//       const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//       const handoverName = handoverPerson ? handoverPerson.full_name : "";

//       let currentDate = startDate;
//       while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//         const formattedDate = currentDate.format("YYYY-MM-DD");

//         const baseRow = {
//           employee_id: employee.id,
//           employee_name: employee.full_name,
//           department: employee.department,
//           handover_name: handoverName,
//           leave_date: formattedDate,
//           type: "Pending_Allocation", // FIXED: "type" is now initialized as Pending_Allocation
//           status: "pending",
//           reason: values.reason
//         };

//         if (values.half === "Full") {
//           leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//         } else {
//           leaveRows.push({ ...baseRow, half: values.half });
//         }
//         currentDate = currentDate.add(1, "day");
//       }

//       const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//       if (error) throw error;

//       message.success("Leave request submitted for review successfully!");
//       setIsModalOpen(false);
//       form.resetFields();
//       refreshData();
//     } catch (err: any) {
//       message.error(err.message || "Failed to save leave records.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const departmentPeers = allEmployees.filter(
//     (emp) => emp.department === employee?.department && emp.id !== employee?.id
//   );

//   if (loading) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//         <Spin size="large" />
//         <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//       <Card
//         style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//         title="Employee Information Dashboard"
//         extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
//       >
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//         </Row>
//       </Card>

//       {/* RENDER GRID INTERFACE */}
//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//         {/* 1. Casual Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 2. Sick Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//       <div style={{ marginBottom: 25 }}>
//   <h3
//     style={{
//       borderBottom: "2px solid #000",
//       paddingBottom: 5,
//     }}
//   >
//     Holiday Working Bonus (Earned Leave Ledger)
//   </h3>

//   <div
//     style={{
//       display: "grid",
//       gridTemplateColumns: "repeat(12, 1fr)",
//       border: "1px solid #000",
//       textAlign: "center",
//     }}
//   >
//     {FINANCIAL_MONTHS.map((m) => (
//       <div
//         key={m.name}
//         style={{
//           borderRight: "1px solid #000",
//           background: isMonthStruck(m.index)
//             ? "#e8e8e8"
//             : "none",
//           padding: 4,
//         }}
//       >
//         <div
//           style={{
//             fontWeight: "bold",
//             borderBottom: "1px solid #000",
//             paddingBottom: 4,
//             marginBottom: 4,
//           }}
//         >
//           {m.name}
//         </div>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             gap: 4,
//             fontSize: 11,
//           }}
//         >
//           <div
//             style={{
//               color: "#52c41a",
//               fontWeight: "bold",
//             }}
//           >
//             Credit:
//             {" "}
//             {uiMap.earned[m.index]?.available || 0}
//           </div>



//           <div
//             style={{
//               color: "#52c41a",
//               fontSize: 10,
//               minHeight: 18,
//               fontWeight: "bold",
//               wordBreak: "break-word",
//             }}
//           >
//             {uiMap.earned[m.index]?.creditDates?.length
//               ? `+ ${uiMap.earned[m.index].creditDates.join(", ")}`
//               : ""}
//           </div>



//           <div
//             style={{
//               color: "#1677ff",
//               fontWeight: "bold",
//             }}
//           >
//             Used:
//             {" "}
//             {uiMap.earned[m.index]?.taken || 0}
//           </div>

//           {/* Earned Leave Credit Dates */}



//           {/* Earned Leave Consumption Dates */}

//           <div
//             style={{
//               color: "#1677ff",
//               fontSize: 10,
//               minHeight: 18,
//               fontWeight: "bold",
//               wordBreak: "break-word",
//             }}
//           >
//             {uiMap.earned[m.index]?.consumeDates?.length
//               ? `- ${uiMap.earned[m.index].consumeDates.join(", ")}`
//               : ""}
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// </div>

//         {/* 4. Loss Of Pay Residual Balancer */}
//         <div>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", padding: 6, background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                   {uiMap.lop[m.index]?.count} DAYS
//                 </div>
//                 <div style={{ fontSize: "9px", color: "red", minHeight: 15, fontWeight: "bold" }}>
//                   {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(",")}` : ""}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </Card>

//       {/* DIALOG APPLICATION WINDOWS */}
//       <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//         <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//           <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//             <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//           </Form.Item>
//           <Form.Item name="half" label="Day Span Allocation">
//             <Radio.Group optionType="button" buttonStyle="solid">
//               <Radio.Button value="Full">Full Day</Radio.Button>
//               <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//               <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//             </Radio.Group>
//           </Form.Item>
//           <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//             <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//               {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//             </Select>
//           </Form.Item>
//           <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//             <Input.TextArea rows={3} maxLength={250} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }






























// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//   { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//   { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//   { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//   { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function StaffDashboard() {
//   const [user, setUser] = useState<any>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [allEmployees, setAllEmployees] = useState<any[]>([]);
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [elCredits, setElCredits] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [form] = Form.useForm();

//   // TypeScript-Safe Layout Allocation State Maps
//   const [uiMap, setUiMap] = useState<{
//     casual: Record<number, Record<string, string>>;
//     sick: Record<number, Record<string, string>>;
//     lop: Record<number, { count: number; dates: string[] }>;
//     earned: Record<number, { taken: number; available: number; dates: string[]; creditDates: string[]; consumeDates: string[]; }>;
//   }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//   useEffect(() => {
//     const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
//     setUser(savedUser);
//     if (savedUser?.id) {
//       refreshData(savedUser.id);
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const refreshData = async (userId?: string) => {
//     const targetId = userId || user?.id;
//     if (!targetId) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);

//     try {
//       const empData = await fetchEmployee(targetId);
//       await fetchAllEmployees();
//       const leavesData = await fetchLeaves(targetId);
//       const creditsData = await fetchElCredits(targetId);

//       if (empData) {
//         processLeaveAllocations(empData, leavesData, creditsData);
//       }
//     } catch (err) {
//       console.error("Dashboard calculation sequence encountered an error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployee = async (id: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("id", id)
//       .single();
//     if (error) return null;
//     setEmployee(data);
//     return data;
//   };

//   const fetchAllEmployees = async () => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("id, full_name, department");
//     if (!error) setAllEmployees(data || []);
//   };

//   const fetchLeaves = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .select(`
//   id,
//   employee_id,
//   employee_name,
//   department,
//   leave_date,
//   half,
//   allocation_source_type,
//   allocation_source_year,
//   allocation_source_month
// `)
//       .eq("employee_id", employeeId)
//       .order("leave_date", { ascending: true })
//       .order("half", { ascending: true }); // Crucial for chronological processing order

//     const validLeaves = data || [];
//     setLeaves(validLeaves);
//     return validLeaves;
//   };

//   const fetchElCredits = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .schema("leave_management")
//       .from("el_credits")
//       .select("*")
//       .eq("employee_id", employeeId);

//     const validCredits = data || [];
//     setElCredits(validCredits);
//     return validCredits;
//   };

// const processLeaveAllocations = (
//   emp: any,
//   allLeaves: any[],
//   credits: any[]
// ) => {

//   const allocatedCasual: any = {};
//   const allocatedSick: any = {};
//   const allocatedLop: any = {};
//   const allocatedEarned: any = {};

//   FINANCIAL_MONTHS.forEach((m) => {
//     allocatedCasual[m.index] = { "1H": [], "2H": [] };
//     allocatedSick[m.index] = { "1H": [], "2H": [] };
//     allocatedLop[m.index] = { count: 0, dates: [] };
//     allocatedEarned[m.index] = {
//       taken: 0,
//       available: 0,
//       creditDates: [],
//       consumeDates: []
//     };
//   });

//   // -------------------------
//   // Credits (unchanged)
//   // -------------------------
//   credits.forEach((credit) => {
//     const month = dayjs(credit.credit_date).month();

//     allocatedEarned[month].available += Number(credit.count || 0);
//     allocatedEarned[month].creditDates.push(
//       dayjs(credit.credit_date).format("DD/M")
//     );
//   });

//   // -------------------------
//   // PURE DB FIELDS ONLY
//   // -------------------------
//   allLeaves.forEach((row) => {

//     const type = row.allocation_source_type;
//     const month = Number(row.allocation_source_month);
//     const half = row.half;
//     const leaveDate = dayjs(row.leave_date).format("DD/M");

//     if (!type || month === null || month === undefined) return;

//     const m = month - 1;

//     if (type === "casual") {
//       allocatedCasual[m]?.[half]?.push(leaveDate);
//       return;
//     }

//     if (type === "sick") {
//       allocatedSick[m]?.[half]?.push(leaveDate);
//       return;
//     }

//     if (type === "earned") {
//       allocatedEarned[m].taken += 0.5;
//       allocatedEarned[m].consumeDates.push(leaveDate);
//       return;
//     }

//     // if (type === "lop") {
//     //   allocatedLop[m].count += 0.5;
//     //   allocatedLop[m].dates.push(leaveDate);
//     //   return;
//     // }



//     if (type === "lop") {
//   // Guard clause: Initialize the month entry if it's missing
//   if (!allocatedLop[m]) {
//     allocatedLop[m] = { count: 0, dates: [] };
//   }

//   allocatedLop[m].count += 0.5;
//   allocatedLop[m].dates.push(leaveDate);
//   return;
// }
//   });

//   setUiMap({
//     casual: allocatedCasual,
//     sick: allocatedSick,
//     lop: allocatedLop,
//     earned: allocatedEarned,
//   });
// };



//   const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;

//     const joinDate = dayjs(employee.joining_date);

//     const financialStartYear =
//       joinDate.month() >= 3
//         ? joinDate.year()
//         : joinDate.year() - 1;

//     const monthYear =
//       monthIndex >= 3
//         ? financialStartYear
//         : financialStartYear + 1;

//     const targetMonth = dayjs()
//       .year(monthYear)
//       .month(monthIndex)
//       .startOf("month");

//     return targetMonth.isBefore(
//       joinDate.startOf("month"),
//       "month"
//     );
//   };

//   const handleApplyLeave = async (values: any) => {
//     if (!values.dateRange || values.dateRange.length !== 2) {
//       message.error("Please select a valid date range.");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const startDate = values.dateRange[0];
//       const endDate = values.dateRange[1];
//       const leaveRows: any[] = [];
//       const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//       const handoverName = handoverPerson ? handoverPerson.full_name : "";

//       let currentDate = startDate;
//       while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//         const formattedDate = currentDate.format("YYYY-MM-DD");

//         const baseRow = {
//           employee_id: employee.id,
//           employee_name: employee.full_name,
//           department: employee.department,
//           handover_name: handoverName,
//           leave_date: formattedDate,
//           type: "Pending_Allocation", // FIXED: "type" is now initialized as Pending_Allocation
//           status: "pending",
//           reason: values.reason
//         };

//         if (values.half === "Full") {
//           leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//         } else {
//           leaveRows.push({ ...baseRow, half: values.half });
//         }
//         currentDate = currentDate.add(1, "day");
//       }

//       const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//       if (error) throw error;

//       message.success("Leave request submitted for review successfully!");
//       setIsModalOpen(false);
//       form.resetFields();
//       refreshData();
//     } catch (err: any) {
//       message.error(err.message || "Failed to save leave records.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const departmentPeers = allEmployees.filter(
//     (emp) => emp.department === employee?.department && emp.id !== employee?.id
//   );


// // const getLeaveTotals = () => {
// //   let totalTaken = 0;
// //   let totalLop = 0;

// //   // 1. Count Casual (Each entry in "1H" or "2H" array = 0.5 day)
// //   Object.values(uiMap.casual).forEach(m => {
// //     totalTaken += (m["1H"]?.length || 0) * 0.5;
// //     totalTaken += (m["2H"]?.length || 0) * 0.5;
// //   });

// //   // 2. Count Sick (Each entry in "1H" or "2H" array = 0.5 day)
// //   Object.values(uiMap.sick).forEach(m => {
// //     totalTaken += (m["1H"]?.length || 0) * 0.5;
// //     totalTaken += (m["2H"]?.length || 0) * 0.5;
// //   });

// //   // 3. Count Earned (Already stored as numbers)
// //   Object.values(uiMap.earned).forEach(m => {
// //     totalTaken += m.taken || 0;
// //   });

// //   // 4. Count LOP
// //   Object.values(uiMap.lop).forEach(m => {
// //     totalLop += m.count || 0;
// //   });

// //   return { taken: totalTaken, lop: totalLop };
// // };



// // const getSummaryStats = () => {
// //   const currentMonthIndex = dayjs().month() >= 3 ? dayjs().month() - 3 : dayjs().month() + 9;
  
// //   // Quota: 2 per month (1 Casual + 1 Sick)
// //   const totalAllowed = (currentMonthIndex + 1) * 2;
  
// //   let totalTaken = 0;
// //   Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
// //   Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
// //   Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

// //   const totalEarnedCredits = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
// //   const totalLop = Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0);

// //   return {
// //     allowed: totalAllowed,
// //     taken: totalTaken,
// //     balance: totalAllowed - totalTaken,
// //     earned: totalEarnedCredits,
// //     lop: totalLop
// //   };
// // };



// // const getSummaryStats = () => {
// //   const currentMonth = dayjs().month(); 
// //   const monthsPassed = currentMonth >= 3 ? currentMonth - 3 : currentMonth + 9;
// //   const count = monthsPassed + 1; // June = 3
  
// //   const casualAllowed = count;
// //   const sickAllowed = count;
// //   const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
// //   const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

// //   let totalTaken = 0;
// //   Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
// //   Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
// //   Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

// //   return {
// //     casual: casualAllowed,
// //     sick: sickAllowed,
// //     earned: earnedAllowed,
// //     total: totalAllowed,
// //     taken: totalTaken,
// //     balance: totalAllowed - totalTaken,
// //     lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0)
// //   };
// // };


// const getSummaryStats = () => {
//   if (!employee?.joining_date) {
//     return { casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0 };
//   }

//   const joinDate = dayjs(employee.joining_date);
//   const currentDate = dayjs();

//   // 1. Determine the start of the current active financial year for this employee
//   const financialStartYear = joinDate.month() >= 3 
//     ? joinDate.year() 
//     : joinDate.year() - 1;

//   let effectiveStartDate = joinDate.startOf("month");
//   const cycleStartDate = dayjs().year(financialStartYear).month(3).startOf("month"); // April 1st of Cycle

//   // If they joined before this financial cycle started, calculations start from April
//   if (joinDate.isBefore(cycleStartDate)) {
//     effectiveStartDate = cycleStartDate;
//   }

//   // 2. Calculate actual months passed from their effective start date to current month
//   let count = currentDate.diff(effectiveStartDate, "month") + 1;
//   if (count < 0) count = 0; // Guard against future joining dates

//   // 3. Compute Quotas based on active tenure months
//   const casualAllowed = count;
//   const sickAllowed = count;
//   const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
//   const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

//   let totalTaken = 0;
//   Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//   Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//   Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

//   return {
//     casual: casualAllowed,
//     sick: sickAllowed,
//     earned: earnedAllowed,
//     total: totalAllowed,
//     taken: totalTaken,
//     balance: totalAllowed - totalTaken,
//     lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0)
//   };
// };

//   if (loading) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//         <Spin size="large" />
//         <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//       {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//       {/* <Card
//         style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//         title="Employee Information Dashboard"
//         extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
//       >
//         <Row gutter={16}>
//           <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//           <Col span={6}><b>Department:</b> {employee?.department}</Col>
//           <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//           <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//         </Row>

//         <Row gutter={16} style={{ background: "#f0f0f0", padding: "10px", borderRadius: 4 }}>
//     <Col span={8}><b>Total Leaves Taken:</b> {getLeaveTotals().taken} Days</Col>
//     <Col span={8}><b>Total LOP:</b> <span style={{ color: "red", fontWeight: "bold" }}>{getLeaveTotals().lop} Days</span></Col>
//     <Col span={8}><b>Status:</b> {getLeaveTotals().lop > 0 ? "⚠️ Attendance Attention Required" : "✅ All Clear"}</Col>
//   </Row>
//       </Card> */}




//       <Card
//   style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//   title="Employee Information Dashboard"
//   extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
// >
//   <Row gutter={16} style={{ marginBottom: 15 }}>
//     <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//     <Col span={6}><b>Department:</b> {employee?.department}</Col>
//     <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//     <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//   </Row>

//   {/* BEAUTIFIED SUMMARY ROW */}
//  {(() => {
//   const stats = getSummaryStats();
//   const formulaItems = [
//     { label: "CASUAL", value: stats.casual },
//     { label: "SICK", value: stats.sick },
//     { label: "EARNED", value: stats.earned },
//   ];

//   return (
//     <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
//       {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
//       <Col span={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//         {formulaItems.map((item, idx) => (
//           <div key={idx} style={{ display: "flex", alignItems: "center" }}>
//             <div style={{ textAlign: "center" }}>
//               <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
//               <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
//             </div>
//             {idx < formulaItems.length - 1 && <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>+</span>}
//           </div>
//         ))}
//         <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>=</span>
//         <div style={{ textAlign: "center" }}>
//           <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
//           <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
//         </div>
//       </Col>

//       {/* Metrics Section */}
//       <Col span={4} style={{ textAlign: "center" }}>
//         <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
//         <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
//       </Col>
//       <Col span={4} style={{ textAlign: "center" }}>
//         <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
//         <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
//       </Col>
//       <Col span={4} style={{ textAlign: "center" }}>
//         <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
//         <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
//       </Col>
//     </Row>
//   );
// })()}
// </Card>

//       {/* RENDER GRID INTERFACE */}
//       <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//         {/* 1. Casual Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 2. Sick Leave Dynamic Tracker */}
//         <div style={{ marginBottom: 25 }}>
//           <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//             {FINANCIAL_MONTHS.map((m) => (
//               <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                 <div style={{ display: "flex", fontSize: "11px" }}>
//                   <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                     <div style={{ color: "#888" }}>1H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]}</div>
//                   </div>
//                   <div style={{ flex: 1, padding: 4 }}>
//                     <div style={{ color: "#888" }}>2H</div>
//                     <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]}</div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
// <div style={{ marginBottom: 25 }}>
//   <h3
//     style={{
//       borderBottom: "2px solid #000",
//       paddingBottom: 5,
//     }}
//   >
//     Holiday Working Bonus (Earned Leave Ledger)
//   </h3>

//   <div
//     style={{
//       display: "grid",
//       gridTemplateColumns: "repeat(12, 1fr)",
//       border: "1px solid #000",
//       textAlign: "center",
//     }}
//   >
//     {FINANCIAL_MONTHS.map((m) => (
//       <div
//         key={m.name}
//         style={{
//           borderRight: "1px solid #000",
//           background: isMonthStruck(m.index)
//             ? "#e8e8e8"
//             : "none",
//           padding: 4,
//           // Prevents the cell from forcing layout expansion
//           minWidth: 0,
//           overflow: "hidden"
//         }}
//       >
//         <div
//           style={{
//             fontWeight: "bold",
//             borderBottom: "1px solid #000",
//             paddingBottom: 4,
//             marginBottom: 4,
//           }}
//         >
//           {m.name}
//         </div>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             gap: 4,
//             fontSize: 11,
//           }}
//         >
//           <div
//             style={{
//               color: "#52c41a",
//               fontWeight: "bold",
//             }}
//           >
//             Credit:{" "}{uiMap.earned[m.index]?.available || 0}
//           </div>

//           <div
//             style={{
//               color: "#52c41a",
//               fontSize: 10,
//               minHeight: 18,
//               fontWeight: "bold",
//               wordBreak: "break-word",
//               overflowWrap: "anywhere"
//             }}
//           >
//             {/* 🌟 SAFEGUARD: Filter unique credit dates */}
//             {uiMap.earned[m.index]?.creditDates?.length
//               ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
//               : ""}
//           </div>

//           <div
//             style={{
//               color: "#1677ff",
//               fontWeight: "bold",
//             }}
//           >
//             Used:{" "}{uiMap.earned[m.index]?.taken || 0}
//           </div>

//           <div
//             style={{
//               color: "#1677ff",
//               fontSize: 10,
//               minHeight: 18,
//               fontWeight: "bold",
//               wordBreak: "break-word",
//               overflowWrap: "anywhere"
//             }}
//           >
//             {/* 🌟 FIXED: Added Array.from(new Set(...)) to filter out duplicate consumption dates on the same day */}
//             {uiMap.earned[m.index]?.consumeDates?.length
//               ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
//               : ""}
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// </div>

//         {/* 4. Loss Of Pay Residual Balancer */}
//         <div>
//   <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//   <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//     {FINANCIAL_MONTHS.map((m) => (
//       <div 
//         key={m.name} 
//         style={{ 
//           borderRight: "1px solid #000", 
//           padding: 6, 
//           background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
//           // Force layout sizing constraint on the grid cell container
//           minWidth: 0, 
//           overflow: "hidden" 
//         }}
//       >
//         <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//         <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//           {uiMap.lop[m.index]?.count} DAYS
//         </div>
//         <div 
//           style={{ 
//             fontSize: "9px", 
//             color: "red", 
//             minHeight: 15, 
//             fontWeight: "bold",
//             // 🌟 FIX: Forces long text strings to break and wrap onto a new row vertically
//             wordBreak: "break-word",
//             overflowWrap: "anywhere"
//           }}
//         >
//           {/* 🌟 FIX: Added a space after the comma inside join(', ') so the browser knows where to wrap */}
//           {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
//         </div>
//       </div>
//     ))}
//   </div>
// </div>
//       </Card>

//       {/* DIALOG APPLICATION WINDOWS */}
//       <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//         <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//           <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//             <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//           </Form.Item>
//           <Form.Item name="half" label="Day Span Allocation">
//             <Radio.Group optionType="button" buttonStyle="solid">
//               <Radio.Button value="Full">Full Day</Radio.Button>
//               <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//               <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//             </Radio.Group>
//           </Form.Item>
//           <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//             <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//               {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//             </Select>
//           </Form.Item>
//           <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//             <Input.TextArea rows={3} maxLength={250} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }

























"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
import { PlusOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const FINANCIAL_MONTHS = [
  { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
  { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
  { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
  { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
];

export default function StaffDashboard() {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [elCredits, setElCredits] = useState<any[]>([]);
  const [retentions, setRetentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Financial Year Selection State (stores the starting year, e.g. 2025 for FY 2025-26)
  const getCurrentFinancialYearStart = () => {
    const today = dayjs();
    return today.month() >= 3 ? today.year() : today.year() - 1;
  };
  const [selectedFyStart, setSelectedFyStart] = useState<number>(getCurrentFinancialYearStart());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Layout Allocation State Maps
  const [uiMap, setUiMap] = useState<{
    casual: Record<number, Record<string, string[]>>;
    sick: Record<number, Record<string, string[]>>;
    lop: Record<number, { count: number; dates: string[] }>;
    earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[] }>;
    retention: Record<number, { amount: number }>;
  }>({ casual: {}, sick: {}, lop: {}, earned: {}, retention: {} });

  const getFinancialYearStart = (year: number, month: number) => {
    return month >= 3 ? year : year - 1;
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(savedUser);
    if (savedUser?.id) {
      refreshData(savedUser.id, selectedFyStart);
    } else {
      setLoading(false);
    }
  }, [selectedFyStart]);

  const refreshData = async (userId?: string, fyStart?: number) => {
    const targetId = userId || user?.id;
    const targetFy = fyStart !== undefined ? fyStart : selectedFyStart;
    if (!targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const empData = await fetchEmployee(targetId);
      await fetchAllEmployees();
      const leavesData = await fetchLeaves(targetId);
      const creditsData = await fetchElCredits(targetId);
      const retentionData = await fetchRetentions(targetId);

      if (empData) {
        processLeaveAllocations(empData, leavesData, creditsData, retentionData, targetFy);
      }
    } catch (err) {
      console.error("Dashboard calculation sequence encountered an error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployee = async (id: string) => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("employees")
      .select("*, opening_retention_amount")
      .eq("id", id)
      .single();
    if (error) return null;
    setEmployee(data);
    return data;
  };

  const fetchAllEmployees = async () => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("employees")
      .select("id, full_name, department");
    if (!error) setAllEmployees(data || []);
  };

  const fetchLeaves = async (employeeId: string) => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("leaves")
      .select(`
        id,
        employee_id,
        employee_name,
        department,
        leave_date,
        half,
        allocation_source_type,
        allocation_source_year,
        allocation_source_month
      `)
      .eq("employee_id", employeeId)
      .order("leave_date", { ascending: true })
      .order("half", { ascending: true });

    const validLeaves = data || [];
    setLeaves(validLeaves);
    return validLeaves;
  };

  const fetchElCredits = async (employeeId: string) => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("el_credits")
      .select("*")
      .eq("employee_id", employeeId);

    const validCredits = data || [];
    setElCredits(validCredits);
    return validCredits;
  };

  const fetchRetentions = async (employeeId: string) => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("payrolls")
      .select("id, employee_id, retained_amount, pay_period_year, pay_period_month")
      .eq("employee_id", employeeId);

    const validRetentions = data || [];
    setRetentions(validRetentions);
    return validRetentions;
  };

  const processLeaveAllocations = (
    emp: any,
    allLeaves: any[],
    credits: any[],
    retentionRecords: any[],
    targetFinancialYear: number
  ) => {
    const allocatedCasual: any = {};
    const allocatedSick: any = {};
    const allocatedLop: any = {};
    const allocatedEarned: any = {};
    const allocatedRetention: any = {};

    FINANCIAL_MONTHS.forEach((m) => {
      allocatedCasual[m.index] = { "1H": [], "2H": [] };
      allocatedSick[m.index] = { "1H": [], "2H": [] };
      allocatedLop[m.index] = { count: 0, dates: [] };
      allocatedEarned[m.index] = {
        taken: 0,
        available: 0,
        creditDates: [],
        consumeDates: []
      };
      allocatedRetention[m.index] = { amount: 0 };
    });

    // Process Earned Leave Credits for selected FY
    credits.forEach((credit) => {
      if (!credit.credit_date) return;
      const creditDate = dayjs(credit.credit_date);
      const creditFinancialYear = getFinancialYearStart(creditDate.year(), creditDate.month());

      if (creditFinancialYear !== targetFinancialYear) return;

      const month = creditDate.month();
      allocatedEarned[month].available += Number(credit.count || 0);
      allocatedEarned[month].creditDates.push(creditDate.format("DD/M"));
    });

    // Process Retention Deductions for selected FY
    retentionRecords.forEach((item) => {
      const year = Number(item.pay_period_year);
      const month1Based = Number(item.pay_period_month);

      if (!year || !month1Based || month1Based < 1 || month1Based > 12) return;

      const jsMonth = month1Based - 1;
      const rFinancialYear = getFinancialYearStart(year, jsMonth);

      if (rFinancialYear !== targetFinancialYear) return;

      const amount = Number(item.retained_amount || 0);
      allocatedRetention[jsMonth].amount += amount;
    });

    // Process Leave Allocations for selected FY
    allLeaves.forEach((row) => {
      const type = row.allocation_source_type;
      const month = Number(row.allocation_source_month);
      const year = Number(row.allocation_source_year);
      const half = row.half;
      const leaveDate = dayjs(row.leave_date).format("DD/M");

      if (!type || month === null || month === undefined) return;

      // Check if leave allocation year matches current FY
      const leaveFy = year ? getFinancialYearStart(year, month - 1) : null;
      if (leaveFy !== null && leaveFy !== targetFinancialYear) return;

      const m = month - 1;

      if (type === "casual") {
        allocatedCasual[m]?.[half]?.push(leaveDate);
        return;
      }

      if (type === "sick") {
        allocatedSick[m]?.[half]?.push(leaveDate);
        return;
      }

      if (type === "earned") {
        allocatedEarned[m].taken += 0.5;
        allocatedEarned[m].consumeDates.push(leaveDate);
        return;
      }

      if (type === "lop") {
        if (!allocatedLop[m]) {
          allocatedLop[m] = { count: 0, dates: [] };
        }
        allocatedLop[m].count += 0.5;
        allocatedLop[m].dates.push(leaveDate);
        return;
      }
    });

    setUiMap({
      casual: allocatedCasual,
      sick: allocatedSick,
      lop: allocatedLop,
      earned: allocatedEarned,
      retention: allocatedRetention,
    });
  };

  const isMonthStruck = (monthIndex: number) => {
    if (!employee?.joining_date) return false;

    const joinDate = dayjs(employee.joining_date);

    // Calculate actual year for this month cell based on selected FY
    const calendarYear = monthIndex >= 3 ? selectedFyStart : selectedFyStart + 1;
    const targetMonth = dayjs().year(calendarYear).month(monthIndex).startOf("month");

    return targetMonth.isBefore(joinDate.startOf("month"), "month");
  };

  const handleApplyLeave = async (values: any) => {
    if (!values.dateRange || values.dateRange.length !== 2) {
      message.error("Please select a valid date range.");
      return;
    }

    setSubmitting(true);
    try {
      const startDate = values.dateRange[0];
      const endDate = values.dateRange[1];
      const leaveRows: any[] = [];
      const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
      const handoverName = handoverPerson ? handoverPerson.full_name : "";

      let currentDate = startDate;
      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
        const formattedDate = currentDate.format("YYYY-MM-DD");

        const baseRow = {
          employee_id: employee.id,
          employee_name: employee.full_name,
          department: employee.department,
          handover_name: handoverName,
          leave_date: formattedDate,
          type: "Pending_Allocation",
          status: "pending",
          reason: values.reason
        };

        if (values.half === "Full") {
          leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
        } else {
          leaveRows.push({ ...baseRow, half: values.half });
        }
        currentDate = currentDate.add(1, "day");
      }

      const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
      if (error) throw error;

      message.success("Leave request submitted for review successfully!");
      setIsModalOpen(false);
      form.resetFields();
      refreshData();
    } catch (err: any) {
      message.error(err.message || "Failed to save leave records.");
    } finally {
      setSubmitting(false);
    }
  };

  const departmentPeers = allEmployees.filter(
    (emp) => emp.department === employee?.department && emp.id !== employee?.id
  );

  const getSummaryStats = () => {
    const openingRetention = Number(employee?.opening_retention_amount || 0);

    if (!employee?.joining_date) {
      return { 
        casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0, 
        openingRetention, currentRetention: 0, totalRetention: openingRetention 
      };
    }

    const joinDate = dayjs(employee.joining_date);
    const currentDate = dayjs();

    const fyStartMonthDate = dayjs().year(selectedFyStart).month(3).startOf("month");
    const fyEndMonthDate = dayjs().year(selectedFyStart + 1).month(2).endOf("month");

    // If joining date is after selected FY, allowance is 0
    if (joinDate.isAfter(fyEndMonthDate)) {
      return {
        casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0,
        openingRetention, currentRetention: 0, totalRetention: openingRetention
      };
    }

    // Determine start boundary for leave accrual in selected FY
    const effectiveAccrualStart = joinDate.isAfter(fyStartMonthDate)
      ? joinDate.startOf("month")
      : fyStartMonthDate;

    // Determine end boundary (capped at current date if viewing active FY)
    const activeFyStart = getCurrentFinancialYearStart();
    let effectiveAccrualEnd = fyEndMonthDate;
    if (selectedFyStart === activeFyStart && currentDate.isBefore(fyEndMonthDate)) {
      effectiveAccrualEnd = currentDate;
    }

    let accruedMonths = effectiveAccrualEnd.diff(effectiveAccrualStart, "month") + 1;
    if (accruedMonths < 0) accruedMonths = 0;
    if (accruedMonths > 12) accruedMonths = 12;

    const casualAllowed = accruedMonths;
    const sickAllowed = accruedMonths;
    const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
    const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

    let totalTaken = 0;
    Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
    Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
    Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

    const currentFyRetention = Object.values(uiMap.retention).reduce((acc, m) => acc + (m.amount || 0), 0);
    const totalRetentionSum = openingRetention + currentFyRetention;

    return {
      casual: casualAllowed,
      sick: sickAllowed,
      earned: earnedAllowed,
      total: totalAllowed,
      taken: totalTaken,
      balance: totalAllowed - totalTaken,
      lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0),
      openingRetention,
      currentRetention: currentFyRetention,
      totalRetention: totalRetentionSum
    };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
        <Spin size="large" />
        <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating FY {selectedFyStart}-{selectedFyStart + 1 - 2000} Ledgers...</div>
      </div>
    );
  }

  const stats = getSummaryStats();
  const formulaItems = [
    { label: "CASUAL", value: stats.casual },
    { label: "SICK", value: stats.sick },
    { label: "EARNED", value: stats.earned },
  ];

  return (
    <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

      {/* FINANCIAL YEAR SELECTOR & DASHBOARD HEADER */}
      <Card
        style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span>Employee Information Dashboard</span>
            
            {/* Financial Year Toggle Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fafafa", padding: "4px 12px", border: "1px solid #d9d9d9", borderRadius: "6px" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "bold" }}>FINANCIAL YEAR:</span>
              <Button 
                size="small" 
                icon={<LeftOutlined />} 
                onClick={() => setSelectedFyStart((prev) => prev - 1)} 
              />
              <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1890ff", minWidth: "90px", textAlign: "center" }}>
                FY {selectedFyStart}-{selectedFyStart + 1 - 2000}
              </span>
              <Button 
                size="small" 
                icon={<RightOutlined />} 
                onClick={() => setSelectedFyStart((prev) => prev + 1)} 
              />
              {selectedFyStart !== getCurrentFinancialYearStart() && (
                <Button size="small" type="link" style={{ padding: "0 4px", fontSize: "11px" }} onClick={() => setSelectedFyStart(getCurrentFinancialYearStart())}>
                  Current FY
                </Button>
              )}
            </div>
          </div>
        }
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
      >
        <Row gutter={16} style={{ marginBottom: 15 }}>
          <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
          <Col span={6}><b>Department:</b> {employee?.department}</Col>
          <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
          <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
        </Row>

        {/* BEAUTIFIED SUMMARY ROW */}
        <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
          {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
          <Col span={9} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {formulaItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
                </div>
                {idx < formulaItems.length - 1 && <span style={{ margin: "0 8px", fontSize: "18px", color: "#888" }}>+</span>}
              </div>
            ))}
            <span style={{ margin: "0 8px", fontSize: "18px", color: "#888" }}>=</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
            </div>
          </Col>

          {/* Metrics Section */}
          <Col span={3} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
          </Col>
          <Col span={3} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
          </Col>
          <Col span={3} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
          </Col>
          <Col span={6} style={{ textAlign: "center", borderLeft: "1px dashed #ccc" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TOTAL RETENTION</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#722ed1" }}>₹{stats.totalRetention.toLocaleString()}</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              (Op: ₹{stats.openingRetention.toLocaleString()} + FY: ₹{stats.currentRetention.toLocaleString()})
            </div>
          </Col>
        </Row>
      </Card>

      {/* RENDER GRID INTERFACE FOR SELECTED FY */}
      <Card 
        style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} 
        title={`CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX (FY ${selectedFyStart}-${selectedFyStart + 1 - 2000})`}
      >

        {/* 1. Casual Leave Dynamic Tracker */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
                <div style={{ display: "flex", fontSize: "11px" }}>
                  <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
                    <div style={{ color: "#888" }}>1H</div>
                    <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]?.join(", ")}</div>
                  </div>
                  <div style={{ flex: 1, padding: 4 }}>
                    <div style={{ color: "#888" }}>2H</div>
                    <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]?.join(", ")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Sick Leave Dynamic Tracker */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
                <div style={{ display: "flex", fontSize: "11px" }}>
                  <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
                    <div style={{ color: "#888" }}>1H</div>
                    <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]?.join(", ")}</div>
                  </div>
                  <div style={{ flex: 1, padding: 4 }}>
                    <div style={{ color: "#888" }}>2H</div>
                    <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]?.join(", ")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>
            Holiday Working Bonus (Earned Leave Ledger)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div
                key={m.name}
                style={{
                  borderRight: "1px solid #000",
                  background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
                  padding: 4,
                  minWidth: 0,
                  overflow: "hidden"
                }}
              >
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
                  {m.name}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
                  <div style={{ color: "#52c41a", fontWeight: "bold" }}>
                    Credit: {uiMap.earned[m.index]?.available || 0}
                  </div>

                  <div style={{ color: "#52c41a", fontSize: 10, minHeight: 18, fontWeight: "bold", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {uiMap.earned[m.index]?.creditDates?.length
                      ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
                      : ""}
                  </div>

                  <div style={{ color: "#1677ff", fontWeight: "bold" }}>
                    Used: {uiMap.earned[m.index]?.taken || 0}
                  </div>

                  <div style={{ color: "#1677ff", fontSize: 10, minHeight: 18, fontWeight: "bold", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {uiMap.earned[m.index]?.consumeDates?.length
                      ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
                      : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Retention Deduction Summary */}
        <div style={{ marginBottom: 25 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: 5 }}>
            <h3 style={{ margin: 0 }}>Retention Deduction Summary (FY {selectedFyStart}-{selectedFyStart + 1 - 2000})</h3>
            <span style={{ fontSize: "12px", color: "#722ed1", fontWeight: "bold" }}>
              Opening Balance: ₹{stats.openingRetention.toLocaleString()} | FY Accumulated: ₹{stats.currentRetention.toLocaleString()} | Total: ₹{stats.totalRetention.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div key={m.name} style={{ borderRight: "1px solid #000", padding: 4 }}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
                <div style={{ color: "#722ed1", fontWeight: "bold", fontSize: 12 }}>
                  ₹{(uiMap.retention[m.index]?.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Loss Of Pay Residual Balancer */}
        <div>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div 
                key={m.name} 
                style={{ 
                  borderRight: "1px solid #000", 
                  padding: 6, 
                  background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
                  minWidth: 0, 
                  overflow: "hidden" 
                }}
              >
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
                  {uiMap.lop[m.index]?.count || 0} DAYS
                </div>
                <div 
                  style={{ 
                    fontSize: "9px", 
                    color: "red", 
                    minHeight: 15, 
                    fontWeight: "bold",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere"
                  }}
                >
                  {uiMap.lop[m.index]?.dates?.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* DIALOG APPLICATION WINDOWS */}
      <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
        <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
          <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item name="half" label="Day Span Allocation">
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value="Full">Full Day</Radio.Button>
              <Radio.Button value="1H">1st Half (1H)</Radio.Button>
              <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select employee..." optionFilterProp="children">
              {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={3} maxLength={250} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}