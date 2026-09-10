// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//   Card,
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   Tabs,
//   Tag,
//   message,
//   Space,
// } from "antd";

// export default function StaffManagement() {
//   const [staff, setStaff] = useState<any[]>([]);
//   const [open, setOpen] = useState(false);
//   const [form] = Form.useForm();

//   // ================= FETCH STAFF =================
//   const fetchStaff = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("*")
//       .eq("role", "staff");

//     setStaff(data || []);
//   };

//   useEffect(() => {
//     fetchStaff();
//   }, []);

//   // ================= ADD STAFF =================
//   const addStaff = async (values: any) => {
//     const { error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .insert([
//         {
//           username: values.username,
//           password_hash: values.password,
//           full_name: values.full_name,
//           employee_code: values.employee_code,
//           designation: values.designation,
//           role: "staff",
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

//   // ================= UPDATE STATUS =================
//   const updateStatus = async (id: string, active: boolean) => {
//     const { error } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .update({ active })
//       .eq("id", id);

//     if (error) {
//       message.error(error.message);
//       return;
//     }

//     message.success("Status updated");
//     fetchStaff();
//   };

//   // ================= TABLE =================
//   const columns = [
//     { title: "Name", dataIndex: "full_name" },
//     { title: "Username", dataIndex: "username" },
//     { title: "Code", dataIndex: "employee_code" },
//     { title: "Designation", dataIndex: "designation" },
//     {
//       title: "Status",
//       dataIndex: "active",
//       render: (v: boolean) =>
//         v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//     },
//     {
//       title: "Action",
//       render: (_: any, record: any) => (
//         <Space>
//           {record.active ? (
//             <Button
//               danger
//               onClick={() => updateStatus(record.id, false)}
//             >
//               Mark Resigned
//             </Button>
//           ) : (
//             <Button
//               type="primary"
//               onClick={() => updateStatus(record.id, true)}
//             >
//               Re-Activate
//             </Button>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   // ================= FILTERS =================
//   const activeStaff = staff.filter((s) => s.active);
//   const resignedStaff = staff.filter((s) => !s.active);

//   return (
//     <div style={{ padding: 20 }}>
//       {/* HEADER */}
//       <Card
//         title="Staff Management"
//         extra={
//           <Button type="primary" onClick={() => setOpen(true)}>
//             ➕ Add Staff
//           </Button>
//         }
//       >
//         {/* TABS */}
//         <Tabs
//           items={[
//             {
//               key: "active",
//               label: `Active Staff (${activeStaff.length})`,
//               children: (
//                 <Table
//                   dataSource={activeStaff}
//                   columns={columns}
//                   rowKey="id"
//                 />
//               ),
//             },
//             {
//               key: "resigned",
//               label: `Resigned Staff (${resignedStaff.length})`,
//               children: (
//                 <Table
//                   dataSource={resignedStaff}
//                   columns={columns}
//                   rowKey="id"
//                 />
//               ),
//             },
//           ]}
//         />
//       </Card>

//       {/* ADD STAFF MODAL */}
//       <Modal
//         title="Add New Staff"
//         open={open}
//         onCancel={() => setOpen(false)}
//         onOk={() => form.submit()}
//       >
//         <Form form={form} layout="vertical" onFinish={addStaff}>
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

//           <Form.Item name="designation" label="Designation">
//             <Input />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }


















// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);







//     // ================= FETCH STAFF =================


//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {

//         fetchDepartments();
//     }, []);




//     // ================= ADD STAFF =================
//    const addStaff = async (values: any) => {
//   const { error } = await supabase
//     .schema("leave_management")
//     .from("employees")
//     .insert([
//       {
//         username: values.username,
//         password_hash: values.password,
//         full_name: values.full_name,
//         employee_code: values.employee_code,
//         designation: values.designation,
//        department: values.department, // ONLY if UUID system
//         joining_date: values.joining_date,
//         role: "staff",
//         active: true,
//       },
//     ]);

//   if (error) {
//     console.error(error);
//     message.error(error.message);
//     return;
//   }

//   message.success("Staff added");
//   setOpen(false);
//   form.resetFields();
//   fetchStaff();
// };


//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department_id: record.department_id,
//             joining_date: record.joining_date
//                 ? dayjs(record.joining_date)
//                 : null,
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department_id: values.department_id,
//                 joining_date: values.joining_date,
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };



//     // ================= GENERATE EMPLOYEE CODE =================

//     const generateEmployeeCode = async () => {
//   const { data } = await supabase
//     .schema("leave_management")
//     .from("employees")
//     .select("employee_code");

//   if (!data || data.length === 0) {
//     const first = "EMP001";
//     setEmployeeCode(first);
//     form.setFieldsValue({ employee_code: first });
//     return;
//   }

//   // extract numbers safely
//   const numbers = data
//     .map((item) => {
//       const match = item.employee_code?.match(/\d+/);
//       return match ? parseInt(match[0]) : 0;
//     })
//     .filter(Boolean);

//   const maxNumber = Math.max(...numbers, 0);
//   const nextNumber = maxNumber + 1;

//   const newCode = "EMP" + String(nextNumber).padStart(3, "0");

//   setEmployeeCode(newCode);
//   form.setFieldsValue({ employee_code: newCode });
// };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };




//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department_id === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Designation", dataIndex: "designation" },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>

//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             {/* HEADER */}
//             <Card
//                 title="Staff Management"
//                 extra={
//                     // <Button type="primary" onClick={() => setOpen(true)}>
//                     //     Add Staff
//                     // </Button>
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 {/* SEARCH + FILTERS */}
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                     >
//                         <Select.Option value="HR">HR</Select.Option>
//                         <Select.Option value="IT">IT</Select.Option>
//                     </Select>

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                     >
//                         <Select.Option value="Developer">Developer</Select.Option>
//                         <Select.Option value="Manager">Manager</Select.Option>
//                     </Select>
//                 </Space>

//                 {/* TABS */}
//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ADD STAFF */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form form={form} layout="vertical" onFinish={addStaff}>

//                     <div style={{ display: "flex", gap: 20 }}>

//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item name="designation" label="Designation">
//                                 <Input />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             <Form.Item name="department_id" label="Department"  rules={[{ required: true, message: "Department is required" }]}>
//                                 <Select
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />



//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date"  rules={[{ required: true, message: "Joining date is required" }]}>
//                                 <Input type="date" style={{ width: "100%" }} />

//                             </Form.Item>
//                         </div>

//                     </div>

//                 </Form>
//             </Modal>

//             {/* EDIT STAFF */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <Form.Item name="full_name" label="Full Name">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="username" label="Username">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="designation" label="Designation">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="department_id" label="Department">
//                         <Select allowClear>
//                             <Select.Option value="HR">HR</Select.Option>
//                             <Select.Option value="IT">IT</Select.Option>
//                         </Select>
//                     </Form.Item>

//                     <Form.Item name="joining_date" label="Joining Date">
//                         <DatePicker style={{ width: "100%" }} />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }























// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);



