// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Select,
//     Row,
//     Col,
//     Statistic,
//     Descriptions,
//     Typography,
//     Spin,
//     Tag,
//     Divider,
// } from "antd";
// import {
//     UserOutlined,
//     TeamOutlined,
//     CalendarOutlined,
//     IdcardOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";

// const { Title } = Typography;

// interface Employee {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     username: string;
//     department: string;
//     designation: string;
//     joining_date: string;
//     active: boolean;
//     role: string;
// }

// export default function HRStaffViewer() {
//     const [loading, setLoading] = useState(false);

//     const [staffList, setStaffList] = useState<Employee[]>([]);

//     const [selectedEmployeeId, setSelectedEmployeeId] =
//         useState<string>();

//     const [employee, setEmployee] =
//         useState<Employee | null>(null);

//     // Summary Cards (will calculate in Part 2)
//     const [summary, setSummary] = useState({
//         casual: 0,
//         sick: 0,
//         earned: 0,
//         unauthorized: 0,
//         lop: 0,
//     });

//     //=====================================================
//     // Fetch all staff
//     //=====================================================

//     const fetchStaff = async () => {
//         setLoading(true);

//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff")
//             .order("full_name");

//         if (error) {
//             console.error(error);
//             setLoading(false);
//             return;
//         }

//         setStaffList(data || []);

//         if (data && data.length > 0) {
//             setSelectedEmployeeId(data[0].id);
//         }

//         setLoading(false);
//     };

//     //=====================================================
//     // Fetch Selected Employee
//     //=====================================================

//     const fetchEmployee = async (id: string) => {
//         if (!id) return;

//         setLoading(true);

//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("id", id)
//             .single();

//         if (error) {
//             console.error(error);
//             setLoading(false);
//             return;
//         }

//         setEmployee(data);

//         setLoading(false);
//     };

//     //=====================================================
//     // Initial Load
//     //=====================================================

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     //=====================================================
//     // Employee Changed
//     //=====================================================

//     useEffect(() => {
//         if (selectedEmployeeId) {
//             fetchEmployee(selectedEmployeeId);
//         }
//     }, [selectedEmployeeId]);

//     if (loading && !employee) {
//         return (
//             <div
//                 style={{
//                     display: "flex",
//                     justifyContent: "center",
//                     marginTop: 100,
//                 }}
//             >
//                 <Spin size="large" />
//             </div>
//         );
//     }

//     return (
//         <div
//             style={{
//                 padding: 20,
//                 maxWidth: 1300,
//                 margin: "0 auto",
//             }}
//         >
//             <Card>
//                 <Title level={3}>
//                     HR Staff Viewer
//                 </Title>

//                 <Divider />

//                 <Row gutter={16} align="middle">

//                     <Col span={8}>

//                         <Select
//                             showSearch
//                             style={{ width: "100%" }}
//                             placeholder="Select Staff"

//                             value={selectedEmployeeId}

//                             optionFilterProp="label"

//                             onChange={(value) =>
//                                 setSelectedEmployeeId(value)
//                             }

//                             options={staffList.map((emp) => ({
//                                 value: emp.id,
//                                 label: `${emp.employee_code} - ${emp.full_name}`,
//                             }))}
//                         />

//                     </Col>

//                 </Row>

//                 <Divider />

//                 {employee && (
//                     <>
//                         <Descriptions
//                             title="Employee Profile"
//                             bordered
//                             column={2}
//                         >
//                             <Descriptions.Item
//                                 label={
//                                     <>
//                                         <IdcardOutlined /> Employee Code
//                                     </>
//                                 }
//                             >
//                                 {employee.employee_code}
//                             </Descriptions.Item>

//                             <Descriptions.Item
//                                 label={
//                                     <>
//                                         <UserOutlined /> Full Name
//                                     </>
//                                 }
//                             >
//                                 {employee.full_name}
//                             </Descriptions.Item>

//                             <Descriptions.Item
//                                 label={
//                                     <>
//                                         <TeamOutlined /> Department
//                                     </>
//                                 }
//                             >
//                                 {employee.department}
//                             </Descriptions.Item>

//                             <Descriptions.Item
//                                 label="Designation"
//                             >
//                                 {employee.designation}
//                             </Descriptions.Item>

//                             <Descriptions.Item
//                                 label={
//                                     <>
//                                         <CalendarOutlined /> Joining Date
//                                     </>
//                                 }
//                             >
//                                 {employee.joining_date
//                                     ? dayjs(employee.joining_date).format(
//                                         "DD-MM-YYYY"
//                                     )
//                                     : "-"}
//                             </Descriptions.Item>

//                             <Descriptions.Item
//                                 label="Status"
//                             >
//                                 {employee.active ? (
//                                     <Tag color="green">
//                                         Active
//                                     </Tag>
//                                 ) : (
//                                     <Tag color="red">
//                                         Resigned
//                                     </Tag>
//                                 )}
//                             </Descriptions.Item>
//                         </Descriptions>

//                         <Divider />

//                         <Row gutter={[16, 16]} style={{ marginBottom: 25 }}>
//                             <Col xs={24} sm={12} md={8} lg={4}>
//                                 <Card>
//                                     <Statistic
//                                         title="Casual Leave"
//                                         value={summary.casual}
//                                         valueStyle={{ color: "#1677ff" }}
//                                     />
//                                 </Card>
//                             </Col>

//                             <Col xs={24} sm={12} md={8} lg={4}>
//                                 <Card>
//                                     <Statistic
//                                         title="Sick Leave"
//                                         value={summary.sick}
//                                         valueStyle={{ color: "#52c41a" }}
//                                     />
//                                 </Card>
//                             </Col>

//                             <Col xs={24} sm={12} md={8} lg={4}>
//                                 <Card>
//                                     <Statistic
//                                         title="Earned Leave"
//                                         value={summary.earned}
//                                         valueStyle={{ color: "#722ed1" }}
//                                     />
//                                 </Card>
//                             </Col>

//                             <Col xs={24} sm={12} md={8} lg={4}>
//                                 <Card>
//                                     <Statistic
//                                         title="Unauthorized"
//                                         value={summary.unauthorized}
//                                         valueStyle={{ color: "#fa8c16" }}
//                                     />
//                                 </Card>
//                             </Col>

//                             <Col xs={24} sm={12} md={8} lg={4}>
//                                 <Card>
//                                     <Statistic
//                                         title="LOP"
//                                         value={summary.lop}
//                                         valueStyle={{ color: "#cf1322" }}
//                                     />
//                                 </Card>
//                             </Col>
//                         </Row>

//                         <Divider />

//                         <Card
//                             title="Employee Records"
//                             style={{
//                                 marginTop: 20,
//                             }}
//                         >
//                             <Title level={5}>
//                                 Attendance, Leave History, EL Credits and Allocation History
//                                 will appear here.
//                             </Title>

//                             <p style={{ color: "#888" }}>
//                                 In Part 2 we will add four tabs:
//                             </p>

//                             <ul>
//                                 <li>Attendance</li>
//                                 <li>Leave History</li>
//                                 <li>EL Credits</li>
//                                 <li>Allocation History</li>
//                             </ul>
//                         </Card>

//                     </>
//                 )}
//             </Card>
//         </div>
//     );
// }

















// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function HRStaffDashboard() {
//     const [employee, setEmployee] = useState<any>(null);
//     const [allEmployees, setAllEmployees] = useState<any[]>([]);
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

//     const [leaves, setLeaves] = useState<any[]>([]);
//     const [elCredits, setElCredits] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [form] = Form.useForm();

//     // TypeScript-Safe Layout Allocation State Maps
//     const [uiMap, setUiMap] = useState<{
//         casual: Record<number, Record<string, string[]>>;
//         sick: Record<number, Record<string, string[]>>;
//         lop: Record<number, { count: number; dates: string[] }>;
//         earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[]; }>;
//     }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//     // Load all staff list on initial render
//     useEffect(() => {
//         initHRDashboard();
//     }, []);

//     const initHRDashboard = async () => {
//         setLoading(true);
//         const emps = await fetchAllEmployees();
//         if (emps && emps.length > 0) {
//             // Default selection to the first employee in the list
//             const firstEmp = emps[0];
//             setSelectedEmployeeId(firstEmp.id);
//             await refreshDataForEmployee(firstEmp.id);
//         } else {
//             setLoading(false);
//         }
//     };

//     const fetchAllEmployees = async () => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, full_name, department, employee_code, joining_date")
//             .order("full_name", { ascending: true });

//         if (!error && data) {
//             setAllEmployees(data);
//             return data;
//         }
//         return [];
//     };

//     const refreshDataForEmployee = async (employeeId: string) => {
//         setLoading(true);
//         try {
//             const empData = await fetchEmployee(employeeId);
//             const leavesData = await fetchLeaves(employeeId);
//             const creditsData = await fetchElCredits(employeeId);

//             if (empData) {
//                 processLeaveAllocations(empData, leavesData, creditsData);
//             }
//         } catch (err) {
//             console.error("Dashboard calculation sequence encountered an error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSelectEmployee = (id: string) => {
//         setSelectedEmployeeId(id);
//         refreshDataForEmployee(id);
//     };

//     const fetchEmployee = async (id: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("id", id)
//             .single();
//         if (error) return null;
//         setEmployee(data);
//         return data;
//     };

//     const fetchLeaves = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select(`
//         id,
//         employee_id,
//         employee_name,
//         department,
//         leave_date,
//         half,
//         allocation_source_type,
//         allocation_source_year,
//         allocation_source_month
//       `)
//             .eq("employee_id", employeeId)
//             .order("leave_date", { ascending: true })
//             .order("half", { ascending: true });

//         const validLeaves = data || [];
//         setLeaves(validLeaves);
//         return validLeaves;
//     };

//     const fetchElCredits = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*")
//             .eq("employee_id", employeeId);

//         const validCredits = data || [];
//         setElCredits(validCredits);
//         return validCredits;
//     };

//     const processLeaveAllocations = (
//         emp: any,
//         allLeaves: any[],
//         credits: any[]
//     ) => {
//         const allocatedCasual: any = {};
//         const allocatedSick: any = {};
//         const allocatedLop: any = {};
//         const allocatedEarned: any = {};