//     // ✨ Get unique list of entered designations for dropdown options
//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF (FIXED KEY NAMES) =================
//     const addStaff = async (values: any) => {
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.username,
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department, // ✨ Matches the Form field below perfectly now
//                    joining_date: values.joining_date? values.joining_date.format("YYYY-MM-DD"): null,
//                     role: "staff",
//                     active: true,
//                 },
//             ]);

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         console.log("joining_date_frozen =", record.joining_date_frozen);
//         console.log(record); // <-- Add this
//         setEditingUser(record);
//         setEditOpen(true);

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department: record.department, // ✨ Changed to track plain string department values
//             joining_date: record.joining_date ? dayjs(record.joining_date) : null,
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department: values.department, // ✨ Updated field tracking keys
//                 joining_date: values.joining_date? values.joining_date.format("YYYY-MM-DD"): null,
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         if (!data || data.length === 0) {
//             const first = "1001";
//             setEmployeeCode(first);
//             form.setFieldsValue({ employee_code: first });
//             return;
//         }

//         const numbers = data
//             .map((item) => {
//                 const match = item.employee_code?.match(/\d+/);
//                 return match ? parseInt(match[0]) : 0;
//             })
//             .filter(Boolean);

//         const maxNumber = Math.max(...numbers, 0);
//         const nextNumber = `EXR${maxNumber + 1}`;
//         const newCode = String(nextNumber).padStart(4, "0");

//         setEmployeeCode(newCode);
//         form.setFieldsValue({ employee_code: newCode });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA (FIXED FOR TEXT MATCHING) =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) && // ✨ Checks text column "department" instead of "department_id"
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" }, // ✨ Added column to visibly display saved text names
//         { title: "Designation", dataIndex: "designation" },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             {/* HEADER */}
//             <Card
//                 title="Staff Management"
//                 extra={
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 {/* SEARCH + FILTERS */}
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     {/* Filter Dropdown dynamically rendered via database table values */}
//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 {/* TABS */}
//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ADD STAFF MODAL */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form form={form} layout="vertical" onFinish={addStaff}>
//                     <div style={{ display: "flex", gap: 20 }}>
//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     // Fallback filter behavior for manual searching
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             {/* ✨ FIXED: Changed name="department_id" to name="department" */}
//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker
//                                     style={{ width: "100%" }}

//                                 />
//                             </Form.Item>
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* EDIT STAFF MODAL */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <Form.Item name="full_name" label="Full Name">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="username" label="Username">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="designation" label="Designation">
//                         <Select
//                             showSearch
//                             placeholder="Select or type designation..."
//                             optionFilterProp="children"
//                             options={uniqueDesignations.map((d) => ({
//                                 value: d,
//                                 label: d,
//                             }))}
//                             filterOption={(input, option) =>
//                                 (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                             }
//                         />
//                     </Form.Item>

//                     {/* ✨ FIXED: Updated edit form to map dynamically to plain text names */}
//                     <Form.Item name="department" label="Department">
//                         <Select
//                             placeholder="Select Department"
//                             allowClear
//                             options={departments.map((d) => ({
//                                 value: d.department_name,
//                                 label: d.department_name,
//                             }))}
//                         />
//                     </Form.Item>

//                     <Form.Item name="joining_date" label="Joining Date">
//                         <DatePicker
//     style={{ width: "100%" }}
//     disabled={editingUser?.joining_date_frozen === true}
// />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }




////////working code for adding daily basis staff and regular



// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);

//     // Get unique list of entered designations for dropdown options
//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF =================
//    const addStaff = async (values: any) => {
//         // 🌟 VERIFIED: Correctly calculates daily wage rules based on selected type
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         if (values.staff_type === "regular" && values.joining_date) {
//             // Regular staff: if joined mid-month, set daily wage restrictions until last day of joining month
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.username,
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department,
//                     joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                     is_permanently_daily: isPermanentlyDaily, // 🌟 Saved to DB
//                     daily_wage_until: dailyWageUntil,         // 🌟 Saved to DB
//                     role: "staff",
//                     active: true,
//                 },
//             ]);

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         // 🌟 CHANGED/FIXED: Bulletproof mapping of staff type fallback
//         let staffType = "regular";
//         if (record.is_permanently_daily) {
//             staffType = "permanent_daily";
//         } else if (record.daily_wage_until) {
//             staffType = "regular";
//         }

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department: record.department,
//             joining_date: record.joining_date ? dayjs(record.joining_date) : null,
//             staff_type: staffType, // 🌟 Sets form dropdown state
//         });
//     };

//     const updateStaff = async (values: any) => {
//         // 🌟 VERIFIED: Recalculates rules on updates dynamically
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         if (values.staff_type === "regular" && values.joining_date) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department: values.department,
//                 joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                 is_permanently_daily: isPermanentlyDaily, // 🌟 Updated in DB
//                 daily_wage_until: dailyWageUntil,         // 🌟 Updated in DB
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         if (!data || data.length === 0) {
//             const first = "1001";
//             setEmployeeCode(first);
//             form.setFieldsValue({ employee_code: first });
//             return;
//         }

//         const numbers = data
//             .map((item) => {
//                 const match = item.employee_code?.match(/\d+/);
//                 return match ? parseInt(match[0]) : 0;
//             })
//             .filter(Boolean);

//         const maxNumber = Math.max(...numbers, 0);
//         const nextNumber = `EXR${maxNumber + 1}`;
//         const newCode = String(nextNumber).padStart(4, "0");

//         setEmployeeCode(newCode);
//         form.setFieldsValue({ employee_code: newCode });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE COLUMNS =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" },
//         { title: "Designation", dataIndex: "designation" },
//         { 
//             title: "Staff Type", 
//             render: (_: any, record: any) => 
//                 record.is_permanently_daily ? (
//                     <Tag color="orange">Daily Basis</Tag>
//                 ) : (
//                     <Tag color="blue">Regular Staff</Tag>
//                 )
//         },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             {/* HEADER */}
//             <Card
//                 title="Staff Management"
//                 extra={
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 {/* SEARCH + FILTERS */}
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 {/* TABS */}
//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ADD STAFF MODAL */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form form={form} layout="vertical" onFinish={addStaff} initialValues={{ staff_type: "regular" }}>
//                     <div style={{ display: "flex", gap: 20 }}>
//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             {/* 🌟 NEW STAFF TYPE DROPDOWN */}
//                             <Form.Item
//                                 name="staff_type"
//                                 label="Staff Type"
//                                 rules={[{ required: true, message: "Staff type is required" }]}
//                             >
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker style={{ width: "100%" }} />
//                             </Form.Item>
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* EDIT STAFF MODAL */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <Form.Item name="full_name" label="Full Name">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="username" label="Username">
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="designation" label="Designation">
//                         <Select
//                             showSearch
//                             placeholder="Select or type designation..."
//                             optionFilterProp="children"
//                             options={uniqueDesignations.map((d) => ({
//                                 value: d,
//                                 label: d,
//                             }))}
//                             filterOption={(input, option) =>
//                                 (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                             }
//                         />
//                     </Form.Item>

//                     <Form.Item name="department" label="Department">
//                         <Select
//                             placeholder="Select Department"
//                             allowClear
//                             options={departments.map((d) => ({
//                                 value: d.department_name,
//                                 label: d.department_name,
//                             }))}
//                         />
//                     </Form.Item>

//                     {/* 🌟 NEW STAFF TYPE DROPDOWN FOR EDIT MODAL */}
//                     <Form.Item
//                         name="staff_type"
//                         label="Staff Type"
//                         rules={[{ required: true, message: "Staff type is required" }]}
//                     >
//                         <Select placeholder="Select Staff Basis Type">
//                             <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                             <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                         </Select>
//                     </Form.Item>

//                     <Form.Item name="joining_date" label="Joining Date">
//                         <DatePicker
//                             style={{ width: "100%" }}
//                             disabled={editingUser?.joining_date_frozen === true}
//                         />
//                     </Form.Item>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }





////// working code with daily wage rate, salary, selection of daily wage for current month




// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     InputNumber,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
//     Checkbox,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     // Form watchers for conditional UI logic in Add Staff Modal
//     const joiningDateValue = Form.useWatch("joining_date", form);
//     const staffTypeValue = Form.useWatch("staff_type", form);
//     const isDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", form);

//     // Form watchers for Edit Staff Modal
//     const editJoiningDateValue = Form.useWatch("joining_date", editForm);
//     const editStaffTypeValue = Form.useWatch("staff_type", editForm);
//     const editIsDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", editForm);

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // Helper: Checks if joining date is mid-month (day of month > 1)
//     const isMidMonthJoining = (dateObj: any) => {
//         if (!dateObj) return false;
//         return dayjs(dateObj).date() > 1;
//     };

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);

//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF =================
//     const addStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);

//         // Set dailyWageUntil if permanently daily OR if mid-month daily wage is checked
//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31"; // Permanent marker
//         } else if (values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.username,
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department,
//                     joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                     is_permanently_daily: isPermanentlyDaily,
//                     daily_wage_until: dailyWageUntil,
//                     normal_salary: values.normal_salary || null,
//                     probation_salary: values.probation_salary || null,
//                     daily_wage_rate: values.daily_wage_rate || null,
//                     role: "staff",
//                     active: true,
//                 },
//             ]);

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         let staffType = "regular";
//         if (record.is_permanently_daily) {
//             staffType = "permanent_daily";
//         }

//         const recordJoiningDate = record.joining_date ? dayjs(record.joining_date) : null;
//         const hasDailyWagePeriod = !!record.daily_wage_until && !record.is_permanently_daily;

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department: record.department,
//             joining_date: recordJoiningDate,
//             staff_type: staffType,
//             is_daily_wage_joining_month: hasDailyWagePeriod,
//             normal_salary: record.normal_salary,
//             probation_salary: record.probation_salary,
//             daily_wage_rate: record.daily_wage_rate,
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31";
//         } else if (values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department: values.department,
//                 joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                 is_permanently_daily: isPermanentlyDaily,
//                 daily_wage_until: dailyWageUntil,
//                 normal_salary: values.normal_salary || null,
//                 probation_salary: values.probation_salary || null,
//                 daily_wage_rate: values.daily_wage_rate || null,
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         if (!data || data.length === 0) {
//             const first = "1001";
//             setEmployeeCode(first);
//             form.setFieldsValue({ employee_code: first });
//             return;
//         }

//         const numbers = data
//             .map((item) => {
//                 const match = item.employee_code?.match(/\d+/);
//                 return match ? parseInt(match[0]) : 0;
//             })
//             .filter(Boolean);

//         const maxNumber = Math.max(...numbers, 0);
//         const nextNumber = `EXR${maxNumber + 1}`;
//         const newCode = String(nextNumber).padStart(4, "0");

//         setEmployeeCode(newCode);
//         form.setFieldsValue({ employee_code: newCode });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE COLUMNS =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" },
//         { title: "Designation", dataIndex: "designation" },
//         {
//             title: "Staff Type",
//             render: (_: any, record: any) =>
//                 record.is_permanently_daily ? (
//                     <Tag color="orange">Daily Basis</Tag>
//                 ) : (
//                     <Tag color="blue">Regular Staff</Tag>
//                 ),
//         },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             <Card
//                 title="Staff Management"
//                 extra={
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ================= ADD STAFF MODAL ================= */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={addStaff}
//                     initialValues={{ staff_type: "regular", is_daily_wage_joining_month: false }}
//                 >
//                     <div style={{ display: "flex", gap: 20 }}>
//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             {/* SALARY FIELDS */}
//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 25000" min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 20000" min={0} />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 name="staff_type"
//                                 label="Staff Type"
//                                 rules={[{ required: true, message: "Staff type is required" }]}
//                             >
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker style={{ width: "100%" }} />
//                             </Form.Item>

//                             {/* MID-MONTH JOINING CHECKBOX */}
//                             {staffTypeValue === "regular" && isMidMonthJoining(joiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month ({dayjs(joiningDateValue).format("MMMM YYYY")}) as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {/* DAILY WAGE RATE FIELD */}
//                             {(staffTypeValue === "permanent_daily" ||
//                                 (staffTypeValue === "regular" &&
//                                     isMidMonthJoining(joiningDateValue) &&
//                                     isDailyWagesInJoiningMonth)) && (
//                                 <Form.Item
//                                     name="daily_wage_rate"
//                                     label="Daily Wage Rate (per day)"
//                                     rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                 >
//                                     <InputNumber style={{ width: "100%" }} placeholder="e.g. 700" min={0} />
//                                 </Form.Item>
//                             )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* ================= EDIT STAFF MODAL ================= */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//                 width={800}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <div style={{ display: "flex", gap: 20 }}>
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="designation" label="Designation">
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </div>

//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="department" label="Department">
//                                 <Select
//                                     placeholder="Select Department"
//                                     allowClear
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item name="staff_type" label="Staff Type">
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker
//                                     style={{ width: "100%" }}
//                                     disabled={editingUser?.joining_date_frozen === true}
//                                 />
//                             </Form.Item>

//                             {editStaffTypeValue === "regular" && isMidMonthJoining(editJoiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {(editStaffTypeValue === "permanent_daily" ||
//                                 (editStaffTypeValue === "regular" &&
//                                     isMidMonthJoining(editJoiningDateValue) &&
//                                     editIsDailyWagesInJoiningMonth)) && (
//                                 <Form.Item
//                                     name="daily_wage_rate"
//                                     label="Daily Wage Rate (per day)"
//                                     rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                 >
//                                     <InputNumber style={{ width: "100%" }} min={0} />
//                                 </Form.Item>
//                             )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }






// //// working code



// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     InputNumber,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
//     Checkbox,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     // Form watchers for conditional UI logic in Add Staff Modal
//     const joiningDateValue = Form.useWatch("joining_date", form);
//     const staffTypeValue = Form.useWatch("staff_type", form);
//     const isDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", form);

//     // Form watchers for Edit Staff Modal
//     const editJoiningDateValue = Form.useWatch("joining_date", editForm);
//     const editStaffTypeValue = Form.useWatch("staff_type", editForm);
//     const editIsDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", editForm);

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // Helper: Checks if joining date is mid-month (day of month > 1)
//     const isMidMonthJoining = (dateObj: any) => {
//         if (!dateObj) return false;
//         return dayjs(dateObj).date() > 1;
//     };

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);

//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF =================
//     const addStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31"; // Permanent marker
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.username,
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department,
//                     joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                     is_permanently_daily: isPermanentlyDaily,
//                     is_daily_wage_joining_month: treatAsDailyWage, // Stored in Database
//                     daily_wage_until: dailyWageUntil,
//                     normal_salary: values.normal_salary || null,
//                     probation_salary: values.probation_salary || null,
//                     daily_wage_rate: values.daily_wage_rate || null,
//                     role: "staff",
//                     active: true,
//                 },
//             ]);

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         let staffType = "regular";
//         if (record.is_permanently_daily) {
//             staffType = "permanent_daily";
//         }

//         const recordJoiningDate = record.joining_date ? dayjs(record.joining_date) : null;

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department: record.department,
//             joining_date: recordJoiningDate,
//             staff_type: staffType,
//             is_daily_wage_joining_month: record.is_daily_wage_joining_month ?? false,
//             normal_salary: record.normal_salary,
//             probation_salary: record.probation_salary,
//             daily_wage_rate: record.daily_wage_rate,
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31";
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department: values.department,
//                 joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                 is_permanently_daily: isPermanentlyDaily,
//                 is_daily_wage_joining_month: treatAsDailyWage, // Stored in Database
//                 daily_wage_until: dailyWageUntil,
//                 normal_salary: values.normal_salary || null,
//                 probation_salary: values.probation_salary || null,
//                 daily_wage_rate: values.daily_wage_rate || null,
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         if (!data || data.length === 0) {
//             const first = "1001";
//             setEmployeeCode(first);
//             form.setFieldsValue({ employee_code: first });
//             return;
//         }

//         const numbers = data
//             .map((item) => {
//                 const match = item.employee_code?.match(/\d+/);
//                 return match ? parseInt(match[0]) : 0;
//             })
//             .filter(Boolean);

//         const maxNumber = Math.max(...numbers, 0);
//         const nextNumber = `EXR${maxNumber + 1}`;
//         const newCode = String(nextNumber).padStart(4, "0");

//         setEmployeeCode(newCode);
//         form.setFieldsValue({ employee_code: newCode });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE COLUMNS =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" },
//         { title: "Designation", dataIndex: "designation" },
//         {
//             title: "Staff Type",
//             render: (_: any, record: any) =>
//                 record.is_permanently_daily ? (
//                     <Tag color="orange">Daily Basis</Tag>
//                 ) : record.is_daily_wage_joining_month ? (
//                     <Tag color="volcano">Regular (Daily Wage 1st Month)</Tag>
//                 ) : (
//                     <Tag color="blue">Regular Staff</Tag>
//                 ),
//         },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             <Card
//                 title="Staff Management"
//                 extra={
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ================= ADD STAFF MODAL ================= */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={addStaff}
//                     initialValues={{ staff_type: "regular", is_daily_wage_joining_month: false }}
//                 >
//                     <div style={{ display: "flex", gap: 20 }}>
//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             {/* SALARY FIELDS */}
//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 25000" min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 20000" min={0} />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 name="staff_type"
//                                 label="Staff Type"
//                                 rules={[{ required: true, message: "Staff type is required" }]}
//                             >
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker style={{ width: "100%" }} />
//                             </Form.Item>

//                             {/* MID-MONTH JOINING CHECKBOX */}
//                             {staffTypeValue === "regular" && isMidMonthJoining(joiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month ({dayjs(joiningDateValue).format("MMMM YYYY")}) as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {/* DAILY WAGE RATE FIELD */}
//                             {(staffTypeValue === "permanent_daily" ||
//                                 (staffTypeValue === "regular" &&
//                                     isMidMonthJoining(joiningDateValue) &&
//                                     isDailyWagesInJoiningMonth)) && (
//                                 <Form.Item
//                                     name="daily_wage_rate"
//                                     label="Daily Wage Rate (per day)"
//                                     rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                 >
//                                     <InputNumber style={{ width: "100%" }} placeholder="e.g. 700" min={0} />
//                                 </Form.Item>
//                             )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* ================= EDIT STAFF MODAL ================= */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//                 width={800}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <div style={{ display: "flex", gap: 20 }}>
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="designation" label="Designation">
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </div>

//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="department" label="Department">
//                                 <Select
//                                     placeholder="Select Department"
//                                     allowClear
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item name="staff_type" label="Staff Type">
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker
//                                     style={{ width: "100%" }}
//                                     disabled={editingUser?.joining_date_frozen === true}
//                                 />
//                             </Form.Item>

//                             {editStaffTypeValue === "regular" && isMidMonthJoining(editJoiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {(editStaffTypeValue === "permanent_daily" ||
//                                 (editStaffTypeValue === "regular" &&
//                                     isMidMonthJoining(editJoiningDateValue) &&
//                                     editIsDailyWagesInJoiningMonth)) && (
//                                 <Form.Item
//                                     name="daily_wage_rate"
//                                     label="Daily Wage Rate (per day)"
//                                     rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                 >
//                                     <InputNumber style={{ width: "100%" }} min={0} />
//                                 </Form.Item>
//                             )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }













// //// working code

// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     InputNumber,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
//     Checkbox,
// } from "antd";
// import dayjs from "dayjs";

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     // Form watchers for conditional UI logic in Add Staff Modal
//     const joiningDateValue = Form.useWatch("joining_date", form);
//     const staffTypeValue = Form.useWatch("staff_type", form);
//     const isDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", form);

//     // Form watchers for Edit Staff Modal
//     const editJoiningDateValue = Form.useWatch("joining_date", editForm);
//     const editStaffTypeValue = Form.useWatch("staff_type", editForm);
//     const editIsDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", editForm);

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);
//     const [employeeCode, setEmployeeCode] = useState("");

//     // Helper: Checks if joining date is mid-month (day of month > 1)
//     const isMidMonthJoining = (dateObj: any) => {
//         if (!dateObj) return false;
//         return dayjs(dateObj).date() > 1;
//     };

//     // ================= FETCH STAFF =================
//     const fetchStaff = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("*")
//             .eq("role", "staff");

//         setStaff(data || []);
//     };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);

//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF =================
//     const addStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31"; // Permanent marker
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

//         // 1. Insert Employee and return ID
//         const { data: newEmp, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.username,
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department,
//                     joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                     is_permanently_daily: isPermanentlyDaily,
//                     is_daily_wage_joining_month: treatAsDailyWage,
//                     daily_wage_until: dailyWageUntil,
//                     normal_salary: values.normal_salary || null,
//                     probation_salary: values.probation_salary || null,
//                     daily_wage_rate: values.daily_wage_rate || null,
//                     retention_amount: values.retention_amount || 0, // 👈 Added
//                     role: "staff",
//                     active: true,
//                 },
//             ])
//             .select("id")
//             .single();

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         // 2. Sync to salary_structures table if salary details exist
//         if (newEmp && (values.probation_salary || values.normal_salary)) {
//             const initialSalary = values.probation_salary || values.normal_salary;
//             const stageName = values.probation_salary ? "Probation" : "Regular";

//             const { error: salaryError } = await supabase
//                 .schema("leave_management")
//                 .from("salary_structures")
//                 .insert([
//                     {
//                         employee_id: newEmp.id,
//                         stage_name: stageName,
//                         base_salary: initialSalary,
//                         effective_from: joiningDateStr,
//                         effective_to: null,
//                     },
//                 ]);

//             if (salaryError) {
//                 console.error("Salary structure insertion error:", salaryError);
//                 message.warning("Staff added, but failed to log salary structure record.");
//             }
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         let staffType = "regular";
//         if (record.is_permanently_daily) {
//             staffType = "permanent_daily";
//         }

//         const recordJoiningDate = record.joining_date ? dayjs(record.joining_date) : null;

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             username: record.username,
//             designation: record.designation,
//             department: record.department,
//             joining_date: recordJoiningDate,
//             staff_type: staffType,
//             is_daily_wage_joining_month: record.is_daily_wage_joining_month ?? false,
//             normal_salary: record.normal_salary,
//             probation_salary: record.probation_salary,
//             daily_wage_rate: record.daily_wage_rate,
//             retention_amount: record.retention_amount ?? 0, // 👈 Added
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31";
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

//         // 1. Update Employee table
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: values.username,
//                 designation: values.designation,
//                 department: values.department,
//                 joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                 is_permanently_daily: isPermanentlyDaily,
//                 is_daily_wage_joining_month: treatAsDailyWage,
//                 daily_wage_until: dailyWageUntil,
//                 normal_salary: values.normal_salary || null,
//                 probation_salary: values.probation_salary || null,
//                 daily_wage_rate: values.daily_wage_rate || null,
//                 retention_amount: values.retention_amount || 0, // 👈 Added
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         // 2. Sync or Upsert to salary_structures table
//         if (editingUser && (values.probation_salary || values.normal_salary)) {
//             const currentSalary = values.probation_salary || values.normal_salary;
//             const stageName = values.probation_salary ? "Probation" : "Regular";

//             // Check if active structure already exists
//             const { data: existingStructure } = await supabase
//                 .schema("leave_management")
//                 .from("salary_structures")
//                 .select("*")
//                 .eq("employee_id", editingUser.id)
//                 .is("effective_to", null)
//                 .maybeSingle();

//             if (existingStructure) {
//                 // Update active salary record
//                 await supabase
//                     .schema("leave_management")
//                     .from("salary_structures")
//                     .update({
//                         stage_name: stageName,
//                         base_salary: currentSalary,
//                     })
//                     .eq("id", existingStructure.id);
//             } else {
//                 // Create new initial record if none existed previously
//                 await supabase
//                     .schema("leave_management")
//                     .from("salary_structures")
//                     .insert([
//                         {
//                             employee_id: editingUser.id,
//                             stage_name: stageName,
//                             base_salary: currentSalary,
//                             effective_from: joiningDateStr,
//                             effective_to: null,
//                         },
//                     ]);
//             }
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         if (!data || data.length === 0) {
//             const first = "1001";
//             setEmployeeCode(first);
//             form.setFieldsValue({ employee_code: first });
//             return;
//         }

//         const numbers = data
//             .map((item) => {
//                 const match = item.employee_code?.match(/\d+/);
//                 return match ? parseInt(match[0]) : 0;
//             })
//             .filter(Boolean);

//         const maxNumber = Math.max(...numbers, 0);
//         const nextNumber = `EXR${maxNumber + 1}`;
//         const newCode = String(nextNumber).padStart(4, "0");

//         setEmployeeCode(newCode);
//         form.setFieldsValue({ employee_code: newCode });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE COLUMNS =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Username", dataIndex: "username" },
//         { title: "Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" },
//         { title: "Designation", dataIndex: "designation" },
//         {
//             title: "Staff Type",
//             render: (_: any, record: any) =>
//                 record.is_permanently_daily ? (
//                     <Tag color="orange">Daily Basis</Tag>
//                 ) : record.is_daily_wage_joining_month ? (
//                     <Tag color="volcano">Regular (Daily Wage 1st Month)</Tag>
//                 ) : (
//                     <Tag color="blue">Regular Staff</Tag>
//                 ),
//         },
//         { title: "Joining Date", dataIndex: "joining_date" },
//         {
//             title: "Status",
//             dataIndex: "active",
//             render: (v: boolean) =>
//                 v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button onClick={() => openEdit(record)}>Edit</Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20 }}>
//             <Card
//                 title="Staff Management"
//                 extra={
//                     <Button type="primary" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//             >
//                 <Space style={{ marginBottom: 16 }}>
//                     <Input
//                         placeholder="Search staff..."
//                         onChange={(e) => setSearch(e.target.value)}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 <Tabs
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ================= ADD STAFF MODAL ================= */}
//             <Modal
//                 title="Add Staff"
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={800}
//             >
//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={addStaff}
//                     initialValues={{ staff_type: "regular", is_daily_wage_joining_month: false }}
//                 >
//                     <div style={{ display: "flex", gap: 20 }}>
//                         {/* LEFT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username" rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="password" label="Password" rules={[{ required: true }]}>
//                                 <Input.Password />
//                             </Form.Item>

//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             {/* SALARY FIELDS */}
//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 25000" min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 20000" min={0} />
//                             </Form.Item>

//                             <Form.Item
//                                 name="retention_amount"
//                                 label="Retention Amount (Deducted Post-Probation)"
//                                 tooltip="This amount will start applying automatically after probation is completed."
//                             >
//                                 <InputNumber style={{ width: "100%" }} placeholder="e.g. 1000" min={0} />
//                             </Form.Item>
//                         </div>

//                         {/* RIGHT SIDE */}
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input value={employeeCode} disabled />
//                             </Form.Item>

//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 name="staff_type"
//                                 label="Staff Type"
//                                 rules={[{ required: true, message: "Staff type is required" }]}
//                             >
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker style={{ width: "100%" }} />
//                             </Form.Item>

//                             {/* MID-MONTH JOINING CHECKBOX */}
//                             {staffTypeValue === "regular" && isMidMonthJoining(joiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month ({dayjs(joiningDateValue).format("MMMM YYYY")}) as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {/* DAILY WAGE RATE FIELD */}
//                             {(staffTypeValue === "permanent_daily" ||
//                                 (staffTypeValue === "regular" &&
//                                     isMidMonthJoining(joiningDateValue) &&
//                                     isDailyWagesInJoiningMonth)) && (
//                                     <Form.Item
//                                         name="daily_wage_rate"
//                                         label="Daily Wage Rate (per day)"
//                                         rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                     >
//                                         <InputNumber style={{ width: "100%" }} placeholder="e.g. 700" min={0} />
//                                     </Form.Item>
//                                 )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* ================= EDIT STAFF MODAL ================= */}
//             <Modal
//                 title="Edit Staff"
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//                 width={800}
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff}>
//                     <div style={{ display: "flex", gap: 20 }}>
//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="full_name" label="Full Name">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="username" label="Username">
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item name="designation" label="Designation">
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>

//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>

//                             <Form.Item
//                                 name="retention_amount"
//                                 label="Retention Amount (Deducted Post-Probation)"
//                             >
//                                 <InputNumber style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </div>

//                         <div style={{ flex: 1 }}>
//                             <Form.Item name="department" label="Department">
//                                 <Select
//                                     placeholder="Select Department"
//                                     allowClear
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>

//                             <Form.Item name="staff_type" label="Staff Type">
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>

//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker
//                                     style={{ width: "100%" }}
//                                     disabled={editingUser?.joining_date_frozen === true}
//                                 />
//                             </Form.Item>

//                             {editStaffTypeValue === "regular" && isMidMonthJoining(editJoiningDateValue) && (
//                                 <Form.Item
//                                     name="is_daily_wage_joining_month"
//                                     valuePropName="checked"
//                                     style={{
//                                         background: "#fffbe6",
//                                         border: "1px solid #ffe58f",
//                                         padding: "10px 12px",
//                                         borderRadius: "6px",
//                                     }}
//                                 >
//                                     <Checkbox>
//                                         Treat joining month as <b>Daily Wages</b>?
//                                     </Checkbox>
//                                 </Form.Item>
//                             )}

//                             {(editStaffTypeValue === "permanent_daily" ||
//                                 (editStaffTypeValue === "regular" &&
//                                     isMidMonthJoining(editJoiningDateValue) &&
//                                     editIsDailyWagesInJoiningMonth)) && (
//                                     <Form.Item
//                                         name="daily_wage_rate"
//                                         label="Daily Wage Rate (per day)"
//                                         rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                     >
//                                         <InputNumber style={{ width: "100%" }} min={0} />
//                                     </Form.Item>
//                                 )}
//                         </div>
//                     </div>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }











// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Input,
//     InputNumber,
//     Select,
//     Tabs,
//     Tag,
//     message,
//     Space,
//     DatePicker,
//     Checkbox,
//     Row,
//     Col,
//     Divider,
//     Typography,
// } from "antd";
// import {
//     UserOutlined,
//     IdcardOutlined,
//     LockOutlined,
//     BankOutlined,
//     CalendarOutlined,
//     PlusOutlined,
//     EditOutlined,
//     SearchOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";

// const { Text, Title } = Typography;

// export default function StaffManagement() {
//     const [staff, setStaff] = useState<any[]>([]);
//     const [open, setOpen] = useState(false);
//     const [editOpen, setEditOpen] = useState(false);
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [form] = Form.useForm();
//     const [editForm] = Form.useForm();

//     // Form watchers for conditional UI logic in Add Staff Modal
//     const joiningDateValue = Form.useWatch("joining_date", form);
//     const staffTypeValue = Form.useWatch("staff_type", form);
//     const isDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", form);

//     // Form watchers for Edit Staff Modal
//     const editJoiningDateValue = Form.useWatch("joining_date", editForm);
//     const editStaffTypeValue = Form.useWatch("staff_type", editForm);
//     const editIsDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", editForm);

//     const [search, setSearch] = useState("");
//     const [filterDept, setFilterDept] = useState<string | null>(null);
//     const [filterDesig, setFilterDesig] = useState<string | null>(null);
//     const [departments, setDepartments] = useState<any[]>([]);

//     // Helper: Checks if joining date is mid-month (day of month > 1)
//     const isMidMonthJoining = (dateObj: any) => {
//         if (!dateObj) return false;
//         return dayjs(dateObj).date() > 1;
//     };

//     // ================= FETCH STAFF =================
// const fetchStaff = async () => {
//     const { data } = await supabase
//         .schema("leave_management")
//         .from("employees")
//         .select("*")
//         .eq("role", "staff")
//         .order("employee_code", { ascending: true }); // <-- Added DB-level sort

//     // <-- Added Natural Alphanumeric Sorting
//     const sortedData = (data || []).sort((a, b) =>
//         (a.employee_code || "").localeCompare(b.employee_code || "", undefined, {
//             numeric: true,
//             sensitivity: "base",
//         })
//     );

//     setStaff(sortedData);
// };

//     useEffect(() => {
//         fetchStaff();
//     }, []);

//     // ================= FETCH DEPARTMENTS =================
//     const fetchDepartments = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("departments")
//             .select("*");

//         setDepartments(data || []);
//     };

//     useEffect(() => {
//         fetchDepartments();
//     }, []);

//     const uniqueDesignations = Array.from(
//         new Set(
//             staff
//                 .map((s) => s.designation)
//                 .filter((d) => d && d.trim() !== "")
//         )
//     ).sort();

//     // ================= ADD STAFF =================
//     const addStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31";
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

//         // 1. Insert Employee and return ID
//         const { data: newEmp, error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .insert([
//                 {
//                     username: values.employee_code, // Username set as employee code
//                     password_hash: values.password,
//                     full_name: values.full_name,
//                     employee_code: values.employee_code,
//                     designation: values.designation,
//                     department: values.department,
//                     joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                     is_permanently_daily: isPermanentlyDaily,
//                     is_daily_wage_joining_month: treatAsDailyWage,
//                     daily_wage_until: dailyWageUntil,
//                     normal_salary: values.normal_salary || null,
//                     probation_salary: values.probation_salary || null,
//                     daily_wage_rate: values.daily_wage_rate || null,
//                     retention_amount: values.retention_amount || 0,
//                     role: "staff",
//                     active: true,
//                 },
//             ])
//             .select("id")
//             .single();

//         if (error) {
//             console.error(error);
//             message.error(error.message);
//             return;
//         }

//         // 2. Sync to salary_structures table if salary details exist
//         // Checks if probation_salary is present and non-null
//         const hasProbation = values.probation_salary != null && values.probation_salary !== "" && Number(values.probation_salary) > 0;

//         const baseSalary = hasProbation ? values.probation_salary : values.normal_salary;
//         const stageName = hasProbation ? "Probation" : "Regular";

//         if (newEmp && baseSalary) {
//             const { error: salaryError } = await supabase
//                 .schema("leave_management")
//                 .from("salary_structures")
//                 .insert([
//                     {
//                         employee_id: newEmp.id,
//                         stage_name: stageName,
//                         base_salary: baseSalary,
//                         effective_from: joiningDateStr,
//                         effective_to: null,
//                     },
//                 ]);

//             if (salaryError) {
//                 console.error("Salary structure insertion error:", salaryError);
//                 message.warning("Staff added, but failed to log salary structure record.");
//             }
//         }

//         message.success("Staff added successfully!");
//         setOpen(false);
//         form.resetFields();
//         fetchStaff();
//     };

//     // ================= EDIT STAFF =================
//     const openEdit = (record: any) => {
//         setEditingUser(record);
//         setEditOpen(true);

//         let staffType = "regular";
//         if (record.is_permanently_daily) {
//             staffType = "permanent_daily";
//         }

//         const recordJoiningDate = record.joining_date ? dayjs(record.joining_date) : null;

//         editForm.setFieldsValue({
//             full_name: record.full_name,
//             employee_code: record.employee_code,
//             username: record.employee_code, // Maintained as employee code
//             designation: record.designation,
//             department: record.department,
//             joining_date: recordJoiningDate,
//             staff_type: staffType,
//             is_daily_wage_joining_month: record.is_daily_wage_joining_month ?? false,
//             normal_salary: record.normal_salary,
//             probation_salary: record.probation_salary,
//             daily_wage_rate: record.daily_wage_rate,
//             retention_amount: record.retention_amount ?? 0,
//         });
//     };

//     const updateStaff = async (values: any) => {
//         const isPermanentlyDaily = values.staff_type === "permanent_daily";
//         let dailyWageUntil = null;

//         const midMonth = isMidMonthJoining(values.joining_date);
//         const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

//         if (isPermanentlyDaily) {
//             dailyWageUntil = "9999-12-31";
//         } else if (treatAsDailyWage) {
//             dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
//         }

//         const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

//         // 1. Update Employee table
//         const { error } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 full_name: values.full_name,
//                 username: editingUser.employee_code, // Keeping username synced with code
//                 designation: values.designation,
//                 department: values.department,
//                 joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
//                 is_permanently_daily: isPermanentlyDaily,
//                 is_daily_wage_joining_month: treatAsDailyWage,
//                 daily_wage_until: dailyWageUntil,
//                 normal_salary: values.normal_salary || null,
//                 probation_salary: values.probation_salary || null,
//                 daily_wage_rate: values.daily_wage_rate || null,
//                 retention_amount: values.retention_amount || 0,
//             })
//             .eq("id", editingUser.id);

//         if (error) {
//             message.error(error.message);
//             return;
//         }

//         // 2. Sync or Upsert to salary_structures table
//         // Checks if probation_salary is present, non-null, and greater than 0
//         const hasProbation = values.probation_salary != null && values.probation_salary !== "" && Number(values.probation_salary) > 0;

//         const baseSalary = hasProbation ? values.probation_salary : values.normal_salary;
//         const stageName = hasProbation ? "Probation" : "Regular";

//         if (editingUser && baseSalary) {
//             const { data: existingStructure } = await supabase
//                 .schema("leave_management")
//                 .from("salary_structures")
//                 .select("*")
//                 .eq("employee_id", editingUser.id)
//                 .is("effective_to", null)
//                 .maybeSingle();

//             if (existingStructure) {
//                 await supabase
//                     .schema("leave_management")
//                     .from("salary_structures")
//                     .update({
//                         stage_name: stageName,
//                         base_salary: baseSalary,
//                     })
//                     .eq("id", existingStructure.id);
//             } else {
//                 await supabase
//                     .schema("leave_management")
//                     .from("salary_structures")
//                     .insert([
//                         {
//                             employee_id: editingUser.id,
//                             stage_name: stageName,
//                             base_salary: baseSalary,
//                             effective_from: joiningDateStr,
//                             effective_to: null,
//                         },
//                     ]);
//             }
//         }

//         message.success("Updated successfully");
//         setEditOpen(false);
//         fetchStaff();
//     };

//     // ================= STATUS =================
//     const updateStatus = async (id: string, active: boolean) => {
//         await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({ active })
//             .eq("id", id);

//         fetchStaff();
//     };

//     // ================= GENERATE EMPLOYEE CODE & SYNC USERNAME =================
//     const generateEmployeeCode = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("employee_code");

//         let newCode = "1001";

//         if (data && data.length > 0) {
//             const numbers = data
//                 .map((item) => {
//                     const match = item.employee_code?.match(/\d+/);
//                     return match ? parseInt(match[0]) : 0;
//                 })
//                 .filter(Boolean);

//             const maxNumber = Math.max(...numbers, 0);
//             const nextNumber = `EXR${maxNumber + 1}`;
//             newCode = String(nextNumber).padStart(4, "0");
//         }

//         form.setFieldsValue({
//             employee_code: newCode,
//             username: newCode, // Explicitly set username as employee code
//         });
//     };

//     const openModal = () => {
//         setOpen(true);
//         generateEmployeeCode();
//     };

//     // ================= FILTERED DATA =================
//     const filteredStaff = staff.filter((s) => {
//         return (
//             s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
//             (!filterDept || s.department === filterDept) &&
//             (!filterDesig || s.designation === filterDesig)
//         );
//     });

//     const activeStaff = filteredStaff.filter((s) => s.active);
//     const resignedStaff = filteredStaff.filter((s) => !s.active);

//     // ================= TABLE COLUMNS =================
//     const columns = [
//         { title: "Name", dataIndex: "full_name" },
//         { title: "Employee Code", dataIndex: "employee_code" },
//         { title: "Department", dataIndex: "department" },
//         { title: "Designation", dataIndex: "designation" },
//         {
//             title: "Staff Type",
//             render: (_: any, record: any) =>
//                 record.is_permanently_daily ? (
//                     <Tag color="orange">Daily Basis</Tag>
//                 ) : record.is_daily_wage_joining_month ? (
//                     <Tag color="volcano">Regular (Daily Wage 1st Month)</Tag>
//                 ) : (
//                     <Tag color="blue">Regular Staff</Tag>
//                 ),
//         },
//         {
//     title: "Joining Date",
//     dataIndex: "joining_date",
//     render: (date: string) => (date ? dayjs(date).format("DD-MM-YYYY") : "-"),
// },
//         // {
//         //     title: "Status",
//         //     dataIndex: "active",
//         //     render: (v: boolean) =>
//         //         v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
//         // },
//         {
//             title: "Action",
//             render: (_: any, record: any) => (
//                 <Space>
//                     <Button icon={<EditOutlined />} onClick={() => openEdit(record)}></Button>
//                     {record.active ? (
//                         <Button danger onClick={() => updateStatus(record.id, false)}>
//                             Resign
//                         </Button>
//                     ) : (
//                         <Button type="primary" onClick={() => updateStatus(record.id, true)}>
//                             Rehire
//                         </Button>
//                     )}
//                 </Space>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
//             <Card
//                 title={<Title level={3} style={{ margin: 0 }}>Staff Management</Title>}
//                 extra={
//                     <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openModal}>
//                         Add Staff
//                     </Button>
//                 }
//                 style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
//             >
//                 <Space style={{ marginBottom: 20 }} wrap>
//                     <Input
//                         placeholder="Search staff..."
//                         prefix={<SearchOutlined />}
//                         onChange={(e) => setSearch(e.target.value)}
//                         style={{ width: 220 }}
//                     />

//                     <Select
//                         placeholder="Filter Department"
//                         allowClear
//                         onChange={(v) => setFilterDept(v)}
//                         style={{ width: 180 }}
//                         options={departments.map((d) => ({
//                             value: d.department_name,
//                             label: d.department_name,
//                         }))}
//                     />

//                     <Select
//                         placeholder="Filter Designation"
//                         allowClear
//                         onChange={(v) => setFilterDesig(v)}
//                         style={{ width: 180 }}
//                         options={uniqueDesignations.map((d) => ({
//                             value: d,
//                             label: d,
//                         }))}
//                     />
//                 </Space>

//                 <Tabs
//                     type="card"
//                     items={[
//                         {
//                             key: "active",
//                             label: `Active Staff (${activeStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={activeStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                     pagination={{ pageSize: 10 }}
//                                 />
//                             ),
//                         },
//                         {
//                             key: "resigned",
//                             label: `Resigned Staff (${resignedStaff.length})`,
//                             children: (
//                                 <Table
//                                     dataSource={resignedStaff}
//                                     columns={columns}
//                                     rowKey="id"
//                                     pagination={{ pageSize: 10 }}
//                                 />
//                             ),
//                         },
//                     ]}
//                 />
//             </Card>

//             {/* ================= ADD STAFF MODAL ================= */}
//             <Modal
//                 title={
//                     <Space>
//                         <UserOutlined style={{ color: "#1677ff" }} />
//                         <span style={{ fontSize: 18, fontWeight: 600 }}>Add New Staff</span>
//                     </Space>
//                 }
//                 open={open}
//                 onCancel={() => setOpen(false)}
//                 onOk={() => form.submit()}
//                 destroyOnHidden
//                 width={720}
//                 centered
//                 okText="Create Staff"
//             >
//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onFinish={addStaff}
//                     initialValues={{ staff_type: "regular", is_daily_wage_joining_month: false }}
//                     style={{ paddingTop: 12 }}
//                 >
//                     <Divider titlePlacement="start" style={{ marginTop: 0, borderColor: "#f0f0f0" }}>
//                         <Text type="secondary" style={{ fontSize: 13 }}><IdcardOutlined /> BASIC DETAILS</Text>
//                     </Divider>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: "Please enter full name" }]}>
//                                 <Input prefix={<UserOutlined />} placeholder="John Doe" />
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item name="employee_code" label="Employee Code">
//                                 <Input prefix={<IdcardOutlined />} disabled style={{ color: "rgba(0, 0, 0, 0.88)", fontWeight: 600 }} />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="password" label="Password" rules={[{ required: true, message: "Please set a password" }]}>
//                                 <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item
//                                 name="department"
//                                 label="Department"
//                                 rules={[{ required: true, message: "Department is required" }]}
//                             >
//                                 <Select
//                                     placeholder="Select Department"
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item
//                                 name="designation"
//                                 label="Designation"
//                                 rules={[{ required: true, message: "Designation is required" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item
//                                 name="staff_type"
//                                 label="Staff Type"
//                                 rules={[{ required: true, message: "Staff type is required" }]}
//                             >
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker style={{ width: "100%" }} prefix={<CalendarOutlined />} />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     {/* MID-MONTH JOINING & DAILY WAGES UI */}
//                     {staffTypeValue === "regular" && isMidMonthJoining(joiningDateValue) && (
//                         <Form.Item
//                             name="is_daily_wage_joining_month"
//                             valuePropName="checked"
//                             style={{
//                                 background: "#fffbe6",
//                                 border: "1px solid #ffe58f",
//                                 padding: "12px",
//                                 borderRadius: "8px",
//                                 marginBottom: 16,
//                             }}
//                         >
//                             <Checkbox>
//                                 Treat joining month ({dayjs(joiningDateValue).format("MMMM YYYY")}) as <b>Daily Wages</b>?
//                             </Checkbox>
//                         </Form.Item>
//                     )}

//                     {(staffTypeValue === "permanent_daily" ||
//                         (staffTypeValue === "regular" &&
//                             isMidMonthJoining(joiningDateValue) &&
//                             isDailyWagesInJoiningMonth)) && (
//                             <Row gutter={16}>
//                                 <Col span={12}>
//                                     <Form.Item
//                                         name="daily_wage_rate"
//                                         label="Daily Wage Rate (per day)"
//                                         rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                     >
//                                         <InputNumber
//                                             prefix="₹"
//                                             style={{ width: "100%" }}
//                                             placeholder="e.g. 700"
//                                             min={0}
//                                         />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                         )}

//                     <Divider titlePlacement="start" style={{ borderColor: "#f0f0f0" }}>
//                         <Text type="secondary" style={{ fontSize: 13 }}><BankOutlined /> SALARY & COMPENSATION STRUCTURE</Text>
//                     </Divider>

//                     <Row gutter={16}>
//                         <Col span={8}>
//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} placeholder="25000" min={0} />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} placeholder="20000" min={0} />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item
//                                 name="retention_amount"
//                                 label="Retention Amount"
//                                 tooltip="Deducted automatically post-probation."
//                             >
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} placeholder="1000" min={0} />
//                             </Form.Item>
//                         </Col>
//                     </Row>
//                 </Form>
//             </Modal>