//         FINANCIAL_MONTHS.forEach((m) => {
//             allocatedCasual[m.index] = { "1H": [], "2H": [] };
//             allocatedSick[m.index] = { "1H": [], "2H": [] };
//             allocatedLop[m.index] = { count: 0, dates: [] };
//             allocatedEarned[m.index] = {
//                 taken: 0,
//                 available: 0,
//                 creditDates: [],
//                 consumeDates: []
//             };
//         });

//         credits.forEach((credit) => {
//             const month = dayjs(credit.credit_date).month();
//             allocatedEarned[month].available += Number(credit.count || 0);
//             allocatedEarned[month].creditDates.push(
//                 dayjs(credit.credit_date).format("DD/M")
//             );
//         });

//         allLeaves.forEach((row) => {
//             const type = row.allocation_source_type;
//             const month = Number(row.allocation_source_month);
//             const half = row.half;
//             const leaveDate = dayjs(row.leave_date).format("DD/M");

//             if (!type || month === null || month === undefined) return;

//             const m = month - 1;

//             if (type === "casual") {
//                 allocatedCasual[m]?.[half]?.push(leaveDate);
//                 return;
//             }

//             if (type === "sick") {
//                 allocatedSick[m]?.[half]?.push(leaveDate);
//                 return;
//             }

//             if (type === "earned") {
//                 allocatedEarned[m].taken += 0.5;
//                 allocatedEarned[m].consumeDates.push(leaveDate);
//                 return;
//             }

//             if (type === "lop") {
//                 if (!allocatedLop[m]) {
//                     allocatedLop[m] = { count: 0, dates: [] };
//                 }
//                 allocatedLop[m].count += 0.5;
//                 allocatedLop[m].dates.push(leaveDate);
//                 return;
//             }
//         });

//         setUiMap({
//             casual: allocatedCasual,
//             sick: allocatedSick,
//             lop: allocatedLop,
//             earned: allocatedEarned,
//         });
//     };

//     const isMonthStruck = (monthIndex: number) => {
//         if (!employee?.joining_date) return false;

//         const joinDate = dayjs(employee.joining_date);

//         const financialStartYear =
//             joinDate.month() >= 3
//                 ? joinDate.year()
//                 : joinDate.year() - 1;

//         const monthYear =
//             monthIndex >= 3
//                 ? financialStartYear
//                 : financialStartYear + 1;

//         const targetMonth = dayjs()
//             .year(monthYear)
//             .month(monthIndex)
//             .startOf("month");

//         return targetMonth.isBefore(
//             joinDate.startOf("month"),
//             "month"
//         );
//     };

//     const handleApplyLeave = async (values: any) => {
//         if (!employee) return;
//         if (!values.dateRange || values.dateRange.length !== 2) {
//             message.error("Please select a valid date range.");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const startDate = values.dateRange[0];
//             const endDate = values.dateRange[1];
//             const leaveRows: any[] = [];
//             const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//             const handoverName = handoverPerson ? handoverPerson.full_name : "";

//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//                 const formattedDate = currentDate.format("YYYY-MM-DD");

//                 const baseRow = {
//                     employee_id: employee.id,
//                     employee_name: employee.full_name,
//                     department: employee.department,
//                     handover_name: handoverName,
//                     leave_date: formattedDate,
//                     type: "Pending_Allocation",
//                     status: "pending",
//                     reason: values.reason
//                 };

//                 if (values.half === "Full") {
//                     leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//                 } else {
//                     leaveRows.push({ ...baseRow, half: values.half });
//                 }
//                 currentDate = currentDate.add(1, "day");
//             }

//             const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//             if (error) throw error;

//             message.success("Leave request submitted for review successfully!");
//             setIsModalOpen(false);
//             form.resetFields();
//             refreshDataForEmployee(employee.id);
//         } catch (err: any) {
//             message.error(err.message || "Failed to save leave records.");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const departmentPeers = allEmployees.filter(
//         (emp) => emp.department === employee?.department && emp.id !== employee?.id
//     );

//     const getSummaryStats = () => {
//         if (!employee?.joining_date) {
//             return { casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0 };
//         }

//         const joinDate = dayjs(employee.joining_date);
//         const currentDate = dayjs();

//         const financialStartYear = joinDate.month() >= 3
//             ? joinDate.year()
//             : joinDate.year() - 1;

//         let effectiveStartDate = joinDate.startOf("month");
//         const cycleStartDate = dayjs().year(financialStartYear).month(3).startOf("month");

//         if (joinDate.isBefore(cycleStartDate)) {
//             effectiveStartDate = cycleStartDate;
//         }

//         let count = currentDate.diff(effectiveStartDate, "month") + 1;
//         if (count < 0) count = 0;

//         const casualAllowed = count;
//         const sickAllowed = count;
//         const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
//         const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

//         let totalTaken = 0;
//         Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

//         return {
//             casual: casualAllowed,
//             sick: sickAllowed,
//             earned: earnedAllowed,
//             total: totalAllowed,
//             taken: totalTaken,
//             balance: totalAllowed - totalTaken,
//             lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0)
//         };
//     };

//     if (loading) {
//         return (
//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//                 <Spin size="large" />
//                 <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//             {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//             <Card
//                 style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//                 title={
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
//                         <span>HR Employee Information Dashboard</span>
//                         {/* STAFF SELECTOR DROPDOWN */}
//                         <Select
//                             showSearch
//                             placeholder="Select Staff..."
//                             value={selectedEmployeeId}
//                             onChange={handleSelectEmployee}
//                             style={{ width: 260, fontWeight: "normal" }}
//                             optionFilterProp="children"
//                         >
//                             {allEmployees
//                                 .filter((emp) => emp.employee_code?.toUpperCase().includes("EXR"))
//                                 .map((emp) => (
//                                     <Select.Option key={emp.id} value={emp.id}>
//                                         {emp.full_name} ({emp.employee_code})
//                                     </Select.Option>
//                                 ))}
//                         </Select>
//                     </div>
//                 }
//             // extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Register Leaves</Button>}
//             >
//                 <Row gutter={16} style={{ marginBottom: 15 }}>
//                     <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//                     <Col span={6}><b>Department:</b> {employee?.department}</Col>
//                     <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//                     <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//                 </Row>

//                 {/* BEAUTIFIED SUMMARY ROW */}
//                 {(() => {
//                     const stats = getSummaryStats();
//                     const formulaItems = [
//                         { label: "CASUAL", value: stats.casual },
//                         { label: "SICK", value: stats.sick },
//                         { label: "EARNED", value: stats.earned },
//                     ];

//                     return (
//                         <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
//                             {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
//                             <Col span={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//                                 {formulaItems.map((item, idx) => (
//                                     <div key={idx} style={{ display: "flex", alignItems: "center" }}>
//                                         <div style={{ textAlign: "center" }}>
//                                             <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
//                                             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
//                                         </div>
//                                         {idx < formulaItems.length - 1 && <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>+</span>}
//                                     </div>
//                                 ))}
//                                 <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>=</span>
//                                 <div style={{ textAlign: "center" }}>
//                                     <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
//                                     <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
//                                 </div>
//                             </Col>

//                             {/* Metrics Section */}
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
//                             </Col>
//                         </Row>
//                     );
//                 })()}
//             </Card>

//             {/* RENDER GRID INTERFACE */}
//             <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//                 {/* 1. Casual Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 2. Sick Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>
//                         Holiday Working Bonus (Earned Leave Ledger)
//                     </h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div
//                                 key={m.name}
//                                 style={{
//                                     borderRight: "1px solid #000",
//                                     background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
//                                     padding: 4,
//                                     minWidth: 0,
//                                     overflow: "hidden"
//                                 }}
//                             >
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
//                                     {m.name}
//                                 </div>
//                                 <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
//                                     <div style={{ color: "#52c41a", fontWeight: "bold" }}>
//                                         Credit: {uiMap.earned[m.index]?.available || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#52c41a",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.creditDates?.length
//                                             ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                     <div style={{ color: "#1677ff", fontWeight: "bold" }}>
//                                         Used: {uiMap.earned[m.index]?.taken || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#1677ff",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.consumeDates?.length
//                                             ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 4. Loss Of Pay Residual Balancer */}
//                 <div>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div
//                                 key={m.name}
//                                 style={{
//                                     borderRight: "1px solid #000",
//                                     padding: 6,
//                                     background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
//                                     minWidth: 0,
//                                     overflow: "hidden"
//                                 }}
//                             >
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                                     {uiMap.lop[m.index]?.count} DAYS
//                                 </div>
//                                 <div
//                                     style={{
//                                         fontSize: "9px",
//                                         color: "red",
//                                         minHeight: 15,
//                                         fontWeight: "bold",
//                                         wordBreak: "break-word",
//                                         overflowWrap: "anywhere"
//                                     }}
//                                 >
//                                     {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </Card>

//             {/* DIALOG APPLICATION WINDOWS */}
//             <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//                 <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//                     <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//                         <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//                     </Form.Item>
//                     <Form.Item name="half" label="Day Span Allocation">
//                         <Radio.Group optionType="button" buttonStyle="solid">
//                             <Radio.Button value="Full">Full Day</Radio.Button>
//                             <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//                             <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//                         </Radio.Group>
//                     </Form.Item>
//                     <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//                         <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//                             {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//                         </Select>
//                     </Form.Item>
//                     <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//                         <Input.TextArea rows={3} maxLength={250} showCount />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }






// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function HRStaffDashboard() {
//     const [employee, setEmployee] = useState<any>(null);
//     const [allEmployees, setAllEmployees] = useState<any[]>([]);
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

//     const [leaves, setLeaves] = useState<any[]>([]);
//     const [elCredits, setElCredits] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [form] = Form.useForm();

//     // TypeScript-Safe Layout Allocation State Maps
//     const [uiMap, setUiMap] = useState<{
//         casual: Record<number, Record<string, string[]>>;
//         sick: Record<number, Record<string, string[]>>;
//         lop: Record<number, { count: number; dates: string[] }>;
//         earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[]; }>;
//     }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//     // Load all staff list on initial render
//     useEffect(() => {
//         initHRDashboard();
//     }, []);

//     const initHRDashboard = async () => {
//         setLoading(true);
//         const emps = await fetchAllEmployees();
//         if (emps && emps.length > 0) {
//             // Default selection to the first employee in the list
//             const firstEmp = emps[0];
//             setSelectedEmployeeId(firstEmp.id);
//             await refreshDataForEmployee(firstEmp.id);
//         } else {
//             setLoading(false);
//         }
//     };