//             {/* ================= EDIT STAFF MODAL ================= */}
//             <Modal
//                 title={
//                     <Space>
//                         <EditOutlined style={{ color: "#1677ff" }} />
//                         <span style={{ fontSize: 18, fontWeight: 600 }}>Edit Staff Record</span>
//                     </Space>
//                 }
//                 open={editOpen}
//                 onCancel={() => setEditOpen(false)}
//                 onOk={() => editForm.submit()}
//                 width={720}
//                 centered
//                 okText="Save Changes"
//             >
//                 <Form form={editForm} layout="vertical" onFinish={updateStaff} style={{ paddingTop: 12 }}>
//                     <Divider titlePlacement="start" style={{ marginTop: 0, borderColor: "#f0f0f0" }}>
//                         <Text type="secondary" style={{ fontSize: 13 }}><IdcardOutlined /> BASIC DETAILS</Text>
//                     </Divider>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="full_name" label="Full Name">
//                                 <Input prefix={<UserOutlined />} />
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item name="employee_code" label="Employee Code / Username">
//                                 <Input prefix={<IdcardOutlined />} disabled style={{ color: "rgba(0, 0, 0, 0.88)", fontWeight: 600 }} />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="department" label="Department">
//                                 <Select
//                                     placeholder="Select Department"
//                                     allowClear
//                                     options={departments.map((d) => ({
//                                         value: d.department_name,
//                                         label: d.department_name,
//                                     }))}
//                                 />
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item name="designation" label="Designation">
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or type designation..."
//                                     optionFilterProp="children"
//                                     options={uniqueDesignations.map((d) => ({
//                                         value: d,
//                                         label: d,
//                                     }))}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     <Row gutter={16}>
//                         <Col span={12}>
//                             <Form.Item name="staff_type" label="Staff Type">
//                                 <Select placeholder="Select Staff Basis Type">
//                                     <Select.Option value="regular">Regular Basis Staff</Select.Option>
//                                     <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
//                                 </Select>
//                             </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                             <Form.Item name="joining_date" label="Joining Date">
//                                 <DatePicker
//                                     style={{ width: "100%" }}
//                                     prefix={<CalendarOutlined />}
//                                     disabled={editingUser?.joining_date_frozen === true}
//                                 />
//                             </Form.Item>
//                         </Col>
//                     </Row>