//     const fetchAllEmployees = async () => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, full_name, department, employee_code, joining_date")
//             .order("full_name", { ascending: true });

//         if (!error && data) {
//             setAllEmployees(data);
//             return data;
//         }
//         return [];
//     };

//     const refreshDataForEmployee = async (employeeId: string) => {
//         setLoading(true);
//         try {
//             const empData = await fetchEmployee(employeeId);
//             const leavesData = await fetchLeaves(employeeId);
//             const creditsData = await fetchElCredits(employeeId);

//             if (empData) {
//                 processLeaveAllocations(empData, leavesData, creditsData);
//             }
//         } catch (err) {
//             console.error("Dashboard calculation sequence encountered an error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSelectEmployee = (id: string) => {
//         setSelectedEmployeeId(id);
//         refreshDataForEmployee(id);
//     };

//     const fetchEmployee = async (id: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("id", id)
//             .single();
//         if (error) return null;
//         setEmployee(data);
//         return data;
//     };

//     const fetchLeaves = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select(`
//         id,
//         employee_id,
//         employee_name,
//         department,
//         leave_date,
//         half,
//         allocated_type,
//         allocation_source_type,
//         allocation_source_year,
//         allocation_source_month
//       `)
//             .eq("employee_id", employeeId)
//             .order("leave_date", { ascending: true })
//             .order("half", { ascending: true });

//         const validLeaves = data || [];
//         setLeaves(validLeaves);
//         return validLeaves;
//     };

//     const fetchElCredits = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*")
//             .eq("employee_id", employeeId);

//         const validCredits = data || [];
//         setElCredits(validCredits);
//         return validCredits;
//     };

//     const processLeaveAllocations = (
//         emp: any,
//         allLeaves: any[],
//         credits: any[]
//     ) => {
//         const allocatedCasual: any = {};
//         const allocatedSick: any = {};
//         const allocatedLop: any = {};
//         const allocatedEarned: any = {};

//         FINANCIAL_MONTHS.forEach((m) => {
//             allocatedCasual[m.index] = { "1H": [], "2H": [] };
//             allocatedSick[m.index] = { "1H": [], "2H": [] };
//             allocatedLop[m.index] = { count: 0, dates: [] };
//             allocatedEarned[m.index] = {
//                 taken: 0,
//                 available: 0,
//                 creditDates: [],
//                 consumeDates: []
//             };
//         });

//         credits.forEach((credit) => {
//             const month = dayjs(credit.credit_date).month();
//             allocatedEarned[month].available += Number(credit.count || 0);
//             allocatedEarned[month].creditDates.push(
//                 dayjs(credit.credit_date).format("DD/M")
//             );
//         });

//         allLeaves.forEach((row) => {
//             const type = row.allocation_source_type;
//             const month = Number(row.allocation_source_month);
//             const leaveDate = dayjs(row.leave_date).format("DD/M");

//             if (!type || month === null || month === undefined) return;

//             const m = month - 1;

//             // Determine slot half (1H vs 2H) from allocated_type (e.g. sick_2H_2026_4)
//             const allocatedTag = String(row.allocated_type || "").toLowerCase();
//             const slotHalf = allocatedTag.includes("_2h_")
//                 ? "2H"
//                 : allocatedTag.includes("_1h_")
//                 ? "1H"
//                 : row.half;

//             if (type === "casual") {
//                 allocatedCasual[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (type === "sick") {
//                 allocatedSick[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (type === "earned") {
//                 allocatedEarned[m].taken += 0.5;
//                 allocatedEarned[m].consumeDates.push(leaveDate);
//                 return;
//             }

//             if (type === "lop") {
//                 if (!allocatedLop[m]) {
//                     allocatedLop[m] = { count: 0, dates: [] };
//                 }
//                 allocatedLop[m].count += 0.5;
//                 allocatedLop[m].dates.push(leaveDate);
//                 return;
//             }
//         });

//         setUiMap({
//             casual: allocatedCasual,
//             sick: allocatedSick,
//             lop: allocatedLop,
//             earned: allocatedEarned,
//         });
//     };

//     const isMonthStruck = (monthIndex: number) => {
//         if (!employee?.joining_date) return false;

//         const joinDate = dayjs(employee.joining_date);

//         const financialStartYear =
//             joinDate.month() >= 3
//                 ? joinDate.year()
//                 : joinDate.year() - 1;

//         const monthYear =
//             monthIndex >= 3
//                 ? financialStartYear
//                 : financialStartYear + 1;

//         const targetMonth = dayjs()
//             .year(monthYear)
//             .month(monthIndex)
//             .startOf("month");

//         return targetMonth.isBefore(
//             joinDate.startOf("month"),
//             "month"
//         );
//     };

//     const handleApplyLeave = async (values: any) => {
//         if (!employee) return;
//         if (!values.dateRange || values.dateRange.length !== 2) {
//             message.error("Please select a valid date range.");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const startDate = values.dateRange[0];
//             const endDate = values.dateRange[1];
//             const leaveRows: any[] = [];
//             const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//             const handoverName = handoverPerson ? handoverPerson.full_name : "";

//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//                 const formattedDate = currentDate.format("YYYY-MM-DD");

//                 const baseRow = {
//                     employee_id: employee.id,
//                     employee_name: employee.full_name,
//                     department: employee.department,
//                     handover_name: handoverName,
//                     leave_date: formattedDate,
//                     type: "Pending_Allocation",
//                     status: "pending",
//                     reason: values.reason
//                 };

//                 if (values.half === "Full") {
//                     leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//                 } else {
//                     leaveRows.push({ ...baseRow, half: values.half });
//                 }
//                 currentDate = currentDate.add(1, "day");
//             }

//             const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//             if (error) throw error;

//             message.success("Leave request submitted for review successfully!");
//             setIsModalOpen(false);
//             form.resetFields();
//             refreshDataForEmployee(employee.id);
//         } catch (err: any) {
//             message.error(err.message || "Failed to save leave records.");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const departmentPeers = allEmployees.filter(
//         (emp) => emp.department === employee?.department && emp.id !== employee?.id
//     );

//     const getSummaryStats = () => {
//         if (!employee?.joining_date) {
//             return { casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0 };
//         }

//         const joinDate = dayjs(employee.joining_date);
//         const currentDate = dayjs();

//         const financialStartYear = joinDate.month() >= 3
//             ? joinDate.year()
//             : joinDate.year() - 1;

//         let effectiveStartDate = joinDate.startOf("month");
//         const cycleStartDate = dayjs().year(financialStartYear).month(3).startOf("month");

//         if (joinDate.isBefore(cycleStartDate)) {
//             effectiveStartDate = cycleStartDate;
//         }

//         let count = currentDate.diff(effectiveStartDate, "month") + 1;
//         if (count < 0) count = 0;

//         const casualAllowed = count;
//         const sickAllowed = count;
//         const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
//         const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

//         let totalTaken = 0;
//         Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

//         return {
//             casual: casualAllowed,
//             sick: sickAllowed,
//             earned: earnedAllowed,
//             total: totalAllowed,
//             taken: totalTaken,
//             balance: totalAllowed - totalTaken,
//             lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0)
//         };
//     };

//     if (loading) {
//         return (
//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//                 <Spin size="large" />
//                 <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//             {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//             <Card
//                 style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//                 title={
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
//                         <span>HR Employee Information Dashboard</span>
//                         {/* STAFF SELECTOR DROPDOWN */}
//                         <Select
//                             showSearch
//                             placeholder="Select Staff..."
//                             value={selectedEmployeeId}
//                             onChange={handleSelectEmployee}
//                             style={{ width: 260, fontWeight: "normal" }}
//                             optionFilterProp="children"
//                         >
//                             {allEmployees
//                                 .filter((emp) => emp.employee_code?.toUpperCase().includes("EXR"))
//                                 .map((emp) => (
//                                     <Select.Option key={emp.id} value={emp.id}>
//                                         {emp.full_name} ({emp.employee_code})
//                                     </Select.Option>
//                                 ))}
//                         </Select>
//                     </div>
//                 }
//             >
//                 <Row gutter={16} style={{ marginBottom: 15 }}>
//                     <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//                     <Col span={6}><b>Department:</b> {employee?.department}</Col>
//                     <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//                     <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//                 </Row>

//                 {/* BEAUTIFIED SUMMARY ROW */}
//                 {(() => {
//                     const stats = getSummaryStats();
//                     const formulaItems = [
//                         { label: "CASUAL", value: stats.casual },
//                         { label: "SICK", value: stats.sick },
//                         { label: "EARNED", value: stats.earned },
//                     ];

//                     return (
//                         <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
//                             {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
//                             <Col span={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//                                 {formulaItems.map((item, idx) => (
//                                     <div key={idx} style={{ display: "flex", alignItems: "center" }}>
//                                         <div style={{ textAlign: "center" }}>
//                                             <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
//                                             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
//                                         </div>
//                                         {idx < formulaItems.length - 1 && <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>+</span>}
//                                     </div>
//                                 ))}
//                                 <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>=</span>
//                                 <div style={{ textAlign: "center" }}>
//                                     <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
//                                     <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
//                                 </div>
//                             </Col>

//                             {/* Metrics Section */}
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
//                             </Col>
//                         </Row>
//                     );
//                 })()}
//             </Card>

//             {/* RENDER GRID INTERFACE */}
//             <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//                 {/* 1. Casual Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 2. Sick Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>
//                         Holiday Working Bonus (Earned Leave Ledger)
//                     </h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div
//                                 key={m.name}
//                                 style={{
//                                     borderRight: "1px solid #000",
//                                     background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
//                                     padding: 4,
//                                     minWidth: 0,
//                                     overflow: "hidden"
//                                 }}
//                             >
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
//                                     {m.name}
//                                 </div>
//                                 <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
//                                     <div style={{ color: "#52c41a", fontWeight: "bold" }}>
//                                         Credit: {uiMap.earned[m.index]?.available || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#52c41a",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.creditDates?.length
//                                             ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                     <div style={{ color: "#1677ff", fontWeight: "bold" }}>
//                                         Used: {uiMap.earned[m.index]?.taken || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#1677ff",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.consumeDates?.length
//                                             ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 4. Loss Of Pay Residual Balancer */}
//                 <div>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             <div
//                                 key={m.name}
//                                 style={{
//                                     borderRight: "1px solid #000",
//                                     padding: 6,
//                                     background: isMonthStruck(m.index) ? "#e8e8e8" : "none",
//                                     minWidth: 0,
//                                     overflow: "hidden"
//                                 }}
//                             >
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                                     {uiMap.lop[m.index]?.count} DAYS
//                                 </div>
//                                 <div
//                                     style={{
//                                         fontSize: "9px",
//                                         color: "red",
//                                         minHeight: 15,
//                                         fontWeight: "bold",
//                                         wordBreak: "break-word",
//                                         overflowWrap: "anywhere"
//                                     }}
//                                 >
//                                     {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </Card>

//             {/* DIALOG APPLICATION WINDOWS */}
//             <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//                 <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//                     <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//                         <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//                     </Form.Item>
//                     <Form.Item name="half" label="Day Span Allocation">
//                         <Radio.Group optionType="button" buttonStyle="solid">
//                             <Radio.Button value="Full">Full Day</Radio.Button>
//                             <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//                             <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//                         </Radio.Group>
//                     </Form.Item>
//                     <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//                         <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//                             {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//                         </Select>
//                     </Form.Item>
//                     <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//                         <Input.TextArea rows={3} maxLength={250} showCount />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }











// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function HRStaffDashboard() {
//     const [employee, setEmployee] = useState<any>(null);
//     const [allEmployees, setAllEmployees] = useState<any[]>([]);
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

//     const [leaves, setLeaves] = useState<any[]>([]);
//     const [elCredits, setElCredits] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [form] = Form.useForm();

//     // TypeScript-Safe Layout Allocation State Maps
//     const [uiMap, setUiMap] = useState<{
//         casual: Record<number, Record<string, string[]>>;
//         sick: Record<number, Record<string, string[]>>;
//         lop: Record<number, { count: number; dates: string[] }>;
//         earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[]; }>;
//     }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//     // Load all staff list on initial render
//     useEffect(() => {
//         initHRDashboard();
//     }, []);

//     const initHRDashboard = async () => {
//         setLoading(true);
//         const emps = await fetchAllEmployees();
//         if (emps && emps.length > 0) {
//             const firstEmp = emps[0];
//             setSelectedEmployeeId(firstEmp.id);
//             await refreshDataForEmployee(firstEmp.id);
//         } else {
//             setLoading(false);
//         }
//     };

//     const fetchAllEmployees = async () => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, full_name, department, employee_code, joining_date")
//             .order("full_name", { ascending: true });

//         if (!error && data) {
//             setAllEmployees(data);
//             return data;
//         }
//         return [];
//     };

//     const refreshDataForEmployee = async (employeeId: string) => {
//         setLoading(true);
//         try {
//             const empData = await fetchEmployee(employeeId);
//             const leavesData = await fetchLeaves(employeeId);
//             const creditsData = await fetchElCredits(employeeId);

//             if (empData) {
//                 processLeaveAllocations(empData, leavesData, creditsData);
//             }
//         } catch (err) {
//             console.error("Dashboard calculation sequence encountered an error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSelectEmployee = (id: string) => {
//         setSelectedEmployeeId(id);
//         refreshDataForEmployee(id);
//     };

//     const fetchEmployee = async (id: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("id", id)
//             .single();
//         if (error) return null;
//         setEmployee(data);
//         return data;
//     };

//     const fetchLeaves = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select(`
//         id,
//         employee_id,
//         employee_name,
//         department,
//         leave_date,
//         half,
//         allocated_type,
//         allocation_source_type,
//         allocation_source_year,
//         allocation_source_month
//       `)
//             .eq("employee_id", employeeId)
//             .order("leave_date", { ascending: true })
//             .order("half", { ascending: true });

//         const validLeaves = data || [];
//         setLeaves(validLeaves);
//         return validLeaves;
//     };

//     const fetchElCredits = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*")
//             .eq("employee_id", employeeId);

//         const validCredits = data || [];
//         setElCredits(validCredits);
//         return validCredits;
//     };

//     const processLeaveAllocations = (
//         emp: any,
//         allLeaves: any[],
//         credits: any[]
//     ) => {
//         const allocatedCasual: any = {};
//         const allocatedSick: any = {};
//         const allocatedLop: any = {};
//         const allocatedEarned: any = {};

//         FINANCIAL_MONTHS.forEach((m) => {
//             allocatedCasual[m.index] = { "1H": [], "2H": [] };
//             allocatedSick[m.index] = { "1H": [], "2H": [] };
//             allocatedLop[m.index] = { count: 0, dates: [] };
//             allocatedEarned[m.index] = {
//                 taken: 0,
//                 available: 0,
//                 creditDates: [],
//                 consumeDates: []
//             };
//         });

//         // 1. Accumulate Earned Leave Credits per month
//         credits.forEach((credit) => {
//             const month = dayjs(credit.credit_date).month();
//             allocatedEarned[month].available += Number(credit.count || 0);
//             allocatedEarned[month].creditDates.push(
//                 dayjs(credit.credit_date).format("DD/M")
//             );
//         });

//         // 2. Process Leaves directly based on allocation_source_type / allocated_type
//         allLeaves.forEach((row) => {
//             const rawType = String(row.allocation_source_type || "").trim().toLowerCase();
//             const allocatedTag = String(row.allocated_type || "").toLowerCase();
//             const month = Number(row.allocation_source_month);
//             const leaveDate = dayjs(row.leave_date).format("DD/M");

//             if (month === null || month === undefined || isNaN(month)) return;

//             const m = month - 1;

//             // Determine slot half (1H vs 2H)
//             const slotHalf = allocatedTag.includes("_2h_")
//                 ? "2H"
//                 : allocatedTag.includes("_1h_")
//                 ? "1H"
//                 : row.half;

//             if (rawType === "casual") {
//                 allocatedCasual[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (rawType === "sick") {
//                 allocatedSick[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (rawType === "earned") {
//                 allocatedEarned[m].taken += 0.5;
//                 allocatedEarned[m].consumeDates.push(leaveDate);
//                 return;
//             }

//             // Strictly route LOP tagged rows to the LOP section
//             if (rawType === "lop" || allocatedTag.startsWith("lop_")) {
//                 if (!allocatedLop[m]) {
//                     allocatedLop[m] = { count: 0, dates: [] };
//                 }
//                 allocatedLop[m].count += 0.5;
//                 allocatedLop[m].dates.push(leaveDate);
//                 return;
//             }
//         });

//         setUiMap({
//             casual: allocatedCasual,
//             sick: allocatedSick,
//             lop: allocatedLop,
//             earned: allocatedEarned,
//         });
//     };



// const isDailyWageMonth = (monthIndex: number) => {
//     if (!employee?.daily_wage_until) return false;

//     const joinDate = dayjs(employee.joining_date);
//     const dailyWageUntil = dayjs(employee.daily_wage_until);

//     return (
//         employee?.is_daily_wage_joining_month === true &&
//         monthIndex === joinDate.month() &&
//         dailyWageUntil.isSame(joinDate, "month")
//     );
// };


//     const isMonthStruck = (monthIndex: number) => {
//         if (!employee?.joining_date) return false;

//         const joinDate = dayjs(employee.joining_date);

//         const financialStartYear =
//             joinDate.month() >= 3
//                 ? joinDate.year()
//                 : joinDate.year() - 1;

//         const monthYear =
//             monthIndex >= 3
//                 ? financialStartYear
//                 : financialStartYear + 1;

//         const targetMonth = dayjs()
//             .year(monthYear)
//             .month(monthIndex)
//             .startOf("month");

//         return targetMonth.isBefore(
//             joinDate.startOf("month"),
//             "month"
//         );
//     };

//     const handleApplyLeave = async (values: any) => {
//         if (!employee) return;
//         if (!values.dateRange || values.dateRange.length !== 2) {
//             message.error("Please select a valid date range.");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const startDate = values.dateRange[0];
//             const endDate = values.dateRange[1];
//             const leaveRows: any[] = [];
//             const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//             const handoverName = handoverPerson ? handoverPerson.full_name : "";

//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//                 const formattedDate = currentDate.format("YYYY-MM-DD");

//                 const baseRow = {
//                     employee_id: employee.id,
//                     employee_name: employee.full_name,
//                     department: employee.department,
//                     handover_name: handoverName,
//                     leave_date: formattedDate,
//                     type: "Pending_Allocation",
//                     status: "pending",
//                     reason: values.reason
//                 };

//                 if (values.half === "Full") {
//                     leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//                 } else {
//                     leaveRows.push({ ...baseRow, half: values.half });
//                 }
//                 currentDate = currentDate.add(1, "day");
//             }

//             const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//             if (error) throw error;

//             message.success("Leave request submitted for review successfully!");
//             setIsModalOpen(false);
//             form.resetFields();
//             refreshDataForEmployee(employee.id);
//         } catch (err: any) {
//             message.error(err.message || "Failed to save leave records.");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const departmentPeers = allEmployees.filter(
//         (emp) => emp.department === employee?.department && emp.id !== employee?.id
//     );

//     const getSummaryStats = () => {
//         if (!employee?.joining_date) {
//             return { casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0 };
//         }

//         const joinDate = dayjs(employee.joining_date);
//         const currentDate = dayjs();

//         const financialStartYear = joinDate.month() >= 3
//             ? joinDate.year()
//             : joinDate.year() - 1;

//         let effectiveStartDate = joinDate.startOf("month");
//         const cycleStartDate = dayjs().year(financialStartYear).month(3).startOf("month");

//         if (joinDate.isBefore(cycleStartDate)) {
//             effectiveStartDate = cycleStartDate;
//         }

//         let count = currentDate.diff(effectiveStartDate, "month") + 1;
//         if (count < 0) count = 0;

//         const casualAllowed = count;
//         const sickAllowed = count;
//         const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
//         const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

//         let totalTaken = 0;
//         Object.values(uiMap.casual).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.sick).forEach(m => totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5);
//         Object.values(uiMap.earned).forEach(m => totalTaken += m.taken || 0);