//                     {editStaffTypeValue === "regular" && isMidMonthJoining(editJoiningDateValue) && (
//                         <Form.Item
//                             name="is_daily_wage_joining_month"
//                             valuePropName="checked"
//                             style={{
//                                 background: "#fffbe6",
//                                 border: "1px solid #ffe58f",
//                                 padding: "12px",
//                                 borderRadius: "8px",
//                                 marginBottom: 16,
//                             }}
//                         >
//                             <Checkbox>
//                                 Treat joining month as <b>Daily Wages</b>?
//                             </Checkbox>
//                         </Form.Item>
//                     )}

//                     {(editStaffTypeValue === "permanent_daily" ||
//                         (editStaffTypeValue === "regular" &&
//                             isMidMonthJoining(editJoiningDateValue) &&
//                             editIsDailyWagesInJoiningMonth)) && (
//                             <Row gutter={16}>
//                                 <Col span={12}>
//                                     <Form.Item
//                                         name="daily_wage_rate"
//                                         label="Daily Wage Rate (per day)"
//                                         rules={[{ required: true, message: "Daily wage rate is required" }]}
//                                     >
//                                         <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                         )}

//                     <Divider titlePlacement="start" style={{ borderColor: "#f0f0f0" }}>
//                         <Text type="secondary" style={{ fontSize: 13 }}><BankOutlined /> SALARY & COMPENSATION STRUCTURE</Text>
//                     </Divider>