//         return {
//             casual: casualAllowed,
//             sick: sickAllowed,
//             earned: earnedAllowed,
//             total: totalAllowed,
//             taken: totalTaken,
//             balance: totalAllowed - totalTaken,
//             lop: Object.values(uiMap.lop).reduce((acc, m) => acc + (m.count || 0), 0)
//         };
//     };

//     if (loading) {
//         return (
//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//                 <Spin size="large" />
//                 <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//             {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//             <Card
//                 style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//                 title={
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
//                         <span>HR Employee Information Dashboard</span>
//                         {/* STAFF SELECTOR DROPDOWN */}
//                         <Select
//                             showSearch
//                             placeholder="Select Staff..."
//                             value={selectedEmployeeId}
//                             onChange={handleSelectEmployee}
//                             style={{ width: 260, fontWeight: "normal" }}
//                             optionFilterProp="children"
//                         >
//                             {allEmployees
//                                 .filter((emp) => emp.employee_code?.toUpperCase().includes("EXR"))
//                                 .map((emp) => (
//                                     <Select.Option key={emp.id} value={emp.id}>
//                                         {emp.full_name} ({emp.employee_code})
//                                     </Select.Option>
//                                 ))}
//                         </Select>
//                     </div>
//                 }
//             >
//                 <Row gutter={16} style={{ marginBottom: 15 }}>
//                     <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//                     <Col span={6}><b>Department:</b> {employee?.department}</Col>
//                     <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//                     <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//                 </Row>

//                 {/* BEAUTIFIED SUMMARY ROW */}
//                 {(() => {
//                     const stats = getSummaryStats();
//                     const formulaItems = [
//                         { label: "CASUAL", value: stats.casual },
//                         { label: "SICK", value: stats.sick },
//                         { label: "EARNED", value: stats.earned },
//                     ];

//                     return (
//                         <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
//                             {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
//                             <Col span={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//                                 {formulaItems.map((item, idx) => (
//                                     <div key={idx} style={{ display: "flex", alignItems: "center" }}>
//                                         <div style={{ textAlign: "center" }}>
//                                             <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
//                                             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
//                                         </div>
//                                         {idx < formulaItems.length - 1 && <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>+</span>}
//                                     </div>
//                                 ))}
//                                 <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>=</span>
//                                 <div style={{ textAlign: "center" }}>
//                                     <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
//                                     <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
//                                 </div>
//                             </Col>

//                             {/* Metrics Section */}
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
//                             </Col>
//                         </Row>
//                     );
//                 })()}
//             </Card>

//             {/* RENDER GRID INTERFACE */}
//             <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//                 {/* 1. Casual Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             // <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>

//                             <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 2. Sick Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             // <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>


//                              <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>
//                         Holiday Working Bonus (Earned Leave Ledger)
//                     </h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//  <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
//                                     {m.name}
//                                 </div>
//                                 <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
//                                     <div style={{ color: "#52c41a", fontWeight: "bold" }}>
//                                         Credit: {uiMap.earned[m.index]?.available || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#52c41a",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.creditDates?.length
//                                             ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                     <div style={{ color: "#1677ff", fontWeight: "bold" }}>
//                                         Used: {uiMap.earned[m.index]?.taken || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#1677ff",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.consumeDates?.length
//                                             ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 4. Loss Of Pay Residual Balancer */}
//                 <div>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                              <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                                     {uiMap.lop[m.index]?.count} DAYS
//                                 </div>
//                                 <div
//                                     style={{
//                                         fontSize: "9px",
//                                         color: "red",
//                                         minHeight: 15,
//                                         fontWeight: "bold",
//                                         wordBreak: "break-word",
//                                         overflowWrap: "anywhere"
//                                     }}
//                                 >
//                                     {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </Card>

//             {/* DIALOG APPLICATION WINDOWS */}
//             <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//                 <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//                     <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//                         <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//                     </Form.Item>
//                     <Form.Item name="half" label="Day Span Allocation">
//                         <Radio.Group optionType="button" buttonStyle="solid">
//                             <Radio.Button value="Full">Full Day</Radio.Button>
//                             <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//                             <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//                         </Radio.Group>
//                     </Form.Item>
//                     <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//                         <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//                             {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//                         </Select>
//                     </Form.Item>
//                     <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//                         <Input.TextArea rows={3} maxLength={250} showCount />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }











// "use client";

// import { useEffect, useState } from "react";
// import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// export default function HRStaffDashboard() {
//     const [employee, setEmployee] = useState<any>(null);
//     const [allEmployees, setAllEmployees] = useState<any[]>([]);
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

//     const [leaves, setLeaves] = useState<any[]>([]);
//     const [elCredits, setElCredits] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

// const getCurrentFinancialYearStart = () => {
//     const today = dayjs();

//     return today.month() >= 3
//         ? today.year()
//         : today.year() - 1;
// };

// const [selectedFinancialYear, setSelectedFinancialYear] = useState<number>(
//     getCurrentFinancialYearStart()
// );

// const [isModalOpen, setIsModalOpen] = useState(false);
// const [submitting, setSubmitting] = useState(false);
// const [form] = Form.useForm();


// // ============================================
// // INITIAL DASHBOARD LOAD
// // ============================================
// useEffect(() => {
//     initHRDashboard();
// }, []);


// // ============================================
// // FINANCIAL YEAR CHANGE
// // ============================================
// useEffect(() => {
//     if (!employee || !selectedEmployeeId) return;

//     processLeaveAllocations(
//         employee,
//         leaves,
//         elCredits
//     );
// }, [selectedFinancialYear]);



//     // TypeScript-Safe Layout Allocation State Maps
//     const [uiMap, setUiMap] = useState<{
//         casual: Record<number, Record<string, string[]>>;
//         sick: Record<number, Record<string, string[]>>;
//         lop: Record<number, { count: number; dates: string[] }>;
//         earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[]; }>;
//     }>({ casual: {}, sick: {}, lop: {}, earned: {} });

//     // Load all staff list on initial render


//     const initHRDashboard = async () => {
//         setLoading(true);
//         const emps = await fetchAllEmployees();
//         if (emps && emps.length > 0) {
//             const firstEmp = emps[0];
//             setSelectedEmployeeId(firstEmp.id);
//             await refreshDataForEmployee(firstEmp.id);
//         } else {
//             setLoading(false);
//         }
//     };








// const getFinancialYearStart = (year: number, month: number) => {
//     // month is JavaScript month: 0 = Jan ... 11 = Dec
//     return month >= 3 ? year : year - 1;
// };

// const getFinancialYearLabel = (startYear: number) => {
//     return `${startYear}-${String(startYear + 1).slice(-2)}`;
// };

// const getSourceFinancialYear = (
//     sourceYear: number,
//     sourceMonth: number
// ) => {
//     // allocation_source_month is 1-12
//     const jsMonth = sourceMonth - 1;

//     return jsMonth >= 3
//         ? sourceYear
//         : sourceYear - 1;
// };





//     const fetchAllEmployees = async () => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, full_name, department, employee_code, joining_date")
//             .order("full_name", { ascending: true });

//         if (!error && data) {
//             setAllEmployees(data);
//             return data;
//         }
//         return [];
//     };

//     const refreshDataForEmployee = async (employeeId: string) => {
//         setLoading(true);
//         try {
//             const empData = await fetchEmployee(employeeId);
//             const leavesData = await fetchLeaves(employeeId);
//             const creditsData = await fetchElCredits(employeeId);

//             if (empData) {
//                 processLeaveAllocations(empData, leavesData, creditsData);
//             }
//         } catch (err) {
//             console.error("Dashboard calculation sequence encountered an error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSelectEmployee = (id: string) => {
//         setSelectedEmployeeId(id);
//         refreshDataForEmployee(id);
//     };

//     const fetchEmployee = async (id: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("id", id)
//             .single();
//         if (error) return null;
//         setEmployee(data);
//         return data;
//     };

//     const fetchLeaves = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select(`
//         id,
//         employee_id,
//         employee_name,
//         department,
//         leave_date,
//         half,
//         allocated_type,
//         allocation_source_type,
//         allocation_source_year,
//         allocation_source_month
//       `)
//             .eq("employee_id", employeeId)
//             .order("leave_date", { ascending: true })
//             .order("half", { ascending: true });

//         const validLeaves = data || [];
//         setLeaves(validLeaves);
//         return validLeaves;
//     };

//     const fetchElCredits = async (employeeId: string) => {
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*")
//             .eq("employee_id", employeeId);

//         const validCredits = data || [];
//         setElCredits(validCredits);
//         return validCredits;
//     };

//     const processLeaveAllocations = (
//         emp: any,
//         allLeaves: any[],
//         credits: any[]
//     ) => {
//         const allocatedCasual: any = {};
//         const allocatedSick: any = {};
//         const allocatedLop: any = {};
//         const allocatedEarned: any = {};
//         const targetFinancialYear = selectedFinancialYear;

//         FINANCIAL_MONTHS.forEach((m) => {
//             allocatedCasual[m.index] = { "1H": [], "2H": [] };
//             allocatedSick[m.index] = { "1H": [], "2H": [] };
//             allocatedLop[m.index] = { count: 0, dates: [] };
//             allocatedEarned[m.index] = {
//                 taken: 0,
//                 available: 0,
//                 creditDates: [],
//                 consumeDates: []
//             };
//         });

//         // 1. Accumulate Earned Leave Credits per month
// credits.forEach((credit) => {
//     if (!credit.credit_date) return;

//     const creditDate = dayjs(credit.credit_date);

//     const creditFinancialYear = getFinancialYearStart(
//         creditDate.year(),
//         creditDate.month()
//     );

//     // Only display credits belonging to selected financial year
//     if (creditFinancialYear !== targetFinancialYear) return;

//     const month = creditDate.month();

//     allocatedEarned[month].available += Number(credit.count || 0);

//     allocatedEarned[month].creditDates.push(
//         creditDate.format("DD/M")
//     );
// });

//         // 2. Process Leaves directly based on allocation_source_type / allocated_type
// allLeaves.forEach((row) => {
//     const rawType = String(
//         row.allocation_source_type || ""
//     ).trim().toLowerCase();

//     const allocatedTag = String(
//         row.allocated_type || ""
//     ).toLowerCase();

//     const sourceYear = Number(row.allocation_source_year);
//     const sourceMonth = Number(row.allocation_source_month);

//     // allocation_source_year = calendar year
//     // allocation_source_month = 1-12
//     if (
//         !sourceYear ||
//         !sourceMonth ||
//         sourceMonth < 1 ||
//         sourceMonth > 12
//     ) {
//         return;
//     }

//     // Determine which financial year this allocation belongs to
//     const leaveFinancialYear = getSourceFinancialYear(
//         sourceYear,
//         sourceMonth
//     );

//     // IMPORTANT:
//     // Ignore allocations belonging to another financial year
//     if (leaveFinancialYear !== targetFinancialYear) {
//         return;
//     }

//     const leaveDate = dayjs(row.leave_date).format("DD/M");

//     const m = sourceMonth - 1;

//             // Determine slot half (1H vs 2H)
//             const slotHalf = allocatedTag.includes("_2h_")
//                 ? "2H"
//                 : allocatedTag.includes("_1h_")
//                 ? "1H"
//                 : row.half;

//             if (rawType === "casual") {
//                 allocatedCasual[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (rawType === "sick") {
//                 allocatedSick[m]?.[slotHalf]?.push(leaveDate);
//                 return;
//             }

//             if (rawType === "earned") {
//                 allocatedEarned[m].taken += 0.5;
//                 allocatedEarned[m].consumeDates.push(leaveDate);
//                 return;
//             }

//             // Strictly route LOP tagged rows to the LOP section
//             if (rawType === "lop" || allocatedTag.startsWith("lop_")) {
//                 if (!allocatedLop[m]) {
//                     allocatedLop[m] = { count: 0, dates: [] };
//                 }
//                 allocatedLop[m].count += 0.5;
//                 allocatedLop[m].dates.push(leaveDate);
//                 return;
//             }
//         });

//         setUiMap({
//             casual: allocatedCasual,
//             sick: allocatedSick,
//             lop: allocatedLop,
//             earned: allocatedEarned,
//         });
//     };



// const isDailyWageMonth = (monthIndex: number) => {
//     if (!employee?.daily_wage_until) return false;

//     const joinDate = dayjs(employee.joining_date);
//     const dailyWageUntil = dayjs(employee.daily_wage_until);

//     return (
//         employee?.is_daily_wage_joining_month === true &&
//         monthIndex === joinDate.month() &&
//         dailyWageUntil.isSame(joinDate, "month")
//     );
// };


// const isMonthStruck = (monthIndex: number) => {
//     if (!employee?.joining_date) return false;

//     const joinDate = dayjs(employee.joining_date);

//     // Build the actual calendar year for this month
//     // based on the SELECTED financial year.
//     const monthYear =
//         monthIndex >= 3
//             ? selectedFinancialYear
//             : selectedFinancialYear + 1;

//     const targetMonth = dayjs()
//         .year(monthYear)
//         .month(monthIndex)
//         .startOf("month");

//     return targetMonth.isBefore(
//         joinDate.startOf("month"),
//         "month"
//     );
// };

//     const handleApplyLeave = async (values: any) => {
//         if (!employee) return;
//         if (!values.dateRange || values.dateRange.length !== 2) {
//             message.error("Please select a valid date range.");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const startDate = values.dateRange[0];
//             const endDate = values.dateRange[1];
//             const leaveRows: any[] = [];
//             const handoverPerson = allEmployees.find(emp => emp.id === values.handover_id);
//             const handoverName = handoverPerson ? handoverPerson.full_name : "";

//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
//                 const formattedDate = currentDate.format("YYYY-MM-DD");

//                 const baseRow = {
//                     employee_id: employee.id,
//                     employee_name: employee.full_name,
//                     department: employee.department,
//                     handover_name: handoverName,
//                     leave_date: formattedDate,
//                     type: "Pending_Allocation",
//                     status: "pending",
//                     reason: values.reason
//                 };

//                 if (values.half === "Full") {
//                     leaveRows.push({ ...baseRow, half: "1H" }, { ...baseRow, half: "2H" });
//                 } else {
//                     leaveRows.push({ ...baseRow, half: values.half });
//                 }
//                 currentDate = currentDate.add(1, "day");
//             }

//             const { error } = await supabase.schema("leave_management").from("leaves").insert(leaveRows);
//             if (error) throw error;

//             message.success("Leave request submitted for review successfully!");
//             setIsModalOpen(false);
//             form.resetFields();
//             refreshDataForEmployee(employee.id);
//         } catch (err: any) {
//             message.error(err.message || "Failed to save leave records.");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const departmentPeers = allEmployees.filter(
//         (emp) => emp.department === employee?.department && emp.id !== employee?.id
//     );

// const getSummaryStats = () => {
//     if (!employee?.joining_date) {
//         return {
//             casual: 0,
//             sick: 0,
//             earned: 0,
//             total: 0,
//             taken: 0,
//             balance: 0,
//             lop: 0
//         };
//     }

//     const joinDate = dayjs(employee.joining_date);

//     const financialYearStart = dayjs()
//         .year(selectedFinancialYear)
//         .month(3)
//         .startOf("month");

//     const financialYearEnd = dayjs()
//         .year(selectedFinancialYear + 1)
//         .month(2)
//         .endOf("month");

//     // Employee joining date is after the selected FY
//     if (joinDate.isAfter(financialYearEnd, "day")) {
//         return {
//             casual: 0,
//             sick: 0,
//             earned: 0,
//             total: 0,
//             taken: 0,
//             balance: 0,
//             lop: 0
//         };
//     }

//     const effectiveStartDate = joinDate.isAfter(
//         financialYearStart,
//         "month"
//     )
//         ? joinDate.startOf("month")
//         : financialYearStart;

// const effectiveEndDate = dayjs().isBefore(
//     financialYearEnd,
//     "day"
// )
//     ? dayjs()
//     : financialYearEnd;

//     let count =
//         effectiveEndDate.diff(
//             effectiveStartDate,
//             "month"
//         ) + 1;

//     if (count < 0) count = 0;

//     const casualAllowed = count;
//     const sickAllowed = count;

//     const earnedAllowed =
//         Object.values(uiMap.earned).reduce(
//             (acc, m) => acc + (m.available || 0),
//             0
//         );

//     const totalAllowed =
//         casualAllowed +
//         sickAllowed +
//         earnedAllowed;

//     let totalTaken = 0;

//     Object.values(uiMap.casual).forEach(
//         (m) =>
//             totalTaken +=
//                 (m["1H"]?.length || 0) * 0.5 +
//                 (m["2H"]?.length || 0) * 0.5
//     );

//     Object.values(uiMap.sick).forEach(
//         (m) =>
//             totalTaken +=
//                 (m["1H"]?.length || 0) * 0.5 +
//                 (m["2H"]?.length || 0) * 0.5
//     );

//     Object.values(uiMap.earned).forEach(
//         (m) =>
//             totalTaken += m.taken || 0
//     );

//     return {
//         casual: casualAllowed,
//         sick: sickAllowed,
//         earned: earnedAllowed,
//         total: totalAllowed,
//         taken: totalTaken,
//         balance: totalAllowed - totalTaken,
//         lop: Object.values(uiMap.lop).reduce(
//             (acc, m) => acc + (m.count || 0),
//             0
//         )
//     };
// };

//     if (loading) {
//         return (
//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "10px" }}>
//                 <Spin size="large" />
//                 <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>

//             {/* EMPLOYEE DETAIL PROFILE HEADER CARD */}
//             <Card
//                 style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
//                 title={
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
//                         <span>HR Employee Information Dashboard</span>
//                         {/* STAFF SELECTOR DROPDOWN */}
//                         <Select
//                             showSearch
//                             placeholder="Select Staff..."
//                             value={selectedEmployeeId}
//                             onChange={handleSelectEmployee}
//                             style={{ width: 260, fontWeight: "normal" }}
//                             optionFilterProp="children"
//                         >
//                             {allEmployees
//                                 .filter((emp) => emp.employee_code?.toUpperCase().includes("EXR"))
//                                 .map((emp) => (
//                                     <Select.Option key={emp.id} value={emp.id}>
//                                         {emp.full_name} ({emp.employee_code})
//                                     </Select.Option>
//                                 ))}
//                         </Select>
//                         <Select
//     value={selectedFinancialYear}
//     onChange={(year) => setSelectedFinancialYear(year)}
//     style={{
//         width: 140,
//         fontWeight: "bold"
//     }}
// >
//     {Array.from({ length: 6 }, (_, i) => {
//         const year = getCurrentFinancialYearStart() - i;

//         return (
//             <Select.Option key={year} value={year}>
//                 FY {getFinancialYearLabel(year)}
//             </Select.Option>
//         );
//     })}
// </Select>
//                     </div>
//                 }
//             >
//                 <Row gutter={16} style={{ marginBottom: 15 }}>
//                     <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
//                     <Col span={6}><b>Department:</b> {employee?.department}</Col>
//                     <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
//                     <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
//                 </Row>

//                 {/* BEAUTIFIED SUMMARY ROW */}
//                 {(() => {
//                     const stats = getSummaryStats();
//                     const formulaItems = [
//                         { label: "CASUAL", value: stats.casual },
//                         { label: "SICK", value: stats.sick },
//                         { label: "EARNED", value: stats.earned },
//                     ];

//                     return (
//                         <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
//                             {/* Formula Section: CASUAL + SICK + EARNED = ALLOWED */}
//                             <Col span={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//                                 {formulaItems.map((item, idx) => (
//                                     <div key={idx} style={{ display: "flex", alignItems: "center" }}>
//                                         <div style={{ textAlign: "center" }}>
//                                             <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
//                                             <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
//                                         </div>
//                                         {idx < formulaItems.length - 1 && <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>+</span>}
//                                     </div>
//                                 ))}
//                                 <span style={{ margin: "0 10px", fontSize: "18px", color: "#888" }}>=</span>
//                                 <div style={{ textAlign: "center" }}>
//                                     <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
//                                     <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
//                                 </div>
//                             </Col>

//                             {/* Metrics Section */}
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>TAKEN</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#faad14" }}>{stats.taken}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>BALANCE</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: stats.balance < 0 ? "red" : "#52c41a" }}>{stats.balance}</div>
//                             </Col>
//                             <Col span={4} style={{ textAlign: "center" }}>
//                                 <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>LOP</div>
//                                 <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>{stats.lop}</div>
//                             </Col>
//                         </Row>
//                     );
//                 })()}
//             </Card>