//                     <Row gutter={16}>
//                         <Col span={8}>
//                             <Form.Item name="normal_salary" label="Normal Salary">
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item name="probation_salary" label="Probation Salary">
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </Col>
//                         <Col span={8}>
//                             <Form.Item name="retention_amount" label="Retention Amount">
//                                 <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
//                             </Form.Item>
//                         </Col>
//                     </Row>
//                 </Form>
//             </Modal>
//         </div>
//     );
// }














"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Tabs,
    Tag,
    message,
    Space,
    DatePicker,
    Checkbox,
    Row,
    Col,
    Divider,
    Typography,
} from "antd";
import {
    UserOutlined,
    IdcardOutlined,
    LockOutlined,
    BankOutlined,
    CalendarOutlined,
    PlusOutlined,
    EditOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export default function StaffManagement() {
    const [staff, setStaff] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    // Form watchers for conditional UI logic in Add Staff Modal
    const joiningDateValue = Form.useWatch("joining_date", form);
    const staffTypeValue = Form.useWatch("staff_type", form);
    const isDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", form);

    // Form watchers for Edit Staff Modal
    const editJoiningDateValue = Form.useWatch("joining_date", editForm);
    const editStaffTypeValue = Form.useWatch("staff_type", editForm);
    const editIsDailyWagesInJoiningMonth = Form.useWatch("is_daily_wage_joining_month", editForm);

    const [search, setSearch] = useState("");
    const [filterDept, setFilterDept] = useState<string | null>(null);
    const [filterDesig, setFilterDesig] = useState<string | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);

    // Helper: Checks if joining date is mid-month (day of month > 1)
    const isMidMonthJoining = (dateObj: any) => {
        if (!dateObj) return false;
        return dayjs(dateObj).date() > 1;
    };

    // ================= FETCH STAFF =================
    const fetchStaff = async () => {
        const { data } = await supabase
            .schema("leave_management")
            .from("employees")
            .select("*")
            .eq("role", "staff")
            .order("employee_code", { ascending: true }); // <-- Added DB-level sort

        // <-- Added Natural Alphanumeric Sorting
        const sortedData = (data || []).sort((a, b) =>
            (a.employee_code || "").localeCompare(b.employee_code || "", undefined, {
                numeric: true,
                sensitivity: "base",
            })
        );

        setStaff(sortedData);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    // ================= FETCH DEPARTMENTS =================
    const fetchDepartments = async () => {
        const { data } = await supabase
            .schema("leave_management")
            .from("departments")
            .select("*");

        setDepartments(data || []);
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const uniqueDesignations = Array.from(
        new Set(
            staff
                .map((s) => s.designation)
                .filter((d) => d && d.trim() !== "")
        )
    ).sort();

    // ================= ADD STAFF =================
    const addStaff = async (values: any) => {
        const isPermanentlyDaily = values.staff_type === "permanent_daily";
        let dailyWageUntil = null;

        const midMonth = isMidMonthJoining(values.joining_date);
        const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

        if (isPermanentlyDaily) {
            dailyWageUntil = "9999-12-31";
        } else if (treatAsDailyWage) {
            dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
        }

        const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

        // 1. Insert Employee and return ID
        const { data: newEmp, error } = await supabase
            .schema("leave_management")
            .from("employees")
            .insert([
                {
                    username: values.employee_code, // Username set as employee code
                    password_hash: values.password,
                    full_name: values.full_name,
                    employee_code: values.employee_code,
                    designation: values.designation,
                    department: values.department,
                    joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
                    is_permanently_daily: isPermanentlyDaily,
                    is_daily_wage_joining_month: treatAsDailyWage,
                    daily_wage_until: dailyWageUntil,
                    normal_salary: values.normal_salary || null,
                    probation_salary: values.probation_salary || null,
                    daily_wage_rate: values.daily_wage_rate || null,
                    retention_amount: values.retention_amount || 0,
                    role: "staff",
                    active: true,
                },
            ])
            .select("id")
            .single();

        if (error) {
            console.error(error);
            message.error(error.message);
            return;
        }

        // 2. Sync to salary_structures table if salary details exist
        // Checks if probation_salary is present and non-null
        const hasProbation = values.probation_salary != null && values.probation_salary !== "" && Number(values.probation_salary) > 0;

        const baseSalary = hasProbation ? values.probation_salary : values.normal_salary;
        const stageName = hasProbation ? "Probation" : "Regular";

        if (newEmp && baseSalary) {
            const { error: salaryError } = await supabase
                .schema("leave_management")
                .from("salary_structures")
                .insert([
                    {
                        employee_id: newEmp.id,
                        stage_name: stageName,
                        base_salary: baseSalary,
                        effective_from: joiningDateStr,
                        effective_to: null,
                    },
                ]);

            if (salaryError) {
                console.error("Salary structure insertion error:", salaryError);
                message.warning("Staff added, but failed to log salary structure record.");
            }
        }

        message.success("Staff added successfully!");
        setOpen(false);
        form.resetFields();
        fetchStaff();
    };

    // ================= EDIT STAFF =================
    const openEdit = (record: any) => {
        setEditingUser(record);
        setEditOpen(true);

        let staffType = "regular";
        if (record.is_permanently_daily) {
            staffType = "permanent_daily";
        }

        const recordJoiningDate = record.joining_date ? dayjs(record.joining_date) : null;

        editForm.setFieldsValue({
            full_name: record.full_name,
            employee_code: record.employee_code,
            username: record.employee_code, // Maintained as employee code
            designation: record.designation,
            department: record.department,
            joining_date: recordJoiningDate,
            staff_type: staffType,
            is_daily_wage_joining_month: record.is_daily_wage_joining_month ?? false,
            normal_salary: record.normal_salary,
            probation_salary: record.probation_salary,
            daily_wage_rate: record.daily_wage_rate,
            retention_amount: record.retention_amount ?? 0,
        });
    };

    const updateStaff = async (values: any) => {
        const isPermanentlyDaily = values.staff_type === "permanent_daily";
        let dailyWageUntil = null;

        const midMonth = isMidMonthJoining(values.joining_date);
        const treatAsDailyWage = values.staff_type === "regular" && midMonth && values.is_daily_wage_joining_month;

        if (isPermanentlyDaily) {
            dailyWageUntil = "9999-12-31";
        } else if (treatAsDailyWage) {
            dailyWageUntil = values.joining_date.endOf("month").format("YYYY-MM-DD");
        }

        const joiningDateStr = values.joining_date ? values.joining_date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

        // 1. Update Employee table
        const { error } = await supabase
            .schema("leave_management")
            .from("employees")
            .update({
                full_name: values.full_name,
                username: editingUser.employee_code, // Keeping username synced with code
                designation: values.designation,
                department: values.department,
                joining_date: values.joining_date ? values.joining_date.format("YYYY-MM-DD") : null,
                is_permanently_daily: isPermanentlyDaily,
                is_daily_wage_joining_month: treatAsDailyWage,
                daily_wage_until: dailyWageUntil,
                normal_salary: values.normal_salary || null,
                probation_salary: values.probation_salary || null,
                daily_wage_rate: values.daily_wage_rate || null,
                retention_amount: values.retention_amount || 0,
            })
            .eq("id", editingUser.id);

        if (error) {
            message.error(error.message);
            return;
        }

        // 2. Sync or Upsert to salary_structures table
        // Checks if probation_salary is present, non-null, and greater than 0
        const hasProbation = values.probation_salary != null && values.probation_salary !== "" && Number(values.probation_salary) > 0;

        const baseSalary = hasProbation ? values.probation_salary : values.normal_salary;
        const stageName = hasProbation ? "Probation" : "Regular";

        if (editingUser && baseSalary) {
            const { data: existingStructure } = await supabase
                .schema("leave_management")
                .from("salary_structures")
                .select("*")
                .eq("employee_id", editingUser.id)
                .is("effective_to", null)
                .maybeSingle();

            if (existingStructure) {
                await supabase
                    .schema("leave_management")
                    .from("salary_structures")
                    .update({
                        stage_name: stageName,
                        base_salary: baseSalary,
                    })
                    .eq("id", existingStructure.id);
            } else {
                await supabase
                    .schema("leave_management")
                    .from("salary_structures")
                    .insert([
                        {
                            employee_id: editingUser.id,
                            stage_name: stageName,
                            base_salary: baseSalary,
                            effective_from: joiningDateStr,
                            effective_to: null,
                        },
                    ]);
            }
        }

        message.success("Updated successfully");
        setEditOpen(false);
        fetchStaff();
    };

    // ================= STATUS =================
    const updateStatus = async (id: string, active: boolean) => {
        await supabase
            .schema("leave_management")
            .from("employees")
            .update({ active })
            .eq("id", id);

        fetchStaff();
    };

    // ================= GENERATE EMPLOYEE CODE & SYNC USERNAME =================
    const generateEmployeeCode = async () => {
        const { data } = await supabase
            .schema("leave_management")
            .from("employees")
            .select("employee_code");

        let newCode = "1001";

        if (data && data.length > 0) {
            const numbers = data
                .map((item) => {
                    const match = item.employee_code?.match(/\d+/);
                    return match ? parseInt(match[0]) : 0;
                })
                .filter(Boolean);

            const maxNumber = Math.max(...numbers, 0);
            const nextNumber = `EXR${maxNumber + 1}`;
            newCode = String(nextNumber).padStart(4, "0");
        }

        form.setFieldsValue({
            employee_code: newCode,
            username: newCode, // Explicitly set username as employee code
        });
    };

    const openModal = () => {
        setOpen(true);
        generateEmployeeCode();
    };

    // ================= FILTERED DATA =================
    const filteredStaff = staff.filter((s) => {
        return (
            s.full_name?.toLowerCase().includes(search.toLowerCase()) &&
            (!filterDept || s.department === filterDept) &&
            (!filterDesig || s.designation === filterDesig)
        );
    });

    const activeStaff = filteredStaff.filter((s) => s.active);
    const resignedStaff = filteredStaff.filter((s) => !s.active);

    // ================= TABLE COLUMNS =================
    const columns = [
        { title: "Name", dataIndex: "full_name" },
        { title: "Employee Code", dataIndex: "employee_code" },
        { title: "Department", dataIndex: "department" },
        { title: "Designation", dataIndex: "designation" },
        {
            title: "Staff Type",
            render: (_: any, record: any) =>
                record.is_permanently_daily ? (
                    <Tag color="orange">Daily Basis</Tag>
                ) : record.is_daily_wage_joining_month ? (
                    <Tag color="volcano">Regular (Daily Wage 1st Month)</Tag>
                ) : (
                    <Tag color="blue">Regular Staff</Tag>
                ),
        },
        {
            title: "Joining Date",
            dataIndex: "joining_date",
            render: (date: string) => (date ? dayjs(date).format("DD-MM-YYYY") : "-"),
        },
        // {
        //     title: "Status",
        //     dataIndex: "active",
        //     render: (v: boolean) =>
        //         v ? <Tag color="green">Active</Tag> : <Tag color="red">Resigned</Tag>,
        // },
        {
            title: "Action",
            render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)}></Button>
                    {record.active ? (
                        <Button danger onClick={() => updateStatus(record.id, false)}>
                            Resign
                        </Button>
                    ) : (
                        <Button type="primary" onClick={() => updateStatus(record.id, true)}>
                            Rehire
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
            <Card
                title={<Title level={3} style={{ margin: 0 }}>Staff Management</Title>}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openModal}>
                        Add Staff
                    </Button>
                }
                style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
                <Space style={{ marginBottom: 20 }} wrap>
                    <Input
                        placeholder="Search staff..."
                        prefix={<SearchOutlined />}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 220 }}
                    />

                    <Select
                        placeholder="Filter Department"
                        allowClear
                        onChange={(v) => setFilterDept(v)}
                        style={{ width: 180 }}
                        options={departments.map((d) => ({
                            value: d.department_name,
                            label: d.department_name,
                        }))}
                    />

                    <Select
                        placeholder="Filter Designation"
                        allowClear
                        onChange={(v) => setFilterDesig(v)}
                        style={{ width: 180 }}
                        options={uniqueDesignations.map((d) => ({
                            value: d,
                            label: d,
                        }))}
                    />
                </Space>

                <Tabs
                    type="card"
                    items={[
                        {
                            key: "active",
                            label: `Active Staff (${activeStaff.length})`,
                            children: (
                                <Table
                                    dataSource={activeStaff}
                                    columns={columns}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                />
                            ),
                        },
                        {
                            key: "resigned",
                            label: `Resigned Staff (${resignedStaff.length})`,
                            children: (
                                <Table
                                    dataSource={resignedStaff}
                                    columns={columns}
                                    rowKey="id"
                                    pagination={{ pageSize: 10 }}
                                />
                            ),
                        },
                    ]}
                />
            </Card>

            {/* ================= ADD STAFF MODAL ================= */}
            <Modal
                title={
                    <Space>
                        <UserOutlined style={{ color: "#1677ff" }} />
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Add New Staff</span>
                    </Space>
                }
                open={open}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                destroyOnHidden
                width={720}
                centered
                okText="Create Staff"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={addStaff}
                    initialValues={{ staff_type: "regular", is_daily_wage_joining_month: false }}
                    style={{ paddingTop: 12 }}
                >
                    <Divider titlePlacement="start" style={{ marginTop: 0, borderColor: "#f0f0f0" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}><IdcardOutlined /> BASIC DETAILS</Text>
                    </Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: "Please enter full name" }]}>
                                <Input prefix={<UserOutlined />} placeholder="John Doe" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="employee_code" label="Employee Code">
                                <Input prefix={<IdcardOutlined />} disabled style={{ color: "rgba(0, 0, 0, 0.88)", fontWeight: 600 }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="password" label="Password" rules={[{ required: true, message: "Please set a password" }]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="department"
                                label="Department"
                                rules={[{ required: true, message: "Department is required" }]}
                            >
                                <Select
                                    placeholder="Select Department"
                                    options={departments.map((d) => ({
                                        value: d.department_name,
                                        label: d.department_name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="designation"
                                label="Designation"
                                rules={[{ required: true, message: "Designation is required" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select or type designation..."
                                    optionFilterProp="children"
                                    options={uniqueDesignations.map((d) => ({
                                        value: d,
                                        label: d,
                                    }))}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="staff_type"
                                label="Staff Type"
                                rules={[{ required: true, message: "Staff type is required" }]}
                            >
                                <Select placeholder="Select Staff Basis Type">
                                    <Select.Option value="regular">Regular Basis Staff</Select.Option>
                                    <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="joining_date" label="Joining Date">
                                <DatePicker style={{ width: "100%" }} prefix={<CalendarOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* MID-MONTH JOINING & DAILY WAGES UI */}
                    {staffTypeValue === "regular" && isMidMonthJoining(joiningDateValue) && (
                        <Form.Item
                            name="is_daily_wage_joining_month"
                            valuePropName="checked"
                            style={{
                                background: "#fffbe6",
                                border: "1px solid #ffe58f",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: 16,
                            }}
                        >
                            <Checkbox>
                                Treat joining month ({dayjs(joiningDateValue).format("MMMM YYYY")}) as <b>Daily Wages</b>?
                            </Checkbox>
                        </Form.Item>
                    )}

                    {(staffTypeValue === "permanent_daily" ||
                        (staffTypeValue === "regular" &&
                            isMidMonthJoining(joiningDateValue) &&
                            isDailyWagesInJoiningMonth)) && (
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="daily_wage_rate"
                                        label="Daily Wage Rate (per day)"
                                        rules={[{ required: true, message: "Daily wage rate is required" }]}
                                    >
                                        <InputNumber
                                            prefix="₹"
                                            style={{ width: "100%" }}
                                            placeholder="e.g. 700"
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                    <Divider titlePlacement="start" style={{ borderColor: "#f0f0f0" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}><BankOutlined /> SALARY & COMPENSATION STRUCTURE</Text>
                    </Divider>

                    {staffTypeValue !== "permanent_daily" && (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="normal_salary" label="Normal Salary">
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        placeholder="25000"
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item name="probation_salary" label="Probation Salary">
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        placeholder="20000"
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="retention_amount"
                                    label="Retention Amount"
                                    tooltip="Deducted automatically post-probation."
                                >
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        placeholder="1000"
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Modal>

            {/* ================= EDIT STAFF MODAL ================= */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: "#1677ff" }} />
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Edit Staff Record</span>
                    </Space>
                }
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={() => editForm.submit()}
                width={720}
                centered
                okText="Save Changes"
            >
                <Form form={editForm} layout="vertical" onFinish={updateStaff} style={{ paddingTop: 12 }}>
                    <Divider titlePlacement="start" style={{ marginTop: 0, borderColor: "#f0f0f0" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}><IdcardOutlined /> BASIC DETAILS</Text>
                    </Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="full_name" label="Full Name">
                                <Input prefix={<UserOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="employee_code" label="Employee Code / Username">
                                <Input prefix={<IdcardOutlined />} disabled style={{ color: "rgba(0, 0, 0, 0.88)", fontWeight: 600 }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="department" label="Department">
                                <Select
                                    placeholder="Select Department"
                                    allowClear
                                    options={departments.map((d) => ({
                                        value: d.department_name,
                                        label: d.department_name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="designation" label="Designation">
                                <Select
                                    showSearch
                                    placeholder="Select or type designation..."
                                    optionFilterProp="children"
                                    options={uniqueDesignations.map((d) => ({
                                        value: d,
                                        label: d,
                                    }))}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="staff_type" label="Staff Type">
                                <Select placeholder="Select Staff Basis Type">
                                    <Select.Option value="regular">Regular Basis Staff</Select.Option>
                                    <Select.Option value="permanent_daily">Daily Basis Staff</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="joining_date" label="Joining Date">
                                <DatePicker
                                    style={{ width: "100%" }}
                                    prefix={<CalendarOutlined />}
                                    disabled={editingUser?.joining_date_frozen === true}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {editStaffTypeValue === "regular" && isMidMonthJoining(editJoiningDateValue) && (
                        <Form.Item
                            name="is_daily_wage_joining_month"
                            valuePropName="checked"
                            style={{
                                background: "#fffbe6",
                                border: "1px solid #ffe58f",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: 16,
                            }}
                        >
                            <Checkbox>
                                Treat joining month as <b>Daily Wages</b>?
                            </Checkbox>
                        </Form.Item>
                    )}

                    {(editStaffTypeValue === "permanent_daily" ||
                        (editStaffTypeValue === "regular" &&
                            isMidMonthJoining(editJoiningDateValue) &&
                            editIsDailyWagesInJoiningMonth)) && (
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="daily_wage_rate"
                                        label="Daily Wage Rate (per day)"
                                        rules={[{ required: true, message: "Daily wage rate is required" }]}
                                    >
                                        <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                    <Divider titlePlacement="start" style={{ borderColor: "#f0f0f0" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}><BankOutlined /> SALARY & COMPENSATION STRUCTURE</Text>
                    </Divider>

                    {editStaffTypeValue !== "permanent_daily" && (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="normal_salary" label="Normal Salary">
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item name="probation_salary" label="Probation Salary">
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="retention_amount"
                                    label="Retention Amount"
                                >
                                    <InputNumber
                                        prefix="₹"
                                        style={{ width: "100%" }}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Modal>
        </div>
    );
}