//             {/* RENDER GRID INTERFACE */}
//             <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">

//                 {/* 1. Casual Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             // <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>

//                             <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "green", fontWeight: "bold" }}>{uiMap.casual[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 2. Sick Leave Dynamic Tracker */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                             // <div key={m.name} style={{ borderRight: "1px solid #000", background: isMonthStruck(m.index) ? "#e8e8e8" : "none" }}>


//                              <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", padding: 4 }}>{m.name}</div>
//                                 <div style={{ display: "flex", fontSize: "11px" }}>
//                                     <div style={{ flex: 1, borderRight: "1px solid #ddd", padding: 4 }}>
//                                         <div style={{ color: "#888" }}>1H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["1H"]?.join(", ")}</div>
//                                     </div>
//                                     <div style={{ flex: 1, padding: 4 }}>
//                                         <div style={{ color: "#888" }}>2H</div>
//                                         <div style={{ minHeight: 20, color: "orange", fontWeight: "bold" }}>{uiMap.sick[m.index]?.["2H"]?.join(", ")}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 3. Company Holiday Bonus Ledger (Earned Leaves) */}
//                 <div style={{ marginBottom: 25 }}>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>
//                         Holiday Working Bonus (Earned Leave Ledger)
//                     </h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//  <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
//                                     {m.name}
//                                 </div>
//                                 <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
//                                     <div style={{ color: "#52c41a", fontWeight: "bold" }}>
//                                         Credit: {uiMap.earned[m.index]?.available || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#52c41a",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.creditDates?.length
//                                             ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                     <div style={{ color: "#1677ff", fontWeight: "bold" }}>
//                                         Used: {uiMap.earned[m.index]?.taken || 0}
//                                     </div>
//                                     <div
//                                         style={{
//                                             color: "#1677ff",
//                                             fontSize: 10,
//                                             minHeight: 18,
//                                             fontWeight: "bold",
//                                             wordBreak: "break-word",
//                                             overflowWrap: "anywhere"
//                                         }}
//                                     >
//                                         {uiMap.earned[m.index]?.consumeDates?.length
//                                             ? ` ${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}`
//                                             : ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 4. Loss Of Pay Residual Balancer */}
//                 <div>
//                     <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (Credits Exhausted)</h3>
//                     <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
//                         {FINANCIAL_MONTHS.map((m) => (
//                              <div
//     key={m.name}
//     style={{
//         position: "relative",
//         borderRight: "1px solid #000",
//         background:
//             isDailyWageMonth(m.index)
//                 ? "#f5f5f5"
//                 : isMonthStruck(m.index)
//                 ? "#e8e8e8"
//                 : "none"
//     }}
// >

//     {isDailyWageMonth(m.index) && (
//     <div
//         style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             transform: "rotate(-30deg)",
//             fontSize: 14,
//             fontWeight: "bold",
//             color: "rgba(255, 40, 40, 0.18)",
//             pointerEvents: "none",
//             zIndex: 10
//         }}
//     >
//         DAILY WAGE
//     </div>
// )}
//                                 <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
//                                 <div style={{ fontWeight: "bold", color: uiMap.lop[m.index]?.count > 0 ? "red" : "inherit", fontSize: "11px" }}>
//                                     {uiMap.lop[m.index]?.count} DAYS
//                                 </div>
//                                 <div
//                                     style={{
//                                         fontSize: "9px",
//                                         color: "red",
//                                         minHeight: 15,
//                                         fontWeight: "bold",
//                                         wordBreak: "break-word",
//                                         overflowWrap: "anywhere"
//                                     }}
//                                 >
//                                     {uiMap.lop[m.index]?.dates.length ? `D: ${Array.from(new Set(uiMap.lop[m.index].dates)).join(", ")}` : ""}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </Card>

//             {/* DIALOG APPLICATION WINDOWS */}
//             <Modal title="Register Leave Window" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={submitting}>
//                 <Form form={form} layout="vertical" onFinish={handleApplyLeave} initialValues={{ half: "Full" }}>
//                     <Form.Item name="dateRange" label="Select Date Spectrum" rules={[{ required: true }]}>
//                         <DatePicker.RangePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
//                     </Form.Item>
//                     <Form.Item name="half" label="Day Span Allocation">
//                         <Radio.Group optionType="button" buttonStyle="solid">
//                             <Radio.Button value="Full">Full Day</Radio.Button>
//                             <Radio.Button value="1H">1st Half (1H)</Radio.Button>
//                             <Radio.Button value="2H">2nd Half (2H)</Radio.Button>
//                         </Radio.Group>
//                     </Form.Item>
//                     <Form.Item name="handover_id" label="Duty Cover Representative" rules={[{ required: true }]}>
//                         <Select showSearch placeholder="Select employee..." optionFilterProp="children">
//                             {departmentPeers.map(emp => <Select.Option key={emp.id} value={emp.id}>{emp.full_name}</Select.Option>)}
//                         </Select>
//                     </Form.Item>
//                     <Form.Item name="reason" label="Purpose Justification" rules={[{ required: true }]}>
//                         <Input.TextArea rows={3} maxLength={250} showCount />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }






"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Spin, Button, Modal, DatePicker, Radio, Form, Input, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const FINANCIAL_MONTHS = [
  { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
  { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
  { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
  { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
];

export default function HRStaffDashboard() {
  const [employee, setEmployee] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [elCredits, setElCredits] = useState<any[]>([]);
  const [retentions, setRetentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentFinancialYearStart = () => {
    const today = dayjs();
    return today.month() >= 3 ? today.year() : today.year() - 1;
  };

  const [selectedFinancialYear, setSelectedFinancialYear] = useState<number>(
    getCurrentFinancialYearStart()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [uiMap, setUiMap] = useState<{
    casual: Record<number, Record<string, string[]>>;
    sick: Record<number, Record<string, string[]>>;
    lop: Record<number, { count: number; dates: string[] }>;
    earned: Record<number, { taken: number; available: number; creditDates: string[]; consumeDates: string[] }>;
    retention: Record<number, { amount: number; notes: string[] }>;
  }>({ casual: {}, sick: {}, lop: {}, earned: {}, retention: {} });

  useEffect(() => {
    initHRDashboard();
  }, []);

  useEffect(() => {
    if (!employee || !selectedEmployeeId) return;
    processLeaveAllocations(employee, leaves, elCredits, retentions);
  }, [selectedFinancialYear]);

  const initHRDashboard = async () => {
    setLoading(true);
    const emps = await fetchAllEmployees();
    if (emps && emps.length > 0) {
      const firstEmp = emps[0];
      setSelectedEmployeeId(firstEmp.id);
      await refreshDataForEmployee(firstEmp.id);
    } else {
      setLoading(false);
    }
  };

  const getFinancialYearStart = (year: number, month: number) => {
    return month >= 3 ? year : year - 1;
  };

  const getFinancialYearLabel = (startYear: number) => {
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  };

  const getSourceFinancialYear = (sourceYear: number, sourceMonth: number) => {
    const jsMonth = sourceMonth - 1;
    return jsMonth >= 3 ? sourceYear : sourceYear - 1;
  };

  const fetchAllEmployees = async () => {
    const { data, error } = await supabase
      .schema("leave_management")
      .from("employees")
      .select("id, full_name, department, employee_code, joining_date, opening_retention_amount")
      .order("full_name", { ascending: true });

    if (!error && data) {
      setAllEmployees(data);
      return data;
    }
    return [];
  };

  const refreshDataForEmployee = async (employeeId: string) => {
    setLoading(true);
    try {
      const empData = await fetchEmployee(employeeId);
      const leavesData = await fetchLeaves(employeeId);
      const creditsData = await fetchElCredits(employeeId);
      const retentionData = await fetchRetentions(employeeId);

      if (empData) {
        processLeaveAllocations(empData, leavesData, creditsData, retentionData);
      }
    } catch (err) {
      console.error("Dashboard calculation sequence encountered an error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    refreshDataForEmployee(id);
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
        allocated_type,
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

    if (error) {
      console.error("Error fetching retention data from payrolls:", error);
    }

    const validRetentions = data || [];
    setRetentions(validRetentions);
    return validRetentions;
  };

  const processLeaveAllocations = (emp: any, allLeaves: any[], credits: any[], retentionRecords: any[]) => {
    const allocatedCasual: any = {};
    const allocatedSick: any = {};
    const allocatedLop: any = {};
    const allocatedEarned: any = {};
    const allocatedRetention: any = {};
    const targetFinancialYear = selectedFinancialYear;

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
      allocatedRetention[m.index] = { amount: 0, notes: [] };
    });

    credits.forEach((credit) => {
      if (!credit.credit_date) return;
      const creditDate = dayjs(credit.credit_date);
      const creditFinancialYear = getFinancialYearStart(creditDate.year(), creditDate.month());

      if (creditFinancialYear !== targetFinancialYear) return;

      const month = creditDate.month();
      allocatedEarned[month].available += Number(credit.count || 0);
      allocatedEarned[month].creditDates.push(creditDate.format("DD/M"));
    });

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

    allLeaves.forEach((row) => {
      const rawType = String(row.allocation_source_type || "").trim().toLowerCase();
      const allocatedTag = String(row.allocated_type || "").toLowerCase();

      const sourceYear = Number(row.allocation_source_year);
      const sourceMonth = Number(row.allocation_source_month);

      if (!sourceYear || !sourceMonth || sourceMonth < 1 || sourceMonth > 12) {
        return;
      }

      const leaveFinancialYear = getSourceFinancialYear(sourceYear, sourceMonth);
      if (leaveFinancialYear !== targetFinancialYear) {
        return;
      }

      const leaveDate = dayjs(row.leave_date).format("DD/M");
      const m = sourceMonth - 1;

      const slotHalf = allocatedTag.includes("_2h_")
        ? "2H"
        : allocatedTag.includes("_1h_")
        ? "1H"
        : row.half;

      if (rawType === "casual") {
        allocatedCasual[m]?.[slotHalf]?.push(leaveDate);
        return;
      }

      if (rawType === "sick") {
        allocatedSick[m]?.[slotHalf]?.push(leaveDate);
        return;
      }

      if (rawType === "earned") {
        allocatedEarned[m].taken += 0.5;
        allocatedEarned[m].consumeDates.push(leaveDate);
        return;
      }

      if (rawType === "lop" || allocatedTag.startsWith("lop_")) {
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

  const isDailyWageMonth = (monthIndex: number) => {
    if (!employee?.daily_wage_until) return false;

    const joinDate = dayjs(employee.joining_date);
    const dailyWageUntil = dayjs(employee.daily_wage_until);

    return (
      employee?.is_daily_wage_joining_month === true &&
      monthIndex === joinDate.month() &&
      dailyWageUntil.isSame(joinDate, "month")
    );
  };

  const isMonthStruck = (monthIndex: number) => {
    if (!employee?.joining_date) return false;

    const joinDate = dayjs(employee.joining_date);
    const monthYear = monthIndex >= 3 ? selectedFinancialYear : selectedFinancialYear + 1;
    const targetMonth = dayjs().year(monthYear).month(monthIndex).startOf("month");

    return targetMonth.isBefore(joinDate.startOf("month"), "month");
  };

  const handleApplyLeave = async (values: any) => {
    if (!employee) return;
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
      refreshDataForEmployee(employee.id);
    } catch (err: any) {
      message.error(err.message || "Failed to save leave records.");
    } finally {
      setSubmitting(false);
    }
  };

  const departmentPeers = allEmployees.filter(
    (emp) => emp.department === employee?.department && emp.id !== employee?.id
  );

  // ==========================================
  // RETENTION SUMMARY INCLUDING OPENING AMOUNT
  // ==========================================
  const getSummaryStats = () => {
    const openingRetention = Number(employee?.opening_retention_amount || 0);

    if (!employee?.joining_date) {
      return { 
        casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0, 
        openingRetention, currentRetention: 0, totalRetention: openingRetention 
      };
    }

    const joinDate = dayjs(employee.joining_date);
    const financialYearStart = dayjs().year(selectedFinancialYear).month(3).startOf("month");
    const financialYearEnd = dayjs().year(selectedFinancialYear + 1).month(2).endOf("month");

    if (joinDate.isAfter(financialYearEnd, "day")) {
      return { 
        casual: 0, sick: 0, earned: 0, total: 0, taken: 0, balance: 0, lop: 0, 
        openingRetention, currentRetention: 0, totalRetention: openingRetention 
      };
    }

    const effectiveStartDate = joinDate.isAfter(financialYearStart, "month")
      ? joinDate.startOf("month")
      : financialYearStart;

    const effectiveEndDate = dayjs().isBefore(financialYearEnd, "day") ? dayjs() : financialYearEnd;

    let count = effectiveEndDate.diff(effectiveStartDate, "month") + 1;
    if (count < 0) count = 0;

    const casualAllowed = count;
    const sickAllowed = count;
    const earnedAllowed = Object.values(uiMap.earned).reduce((acc, m) => acc + (m.available || 0), 0);
    const totalAllowed = casualAllowed + sickAllowed + earnedAllowed;

    let totalTaken = 0;

    Object.values(uiMap.casual).forEach((m) => {
      totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5;
    });

    Object.values(uiMap.sick).forEach((m) => {
      totalTaken += (m["1H"]?.length || 0) * 0.5 + (m["2H"]?.length || 0) * 0.5;
    });

    Object.values(uiMap.earned).forEach((m) => {
      totalTaken += m.taken || 0;
    });

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
        <div style={{ fontFamily: "monospace", color: "#666" }}>Recalculating Chronological Ledgers...</div>
      </div>
    );
  }

  const stats = getSummaryStats();

  return (
    <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh", fontFamily: "monospace" }}>
      <Card
        style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #000" }}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span>HR Employee Information Dashboard</span>
            <div style={{ display: "flex", gap: 10 }}>
              <Select
                showSearch
                placeholder="Select Staff..."
                value={selectedEmployeeId}
                onChange={handleSelectEmployee}
                style={{ width: 260, fontWeight: "normal" }}
                optionFilterProp="children"
              >
                {allEmployees
                  .filter((emp) => emp.employee_code?.toUpperCase().includes("EXR"))
                  .map((emp) => (
                    <Select.Option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </Select.Option>
                  ))}
              </Select>
              <Select
                value={selectedFinancialYear}
                onChange={(year) => setSelectedFinancialYear(year)}
                style={{ width: 140, fontWeight: "bold" }}
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const year = getCurrentFinancialYearStart() - i;
                  return (
                    <Select.Option key={year} value={year}>
                      FY {getFinancialYearLabel(year)}
                    </Select.Option>
                  );
                })}
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Apply Leave
              </Button>
            </div>
          </div>
        }
      >
        <Row gutter={16} style={{ marginBottom: 15 }}>
          <Col span={6}><b>Name:</b> {employee?.full_name}</Col>
          <Col span={6}><b>Department:</b> {employee?.department}</Col>
          <Col span={6}><b>Employee ID:</b> {employee?.employee_code}</Col>
          <Col span={6}><b>Joining Date:</b> {employee?.joining_date ? dayjs(employee.joining_date).format("DD-MM-YYYY") : ""}</Col>
        </Row>

        <Row gutter={16} style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", alignItems: "center" }}>
          <Col span={9} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[
              { label: "CASUAL", value: stats.casual },
              { label: "SICK", value: stats.sick },
              { label: "EARNED", value: stats.earned },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>{item.label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{item.value}</div>
                </div>
                {idx < 2 && <span style={{ margin: "0 8px", fontSize: "18px", color: "#888" }}>+</span>}
              </div>
            ))}
            <span style={{ margin: "0 8px", fontSize: "18px", color: "#888" }}>=</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>ALLOWED</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}>{stats.total}</div>
            </div>
          </Col>

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

      <Card style={{ borderRadius: 8, border: "1px solid #000", marginBottom: 20 }} title="CHRONOLOGICAL LEAVE ACCUMULATION TRACKING MATRIX">
        {/* Casual Leave Grid */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Casual Leave (Allocated Balance Consumption)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div
                key={m.name}
                style={{
                  position: "relative",
                  borderRight: "1px solid #000",
                  background: isDailyWageMonth(m.index) ? "#f5f5f5" : isMonthStruck(m.index) ? "#e8e8e8" : "none"
                }}
              >
                {isDailyWageMonth(m.index) && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", transform: "rotate(-30deg)", fontSize: 14, fontWeight: "bold", color: "rgba(255, 40, 40, 0.18)", pointerEvents: "none", zIndex: 10 }}>
                    DAILY WAGE
                  </div>
                )}
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

        {/* Sick Leave Grid */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Sick Leave (Allocated Balance Consumption)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div
                key={m.name}
                style={{
                  position: "relative",
                  borderRight: "1px solid #000",
                  background: isDailyWageMonth(m.index) ? "#f5f5f5" : isMonthStruck(m.index) ? "#e8e8e8" : "none"
                }}
              >
                {isDailyWageMonth(m.index) && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", transform: "rotate(-30deg)", fontSize: 14, fontWeight: "bold", color: "rgba(255, 40, 40, 0.18)", pointerEvents: "none", zIndex: 10 }}>
                    DAILY WAGE
                  </div>
                )}
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

        {/* Earned Leave Ledger */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Holiday Working Bonus (Earned Leave Ledger)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div
                key={m.name}
                style={{
                  position: "relative",
                  borderRight: "1px solid #000",
                  background: isDailyWageMonth(m.index) ? "#f5f5f5" : isMonthStruck(m.index) ? "#e8e8e8" : "none"
                }}
              >
                {isDailyWageMonth(m.index) && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", transform: "rotate(-30deg)", fontSize: 14, fontWeight: "bold", color: "rgba(255, 40, 40, 0.18)", pointerEvents: "none", zIndex: 10 }}>
                    DAILY WAGE
                  </div>
                )}
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 }}>
                  {m.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
                  <div style={{ color: "#52c41a", fontWeight: "bold" }}>
                    Credit: {uiMap.earned[m.index]?.available || 0}
                  </div>
                  <div style={{ color: "#52c41a", fontSize: 10, minHeight: 18, fontWeight: "bold", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {uiMap.earned[m.index]?.creditDates?.length ? `${Array.from(new Set(uiMap.earned[m.index].creditDates)).join(", ")}` : ""}
                  </div>
                  <div style={{ color: "#1677ff", fontWeight: "bold" }}>
                    Used: {uiMap.earned[m.index]?.taken || 0}
                  </div>
                  <div style={{ color: "#1677ff", fontSize: 10, minHeight: 18, fontWeight: "bold", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {uiMap.earned[m.index]?.consumeDates?.length ? `${Array.from(new Set(uiMap.earned[m.index].consumeDates)).join(", ")}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Ledger with Opening Balance */}
        <div style={{ marginBottom: 25 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: 5 }}>
            <h3 style={{ margin: 0 }}>Retention Deduction Summary</h3>
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

        {/* LOP Ledger */}
        <div>
          <h3 style={{ borderBottom: "2px solid #000", paddingBottom: 5 }}>Loss of Pay (LOP) Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", border: "1px solid #000", textAlign: "center" }}>
            {FINANCIAL_MONTHS.map((m) => (
              <div key={m.name} style={{ borderRight: "1px solid #000", padding: 4 }}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", marginBottom: 4 }}>{m.name}</div>
                <div style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: 12 }}>{uiMap.lop[m.index]?.count || 0} Days</div>
                <div style={{ fontSize: 10, color: "#888", minHeight: 18, wordBreak: "break-word" }}>
                  {uiMap.lop[m.index]?.dates?.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Leave Application Modal */}
      <Modal
        title="Apply Leave Request"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleApplyLeave}>
          <Form.Item name="dateRange" label="Leave Date Range" rules={[{ required: true, message: "Please select dates" }]}>
            <DatePicker.RangePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="half" label="Duration" initialValue="Full" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="Full">Full Day</Radio>
              <Radio value="1H">1st Half (1H)</Radio>
              <Radio value="2H">2nd Half (2H)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="handover_id" label="Work Handover To">
            <Select placeholder="Select colleague for handover" showSearch optionFilterProp="children">
              {departmentPeers.map((peer) => (
                <Select.Option key={peer.id} value={peer.id}>
                  {peer.full_name} ({peer.employee_code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="reason" label="Reason for Leave" rules={[{ required: true, message: "Please specify reason" }]}>
            <Input.TextArea rows={3} placeholder="Provide details..." />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}