// "use client";

// import { useState } from "react";
// import { Upload, Button, Table, Card, Tag, message, Space, Typography, Alert } from "antd";
// import { UploadOutlined, CheckCircleOutlined, AlertOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [verifying, setVerifying] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     // 1. Core Logic: Parse the biometric report structure
// const handleFileUpload = async (file: File) => {
//   setLoading(true);
//   setDiscrepancies([]);

//   const reader = new FileReader();
//   reader.onload = async (e) => {
//     try {
//       const data = e.target?.result;
//       const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];

//       const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       let currentEmpCode = "";
//       const parsedAttendanceMap: Record<string, Record<string, string>> = {};

//       // 1. Parse the Excel / XLS structural layout matrix
//       rawRows.forEach((row: any[]) => {
//         if (!row || row.length === 0) return;

//         const rowText = row.join(" ");
//         if (rowText.includes("Emp Code:")) {
//           const empCodeIndex = row.findIndex(cell => cell && String(cell).includes("Emp Code:"));
//           if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//           }
//         }

//         if (currentEmpCode && row[1] !== undefined && row[1] !== null) {
//           const dateStr = String(row[1]).trim();
//           const statusStr = row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : "";

//           // Match date patterns like 01-Apr-2026 safely
//           if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//             if (!parsedAttendanceMap[currentEmpCode]) {
//               parsedAttendanceMap[currentEmpCode] = {};
//             }
//             parsedAttendanceMap[currentEmpCode][standardizedDate] = statusStr;
//           }
//         }
//       });

//       // 2. Fetch approved leaves from your database
//       const { data: dbLeaves, error: dbError } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("id, leave_date, status, employee_id")
//         .eq("status", "approved");

//       if (dbError) throw dbError;

//       // 3. Fetch employees separately to bypass the missing schema caching relationship link
//       const { data: dbEmployees, error: empError } = await supabase
//         .schema("leave_management")
//         .from("employees")
//         .select("id, employee_code, full_name");

//       if (empError) throw empError;

//       // Build a fast key-value profile lookup map for O(1) performance
//       const employeeMap: Record<string, { employee_code: string; full_name: string }> = {};
//       dbEmployees?.forEach((emp) => {
//         employeeMap[emp.id] = {
//           employee_code: emp.employee_code,
//           full_name: emp.full_name,
//         };
//       });

//       const verificationList: DiscrepancyRow[] = [];

//       // 4. Compare leave registry entries against biometric attendance states
//       dbLeaves?.forEach((leave: any) => {
//         const empDetails = employeeMap[leave.employee_id];
//         const empCode = empDetails?.employee_code;
//         const fullName = empDetails?.full_name || "Unknown";

//         const formattedLeaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//         const actualExcelStatus = parsedAttendanceMap[empCode]?.[formattedLeaveDate] || "No Data";

//         // Verification condition: Check if row string contains 'Absent' or '½Present'
//         const isMarkedAbsent = actualExcelStatus.toLowerCase().includes("absent") || 
//                                actualExcelStatus.toLowerCase().includes("½present");

//         verificationList.push({
//           key: leave.id,
//           leave_id: leave.id,
//           employee_code: empCode || "—",
//           full_name: fullName,
//           leave_date: formattedLeaveDate,
//           excel_status: actualExcelStatus,
//           db_status: leave.status,
//           is_match: isMarkedAbsent
//         });
//       });

//       setDiscrepancies(verificationList);
//       setFileUploaded(true);
//       message.success("Biometric sheet tracking synchronized successfully!");
//     } catch (err: any) {
//       console.error("Parsing Exception Context:", err.message || err.details || err);
//       message.error(`Failed to parse file: ${err.message || "Invalid structure"}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   reader.readAsBinaryString(file);
//   return false; // Blocks immediate automatic browser HTTP post actions
// };
//     // 4. Update action: Change matching records from "approved" to "taken"
//     const commitStatusChanges = async () => {
//         setVerifying(true);
//         // Filter down to rows where the check matched ("Absent" in file vs "Approved" in DB)
//         const recordsToUpdate = discrepancies.filter(item => item.is_match);

//         if (recordsToUpdate.length === 0) {
//             message.info("No records match the required confirmation rules.");
//             setVerifying(false);
//             return;
//         }

//         try {
//             const idsToChange = recordsToUpdate.map(r => r.leave_id);

//             const { error } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({ status: "taken" })
//                 .in("id", idsToChange);

//             if (error) throw error;

//             message.success(`Successfully shifted ${idsToChange.length} leaf records to "TAKEN" state!`);

//             // Update local grid states smoothly
//             setDiscrepancies(prev =>
//                 prev.map(item => item.is_match ? { ...item, db_status: "taken", is_match: false } : item)
//             );
//         } catch (err: any) {
//             message.error(err.message);
//         } finally {
//             setVerifying(false);
//         }
//     };

//     // Grid Configuration Setup 
//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Target Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         {
//             title: "Biometric File Status",
//             dataIndex: "excel_status",
//             render: (txt: string) => (
//                 <Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>
//             )
//         },
//         {
//             title: "DB Leave Status",
//             dataIndex: "db_status",
//             render: (status: string) => (
//                 <Tag color={status === "taken" ? "blue" : "gold"}>{status.toUpperCase()}</Tag>
//             )
//         },
//         {
//             title: "Verification Action Rule",
//             dataIndex: "is_match",
//             render: (matched: boolean, record: any) => (
//                 record.db_status === "taken" ? (
//                     <Tag color="success" icon={<CheckCircleOutlined />}>Updated to Taken</Tag>
//                 ) : matched ? (
//                     <Tag color="processing">Ready to shift to Taken</Tag>
//                 ) : (
//                     <Tag color="default" icon={<AlertOutlined />}>Skipped (Not marked Absent)</Tag>
//                 )
//             )
//         }
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card
//                 title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}
//                 extra={
//                     fileUploaded && (
//                         <Button
//                             type="primary"
//                             icon={<CheckCircleOutlined />}
//                             onClick={commitStatusChanges}
//                             loading={verifying}
//                         >
//                             Confirm & Update Matches to "Taken"
//                         </Button>
//                     )
//                 }
//             >
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert
//                         message="Verification Rules Engine Instruction"
//                         description='Upload your periodic biometric file (such as "Daily Attendance Report April2026-27.xls"). The system automatically reads nested records, validates employee IDs, confirms if "Approved" entries are tracked as "Absent", and moves validated logs to "taken" status.'
//                         type="info"
//                         showIcon
//                     />

//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={discrepancies}
//                             columns={columns}
//                             loading={loading}
//                             pagination={{ pageSize: 10 }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }





















// "use client";

// import { useState } from "react";
// import { Upload, Button, Table, Card, Tag, message, Space, Typography, Alert } from "antd";
// import { UploadOutlined, CheckCircleOutlined, AlertOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [verifying, setVerifying] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     // 1. Core Logic: Parse the biometric report structure
//     const handleFileUpload = async (file: File) => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];

//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];
//                 const parsedAttendanceMap: Record<string, Record<string, string>> = {};

//                 // ================= STAGE 1: LOAD RAW EXCEL DATA FIRST =================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(cell => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     if (currentEmpCode && row[1] !== undefined && row[1] !== null) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : "";

//                         // Safe check to confirm it's a date row (e.g., 01-Apr-2026)
//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

//                             // Build map for fast cross-comparison lookups later
//                             if (!parsedAttendanceMap[currentEmpCode]) {
//                                 parsedAttendanceMap[currentEmpCode] = {};
//                             }
//                             parsedAttendanceMap[currentEmpCode][standardizedDate] = statusStr;

//                             // Strict filter: Capture ONLY "Absent" and "½Present" records from the sheet
//                             const lowerStatus = statusStr.toLowerCase();
//                             if (lowerStatus.includes("absent") || lowerStatus.includes("½present")) {
//                                 rawAbsentAndHalfPresentList.push({
//                                     employee_code: currentEmpCode,
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             }
//                         }
//                     }
//                 });

//                 if (rawAbsentAndHalfPresentList.length === 0) {
//                     message.warning("No 'Absent' or '½Present' records found in the uploaded file.");
//                     setLoading(false);
//                     return;
//                 }

//                 // Pre-populate the view table with the raw Excel data immediately
//                 const initialViewRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map((item, index) => ({
//                     key: `raw-${index}`,
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Loading data...", // Placeholder while DB handles comparisons
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Checking...",
//                     is_match: false
//                 }));

//                 setDiscrepancies(initialViewRows);
//                 setFileUploaded(true);

//                 // ================= STAGE 2: COMPARE WITH DATABASE APPROVED LEAVES =================

//                 // 1. Fetch approved leaves
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id")
//                     .eq("status", "approved");

//                 if (dbError) throw dbError;

//                 // 2. Fetch employee master profile references
//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name");

//                 if (empError) throw empError;

//                 // Create a fast-lookup map for employee metadata names
//                 const employeeMap: Record<string, { employee_code: string; full_name: string }> = {};
//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[emp.id] = {
//                         employee_code: emp.employee_code,
//                         full_name: emp.full_name,
//                     };
//                 });

//                 // Build a composite hash map key "employeeCode_date" of all approved database leaves for O(1) comparison matching
//                 const dbApprovedMap: Record<string, { leave_id: string; status: string }> = {};
//                 dbLeaves?.forEach((leave) => {
//                     const empCode = employeeMap[leave.employee_id]?.employee_code;
//                     if (empCode) {
//                         const formattedDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//                         dbApprovedMap[`${empCode}_${formattedDate}`] = {
//                             leave_id: leave.id,
//                             status: leave.status,
//                         };
//                     }
//                 });

//                 // 3. Map names and evaluate matches back into the list state
//                 const finalizedVerificationRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map((item, index) => {
//                     // Look up employee name info from our database list
//                     const matchedEmployee = dbEmployees?.find(emp => emp.employee_code === item.employee_code);
//                     const fullName = matchedEmployee ? matchedEmployee.full_name : "Not in System";

//                     // Check if this specific absent row has a matching approved leave entry in the database
//                     const dbMatch = dbApprovedMap[`${item.employee_code}_${item.leave_date}`];

//                     return {
//                         key: dbMatch ? dbMatch.leave_id : `unmatched-${index}`,
//                         leave_id: dbMatch ? dbMatch.leave_id : "",
//                         employee_code: item.employee_code,
//                         full_name: fullName,
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: dbMatch ? dbMatch.status : "No Approved Leave",
//                         // It's a match ready for action if we have a linked database approved leave record!
//                         is_match: !!dbMatch,
//                     };
//                 });

//                 // Re-render display view with completely evaluated mapping definitions
//                 setDiscrepancies(finalizedVerificationRows);
//                 message.success("Reconciliation comparison complete!");
//             } catch (err: any) {
//                 console.error("Parsing Exception Context:", err.message || err.details || err);
//                 message.error(`Failed to complete file validation processing: ${err.message}`);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };
//     // 4. Update action: Change matching records from "approved" to "taken"
//     const commitStatusChanges = async () => {
//         setVerifying(true);
//         // Filter down to rows where the check matched ("Absent" in file vs "Approved" in DB)
//         const recordsToUpdate = discrepancies.filter(item => item.is_match);

//         if (recordsToUpdate.length === 0) {
//             message.info("No records match the required confirmation rules.");
//             setVerifying(false);
//             return;
//         }

//         try {
//             const idsToChange = recordsToUpdate.map(r => r.leave_id);

//             const { error } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({ status: "taken" })
//                 .in("id", idsToChange);

//             if (error) throw error;

//             message.success(`Successfully shifted ${idsToChange.length} leaf records to "TAKEN" state!`);

//             // Update local grid states smoothly
//             setDiscrepancies(prev =>
//                 prev.map(item => item.is_match ? { ...item, db_status: "taken", is_match: false } : item)
//             );
//         } catch (err: any) {
//             message.error(err.message);
//         } finally {
//             setVerifying(false);
//         }
//     };

//     // Grid Configuration Setup 
//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Target Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         {
//             title: "Biometric File Status",
//             dataIndex: "excel_status",
//             render: (txt: string) => (
//                 <Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>
//             )
//         },
//         {
//             title: "DB Leave Status",
//             dataIndex: "db_status",
//             render: (status: string) => (
//                 <Tag color={status === "taken" ? "blue" : "gold"}>{status.toUpperCase()}</Tag>
//             )
//         },
//         {
//             title: "Verification Action Rule",
//             dataIndex: "is_match",
//             render: (matched: boolean, record: any) => (
//                 record.db_status === "taken" ? (
//                     <Tag color="success" icon={<CheckCircleOutlined />}>Updated to Taken</Tag>
//                 ) : matched ? (
//                     <Tag color="processing">Ready to shift to Taken</Tag>
//                 ) : (
//                     <Tag color="default" icon={<AlertOutlined />}>Skipped (Not marked Absent)</Tag>
//                 )
//             )
//         }
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card
//                 title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}
//                 extra={
//                     fileUploaded && (
//                         <Button
//                             type="primary"
//                             icon={<CheckCircleOutlined />}
//                             onClick={commitStatusChanges}
//                             loading={verifying}
//                         >
//                             Confirm & Update Matches to "Taken"
//                         </Button>
//                     )
//                 }
//             >
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert
//                         title="Verification Rules Engine Instruction" // ✨ FIXED: Changed from message to title
//                         description='Upload your periodic biometric file (such as "Daily Attendance Report April2026-27.xls"). The system automatically reads nested records, validates employee IDs, confirms if "Approved" entries are tracked as "Absent", and moves validated logs to "taken" status.'
//                         type="info"
//                         showIcon
//                     />

//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={discrepancies}
//                             columns={columns}
//                             loading={loading}
//                             pagination={{ pageSize: 10 }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }




















// "use client";

// import { useState } from "react";
// import { Upload, Button, Table, Card, Tag, message, Space, Typography, Alert } from "antd";
// import { UploadOutlined, CheckCircleOutlined, AlertOutlined } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [verifying, setVerifying] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     // 1. Core Logic: Parse the biometric report structure
//     const handleFileUpload = async (file: File) => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];

//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];
//                 const parsedAttendanceMap: Record<string, Record<string, string>> = {};

//                 // ================= STAGE 1: LOAD RAW EXCEL DATA FIRST =================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(cell => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     if (currentEmpCode && row[1] !== undefined && row[1] !== null) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : "";

//                         // Safe check to confirm it's a date row (e.g., 01-Apr-2026)
//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

//                             // Build map for fast cross-comparison lookups later
//                             if (!parsedAttendanceMap[currentEmpCode]) {
//                                 parsedAttendanceMap[currentEmpCode] = {};
//                             }
//                             parsedAttendanceMap[currentEmpCode][standardizedDate] = statusStr;

//                             // Strict filter: Capture ONLY "Absent" and "½Present" records from the sheet
//                             const lowerStatus = statusStr.toLowerCase();
//                             if (lowerStatus.includes("absent") || lowerStatus.includes("½present")) {
//                                 rawAbsentAndHalfPresentList.push({
//                                     employee_code: currentEmpCode,
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             }
//                         }
//                     }
//                 });

//                 if (rawAbsentAndHalfPresentList.length === 0) {
//                     message.warning("No 'Absent' or '½Present' records found in the uploaded file.");
//                     setLoading(false);
//                     return;
//                 }

//                 // Pre-populate the view table with the raw Excel data immediately
//                 const initialViewRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map((item, index) => ({
//                     key: `raw-${index}`,
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Loading data...", // Placeholder while DB handles comparisons
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Checking...",
//                     is_match: false
//                 }));

//                 setDiscrepancies(initialViewRows);
//                 setFileUploaded(true);

//                 // ================= STAGE 2: COMPARE WITH DATABASE APPROVED LEAVES =================

//                 // 1. Fetch approved leaves
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id")
//                     .eq("status", "approved");

//                 if (dbError) throw dbError;

//                 // 2. Fetch employee master profile references
//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name");

//                 if (empError) throw empError;

//                 // Create a fast-lookup map for employee metadata names
//                 const employeeMap: Record<string, { employee_code: string; full_name: string }> = {};
//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[emp.id] = {
//                         employee_code: emp.employee_code,
//                         full_name: emp.full_name,
//                     };
//                 });

//                 // Build a composite hash map key "employeeCode_date" of all approved database leaves for O(1) comparison matching
//                 const dbApprovedMap: Record<string, { leave_id: string; status: string }> = {};
//                 dbLeaves?.forEach((leave) => {
//                     const empCode = employeeMap[leave.employee_id]?.employee_code;
//                     if (empCode) {
//                         const formattedDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//                         dbApprovedMap[`${empCode}_${formattedDate}`] = {
//                             leave_id: leave.id,
//                             status: leave.status,
//                         };
//                     }
//                 });

//                 // 3. Map names and evaluate matches back into the list state
//                 const finalizedVerificationRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map((item, index) => {
//                     // Look up employee name info from our database list
//                     const matchedEmployee = dbEmployees?.find(emp => emp.employee_code === item.employee_code);
//                     const fullName = matchedEmployee ? matchedEmployee.full_name : "Not in System";

//                     // Check if this specific absent row has a matching approved leave entry in the database
//                     const dbMatch = dbApprovedMap[`${item.employee_code}_${item.leave_date}`];

//                     return {
//                         key: dbMatch ? dbMatch.leave_id : `unmatched-${index}`,
//                         leave_id: dbMatch ? dbMatch.leave_id : "",
//                         employee_code: item.employee_code,
//                         full_name: fullName,
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: dbMatch ? dbMatch.status : "No Approved Leave",
//                         // It's a match ready for action if we have a linked database approved leave record!
//                         is_match: !!dbMatch,
//                     };
//                 });

//                 // Re-render display view with completely evaluated mapping definitions
//                 setDiscrepancies(finalizedVerificationRows);
//                 message.success("Reconciliation comparison complete!");
//             } catch (err: any) {
//                 console.error("Parsing Exception Context:", err.message || err.details || err);
//                 message.error(`Failed to complete file validation processing: ${err.message}`);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };
//     // 4. Update action: Change matching records from "approved" to "taken"
//     const commitStatusChanges = async () => {
//         setVerifying(true);
//         // Filter down to rows where the check matched ("Absent" in file vs "Approved" in DB)
//         const recordsToUpdate = discrepancies.filter(item => item.is_match);

//         if (recordsToUpdate.length === 0) {
//             message.info("No records match the required confirmation rules.");
//             setVerifying(false);
//             return;
//         }

//         try {
//             const idsToChange = recordsToUpdate.map(r => r.leave_id);

//             const { error } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({ status: "taken" })
//                 .in("id", idsToChange);

//             if (error) throw error;

//             message.success(`Successfully shifted ${idsToChange.length} leaf records to "TAKEN" state!`);

//             // Update local grid states smoothly
//             setDiscrepancies(prev =>
//                 prev.map(item => item.is_match ? { ...item, db_status: "taken", is_match: false } : item)
//             );
//         } catch (err: any) {
//             message.error(err.message);
//         } finally {
//             setVerifying(false);
//         }
//     };

//     // Grid Configuration Setup 
//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Target Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         {
//             title: "Biometric File Status",
//             dataIndex: "excel_status",
//             render: (txt: string) => (
//                 <Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>
//             )
//         },
//         {
//             title: "DB Leave Status",
//             dataIndex: "db_status",
//             render: (status: string) => (
//                 <Tag color={status === "taken" ? "blue" : "gold"}>{status.toUpperCase()}</Tag>
//             )
//         },
//         {
//             title: "Verification Action Rule",
//             dataIndex: "is_match",
//             render: (matched: boolean, record: any) => (
//                 record.db_status === "taken" ? (
//                     <Tag color="success" icon={<CheckCircleOutlined />}>Updated to Taken</Tag>
//                 ) : matched ? (
//                     <Tag color="processing">Ready to shift to Taken</Tag>
//                 ) : (
//                     <Tag color="default" icon={<AlertOutlined />}>Skipped (Not marked Absent)</Tag>
//                 )
//             )
//         }
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card
//                 title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}
//                 extra={
//                     fileUploaded && (
//                         <Button
//                             type="primary"
//                             icon={<CheckCircleOutlined />}
//                             onClick={commitStatusChanges}
//                             loading={verifying}
//                         >
//                             Confirm & Update Matches to "Taken"
//                         </Button>
//                     )
//                 }
//             >
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert
//                         title="Verification Rules Engine Instruction" // ✨ FIXED: Changed from message to title
//                         description='Upload your periodic biometric file (such as "Daily Attendance Report April2026-27.xls"). The system automatically reads nested records, validates employee IDs, confirms if "Approved" entries are tracked as "Absent", and moves validated logs to "taken" status.'
//                         type="info"
//                         showIcon
//                     />

//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={discrepancies}
//                             columns={columns}
//                             loading={loading}
//                             pagination={{ pageSize: 10 }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }













// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] =
//         useState(false);

//     const [discrepancies, setDiscrepancies] =
//         useState<DiscrepancyRow[]>(
//             []
//         );

//     const [fileUploaded, setFileUploaded] =
//         useState(false);

//     const handleFileUpload =
//         async (file: File) => {
//             setLoading(true);
//             setDiscrepancies([]);

//             const reader =
//                 new FileReader();

//             reader.onload =
//                 async (e) => {
//                     try {
//                         const data =
//                             e.target?.result;

//                         const workbook =
//                             XLSX.read(
//                                 data,
//                                 {
//                                     type: "binary",
//                                     cellDates: true,
//                                 }
//                             );

//                         const sheetName =
//                             workbook
//                                 .SheetNames[0];

//                         const worksheet =
//                             workbook.Sheets[
//                             sheetName
//                             ];

//                         const rawRows: any[] =
//                             XLSX.utils.sheet_to_json(
//                                 worksheet,
//                                 {
//                                     header: 1,
//                                 }
//                             );

//                         let currentEmpCode =
//                             "";

//                         const rawAbsentAndHalfPresentList:
//                             any[] =
//                             [];

//                         // =====================
//                         // PARSE EXCEL
//                         // =====================

//                         rawRows.forEach(
//                             (
//                                 row: any[]
//                             ) => {
//                                 if (
//                                     !row ||
//                                     row.length ===
//                                     0
//                                 )
//                                     return;

//                                 const rowText =
//                                     row.join(
//                                         " "
//                                     );

//                                 if (
//                                     rowText.includes(
//                                         "Emp Code:"
//                                     )
//                                 ) {
//                                     const empCodeIndex =
//                                         row.findIndex(
//                                             (
//                                                 cell
//                                             ) =>
//                                                 cell &&
//                                                 String(
//                                                     cell
//                                                 ).includes(
//                                                     "Emp Code:"
//                                                 )
//                                         );

//                                     if (
//                                         empCodeIndex !==
//                                         -1 &&
//                                         row[
//                                         empCodeIndex +
//                                         1
//                                         ]
//                                     ) {
//                                         currentEmpCode =
//                                             String(
//                                                 row[
//                                                 empCodeIndex +
//                                                 1
//                                                 ]
//                                             ).trim();
//                                     }
//                                 }

//                                 if (
//                                     currentEmpCode &&
//                                     row[1] !==
//                                     undefined &&
//                                     row[1] !==
//                                     null
//                                 ) {
//                                     const dateStr =
//                                         String(
//                                             row[1]
//                                         ).trim();

//                                     const statusStr =
//                                         row[14] !==
//                                             undefined &&
//                                             row[14] !==
//                                             null
//                                             ? String(
//                                                 row[14]
//                                             ).trim()
//                                             : "";

//                                     if (
//                                         /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(
//                                             dateStr
//                                         )
//                                     ) {
//                                         const standardizedDate =
//                                             dayjs(
//                                                 dateStr
//                                             ).format(
//                                                 "YYYY-MM-DD"
//                                             );

//                                         const lowerStatus =
//                                             statusStr.toLowerCase();

//                                         if (
//                                             lowerStatus.includes(
//                                                 "absent"
//                                             ) ||
//                                             lowerStatus.includes(
//                                                 "½present"
//                                             )
//                                         ) {
//                                             rawAbsentAndHalfPresentList.push(
//                                                 {
//                                                     employee_code:
//                                                         currentEmpCode,
//                                                     leave_date:
//                                                         standardizedDate,
//                                                     excel_status:
//                                                         statusStr,
//                                                 }
//                                             );
//                                         }
//                                     }
//                                 }
//                             }
//                         );

//                         if (
//                             rawAbsentAndHalfPresentList.length ===
//                             0
//                         ) {
//                             message.warning(
//                                 "No Absent or ½Present records found."
//                             );

//                             setLoading(
//                                 false
//                             );

//                             return;
//                         }

//                         setFileUploaded(
//                             true
//                         );

//                         // =====================
//                         // FETCH DATABASE
//                         // =====================

//                         const {
//                             data:
//                                 dbLeaves,
//                             error:
//                                 dbError,
//                         } =
//                             await supabase
//                                 .schema(
//                                     "leave_management"
//                                 )
//                                 .from(
//                                     "leaves"
//                                 )
//                                 .select(
//                                     "id, leave_date, status, employee_id"
//                                 )
//                                 .eq(
//                                     "status",
//                                     "approved"
//                                 );

//                         if (
//                             dbError
//                         )
//                             throw dbError;

//                         const {
//                             data:
//                                 dbEmployees,
//                             error:
//                                 empError,
//                         } =
//                             await supabase
//                                 .schema(
//                                     "leave_management"
//                                 )
//                                 .from(
//                                     "employees"
//                                 )
//                                 .select(
//                                     "id, employee_code, full_name, department"
//                                 );

//                         if (
//                             empError
//                         )
//                             throw empError;

//                         // =====================
//                         // BUILD MAPS
//                         // =====================

//                         const employeeMap:
//     Record<
//         string,
//         {
//             id: string;
//             full_name: string;
//             department: string;
//         }
//     > =
//     {};

// dbEmployees?.forEach(
//     (
//         emp
//     ) => {
//         employeeMap[
//             emp.employee_code
//         ] =
//         {
//             id:
//                 emp.id,
//             full_name:
//                 emp.full_name,
//             department:
//                 emp.department || "",
//         };
//     }
// );

//                         const approvedLeaveMap:
//                             Record<
//                                 string,
//                                 string
//                             > =
//                             {};

//                         dbLeaves?.forEach(
//                             (
//                                 leave
//                             ) => {
//                                 const emp =
//                                     dbEmployees?.find(
//                                         (
//                                             e
//                                         ) =>
//                                             e.id ===
//                                             leave.employee_id
//                                     );

//                                 if (
//                                     emp
//                                 ) {
//                                     approvedLeaveMap[
//                                         `${emp.employee_code}_${dayjs(
//                                             leave.leave_date
//                                         ).format(
//                                             "YYYY-MM-DD"
//                                         )}`
//                                     ] =
//                                         leave.id;
//                                 }
//                             }
//                         );

//                         // =====================
//                         // AUTO PROCESS
//                         // =====================

//                         const idsToUpdate:
//                             string[] =
//                             [];

//                         const unauthorizedLeaves:
//                             any[] =
//                             [];

//                         const finalRows:
//     DiscrepancyRow[] =
//     rawAbsentAndHalfPresentList.map(
//         (
//             item,
//             index
//         ) => {
//             const employee =
//                 employeeMap[
//                 item.employee_code
//                 ];

//             const dbMatch =
//                 approvedLeaveMap[
//                 `${item.employee_code}_${item.leave_date}`
//                 ];

//             // MATCH FOUND
//             if (
//                 dbMatch
//             ) {
//                 idsToUpdate.push(
//                     dbMatch
//                 );
//             }

//             // NO MATCH -> CREATE UNAUTHORIZED LEAVE
//             else if (
//                 employee
//             ) {
//                 const lowerStatus =
//                     item.excel_status.toLowerCase();

//                 // ½Present -> only 1H
//                 if (
//                     lowerStatus.includes(
//                         "½present"
//                     ) ||
//                     lowerStatus.includes(
//                         "1/2"
//                     )
//                 ) {
//                     unauthorizedLeaves.push(
//                         {
//                             employee_id:
//                                 employee.id,
//                             employee_name:
//                                 employee.full_name,
//                             department:
//                                 employee.department,
//                             leave_date:
//                                 item.leave_date,
//                             half:
//                                 "1H",
//                             type:
//                                 "Unauthorized_Leave",
//                             reason:
//                                 "Auto-created from biometric reconciliation",
//                             status:
//                                 "Unauthorized_Leave",
//                         }
//                     );
//                 }

//                 // Full absent -> 1H + 2H
//                 else {
//                     unauthorizedLeaves.push(
//                         {
//                             employee_id:
//                                 employee.id,
//                             employee_name:
//                                 employee.full_name,
//                             department:
//                                 employee.department,
//                             leave_date:
//                                 item.leave_date,
//                             half:
//                                 "1H",
//                             type:
//                                 "Unauthorized_Leave",
//                             reason:
//                                 "Auto-created from biometric reconciliation",
//                             status:
//                                 "Unauthorized_Leave",
//                         },
//                         {
//                             employee_id:
//                                 employee.id,
//                             employee_name:
//                                 employee.full_name,
//                             department:
//                                 employee.department,
//                             leave_date:
//                                 item.leave_date,
//                             half:
//                                 "2H",
//                             type:
//                                 "Unauthorized_Leave",
//                             reason:
//                                 "Auto-created from biometric reconciliation",
//                             status:
//                                 "Unauthorized_Leave",
//                         }
//                     );
//                 }
//             }

//             // IMPORTANT:
//             // RETURN TABLE ROW
//             return {
//                 key:
//                     index.toString(),
//                 leave_id:
//                     dbMatch ||
//                     "",
//                 employee_code:
//                     item.employee_code,
//                 full_name:
//                     employee?.full_name ||
//                     "Not in System",
//                 leave_date:
//                     item.leave_date,
//                 excel_status:
//                     item.excel_status,
//                 db_status:
//                     dbMatch
//                         ? "taken"
//                         : employee
//                             ? "Unauthorized_Leave"
//                             : "Not in System",
//                 is_match:
//                     !!dbMatch,
//             };
//         }
//     );


//                         // =====================
//                         // UPDATE APPROVED -> TAKEN
//                         // =====================

//                         if (
//                             idsToUpdate.length >
//                             0
//                         ) {
//                             const {
//                                 error:
//                                     updateError,
//                             } =
//                                 await supabase
//                                     .schema(
//                                         "leave_management"
//                                     )
//                                     .from(
//                                         "leaves"
//                                     )
//                                     .update(
//                                         {
//                                             status:
//                                                 "taken",
//                                         }
//                                     )
//                                     .in(
//                                         "id",
//                                         idsToUpdate
//                                     );

//                             if (
//                                 updateError
//                             )
//                                 throw updateError;
//                         }

//                         // =====================
//                         // INSERT UNAUTHORIZED LEAVES
//                         // =====================

//                         if (
//                             unauthorizedLeaves.length >
//                             0
//                         ) {
//                             const {
//                                 error:
//                                     insertError,
//                             } =
//                                 await supabase
//                                     .schema(
//                                         "leave_management"
//                                     )
//                                     .from(
//                                         "leaves"
//                                     )
//                                     .insert(
//                                         unauthorizedLeaves
//                                     );

//                             if (
//                                 insertError
//                             )
//                                 throw insertError;
//                         }

//                         setDiscrepancies(
//                             finalRows
//                         );

//                         message.success(
//                             `Completed! ${idsToUpdate.length} approved leave(s) changed to TAKEN and ${unauthorizedLeaves.length} Unauthorized Leave(s) created.`
//                         );
//                     } catch (
//                         err: any
//                     ) {
//                         console.error(
//                             err
//                         );

//                         message.error(
//                             err.message
//                         );
//                     } finally {
//                         setLoading(
//                             false
//                         );
//                     }
//                 };

//             reader.readAsBinaryString(
//                 file
//             );

//             return false;
//         };

//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex:
//                 "employee_code",
//         },
//         {
//             title:
//                 "Employee Name",
//             dataIndex:
//                 "full_name",
//         },
//         {
//             title:
//                 "Leave Date",
//             dataIndex:
//                 "leave_date",
//             render: (
//                 d: string
//             ) =>
//                 dayjs(
//                     d
//                 ).format(
//                     "DD-MM-YYYY"
//                 ),
//         },
//         {
//             title:
//                 "Excel Status",
//             dataIndex:
//                 "excel_status",
//             render: (
//                 txt: string
//             ) => (
//                 <Tag
//                     color={
//                         txt
//                             .toLowerCase()
//                             .includes(
//                                 "absent"
//                             )
//                             ? "error"
//                             : "warning"
//                     }
//                 >
//                     {txt}
//                 </Tag>
//             ),
//         },
//         {
//             title:
//                 "System Result",
//             dataIndex:
//                 "db_status",
//             render: (
//                 status: string
//             ) => (
//                 <Tag
//                     color={
//                         status ===
//                             "taken"
//                             ? "blue"
//                             : status ===
//                                 "Unauthorized Leave"
//                                 ? "red"
//                                 : "default"
//                     }
//                 >
//                     {status}
//                 </Tag>
//             ),
//         },
//         {
//             title: "Result",
//             render: (
//                 _: any,
//                 record: any
//             ) =>
//                 record.db_status ===
//                     "taken" ? (
//                     <Tag
//                         color="success"
//                         icon={
//                             <CheckCircleOutlined />
//                         }
//                     >
//                         Auto Updated
//                     </Tag>
//                 ) : (
//                     <Tag
//                         color="error"
//                         icon={
//                             <AlertOutlined />
//                         }
//                     >
//                         Unauthorized Leave Created
//                     </Tag>
//                 ),
//         },
//     ];

//     return (
//         <div
//             style={{
//                 padding: 20,
//                 maxWidth: 1200,
//                 margin:
//                     "0 auto",
//             }}
//         >
//             <Card
//                 title={
//                     <Title
//                         level={3}
//                         style={{
//                             margin: 0,
//                         }}
//                     >
//                         HR Panel Attendance
//                         Reconciliation
//                     </Title>
//                 }
//             >
//                 <Space
//                     orientation="vertical"
//                     style={{
//                         width:
//                             "100%",
//                     }}
//                     size="large"
//                 >
//                     <Alert
//                         title="Automatic Reconciliation Enabled"
//                         description="Upload biometric attendance file. Approved leaves are automatically converted to TAKEN. Missing leave records are automatically created as Unauthorized Leave."
//                         type="info"
//                         showIcon
//                     />

//                     <Upload
//                         beforeUpload={
//                             handleFileUpload
//                         }
//                         showUploadList={
//                             false
//                         }
//                         accept=".xls,.xlsx"
//                     >
//                         <Button
//                             icon={
//                                 <UploadOutlined />
//                             }
//                             loading={
//                                 loading
//                             }
//                         >
//                             Choose Attendance
//                             Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={
//                                 discrepancies
//                             }
//                             columns={
//                                 columns
//                             }
//                             loading={
//                                 loading
//                             }
//                             pagination={{
//                                 pageSize: 10,
//                             }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }














// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const handleFileUpload = (file: File) => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();

//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, {
//                     type: "binary",
//                     cellDates: true,
//                 });

//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
//                     header: 1,
//                 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 // =====================
//                 // PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && String(cell).includes("Emp Code:")
//                         );

//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     if (
//                         currentEmpCode &&
//                         row[1] !== undefined &&
//                         row[1] !== null
//                     ) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null
//                             ? String(row[14]).trim()
//                             : "";

//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                             const lowerStatus = statusStr.toLowerCase();

//                             if (
//                                 lowerStatus.includes("absent") ||
//                                 lowerStatus.includes("½present") ||
//                                 lowerStatus.includes("1/2")
//                             ) {
//                                 rawAbsentAndHalfPresentList.push({
//                                     employee_code: currentEmpCode,
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             }
//                         }
//                     }
//                 });

//                 if (rawAbsentAndHalfPresentList.length === 0) {
//                     message.warning("No Absent or ½Present records found.");
//                     setLoading(false);
//                     return;
//                 }

//                 setFileUploaded(true);

//                 // =====================
//                 // FETCH DATABASE
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half")
//                     .eq("status", "approved");

//                 if (dbError) throw dbError;

//                 // FIXED: Removed the invalid duplicate .from("leaves") chain statement
//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department");

//                 if (empError) throw empError;

//                 // =====================
//                 // BUILD MAPS
//                 // =====================
//                 const employeeMap: Record<
//                     string,
//                     { id: string; full_name: string; department: string }
//                 > = {};

//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[emp.employee_code] = {
//                         id: emp.id,
//                         full_name: emp.full_name,
//                         department: emp.department || "",
//                     };
//                 });

//                 const approvedLeaveMap: Record<
//                     string,
//                     Array<{ id: string; half: string }>
//                 > = {};

//                 dbLeaves?.forEach((leave) => {
//                     const emp = dbEmployees?.find((e) => e.id === leave.employee_id);

//                     if (emp) {
//                         const mapKey = `${emp.employee_code}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;
//                         if (!approvedLeaveMap[mapKey]) {
//                             approvedLeaveMap[mapKey] = [];
//                         }
//                         approvedLeaveMap[mapKey].push({
//                             id: leave.id,
//                             half: leave.half,
//                         });
//                     }
//                 });

//                 // =====================
//                 // AUTO PROCESS
//                 // =====================
//                 const idsToUpdate: string[] = [];
//                 const unauthorizedLeaves: any[] = [];

//                 const finalRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map(
//                     (item, index) => {
//                         const employee = employeeMap[item.employee_code];
//                         const mapKey = `${item.employee_code}_${item.leave_date}`;

//                         const dbMatches = approvedLeaveMap[mapKey] || [];
//                         const lowerStatus = item.excel_status.toLowerCase();

//                         const isHalfPresent = lowerStatus.includes("½present") || lowerStatus.includes("1/2");
//                         let matchFound = false;

//                         if (isHalfPresent) {
//                             if (dbMatches.length > 0) {
//                                 idsToUpdate.push(dbMatches[0].id);
//                                 matchFound = true;
//                             } else if (employee) {
//                                 unauthorizedLeaves.push({
//                                     employee_id: employee.id,
//                                     employee_name: employee.full_name,
//                                     department: employee.department,
//                                     leave_date: item.leave_date,
//                                     half: "1H",
//                                     type: "Unauthorized_Leave",
//                                     reason: "Auto-created from biometric reconciliation",
//                                     status: "Unauthorized_Leave",
//                                 });
//                             }
//                         } else {
//                             const has1HMatch = dbMatches.find(m => m.half === "1H");
//                             if (has1HMatch) {
//                                 idsToUpdate.push(has1HMatch.id);
//                             } else if (employee) {
//                                 unauthorizedLeaves.push({
//                                     employee_id: employee.id,
//                                     employee_name: employee.full_name,
//                                     department: employee.department,
//                                     leave_date: item.leave_date,
//                                     half: "1H",
//                                     type: "Unauthorized_Leave",
//                                     reason: "Auto-created from biometric reconciliation",
//                                     status: "Unauthorized_Leave",
//                                 });
//                             }

//                             const has2HMatch = dbMatches.find(m => m.half === "2H");
//                             if (has2HMatch) {
//                                 idsToUpdate.push(has2HMatch.id);
//                             } else if (employee) {
//                                 unauthorizedLeaves.push({
//                                     employee_id: employee.id,
//                                     employee_name: employee.full_name,
//                                     department: employee.department,
//                                     leave_date: item.leave_date,
//                                     half: "2H",
//                                     type: "Unauthorized_Leave",
//                                     reason: "Auto-created from biometric reconciliation",
//                                     status: "Unauthorized_Leave",
//                                 });
//                             }

//                             if (has1HMatch || has2HMatch) {
//                                 matchFound = true;
//                             }
//                         }

//                         return {
//                             key: index.toString(),
//                             leave_id: dbMatches.map(m => m.id).join(", ") || "",
//                             employee_code: item.employee_code,
//                             full_name: employee?.full_name || "Not in System",
//                             leave_date: item.leave_date,
//                             excel_status: item.excel_status,
//                             db_status: matchFound
//                                 ? "taken"
//                                 : employee
//                                     ? "Unauthorized_Leave"
//                                     : "Not in System",
//                             is_match: matchFound,
//                         };
//                     }
//                 );

//                 // =====================
//                 // UPDATE APPROVED -> TAKEN
//                 // =====================
//                 if (idsToUpdate.length > 0) {
//                     const { error: updateError } = await supabase
//                         .schema("leave_management")
//                         .from("leaves")
//                         .update({ status: "taken" })
//                         .in("id", idsToUpdate);

//                     if (updateError) throw updateError;
//                 }

//                 // =====================
//                 // INSERT UNAUTHORIZED LEAVES
//                 // =====================
//                 if (unauthorizedLeaves.length > 0) {
//                     const { error: insertError } = await supabase
//                         .schema("leave_management")
//                         .from("leaves")
//                         .insert(unauthorizedLeaves);

//                     if (insertError) throw insertError;
//                 }

//                 setDiscrepancies(finalRows);
//                 message.success(
//                     `Completed! ${idsToUpdate.length} approved leave slot(s) changed to TAKEN and ${unauthorizedLeaves.length} Unauthorized Leave slot(s) handled.`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//         },
//         {
//             title: "Employee Name",
//             dataIndex: "full_name",
//         },
//         {
//             title: "Leave Date",
//             dataIndex: "leave_date",
//             render: (d: string) => dayjs(d).format("DD-MM-YYYY"),
//         },
//         {
//             title: "Excel Status",
//             dataIndex: "excel_status",
//             render: (txt: string) => (
//                 <Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>
//                     {txt}
//                 </Tag>
//             ),
//         },
//         {
//             title: "System Result",
//             dataIndex: "db_status",
//             render: (status: string) => (
//                 <Tag
//                     color={
//                         status === "taken"
//                             ? "blue"
//                             : status === "Unauthorized_Leave"
//                                 ? "red"
//                                 : "default"
//                     }
//                 >
//                     {status}
//                 </Tag>
//             ),
//         },
//         {
//             title: "Result",
//             render: (_: any, record: any) =>
//                 record.db_status === "taken" ? (
//                     <Tag color="success" icon={<CheckCircleOutlined />}>
//                         Auto Updated
//                     </Tag>
//                 ) : (
//                     <Tag color="error" icon={<AlertOutlined />}>
//                         Unauthorized Leave Created
//                     </Tag>
//                 ),
//         },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card
//                 title={
//                     <Title level={3} style={{ margin: 0 }}>
//                         HR Panel Attendance Reconciliation
//                     </Title>
//                 }
//             >
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert
//                         title="Automatic Reconciliation Enabled"
//                         description="Upload biometric attendance file. Approved leaves are automatically converted to TAKEN. Missing leave records are automatically created as Unauthorized Leave."
//                         type="info"
//                         showIcon
//                     />

//                     <Upload
//                         beforeUpload={handleFileUpload}
//                         showUploadList={false}
//                         accept=".xls,.xlsx"
//                     >
//                         <Button icon={<UploadOutlined />} loading={loading}>
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={discrepancies}
//                             columns={columns}
//                             loading={loading}
//                             pagination={{ pageSize: 10 }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }






// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";

// const { Title } = Typography;

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const handleFileUpload = (file: File) => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();

//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, {
//                     type: "binary",
//                     cellDates: true,
//                 });

//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
//                     header: 1,
//                 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 // =====================
//                 // PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && String(cell).includes("Emp Code:")
//                         );

//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     if (
//                         currentEmpCode &&
//                         row[1] !== undefined &&
//                         row[1] !== null
//                     ) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null
//                             ? String(row[14]).trim()
//                             : "";

//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                             const lowerStatus = statusStr.toLowerCase();

//                             if (
//                                 lowerStatus.includes("absent") ||
//                                 lowerStatus.includes("½present") ||
//                                 lowerStatus.includes("1/2")
//                             ) {
//                                 rawAbsentAndHalfPresentList.push({
//                                     employee_code: currentEmpCode,
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             }
//                         }
//                     }
//                 });

//                 if (rawAbsentAndHalfPresentList.length === 0) {
//                     message.warning("No Absent or ½Present records found.");
//                     setLoading(false);
//                     return;
//                 }

//                 setFileUploaded(true);

//                 // =====================
//                 // FETCH DATABASE
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);

//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department");

//                 if (empError) throw empError;

//                 // =====================
//                 // BUILD MAPS
//                 // =====================
//                 const employeeMap: Record<
//                     string,
//                     { id: string; full_name: string; department: string }
//                 > = {};

//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[emp.employee_code] = {
//                         id: emp.id,
//                         full_name: emp.full_name,
//                         department: emp.department || "",
//                     };
//                 });

//                 const totalLeaveMap: Record<
//                     string,
//                     Array<{ id: string; half: string; status: string }>
//                 > = {};

//                 dbLeaves?.forEach((leave) => {
//                     const emp = dbEmployees?.find((e) => e.id === leave.employee_id);

//                     if (emp) {
//                         const mapKey = `${emp.employee_code}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;
//                         if (!totalLeaveMap[mapKey]) {
//                             totalLeaveMap[mapKey] = [];
//                         }
//                         totalLeaveMap[mapKey].push({
//                             id: leave.id,
//                             half: leave.half,
//                             status: leave.status,
//                         });
//                     }
//                 });

//                 // =====================
//                 // AUTO PROCESS
//                 // =====================
//                 const idsToUpdate: string[] = [];
//                 const unauthorizedLeaves: any[] = [];

//                 const finalRows: DiscrepancyRow[] = rawAbsentAndHalfPresentList.map(
//                     (item, index) => {
//                         const employee = employeeMap[item.employee_code];
//                         const mapKey = `${item.employee_code}_${item.leave_date}`;

//                         const dbMatches = totalLeaveMap[mapKey] || [];
//                         const lowerStatus = item.excel_status.toLowerCase();

//                         const isHalfPresent = lowerStatus.includes("½present") || lowerStatus.includes("1/2");

//                         let matchFound = false;
//                         let isAlreadyLoggedUnauthorized = false;

//                         // Helper closures to prevent repeating code for 1H and 2H checks
//                         const processSlot = (targetHalf: string) => {
//                             // Find if there is an approved or already taken leave for this half
//                             const legitimateLeave = dbMatches.find(
//                                 m => m.half === targetHalf && (m.status === "approved" || m.status === "taken")
//                             );

//                             // Check if an Unauthorized entry already exists for this half
//                             const existingUnauthorized = dbMatches.some(
//                                 m => m.half === targetHalf && m.status === "Unauthorized_Leave"
//                             );

//                             if (legitimateLeave) {
//                                 if (legitimateLeave.status === "approved") {
//                                     idsToUpdate.push(legitimateLeave.id);
//                                 }
//                                 matchFound = true;
//                             } else if (existingUnauthorized) {
//                                 isAlreadyLoggedUnauthorized = true;
//                             } else if (employee) {
//                                 unauthorizedLeaves.push({
//                                     employee_id: employee.id,
//                                     employee_name: employee.full_name,
//                                     department: employee.department,
//                                     leave_date: item.leave_date,
//                                     half: targetHalf,
//                                     type: "Unauthorized_Leave",
//                                     reason: "Auto-created from biometric",
//                                     status: "Unauthorized_Leave",
//                                 });
//                             }
//                         };

//                         if (isHalfPresent) {
//                             // ½Present means they are absent for 1 half (typically 1H)
//                             processSlot("1H");
//                         } else {
//                             // Absent means they are missing for both halves
//                             processSlot("1H");
//                             processSlot("2H");
//                         }

//                         // Determine final status text for the table UI row
//                         let finalSystemResult = "Not in System";
//                         if (matchFound) {
//                             finalSystemResult = "taken";
//                         } else if (isAlreadyLoggedUnauthorized) {
//                             finalSystemResult = "Unauthorized_Leave (Skipped Duplicate)";
//                         } else if (employee) {
//                             finalSystemResult = "Unauthorized_Leave (Created)";
//                         }

//                         return {
//                             key: index.toString(),
//                             leave_id: dbMatches.map(m => m.id).join(", ") || "",
//                             employee_code: item.employee_code,
//                             full_name: employee?.full_name || "Not in System",
//                             leave_date: item.leave_date,
//                             excel_status: item.excel_status,
//                             db_status: finalSystemResult,
//                             is_match: matchFound,
//                         };
//                     }
//                 );

//                 // =====================
//                 // UPDATE APPROVED -> TAKEN
//                 // =====================
//                 if (idsToUpdate.length > 0) {
//                     const { error: updateError } = await supabase
//                         .schema("leave_management")
//                         .from("leaves")
//                         .update({ status: "taken" })
//                         .in("id", idsToUpdate);

//                     if (updateError) throw updateError;
//                 }

//                 // =====================
//                 // INSERT UNAUTHORIZED LEAVES
//                 // =====================
//                 if (unauthorizedLeaves.length > 0) {
//                     const { error: insertError } = await supabase
//                         .schema("leave_management")
//                         .from("leaves")
//                         .insert(unauthorizedLeaves);

//                     if (insertError) throw insertError;
//                 }

//                 setDiscrepancies(finalRows);

//                 if (unauthorizedLeaves.length === 0 && idsToUpdate.length === 0) {
//                     message.info("Reconciliation complete! File data matches current records, no actions were required.");
//                 } else {
//                     message.success(
//                         `Completed! ${idsToUpdate.length} approved slots updated to TAKEN. ${unauthorizedLeaves.length} new Unauthorized rows appended.`
//                     );
//                 }
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//         },
//         {
//             title: "Employee Name",
//             dataIndex: "full_name",
//         },
//         {
//             title: "Leave Date",
//             dataIndex: "leave_date",
//             render: (d: string) => dayjs(d).format("DD-MM-YYYY"),
//         },
//         {
//             title: "Excel Status",
//             dataIndex: "excel_status",
//             render: (txt: string) => (
//                 <Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>
//                     {txt}
//                 </Tag>
//             ),
//         },
//         {
//             title: "System Result",
//             dataIndex: "db_status",
//             render: (status: string) => {
//                 let color = "default";
//                 if (status === "taken") color = "blue";
//                 if (status.includes("Skipped")) color = "orange";
//                 if (status.includes("(Created)")) color = "red";
//                 return <Tag color={color}>{status}</Tag>;
//             },
//         },
//         {
//             title: "Result",
//             render: (_: any, record: any) => {
//                 if (record.db_status === "taken") {
//                     return (
//                         <Tag color="success" icon={<CheckCircleOutlined />}>
//                             Auto Updated to Taken
//                         </Tag>
//                     );
//                 } else if (record.db_status.includes("Skipped")) {
//                     return (
//                         <Tag color="warning" icon={<AlertOutlined />}>
//                             Ignored (Duplicate Row)
//                         </Tag>
//                     );
//                 } else {
//                     return (
//                         <Tag color="error" icon={<AlertOutlined />}>
//                             Unauthorized Leave Created
//                         </Tag>
//                     );
//                 }
//             },
//         },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card
//                 title={
//                     <Title level={3} style={{ margin: 0 }}>
//                         HR Panel Attendance Reconciliation
//                     </Title>
//                 }
//             >
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert
//                         message="Automatic Reconciliation Enabled"
//                         description="Upload biometric attendance file. Approved leaves transition to TAKEN. Duplicate uploads automatically protect existing entries."
//                         type="info"
//                         showIcon
//                     />

//                     <Upload
//                         beforeUpload={handleFileUpload}
//                         showUploadList={false}
//                         accept=".xls,.xlsx"
//                     >
//                         <Button icon={<UploadOutlined />} loading={loading}>
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <Table
//                             dataSource={discrepancies}
//                             columns={columns}
//                             loading={loading}
//                             pagination={{ pageSize: 10 }}
//                         />
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }












// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
// }

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const handleFileUpload = (
//         file: RcFile
//     ): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader =
//             new FileReader();

//         reader.onload = async (
//             e
//         ) => {
//             try {
//                 const data =
//                     e.target?.result;

//                 const workbook =
//                     XLSX.read(data, {
//                         type: "binary",
//                         cellDates: true,
//                     });

//                 const sheetName =
//                     workbook.SheetNames[0];

//                 const worksheet =
//                     workbook.Sheets[
//                     sheetName
//                     ];

//                 const rawRows: any[] =
//                     XLSX.utils.sheet_to_json(
//                         worksheet,
//                         {
//                             header: 1,
//                         }
//                     );

//                 let currentEmpCode =
//                     "";

//                 const rawAbsentAndHalfPresentList:
//                     any[] = [];

//                 // =====================
//                 // PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[], index: number) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");

//                     // Update Employee Code
//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && String(cell).includes("Emp Code:")
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     // Process attendance data
//                     if (currentEmpCode && row[1] !== undefined && row[1] !== null) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : "";

//                         // DEBUG: Log what the system sees for each row


//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                             const lowerStatus = statusStr.toLowerCase().trim();

//                             const isMatch =
//                                 lowerStatus.includes("absent") ||
//                                 lowerStatus.includes("½present") ||
//                                 lowerStatus.includes("1/2") ||
//                                 (lowerStatus.includes("present") && lowerStatus.includes("no outpunch"));

//                             if (isMatch) {
//                                 console.log(
//     "ADDING ROW:",
//     {
//         employee_code:
//             currentEmpCode,
//         originalDate:
//             dateStr,
//         standardizedDate,
//         status:
//             statusStr,
//     }
// );

// rawAbsentAndHalfPresentList.push({
//                                     employee_code: currentEmpCode,
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             } else {

//                             }
//                         } else {

//                         }
//                     }
//                 });

//                 // =====================
//                 // FETCH CURRENT DATABASE ENTRIES
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half, allocated_type")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department, joining_date");
//                 if (empError) throw empError;

//                 const { data: dbCredits, error: creditsError } = await supabase
//                     .schema("leave_management")
//                     .from("el_credits")
//                     .select("*");
//                 if (creditsError) throw creditsError;

//                 // Build Maps
//                 const employeeMap: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[emp.employee_code] = emp;
//                 });

//               const totalLeaveMap: Record<
//     string,
//     any[]
// > = {};

// // Create fast employee id map
// const employeeIdMap:
//     Record<
//         string,
//         any
//     > = {};

// dbEmployees?.forEach(
//     (emp) => {
//         employeeIdMap[
//             emp.id
//         ] = emp;
//     }
// );

// dbLeaves?.forEach(
//     (leave) => {
//         const emp =
//             employeeIdMap[
//             leave.employee_id
//             ];

//         if (!emp)
//             return;

//         const employeeCode =
//             String(
//                 emp.employee_code
//             ).trim();

//         const leaveDate =
//             dayjs(
//                 leave.leave_date
//             ).format(
//                 "YYYY-MM-DD"
//             );

//         const mapKey =
//             `${employeeCode}_${leaveDate}`;

//         if (
//             !totalLeaveMap[
//             mapKey
//             ]
//         ) {
//             totalLeaveMap[
//                 mapKey
//             ] = [];
//         }

//         totalLeaveMap[
//             mapKey
//         ].push(
//             leave
//         );
//     }
// );

// console.log(
//     "TOTAL LEAVE MAP",
//     totalLeaveMap
// );

//                 // Generate Pools
//                 const dynamicPoolCache: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     if (!emp.joining_date) return;
//                     const joinDate = dayjs(emp.joining_date);
//                     const casualPool: any[] = [];
//                     const sickPool: any[] = [];
//                     let loopDate = joinDate.startOf("month");
//                     const endOfCalendarBoundary = dayjs().endOf("year");

//                     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                         const mIdx = loopDate.month();
//                         casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         loopDate = loopDate.add(1, "month");
//                     }

//                     const earnedMap: Record<number, { taken: number; available: number }> = {};
//                     FINANCIAL_MONTHS.forEach(m => {
//                         const monthlyCredits = dbCredits
//                             .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                             .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                         earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                     });

//                     const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && l.status === "taken") || [];
//                     historicalTakenLeaves.forEach(leave => {
//                         const lMonth = dayjs(leave.leave_date).month();
//                         if (leave.allocated_type?.startsWith("casual")) {
//                             const slot = casualPool.find(s => s.monthIndex === lMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type?.startsWith("sick")) {
//                             const slot = sickPool.find(s => s.monthIndex === lMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type === "earned") {
//                             const activeElMonth = FINANCIAL_MONTHS.find(m => earnedMap[m.index].available > earnedMap[m.index].taken);
//                             if (activeElMonth) earnedMap[activeElMonth.index].taken += 0.5;
//                         }
//                     });
//                     dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//                 });

//                 // Process Rows
//                 const idsToUpdate: string[] = [];
//                 const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//                 const unauthorizedLeaves: any[] = [];
//                 const finalRows: DiscrepancyRow[] = [];



//                 const fullDayLeaves =
//     rawAbsentAndHalfPresentList.filter(
//         item => {
//             const status =
//                 item.excel_status
//                     .toLowerCase();

//             return (
//                 !status.includes("½present") &&
//                 !status.includes("1/2")
//             );
//         }
//     );

// const halfDayLeaves =
//     rawAbsentAndHalfPresentList.filter(
//         item => {
//             const status =
//                 item.excel_status
//                     .toLowerCase();

//             return (
//                 status.includes("½present") ||
//                 status.includes("1/2")
//             );
//         }
//     );

// const orderedLeaves = [
//     ...fullDayLeaves,
//     ...halfDayLeaves,
// ];




//                orderedLeaves.forEach((item, index) => {
//                     const employee = employeeMap[item.employee_code];
//                     if (!employee) return;

//                     const mapKey = `${item.employee_code}_${item.leave_date}`;
//                     const dbMatches = totalLeaveMap[mapKey] || [];
//                     const isHalfPresent = item.excel_status.toLowerCase().includes("½present") || item.excel_status.toLowerCase().includes("1/2");
//                     const pools = dynamicPoolCache[item.employee_code];
//                     const leaveDay = dayjs(item.leave_date);

//                     let matchFound = false;
//                     let isAlreadyLoggedUnauthorized = false;
//                     let calculatedAllocationsForThisRow: string[] = [];

//                const processSlotAllocation = (
//     targetHalf: string
// ) => {
//     // PRIORITY:
//     // approved → taken → Unauthorized_Leave

//     const approvedRecord =
//         dbMatches.find(
//             (m) =>
//                 m.half ===
//                     targetHalf &&
//                 m.status ===
//                     "approved"
//         );

//     const takenRecord =
//         dbMatches.find(
//             (m) =>
//                 m.half ===
//                     targetHalf &&
//                 m.status ===
//                     "taken"
//         );

//     const unauthorizedRecord =
//         dbMatches.find(
//             (m) =>
//                 m.half ===
//                     targetHalf &&
//                 m.status ===
//                     "Unauthorized_Leave"
//         );

//     // ======================
//     // APPROVED → TAKE IT
//     // ======================
//     if (approvedRecord) {
//         matchFound = true;

//         let targetAllocatedType =
//             approvedRecord.allocated_type ||
//             "lop";

//         // If allocation missing,
//         // calculate one
//         if (
//             !approvedRecord.allocated_type &&
//             pools
//         ) {
//             const freeCasualSlot =
//                 pools.casual.find(
//                     (s: any) =>
//                         !s.usedDate &&
//                         s.half ===
//                             targetHalf
//                 );

//             const freeSickSlot =
//                 pools.sick.find(
//                     (s: any) =>
//                         !s.usedDate &&
//                         s.half ===
//                             targetHalf
//                 );

//             const freeElMonth =
//                 FINANCIAL_MONTHS.find(
//                     (m) =>
//                         pools.earned[
//                             m.index
//                         ]
//                             .available >
//                         pools.earned[
//                             m.index
//                         ].taken
//                 );

//             if (freeCasualSlot) {
//                 freeCasualSlot.usedDate =
//                     item.leave_date;

//                 targetAllocatedType =
//                     targetHalf ===
//                     "1H"
//                         ? "casual_1H"
//                         : "casual_2H";
//             } else if (
//                 freeSickSlot
//             ) {
//                 freeSickSlot.usedDate =
//                     item.leave_date;

//                 targetAllocatedType =
//                     targetHalf ===
//                     "1H"
//                         ? "sick_1H"
//                         : "sick_2H";
//             } else if (
//                 freeElMonth
//             ) {
//                 pools.earned[
//                     freeElMonth.index
//                 ].taken += 0.5;

//                 targetAllocatedType =
//                     "earned";
//             }
//         }

//         calculatedAllocationsForThisRow.push(
//             targetAllocatedType
//         );

//         // UPDATE DB
//         idsToUpdate.push(
//             approvedRecord.id
//         );

//         leavesToUpdateWithAllocation.push(
//             {
//                 id: approvedRecord.id,
//                 allocated_type:
//                     targetAllocatedType,
//             }
//         );

//         console.log(
//             "APPROVED FOUND:",
//             approvedRecord
//         );

//         return;
//     }

//    // ======================
// // ALREADY TAKEN
// // ======================
// if (takenRecord) {
//     matchFound = true;

//     calculatedAllocationsForThisRow.push(
//         takenRecord.allocated_type ||
//         "taken"
//     );

//     return;
// }

// // ======================
// // UNAUTHORIZED EXISTS
// // ======================
// if (unauthorizedRecord) {
//     matchFound = true;

//     calculatedAllocationsForThisRow.push(
//         unauthorizedRecord.allocated_type || "lop"
//     );

//     idsToUpdate.push(
//         unauthorizedRecord.id
//     );

//     leavesToUpdateWithAllocation.push({
//         id: unauthorizedRecord.id,
//         allocated_type:
//             unauthorizedRecord.allocated_type || "lop",
//     });

//     return;
// }

// // ======================
// // CREATE NEW UNAUTHORIZED
// // ======================

// let targetAllocatedType = "lop";

// // optional pool allocation
// if (pools) {
//     const leaveMonth =
//     dayjs(item.leave_date).month();

// // const freeCasualSlot =
// //     pools.casual
// //         .filter(
// //             (s: any) =>
// //                 !s.usedDate &&
// //                 s.half === targetHalf &&
// //                 s.monthIndex <= leaveMonth
// //         )
// //         .sort(
// //             (a: any, b: any) =>
// //                 a.monthIndex - b.monthIndex
// //         )[0];






// const casualMonth =
//     FINANCIAL_MONTHS.find((m) => {

//         const first =
//             pools.casual.find(
//                 (s:any) =>
//                     !s.usedDate &&
//                     s.monthIndex === m.index &&
//                     s.half === "1H"
//             );

//         const second =
//             pools.casual.find(
//                 (s:any) =>
//                     !s.usedDate &&
//                     s.monthIndex === m.index &&
//                     s.half === "2H"
//             );

//         return (
//             m.index <= leaveMonth &&
//             first &&
//             second
//         );
//     });

// // const freeSickSlot =
// //     pools.sick
// //         .filter(
// //             (s: any) =>
// //                 !s.usedDate &&
// //                 s.half === targetHalf &&
// //                 s.monthIndex <= leaveMonth
// //         )
// //         .sort(
// //             (a: any, b: any) =>
// //                 a.monthIndex - b.monthIndex
// //         )[0];







// const sickMonth =
//     FINANCIAL_MONTHS.find((m) => {

//         const first =
//             pools.sick.find(
//                 (s:any) =>
//                     !s.usedDate &&
//                     s.monthIndex === m.index &&
//                     s.half === "1H"
//             );

//         const second =
//             pools.sick.find(
//                 (s:any) =>
//                     !s.usedDate &&
//                     s.monthIndex === m.index &&
//                     s.half === "2H"
//             );

//         return (
//             m.index <= leaveMonth &&
//             first &&
//             second
//         );
//     });

//     const freeElMonth =
//         FINANCIAL_MONTHS.find(
//             (m) =>
//                 pools.earned[
//                     m.index
//                 ].available >
//                 pools.earned[
//                     m.index
//                 ].taken
//         );

//     // if (freeCasualSlot) {
//     //     freeCasualSlot.usedDate =
//     //         item.leave_date;

//     //     targetAllocatedType =
//     //         targetHalf === "1H"
//     //             ? "casual_1H"
//     //             : "casual_2H";
//     // } else if (
//     //     freeSickSlot
//     // ) {
//     //     freeSickSlot.usedDate =
//     //         item.leave_date;

//     //     targetAllocatedType =
//     //         targetHalf === "1H"
//     //             ? "sick_1H"
//     //             : "sick_2H";
//     // } 

//     if (casualMonth) {

//     const slot =
//         pools.casual.find(
//             (s:any) =>
//                 !s.usedDate &&
//                 s.monthIndex === casualMonth.index &&
//                 s.half === targetHalf
//         );

//     if (slot) {
//         slot.usedDate =
//             item.leave_date;

//         targetAllocatedType =
//             targetHalf === "1H"
//                 ? "casual_1H"
//                 : "casual_2H";
//     }

// }
// else if (sickMonth) {

//     const slot =
//         pools.sick.find(
//             (s:any) =>
//                 !s.usedDate &&
//                 s.monthIndex === sickMonth.index &&
//                 s.half === targetHalf
//         );

//     if (slot) {
//         slot.usedDate =
//             item.leave_date;

//         targetAllocatedType =
//             targetHalf === "1H"
//                 ? "sick_1H"
//                 : "sick_2H";
//     }

// }


//     else if (
//         freeElMonth
//     ) {
//         pools.earned[
//             freeElMonth.index
//         ].taken += 0.5;

//         targetAllocatedType =
//             "earned";
//     }
// }

// console.log(
//     "CREATING UNAUTHORIZED:",
//     employee.employee_code,
//     item.leave_date,
//     targetHalf
// );

// unauthorizedLeaves.push({
//     employee_id:
//         employee.id,

//     employee_name:
//         employee.full_name,

//     department:
//         employee.department,

//     leave_date:
//         item.leave_date,

//     half:
//         targetHalf,

//     type:
//         "Leave",

//     allocated_type:
//         targetAllocatedType,

//     reason:
//         "Auto-created from biometric",

//     status:
//         "Unauthorized_Leave",
// });

// calculatedAllocationsForThisRow.push(
//     targetAllocatedType
// );
// };
//                     if (isHalfPresent) { processSlotAllocation("1H"); } else { processSlotAllocation("1H"); processSlotAllocation("2H"); }

//                     let finalSystemResult = matchFound ? "taken" : (isAlreadyLoggedUnauthorized ? "Unauthorized_Leave (Skipped Duplicate)" : "Unauthorized_Leave (Created)");
//                     finalRows.push({
//                         key: index.toString(),
//                         leave_id: dbMatches.map(m => m.id).join(", ") || "",
//                         employee_code: item.employee_code,
//                         full_name: employee.full_name,
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: finalSystemResult,
//                         allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                         is_match: matchFound,
//                     });
//                 });

//                 if (leavesToUpdateWithAllocation.length > 0) {
//                     for (const item of leavesToUpdateWithAllocation) {
//                         await supabase.schema("leave_management").from("leaves").update({ status: "taken", allocated_type: item.allocated_type }).eq("id", item.id);
//                     }
//                 }
//                 console.log(
//     "UNAUTHORIZED TO INSERT",
//     unauthorizedLeaves
// );
//                 if (unauthorizedLeaves.length > 0) {
//                     const { error: insertError } = await supabase.schema("leave_management").from("leaves").insert(unauthorizedLeaves);
//                     if (insertError) throw insertError;
//                 }
//                 setDiscrepancies(finalRows);
//                 message.success(`Completed! ${idsToUpdate.length} records processed. ${unauthorizedLeaves.length} unauthorized logs written.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result", dataIndex: "db_status", render: (status: string) => {
//                 let color = "default";
//                 if (status === "taken") color = "blue";
//                 if (status.includes("Skipped")) color = "orange";
//                 if (status.includes("(Created)")) color = "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket (DB Status)", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//         {
//             title: "Result", render: (_: any, record: any) => {
//                 if (record.db_status === "taken") return (<Tag color="success" icon={<CheckCircleOutlined />}>Auto Allocated & Closed</Tag>);
//                 if (record.db_status.includes("Skipped")) return (<Tag color="warning" icon={<AlertOutlined />}>Ignored (Duplicate Row)</Tag>);
//                 return (<Tag color="error" icon={<AlertOutlined />}>Unauthorized Created & Allocated</Tag>);
//             }
//         },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert message="Automatic Database Balance Allocation Enabled" description="Uploading biometric records directly allocates remaining employee CL/SL/Earned pools and saves the result securely into the database." type="info" showIcon />
//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>Choose Attendance Report File</Button>
//                     </Upload>
//                     {fileUploaded && (<Table dataSource={discrepancies} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />)}
//                 </Space>
//             </Card>
//         </div>
//     );
// }















// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title } = Typography;

// // Add this right below your imports


// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
// }


// ;
// // Define the type at the top
// type LeaveType = "casual" | "sick" | "earned" | "lop";

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     // Try Casual
//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     // Try Sick
//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     // Try Earned
//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);
//     const handleFileUpload = (
//         file: RcFile
//     ): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader =
//             new FileReader();

//         reader.onload = async (
//             e
//         ) => {
//             try {
//                 const data =
//                     e.target?.result;

//                 const workbook =
//                     XLSX.read(data, {
//                         type: "binary",
//                         cellDates: true,
//                     });

//                 const sheetName =
//                     workbook.SheetNames[0];

//                 const worksheet =
//                     workbook.Sheets[
//                     sheetName
//                     ];

//                 const rawRows: any[] =
//                     XLSX.utils.sheet_to_json(
//                         worksheet,
//                         {
//                             header: 1,
//                         }
//                     );

//                 let currentEmpCode =
//                     "";

//                 const rawAbsentAndHalfPresentList:
//                     any[] = [];

//                 // =====================
//                 // PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[], index: number) => {
//                     if (!row || row.length === 0) return;

//                     const rowText = row.join(" ");

//                     // Update Employee Code
//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && String(cell).includes("Emp Code:")
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                     }

//                     // Process attendance data
//                     if (currentEmpCode && row[1] !== undefined && row[1] !== null) {
//                         const dateStr = String(row[1]).trim();
//                         const statusStr = row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : "";

//                         // DEBUG: Log what the system sees for each row


//                         if (/^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr)) {
//                             const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                             const lowerStatus = statusStr.toLowerCase().trim();

//                             const isMatch =
//                                 lowerStatus.includes("absent") ||
//                                 lowerStatus.includes("½present") ||
//                                 lowerStatus.includes("1/2") ||
//                                 (lowerStatus.includes("present") && lowerStatus.includes("no outpunch"));

//                             if (isMatch) {
//                                 console.log(
//                                     "ADDING ROW:",
//                                     {
//                                         employee_code:
//                                             currentEmpCode,
//                                         originalDate:
//                                             dateStr,
//                                         standardizedDate,
//                                         status:
//                                             statusStr,
//                                     }
//                                 );

//                                 rawAbsentAndHalfPresentList.push({
//                                     employee_code: String(currentEmpCode).trim(),
//                                     leave_date: standardizedDate,
//                                     excel_status: statusStr,
//                                 });
//                             } else {

//                             }
//                         } else {

//                         }
//                     }
//                 });

//                 // =====================
//                 // FETCH CURRENT DATABASE ENTRIES
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half, allocated_type")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department, joining_date");
//                 if (empError) throw empError;

//                 const employeeMap: Record<string, any> = {};

// dbEmployees?.forEach((emp) => {
//     employeeMap[String(emp.employee_code).trim()] = emp;
// });

//                 const { data: dbCredits, error: creditsError } = await supabase
//                     .schema("leave_management")
//                     .from("el_credits")
//                     .select("*");
//                 if (creditsError) throw creditsError;

//                 // Build Maps
//                 // const employeeMap: Record<string, any> = {};


//                 const totalLeaveMap: Record<
//                     string,
//                     any[]
//                 > = {};

//                 // Create fast employee id map
//                 const employeeIdMap:
//                     Record<
//                         string,
//                         any
//                     > = {};

//                 dbEmployees?.forEach(
//                     (emp) => {
//                         employeeIdMap[
//                             emp.id
//                         ] = emp;
//                     }
//                 );

//                 dbLeaves?.forEach(
//                     (leave) => {
//                         const emp =
//                             employeeIdMap[
//                             leave.employee_id
//                             ];

//                         if (!emp)
//                             return;

//                         const employeeCode =
//                             String(
//                                 emp.employee_code
//                             ).trim();

//                         const leaveDate =
//                             dayjs(
//                                 leave.leave_date
//                             ).format(
//                                 "YYYY-MM-DD"
//                             );

//                         const mapKey =
//                             `${employeeCode}_${leaveDate}`;

//                         if (
//                             !totalLeaveMap[
//                             mapKey
//                             ]
//                         ) {
//                             totalLeaveMap[
//                                 mapKey
//                             ] = [];
//                         }

//                         totalLeaveMap[
//                             mapKey
//                         ].push(
//                             leave
//                         );
//                     }
//                 );

//                 console.log(
//                     "TOTAL LEAVE MAP",
//                     totalLeaveMap
//                 );

//                 // Generate Pools
//                 const dynamicPoolCache: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     if (!emp.joining_date) return;
//                     const joinDate = dayjs(emp.joining_date);
//                     const casualPool: any[] = [];
//                     const sickPool: any[] = [];
//                     let loopDate = joinDate.startOf("month");
//                     const endOfCalendarBoundary = dayjs().endOf("year");

//                     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                         const mIdx = loopDate.month();
//                         casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         loopDate = loopDate.add(1, "month");
//                     }

//                     const earnedMap: Record<number, { taken: number; available: number }> = {};
//                     FINANCIAL_MONTHS.forEach(m => {
//                         const monthlyCredits = dbCredits
//                             .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                             .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                         earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                     });

//                     const historicalTakenLeaves =
//                         dbLeaves?.filter(
//                             l =>
//                                 l.employee_id === emp.id &&
//                                 (
//                                     l.status === "taken" ||
//                                     l.status === "Unauthorized_Leave"
//                                 )
//                         ) || [];

//                     historicalTakenLeaves.forEach((leave) => {

//                         const parts =
//                             leave.allocated_type?.split("_") || [];

//                         /*
//                         casual_1H_2026_04
//                         casual_2H_2026_04

//                         sick_1H_2026_04
//                         sick_2H_2026_04

//                         earned_2026_04

//                         lop_2026_04
//                         */

//                         if (
//                             leave.allocated_type?.startsWith("casual")
//                         ) {

//                             const allocationMonth =
//                                 Number(parts[3]) - 1;

//                             const slot =
//                                 casualPool.find(
//                                     (s) =>
//                                         s.monthIndex === allocationMonth &&
//                                         s.half === leave.half
//                                 );

//                             if (slot) {
//                                 slot.usedDate =
//                                     leave.leave_date;
//                             }
//                         }

//                         else if (
//                             leave.allocated_type?.startsWith("sick")
//                         ) {

//                             const allocationMonth =
//                                 Number(parts[3]) - 1;

//                             const slot =
//                                 sickPool.find(
//                                     (s) =>
//                                         s.monthIndex === allocationMonth &&
//                                         s.half === leave.half
//                                 );

//                             if (slot) {
//                                 slot.usedDate =
//                                     leave.leave_date;
//                             }
//                         }

//                         else if (
//                             leave.allocated_type?.startsWith("earned")
//                         ) {

//                             const earnedMonth =
//                                 Number(parts[2]) - 1;

//                             if (
//                                 earnedMap[
//                                 earnedMonth
//                                 ]
//                             ) {
//                                 earnedMap[
//                                     earnedMonth
//                                 ].taken += 0.5;
//                             }
//                         }

//                     });

//                     dynamicPoolCache[
//                         emp.employee_code
//                     ] = {
//                         casual: casualPool,
//                         sick: sickPool,
//                         earned: earnedMap,
//                     };
//                 });





//                 // =====================
//                 // NEW ALLOCATION ENGINE HELPERS
//                 // =====================

//              // =====================
// // NEW ALLOCATION ENGINE
// // =====================

// type LeaveType = "casual" | "sick" | "earned" | "lop";

// // Process Rows
// const idsToUpdate: string[] = [];
// const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
// const unauthorizedLeaves: any[] = [];
// const finalRows: DiscrepancyRow[] = [];

// const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//     const status = item.excel_status.toLowerCase();
//     return !status.includes("½present") && !status.includes("1/2");
// });

// const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//     const status = item.excel_status.toLowerCase();
//     return status.includes("½present") || status.includes("1/2");
// });

// const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

// orderedLeaves.forEach((item, index) => {
//     if (!item.employee_code || !item.leave_date) return;

//     const empCode = String(item.employee_code).trim();
//     const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//     const pools = dynamicPoolCache[empCode];
//     if (!employee || !pools) return;

//     const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//     const leaveDay = dayjs(item.leave_date);

//     let matchFound = false;
//     let calculatedAllocationsForThisRow: string[] = [];

//     // This helper now handles the splitting of "Full" into 1H and 2H
//     const processSlotAllocation = (targetHalf: string) => {
//         const record = dbMatches.find(m => m.half === targetHalf);

//         // 1. If an existing record (approved/taken/unauthorized) is found for this specific half
//         if (record) {
//             matchFound = true;
//             calculatedAllocationsForThisRow.push(record.allocated_type || "taken");
//             if (record.status !== "taken") {
//                 idsToUpdate.push(record.id);
//                 leavesToUpdateWithAllocation.push({ id: record.id, allocated_type: record.allocated_type });
//             }
//             return;
//         }

//         // 2. AUTO-ALLOCATE NEW (Only if no record found for this specific half)
//         const type = decideLeaveType(pools, leaveDay);
//         const targetAllocatedType = `${type}_${leaveDay.format("YYYY_MM")}`;

//         unauthorizedLeaves.push({
//             employee_id: employee.id,
//             employee_name: employee.full_name,
//             department: employee.department,
//             leave_date: item.leave_date,
//             half: targetHalf, // This will now be "1H" or "2H"
//             type: "Leave",
//             allocated_type: targetAllocatedType,
//             reason: "Auto-created from biometric",
//             status: "Unauthorized_Leave",
//         });
//         calculatedAllocationsForThisRow.push(targetAllocatedType);
//     };

//     // LOGIC: If full day, trigger 1H and 2H separately. If already 1H/2H, trigger accordingly.
//     const isFullDay = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");

//     if (isFullDay) {
//         processSlotAllocation("1H");
//         processSlotAllocation("2H");
//     } else {
//         // Handle specific half days if they exist
//         const target = item.excel_status.includes("1H") ? "1H" : "2H";
//         processSlotAllocation(target);
//     }

//     finalRows.push({
//         key: index.toString(),
//         leave_id: dbMatches.map(m => m.id).join(", "),
//         employee_code: item.employee_code,
//         full_name: employee.full_name,
//         leave_date: item.leave_date,
//         excel_status: item.excel_status,
//         db_status: matchFound ? "taken" : "Unauthorized_Leave (Created)",
//         allocated_type: calculatedAllocationsForThisRow.join(" + "),
//         is_match: matchFound,
//     });
// });

// // Final Database Commits
// if (leavesToUpdateWithAllocation.length > 0) {
//     for (const item of leavesToUpdateWithAllocation) {
//         await supabase.schema("leave_management").from("leaves")
//             .update({ status: "taken", allocated_type: item.allocated_type })
//             .eq("id", item.id);
//     }
// }

// if (unauthorizedLeaves.length > 0) {
//     const { error: insertError } = await supabase.schema("leave_management")
//         .from("leaves").insert(unauthorizedLeaves);
//     if (insertError) throw insertError;
// }

// setDiscrepancies(finalRows);
// message.success(`Completed! ${leavesToUpdateWithAllocation.length} updated, ${unauthorizedLeaves.length} created.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result", dataIndex: "db_status", render: (status: string) => {
//                 let color = "default";
//                 if (status === "taken") color = "blue";
//                 if (status.includes("Skipped")) color = "orange";
//                 if (status.includes("(Created)")) color = "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket (DB Status)", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//         {
//             title: "Result", render: (_: any, record: any) => {
//                 if (record.db_status === "taken") return (<Tag color="success" icon={<CheckCircleOutlined />}>Auto Allocated & Closed</Tag>);
//                 if (record.db_status.includes("Skipped")) return (<Tag color="warning" icon={<AlertOutlined />}>Ignored (Duplicate Row)</Tag>);
//                 return (<Tag color="error" icon={<AlertOutlined />}>Unauthorized Created & Allocated</Tag>);
//             }
//         },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Database Balance Allocation Enabled" description="Uploading biometric records directly allocates remaining employee CL/SL/Earned pools and saves the result securely into the database." type="info" showIcon />
//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>Choose Attendance Report File</Button>
//                     </Upload>
//                     {fileUploaded && (<Table dataSource={discrepancies} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />)}
//                 </Space>
//             </Card>
//         </div>
//     );
// }
















// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Divider,
// } from "antd";
// import {
//     UploadOutlined,
//     CheckCircleOutlined,
//     AlertOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title } = Typography;

// // Add this right below your imports


// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
// }


// ;
// // Define the type at the top
// type LeaveType = "casual" | "sick" | "earned" | "lop";

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     // Try Casual
//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     // Try Sick
//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     // Try Earned
//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };


// const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
// const endDate = dayjs().endOf("month").format("YYYY-MM-DD");

// const { data: leaves } = await supabase
//     .schema("leave_management")
//     .from("leaves")
//     .select(`
//         employee_name,
//         status,
//         allocated_type,
//         leave_date
//     `)
//     .gte("leave_date", startDate)
//     .lte("leave_date", endDate);


//     const stats = {
//     processed: 0,
//     unauthorized: 0,
//     applied: 0,
//     lop: 0,

//     unauthorizedStaff: {} as Record<string, number>,
//     lopStaff: {} as Record<string, number>,
//     processedStaff: {} as Record<string, number>,
// };

// leaves?.forEach((leave) => {
//     const name = leave.employee_name || "Unknown";

//     stats.processed += 0.5;

//     stats.processedStaff[name] =
//         (stats.processedStaff[name] || 0) + 0.5;

//     if (leave.status === "Unauthorized_Leave") {
//         stats.unauthorized += 0.5;

//         stats.unauthorizedStaff[name] =
//             (stats.unauthorizedStaff[name] || 0) + 0.5;
//     } else {
//         stats.applied += 0.5;
//     }

//     if (
//         leave.allocated_type
//             ?.toLowerCase()
//             .startsWith("lop")
//     ) {
//         stats.lop += 0.5;

//         stats.lopStaff[name] =
//             (stats.lopStaff[name] || 0) + 0.5;
//     }
// });


// const getTopStaff = (
//     obj: Record<string, number>,
//     limit = 5
// ) =>
//     Object.entries(obj)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, limit);




// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);
//     const handleFileUpload = (
//         file: RcFile
//     ): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader =
//             new FileReader();

//         reader.onload = async (
//             e
//         ) => {
//             try {
//                 const data =
//                     e.target?.result;

//                 const workbook =
//                     XLSX.read(data, {
//                         type: "binary",
//                         cellDates: true,
//                     });

//                 const sheetName =
//                     workbook.SheetNames[0];

//                 const worksheet =
//                     workbook.Sheets[
//                     sheetName
//                     ];

//                 const rawRows: any[] =
//                     XLSX.utils.sheet_to_json(
//                         worksheet,
//                         {
//                             header: 1,
//                         }
//                     );

//                 let currentEmpCode =
//                     "";

//                 const rawAbsentAndHalfPresentList:
//                     any[] = [];

//                 // =====================
//                 // PARSE EXCEL
//                 // =====================
// rawRows.forEach((row: any[], index: number) => {
//     if (!row || row.length === 0) return;

//     const rowText = row.join(" ");

//     // 1. UPDATE EMPLOYEE CODE: 
//     if (rowText.includes("Emp Code:")) {
//         const empCodeIndex = row.findIndex(
//             (cell) => cell && String(cell).includes("Emp Code:")
//         );
//         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//         }
//         return; 
//     }

//     // 2. DYNAMIC ROW PROCESSING:
//     const dateStr = row[1] ? String(row[1]).trim() : "";
//     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//     if (isDateRow && currentEmpCode) {
//         // Scan columns 10 to 18 to find the status string
//         let statusStr = "";
//         for (let i = 10; i <= 18; i++) {
//             const cellVal = row[i] ? String(row[i]).trim() : "";
//             if (cellVal.toLowerCase().includes("present") || 
//                 cellVal.toLowerCase().includes("absent") || 
//                 cellVal.toLowerCase().includes("weeklyoff")) {
//                 statusStr = cellVal;
//                 break;
//             }
//         }

//         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//         const lowerStatus = statusStr.toLowerCase();

//         // 3. IDENTIFY STATUS
//         const isAbsent = lowerStatus.includes("absent");
//         const isHalfDay = lowerStatus.includes("½present") || lowerStatus.includes("1/2");
//         const isNoOutpunch = lowerStatus.includes("no outpunch");

//         // Logic to capture the leave
//         if (isAbsent || isHalfDay || isNoOutpunch) {
//             rawAbsentAndHalfPresentList.push({
//                 employee_code: String(currentEmpCode).trim(),
//                 leave_date: standardizedDate,
//                 excel_status: statusStr,
//             });
//         }
//     }
// });
//                 // =====================
//                 // FETCH CURRENT DATABASE ENTRIES
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half, allocated_type")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department, joining_date");
//                 if (empError) throw empError;

//                 const employeeMap: Record<string, any> = {};

// dbEmployees?.forEach((emp) => {
//     employeeMap[String(emp.employee_code).trim()] = emp;
// });

//                 const { data: dbCredits, error: creditsError } = await supabase
//                     .schema("leave_management")
//                     .from("el_credits")
//                     .select("*");
//                 if (creditsError) throw creditsError;

//                 // Build Maps
//                 // const employeeMap: Record<string, any> = {};


//                 const totalLeaveMap: Record<
//                     string,
//                     any[]
//                 > = {};

//                 // Create fast employee id map
//                 const employeeIdMap:
//                     Record<
//                         string,
//                         any
//                     > = {};

//                 dbEmployees?.forEach(
//                     (emp) => {
//                         employeeIdMap[
//                             emp.id
//                         ] = emp;
//                     }
//                 );

//                 dbLeaves?.forEach(
//                     (leave) => {
//                         const emp =
//                             employeeIdMap[
//                             leave.employee_id
//                             ];

//                         if (!emp)
//                             return;

//                         const employeeCode =
//                             String(
//                                 emp.employee_code
//                             ).trim();

//                         const leaveDate =
//                             dayjs(
//                                 leave.leave_date
//                             ).format(
//                                 "YYYY-MM-DD"
//                             );

//                         const mapKey =
//                             `${employeeCode}_${leaveDate}`;

//                         if (
//                             !totalLeaveMap[
//                             mapKey
//                             ]
//                         ) {
//                             totalLeaveMap[
//                                 mapKey
//                             ] = [];
//                         }

//                         totalLeaveMap[
//                             mapKey
//                         ].push(
//                             leave
//                         );
//                     }
//                 );

//                 console.log(
//                     "TOTAL LEAVE MAP",
//                     totalLeaveMap
//                 );

//                 // Generate Pools
//                 const dynamicPoolCache: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     if (!emp.joining_date) return;
//                     const joinDate = dayjs(emp.joining_date);
//                     const casualPool: any[] = [];
//                     const sickPool: any[] = [];
//                     let loopDate = joinDate.startOf("month");
//                     const endOfCalendarBoundary = dayjs().endOf("year");

//                     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                         const mIdx = loopDate.month();
//                         casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         loopDate = loopDate.add(1, "month");
//                     }

//                     const earnedMap: Record<number, { taken: number; available: number }> = {};
//                     FINANCIAL_MONTHS.forEach(m => {
//                         const monthlyCredits = dbCredits
//                             .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                             .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                         earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                     });

//                     const historicalTakenLeaves =
//                         dbLeaves?.filter(
//                             l =>
//                                 l.employee_id === emp.id &&
//                                 (
//                                     l.status === "taken" ||
//                                     l.status === "Unauthorized_Leave"
//                                 )
//                         ) || [];

//                     historicalTakenLeaves.forEach((leave) => {

//                         const parts =
//                             leave.allocated_type?.split("_") || [];

//                         /*
//                         casual_1H_2026_04
//                         casual_2H_2026_04

//                         sick_1H_2026_04
//                         sick_2H_2026_04

//                         earned_2026_04

//                         lop_2026_04
//                         */

//                         if (
//                             leave.allocated_type?.startsWith("casual")
//                         ) {

//                             const allocationMonth =
//                                 Number(parts[3]) - 1;

//                             const slot =
//                                 casualPool.find(
//                                     (s) =>
//                                         s.monthIndex === allocationMonth &&
//                                         s.half === leave.half
//                                 );

//                             if (slot) {
//                                 slot.usedDate =
//                                     leave.leave_date;
//                             }
//                         }

//                         else if (
//                             leave.allocated_type?.startsWith("sick")
//                         ) {

//                             const allocationMonth =
//                                 Number(parts[3]) - 1;

//                             const slot =
//                                 sickPool.find(
//                                     (s) =>
//                                         s.monthIndex === allocationMonth &&
//                                         s.half === leave.half
//                                 );

//                             if (slot) {
//                                 slot.usedDate =
//                                     leave.leave_date;
//                             }
//                         }

//                         else if (
//                             leave.allocated_type?.startsWith("earned")
//                         ) {

//                             const earnedMonth =
//                                 Number(parts[2]) - 1;

//                             if (
//                                 earnedMap[
//                                 earnedMonth
//                                 ]
//                             ) {
//                                 earnedMap[
//                                     earnedMonth
//                                 ].taken += 0.5;
//                             }
//                         }

//                     });

//                     dynamicPoolCache[
//                         emp.employee_code
//                     ] = {
//                         casual: casualPool,
//                         sick: sickPool,
//                         earned: earnedMap,
//                     };
//                 });





//                 // =====================
//                 // NEW ALLOCATION ENGINE HELPERS
//                 // =====================

//              // =====================
// // NEW ALLOCATION ENGINE
// // =====================

// type LeaveType = "casual" | "sick" | "earned" | "lop";

// // Process Rows
// const idsToUpdate: string[] = [];
// const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
// const unauthorizedLeaves: any[] = [];
// const finalRows: DiscrepancyRow[] = [];

// const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//     const status = item.excel_status.toLowerCase();
//     return !status.includes("½present") && !status.includes("1/2");
// });

// const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//     const status = item.excel_status.toLowerCase();
//     return status.includes("½present") || status.includes("1/2");
// });

// const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

// orderedLeaves.forEach((item, index) => {
//     if (!item.employee_code || !item.leave_date) return;

//     const empCode = String(item.employee_code).trim();
//     const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//     const pools = dynamicPoolCache[empCode];
//     if (!employee || !pools) return;

//     const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//     const leaveDay = dayjs(item.leave_date);

//     let matchFound = false;
//     let calculatedAllocationsForThisRow: string[] = [];

//     // This helper now handles the splitting of "Full" into 1H and 2H
//     const processSlotAllocation = (targetHalf: string) => {
//         const record = dbMatches.find(m => m.half === targetHalf);

//         // 1. If an existing record (approved/taken/unauthorized) is found for this specific half
//         if (record) {
//             matchFound = true;
//             calculatedAllocationsForThisRow.push(record.allocated_type || "taken");
//             if (record.status !== "taken") {
//                 idsToUpdate.push(record.id);
//                 leavesToUpdateWithAllocation.push({ id: record.id, allocated_type: record.allocated_type });
//             }
//             return;
//         }

//         // 2. AUTO-ALLOCATE NEW (Only if no record found for this specific half)
//         const type = decideLeaveType(pools, leaveDay);
//         const targetAllocatedType = `${type}_${leaveDay.format("YYYY_MM")}`;

//         unauthorizedLeaves.push({
//             employee_id: employee.id,
//             employee_name: employee.full_name,
//             department: employee.department,
//             leave_date: item.leave_date,
//             half: targetHalf, // This will now be "1H" or "2H"
//             type: "Leave",
//             allocated_type: targetAllocatedType,
//             reason: "Auto-created from biometric",
//             status: "Unauthorized_Leave",
//         });
//         calculatedAllocationsForThisRow.push(targetAllocatedType);
//     };

//     // LOGIC: If full day, trigger 1H and 2H separately. If already 1H/2H, trigger accordingly.
//     const isFullDay = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");

//     if (isFullDay) {
//         processSlotAllocation("1H");
//         processSlotAllocation("2H");
//     } else {
//         // Handle specific half days if they exist
//         const target = item.excel_status.includes("1H") ? "1H" : "2H";
//         processSlotAllocation(target);
//     }

//     finalRows.push({
//         key: index.toString(),
//         leave_id: dbMatches.map(m => m.id).join(", "),
//         employee_code: item.employee_code,
//         full_name: employee.full_name,
//         leave_date: item.leave_date,
//         excel_status: item.excel_status,
//         db_status: matchFound ? "taken" : "Unauthorized_Leave (Created)",
//         allocated_type: calculatedAllocationsForThisRow.join(" + "),
//         is_match: matchFound,
//     });
// });

// // Final Database Commits
// if (leavesToUpdateWithAllocation.length > 0) {
//     for (const item of leavesToUpdateWithAllocation) {
//         await supabase.schema("leave_management").from("leaves")
//             .update({ status: "taken", allocated_type: item.allocated_type })
//             .eq("id", item.id);
//     }
// }

// if (unauthorizedLeaves.length > 0) {
//     const { error: insertError } = await supabase.schema("leave_management")
//         .from("leaves").insert(unauthorizedLeaves);
//     if (insertError) throw insertError;
// }

// setDiscrepancies(finalRows);
// message.success(`Completed! ${leavesToUpdateWithAllocation.length} updated, ${unauthorizedLeaves.length} created.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result", dataIndex: "db_status", render: (status: string) => {
//                 let color = "default";
//                 if (status === "taken") color = "blue";
//                 if (status.includes("Skipped")) color = "orange";
//                 if (status.includes("(Created)")) color = "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket (DB Status)", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//         {
//             title: "Result", render: (_: any, record: any) => {
//                 if (record.db_status === "taken") return (<Tag color="success" icon={<CheckCircleOutlined />}>Auto Allocated & Closed</Tag>);
//                 if (record.db_status.includes("Skipped")) return (<Tag color="warning" icon={<AlertOutlined />}>Ignored (Duplicate Row)</Tag>);
//                 return (<Tag color="error" icon={<AlertOutlined />}>Unauthorized Created & Allocated</Tag>);
//             }
//         },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Database Balance Allocation Enabled" description="Uploading biometric records directly allocates remaining employee CL/SL/Earned pools and saves the result securely into the database." type="info" showIcon />
//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading}>Choose Attendance Report File</Button>
//                     </Upload>
//                     {fileUploaded && (<Table dataSource={discrepancies} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />)}
//                 </Space>
//             </Card>

//                 <Card
//     title="Unauthorized Leaves"
//     variant="borderless"
// >
//     <Statistic
//         value={stats.unauthorized}
//     />

//     <Divider />

//     {getTopStaff(
//         stats.unauthorizedStaff
//     ).map(([name, count]) => (
//         <div
//             key={name}
//             style={{
//                 display: "flex",
//                 justifyContent:
//                     "space-between",
//                 marginBottom: 6,
//             }}
//         >
//             <span>{name}</span>
//             <Tag color="red">
//                 {count}
//             </Tag>
//         </div>
//     ))}
// </Card>

//         </div>
//     );
// }










// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 // =====================
//                 // 1. PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         const isAbsent = lowerStatus.includes("absent");
//                         const isHalfDay = lowerStatus.includes("½present") || lowerStatus.includes("1/2");
//                         const isNoOutpunch = lowerStatus.includes("no outpunch");

//                         if (isAbsent || isHalfDay || isNoOutpunch) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 // =====================
//                 // 2. FETCH CURRENT DATABASE ENTRIES
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half, allocated_type")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department, joining_date");
//                 if (empError) throw empError;

//                 const employeeMap: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[String(emp.employee_code).trim()] = emp;
//                 });

//                 const { data: dbCredits, error: creditsError } = await supabase
//                     .schema("leave_management")
//                     .from("el_credits")
//                     .select("*");
//                 if (creditsError) throw creditsError;

//                 const totalLeaveMap: Record<string, any[]> = {};
//                 const employeeIdMap: Record<string, any> = {};

//                 dbEmployees?.forEach((emp) => {
//                     employeeIdMap[emp.id] = emp;
//                 });

//                 dbLeaves?.forEach((leave) => {
//                     const emp = employeeIdMap[leave.employee_id];
//                     if (!emp) return;

//                     const employeeCode = String(emp.employee_code).trim();
//                     const leaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//                     const mapKey = `${employeeCode}_${leaveDate}`;

//                     if (!totalLeaveMap[mapKey]) {
//                         totalLeaveMap[mapKey] = [];
//                     }
//                     totalLeaveMap[mapKey].push(leave);
//                 });

//                 // Generate Pools
//                 const dynamicPoolCache: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     if (!emp.joining_date) return;
//                     const joinDate = dayjs(emp.joining_date);
//                     const casualPool: any[] = [];
//                     const sickPool: any[] = [];
//                     let loopDate = joinDate.startOf("month");
//                     const endOfCalendarBoundary = dayjs().endOf("year");

//                     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                         const mIdx = loopDate.month();
//                         casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         loopDate = loopDate.add(1, "month");
//                     }

//                     const earnedMap: Record<number, { taken: number; available: number }> = {};
//                     FINANCIAL_MONTHS.forEach(m => {
//                         const monthlyCredits = dbCredits
//                             .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                             .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                         earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                     });

//                     const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && (l.status === "taken" || l.status === "Unauthorized_Leave")) || [];

//                     historicalTakenLeaves.forEach((leave) => {
//                         const parts = leave.allocated_type?.split("_") || [];
//                         if (leave.allocated_type?.startsWith("casual")) {
//                             const allocationMonth = Number(parts[3]) - 1;
//                             const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type?.startsWith("sick")) {
//                             const allocationMonth = Number(parts[3]) - 1;
//                             const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type?.startsWith("earned")) {
//                             const earnedMonth = Number(parts[2]) - 1;
//                             if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                         }
//                     });

//                     dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//                 });

//                 // =====================
//                 // 3. NEW ALLOCATION ENGINE & TRACKING
//                 // =====================
//                 const idsToUpdate: string[] = [];
//                 const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//                 const unauthorizedLeaves: any[] = [];
//                 const finalRows: DiscrepancyRow[] = [];
//                 const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//                 let matchedCounter = 0;
//                 let unauthorizedCounter = 0;
//                 let invalidCodeCounter = 0;

//                 const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//                     const status = item.excel_status.toLowerCase();
//                     return !status.includes("½present") && !status.includes("1/2");
//                 });

//                 const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//                     const status = item.excel_status.toLowerCase();
//                     return status.includes("½present") || status.includes("1/2");
//                 });

//                 const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//                 orderedLeaves.forEach((item, index) => {
//                     if (!item.employee_code || !item.leave_date) return;

//                     const empCode = String(item.employee_code).trim();
//                     const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//                     const pools = dynamicPoolCache[empCode];

//                     // Track cumulative leave hits per employee
//                     const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//                     const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//                     if (!staffLeaveCounter[empCode]) {
//                         staffLeaveCounter[empCode] = {
//                             name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE",
//                             count: 0
//                         };
//                     }
//                     staffLeaveCounter[empCode].count += incrementalWeight;

//                     if (!employee || !pools) {
//                         invalidCodeCounter++;
//                         finalRows.push({
//                             key: `err-${index}`,
//                             leave_id: "N/A",
//                             employee_code: empCode,
//                             full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                             leave_date: item.leave_date,
//                             excel_status: item.excel_status,
//                             db_status: "Rejected / Skipped",
//                             allocated_type: "NONE",
//                             is_match: false,
//                             issue_type: "INVALID_EMP_CODE",
//                         });
//                         return;
//                     }

//                     const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//                     const leaveDay = dayjs(item.leave_date);

//                     let matchFound = false;
//                     let calculatedAllocationsForThisRow: string[] = [];

//                     const processSlotAllocation = (targetHalf: string) => {
//                         const record = dbMatches.find(m => m.half === targetHalf);

//                         if (record) {
//                             matchFound = true;
//                             calculatedAllocationsForThisRow.push(record.allocated_type || "taken");
//                             if (record.status !== "taken") {
//                                 idsToUpdate.push(record.id);
//                                 leavesToUpdateWithAllocation.push({ id: record.id, allocated_type: record.allocated_type });
//                             }
//                             return;
//                         }

//                         const type = decideLeaveType(pools, leaveDay);
//                         const targetAllocatedType = `${type}_${leaveDay.format("YYYY_MM")}`;

//                         unauthorizedLeaves.push({
//                             employee_id: employee.id,
//                             employee_name: employee.full_name,
//                             department: employee.department,
//                             leave_date: item.leave_date,
//                             half: targetHalf,
//                             type: "Leave",
//                             allocated_type: targetAllocatedType,
//                             reason: "Auto-created from biometric",
//                             status: "Unauthorized_Leave",
//                         });
//                         calculatedAllocationsForThisRow.push(targetAllocatedType);
//                     };

//                     if (isFullDayRow) {
//                         processSlotAllocation("1H");
//                         processSlotAllocation("2H");
//                     } else {
//                         const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                         processSlotAllocation(target);
//                     }

//                     if (matchFound) matchedCounter++; 
//                     else unauthorizedCounter++;

//                     finalRows.push({
//                         key: index.toString(),
//                         leave_id: dbMatches.map(m => m.id).join(", "),
//                         employee_code: item.employee_code,
//                         full_name: employee.full_name,
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: matchFound ? "taken" : "Unauthorized_Leave (Created)",
//                         allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                         is_match: matchFound,
//                         issue_type: matchFound ? "MATCHED" : "UNAUTHORIZED_CREATED",
//                     });
//                 });

//                 if (leavesToUpdateWithAllocation.length > 0) {
//                     for (const item of leavesToUpdateWithAllocation) {
//                         await supabase.schema("leave_management").from("leaves")
//                             .update({ status: "taken", allocated_type: item.allocated_type })
//                             .eq("id", item.id);
//                     }
//                 }

//                 if (unauthorizedLeaves.length > 0) {
//                     const { error: insertError } = await supabase.schema("leave_management")
//                         .from("leaves").insert(unauthorizedLeaves);
//                     if (insertError) throw insertError;
//                 }

//                 // Compile single line staff totals mapping
//                 const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//                     employee_code: code,
//                     full_name: staffLeaveCounter[code].name,
//                     total_leaves: staffLeaveCounter[code].count,
//                 }));

//                 setStaffSummaries(summariesList);
//                 setSummaryStats({
//                     totalRows: orderedLeaves.length,
//                     matchedCount: matchedCounter,
//                     unauthorizedCreated: unauthorizedCounter,
//                     invalidCodes: invalidCodeCounter,
//                 });

//                 setDiscrepancies(finalRows);
//                 setFileUploaded(true);

//                 if (invalidCodeCounter > 0) {
//                     message.warning(`Reconciliation completed with ${invalidCodeCounter} unmapped system errors.`);
//                 } else {
//                     message.success("Reconciliation successfully synchronized!");
//                 }

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         { 
//             title: "Emp Code", 
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//     ];

//     // Filter to strictly display exception issues (Unmapped codes & Unauthorized Auto-allocations)
//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <List
//                                     dataSource={staffSummaries}
//                                     size="small"
//                                     bordered={false}
//                                     renderItem={(staff) => (
//                                         <List.Item style={{ padding: "6px 12px" }}>
//                                             <div>
//                                                 <Text strong style={{ marginRight: 12 }}>[Code: {staff.employee_code}]</Text>
//                                                 <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </List.Item>
//                                     )}
//                                 />
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table 
//                                 dataSource={issueRowsOnly} 
//                                 columns={columns} 
//                                 loading={loading} 
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }

























// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// interface RawLeaveItem {
//     employee_code: string;
//     leave_date: string;
//     excel_status: string;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [recalculating, setRecalculating] = useState(false);
//     const [rawUploadedData, setRawUploadedData] = useState<RawLeaveItem[]>([]);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // Phase 1: Read Sheet Data & Populate Raw Data Array Structure
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setRawUploadedData([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const parsedLeaves: RawLeaveItem[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         const isAbsent = lowerStatus.includes("absent");
//                         const isHalfDay = lowerStatus.includes("½present") || lowerStatus.includes("1/2");
//                         const isNoOutpunch = lowerStatus.includes("no outpunch");

//                         if (isAbsent || isHalfDay || isNoOutpunch) {
//                             parsedLeaves.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 if (parsedLeaves.length === 0) {
//                     message.warning("No leave exception structural entries detected inside the worksheet payload.");
//                     setLoading(false);
//                     return;
//                 }

//                 setRawUploadedData(parsedLeaves);
//                 setFileUploaded(true);
//                 message.success(`Successfully imported ${parsedLeaves.length} exception rows. Click 'Recalculate Data' to process dynamic balances.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An exception fault error triggered reading file contents.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // Phase 2: Fresh Query of Base Rules (Joining Date Changes / Extra EL Credits)
//     const handleRecalculation = async () => {
//         if (rawUploadedData.length === 0) {
//             message.error("No raw layout tracking array buffers found. Upload target spreadsheet files first.");
//             return;
//         }

//         setRecalculating(true);
//         try {
//             // Fresh dynamic read of core entities
//             const { data: dbLeaves, error: dbError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, employee_id, half, allocated_type")
//                 .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//             if (dbError) throw dbError;

//             const { data: employeesList, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, full_name, department, joining_date");
//             if (empError) throw empError;

//             const { data: dbCredits, error: creditsError } = await supabase
//                 .schema("leave_management")
//                 .from("el_credits")
//                 .select("*");
//             if (creditsError) throw creditsError;

//             // Map variables based on fresh query
//             const employeeMap: Record<string, any> = {};
//             const employeeIdMap: Record<string, any> = {};
//             employeesList?.forEach((emp) => {
//                 const codeKey = String(emp.employee_code).trim();
//                 employeeMap[codeKey] = emp;
//                 employeeIdMap[emp.id] = emp;
//             });

//             const totalLeaveMap: Record<string, any[]> = {};
//             dbLeaves?.forEach((leave) => {
//                 const emp = employeeIdMap[leave.employee_id];
//                 if (!emp) return;

//                 const employeeCode = String(emp.employee_code).trim();
//                 const leaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//                 const mapKey = `${employeeCode}_${leaveDate}`;

//                 if (!totalLeaveMap[mapKey]) {
//                     totalLeaveMap[mapKey] = [];
//                 }
//                 totalLeaveMap[mapKey].push(leave);
//             });

//             // Re-build all functional bucket pools considering altered configurations 
//             const dynamicPoolCache: Record<string, any> = {};
//             employeesList?.forEach((emp) => {
//                 if (!emp.joining_date) return;

//                 // Affected Step A: Use freshly grabbed joining date value boundary
//                 const joinDate = dayjs(emp.joining_date);
//                 const casualPool: any[] = [];
//                 const sickPool: any[] = [];
//                 let loopDate = joinDate.startOf("month");
//                 const endOfCalendarBoundary = dayjs().endOf("year");

//                 while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                     const mIdx = loopDate.month();
//                     casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                     sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                     loopDate = loopDate.add(1, "month");
//                 }

//                 // Affected Step B: Calculate fresh EL balances including manual adjustments
//                 const earnedMap: Record<number, { taken: number; available: number }> = {};
//                 FINANCIAL_MONTHS.forEach(m => {
//                     const monthlyCredits = dbCredits
//                         .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                         .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                     earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                 });

//                 // Re-hydrate consumption counts safely from explicitly structured manual adjustments
//                 const establishedApprovedLeaves = dbLeaves?.filter(l => 
//                     l.employee_id === emp.id && 
//                     (l.status === "approved" || l.status === "taken") && 
//                     !l.allocated_type?.includes("auto_")
//                 ) || [];

//                 establishedApprovedLeaves.forEach((leave) => {
//                     const parts = leave.allocated_type?.split("_") || [];
//                     if (leave.allocated_type?.startsWith("casual")) {
//                         const allocationMonth = Number(parts[3]) - 1;
//                         const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                         if (slot) slot.usedDate = leave.leave_date;
//                     } else if (leave.allocated_type?.startsWith("sick")) {
//                         const allocationMonth = Number(parts[3]) - 1;
//                         const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                         if (slot) slot.usedDate = leave.leave_date;
//                     } else if (leave.allocated_type?.startsWith("earned")) {
//                         const earnedMonth = Number(parts[2]) - 1;
//                         if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                     }
//                 });

//                 dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//             });

//             // Tracking and balance output arrays
//             const finalRows: DiscrepancyRow[] = [];
//             const staffLeaveCounter: Record<string, { name: string; count: number }> = {};
//             const leavesToUpsert: any[] = [];

//             let matchedCounter = 0;
//             let unauthorizedCounter = 0;
//             let invalidCodeCounter = 0;

//             const fullDayLeaves = rawUploadedData.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return !status.includes("½present") && !status.includes("1/2");
//             });
//             const halfDayLeaves = rawUploadedData.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return status.includes("½present") || status.includes("1/2");
//             });
//             const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//             orderedLeaves.forEach((item, index) => {
//                 if (!item.employee_code || !item.leave_date) return;

//                 const empCode = String(item.employee_code).trim();
//                 const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//                 const pools = dynamicPoolCache[empCode];

//                 const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//                 const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//                 if (!staffLeaveCounter[empCode]) {
//                     staffLeaveCounter[empCode] = {
//                         name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE",
//                         count: 0
//                     };
//                 }
//                 staffLeaveCounter[empCode].count += incrementalWeight;

//                 if (!employee || !pools) {
//                     invalidCodeCounter++;
//                     finalRows.push({
//                         key: `err-${index}`,
//                         leave_id: "N/A",
//                         employee_code: empCode,
//                         full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: "Rejected / Skipped",
//                         allocated_type: "NONE",
//                         is_match: false,
//                         issue_type: "INVALID_EMP_CODE",
//                     });
//                     return;
//                 }

//                 const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//                 const leaveDay = dayjs(item.leave_date);

//                 let matchFound = false;
//                 let calculatedAllocationsForThisRow: string[] = [];

//                 const processSlotAllocation = (targetHalf: string) => {
//                     const existingRecord = dbMatches.find(m => m.half === targetHalf);

//                     // If manually managed or pre-approved, protect that assignment mapping
//                     if (existingRecord && existingRecord.status === "approved") {
//                         matchFound = true;
//                         calculatedAllocationsForThisRow.push(existingRecord.allocated_type || "approved");
//                         return;
//                     }

//                     // Re-calculate the dynamically evaluated allocation string
//                     const determinedType = decideLeaveType(pools, leaveDay);
//                     const targetAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;
//                     calculatedAllocationsForThisRow.push(targetAllocatedType);

//                     const baselinePayload = {
//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Dynamic allocation updated via recalculation",
//                         status: "Unauthorized_Leave" as const,
//                     };

//                     if (existingRecord) {
//                         // Update existing dynamic mapping record
//                         leavesToUpsert.push({ id: existingRecord.id, ...baselinePayload });
//                         matchFound = true;
//                     } else {
//                         // Queue clean record insert configuration
//                         leavesToUpsert.push(baselinePayload);
//                     }
//                 };

//                 if (isFullDayRow) {
//                     processSlotAllocation("1H");
//                     processSlotAllocation("2H");
//                 } else {
//                     const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                     processSlotAllocation(target);
//                 }

//                 if (matchFound) matchedCounter++; 
//                 else unauthorizedCounter++;

//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: dbMatches.map(m => m.id).join(", ") || "New Dynamic Tracking Row",
//                     employee_code: item.employee_code,
//                     full_name: employee.full_name,
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: matchFound ? "synchronized" : "Unauthorized_Leave (Calculated)",
//                     allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                     is_match: matchFound,
//                     issue_type: matchFound ? "MATCHED" : "UNAUTHORIZED_CREATED",
//                 });
//             });

//             // Safe transactional atomic sync step
//             if (leavesToUpsert.length > 0) {
//                 const { error: upsertError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .upsert(leavesToUpsert, { onConflict: "id" });
//                 if (upsertError) throw upsertError;
//             }

//             const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//                 employee_code: code,
//                 full_name: staffLeaveCounter[code].name,
//                 total_leaves: staffLeaveCounter[code].count,
//             }));

//             setStaffSummaries(summariesList);
//             setSummaryStats({
//                 totalRows: orderedLeaves.length,
//                 matchedCount: matchedCounter,
//                 unauthorizedCreated: unauthorizedCounter,
//                 invalidCodes: invalidCodeCounter,
//             });

//             setDiscrepancies(finalRows);
//             message.success("Recalculation completed! Dynamic pools and allocations updated successfully.");

//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "An error occurred during allocation rule evaluations.");
//         } finally {
//             setRecalculating(false);
//         }
//     };

//     const columns = [
//         { 
//             title: "Emp Code", 
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "blue";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#2f54eb" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Aligned Control Buttons Row */}
//                     <Space size="middle" direction="horizontal">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button 
//                             icon={<SyncOutlined />} 
//                             onClick={handleRecalculation} 
//                             loading={recalculating} 
//                             disabled={!fileUploaded}
//                             type="default"
//                             style={{ borderColor: fileUploaded ? "#1890ff" : undefined, color: fileUploaded ? "#1890ff" : undefined }}
//                         >
//                             Recalculate Data
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {discrepancies.length > 0 && (
//                                 <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                     <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                     <Row gutter={16}>
//                                         <Col span={6}>
//                                             <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                         </Col>
//                                         <Col span={6}>
//                                             <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                         </Col>
//                                         <Col span={6}>
//                                             <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                         </Col>
//                                         <Col span={6}>
//                                             <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                         </Col>
//                                     </Row>
//                                 </div>
//                             )}

//                             {staffSummaries.length > 0 && (
//                                 <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                     <List
//                                         dataSource={staffSummaries}
//                                         size="small"
//                                         bordered={false}
//                                         renderItem={(staff) => (
//                                             <List.Item style={{ padding: "6px 12px" }}>
//                                                 <div>
//                                                     <Text strong style={{ marginRight: 12 }}>[Code: {staff.employee_code}]</Text>
//                                                     <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                                     <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                     <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                                 </div>
//                                             </List.Item>
//                                         )}
//                                     />
//                                 </Card>
//                             )}

//                             {issueRowsOnly.length > 0 && (
//                                 <>
//                                     <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                                     <Table 
//                                         dataSource={issueRowsOnly} 
//                                         columns={columns} 
//                                         loading={recalculating} 
//                                         pagination={{ pageSize: 10 }}
//                                         locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                                     />
//                                 </>
//                             )}
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }













// "use client";

// import { useState, useEffect } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     InfoCircleOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status?: string;
//     db_status: string;
//     allocated_type: string;
// }

// interface RawLeaveItem {
//     employee_code: string;
//     leave_date: string;
//     excel_status: string;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [recalculating, setRecalculating] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);

//     // Fetch system discrepancies automatically on mount to show current status without uploading anything
//     useEffect(() => {
//         fetchCurrentSystemDiscrepancies();
//     }, []);

//     const fetchCurrentSystemDiscrepancies = async () => {
//         try {
//             const { data: dbLeaves } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, allocated_type, employee_name, half, employee_id, type, reason")
//                 .eq("status", "Unauthorized_Leave");

//             const { data: employeesList } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code");

//             const empIdToCodeMap: Record<string, string> = {};
//             employeesList?.forEach(e => { empIdToCodeMap[e.id] = e.employee_code; });

//             if (dbLeaves) {
//                 const mapped: DiscrepancyRow[] = dbLeaves.map((l, index) => ({
//                     key: index.toString(),
//                     leave_id: l.id,
//                     employee_code: empIdToCodeMap[l.employee_id] || "UNKNOWN",
//                     full_name: l.employee_name || "Staff Member",
//                     leave_date: l.leave_date,
//                     db_status: `Unauthorized_Leave (${l.half})`,
//                     allocated_type: l.allocated_type || "UNASSIGNED"
//                 }));
//                 setDiscrepancies(mapped);
//             }
//         } catch (err) {
//             console.error("Error fetching initial view logs:", err);
//         }
//     };

//     // Shared Engine: Pulls data fresh from DB, figures pools out, and handles upsert allocations
//     const runAllocationEngine = async (providedExcelLeaves?: RawLeaveItem[]) => {
//         // 1. Fetch clean system baselines
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type, employee_name, department, type, reason")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: employeesList, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             const codeKey = String(emp.employee_code).trim();
//             employeeMap[codeKey] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         // 2. Build dynamic balance pools on the fly (taking fresh joining dates into account)
//         const dynamicPoolCache: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             if (!emp.joining_date) return;

//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             // Re-hydrate static approved assignments safely
//             const establishedApprovedLeaves = dbLeaves?.filter(l => 
//                 l.employee_id === emp.id && 
//                 (l.status === "approved" || l.status === "taken") && 
//                 !l.allocated_type?.includes("auto_")
//             ) || [];

//             establishedApprovedLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.id] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const leavesToUpsert: any[] = [];
//         const uiOutputRows: DiscrepancyRow[] = [];

//         // 3. Determine the evaluation source target payload
//         if (providedExcelLeaves) {
//             // Context A: Executing file parsing upload logic pipelines
//             providedExcelLeaves.forEach((item, index) => {
//                 const empCode = String(item.employee_code).trim();
//                 const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//                 if (!employee) return;

//                 const pools = dynamicPoolCache[employee.id];
//                 const leaveDay = dayjs(item.leave_date);
//                 const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");

//                 const evaluateAndQueue = (targetHalf: string) => {
//                     // Check if an approved row exists to preserve it
//                     const preExistingMatch = dbLeaves?.find(l => l.employee_id === employee.id && l.leave_date === item.leave_date && l.half === targetHalf);
//                     if (preExistingMatch && preExistingMatch.status === "approved") return preExistingMatch.allocated_type;

//                     const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                     const targetAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                     leavesToUpsert.push({
//                         id: preExistingMatch?.id || undefined, // Upsert cleanly if record exists
//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Biometric auto-exception matching",
//                         status: preExistingMatch?.status || "Unauthorized_Leave",
//                     });

//                     return targetAllocatedType;
//                 };

//                 let computedAllocations: string[] = [];
//                 if (isFullDayRow) {
//                     computedAllocations.push(evaluateAndQueue("1H") || "");
//                     computedAllocations.push(evaluateAndQueue("2H") || "");
//                 } else {
//                     const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                     computedAllocations.push(evaluateAndQueue(target) || "");
//                 }

//                 uiOutputRows.push({
//                     key: index.toString(),
//                     leave_id: "Auto Generated",
//                     employee_code: empCode,
//                     full_name: employee.full_name,
//                     leave_date: item.leave_date,
//                     db_status: "Unauthorized_Leave",
//                     allocated_type: computedAllocations.filter(Boolean).join(" + ")
//                 });
//             });
//         } else {
//             // Context B: RECALCULATING FROM DATABASE DIRECTLY (No excel file dependency)
//             const systemUnauthorizedLeaves = dbLeaves?.filter(l => l.status === "Unauthorized_Leave") || [];

//             systemUnauthorizedLeaves.forEach((leave, index) => {
//                 const pools = dynamicPoolCache[leave.employee_id];
//                 const leaveDay = dayjs(leave.leave_date);
//                 const emp = employeeIdMap[leave.employee_id];

//                 const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                 const freshAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                 // Push only the recalculated changes onto the operation stack
//                 leavesToUpsert.push({
//                     id: leave.id,
//                     employee_id: leave.employee_id,
//                     employee_name: leave.employee_name,
//                     department: leave.department,
//                     leave_date: leave.leave_date,
//                     half: leave.half,
//                     type: leave.type,
//                     allocated_type: freshAllocatedType,
//                     reason: leave.reason,
//                     status: leave.status
//                 });

//                 uiOutputRows.push({
//                     key: index.toString(),
//                     leave_id: leave.id,
//                     employee_code: emp?.employee_code || "UNKNOWN",
//                     full_name: leave.employee_name || "Staff Member",
//                     leave_date: leave.leave_date,
//                     db_status: `Recalculated (${leave.half})`,
//                     allocated_type: freshAllocatedType
//                 });
//             });
//         }

//         // 4. Atomic Database Update Operations Execution Block
//         if (leavesToUpsert.length > 0) {
//             const { error: upsertError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .upsert(leavesToUpsert, { onConflict: "id" });
//             if (upsertError) throw upsertError;
//         }

//         setDiscrepancies(uiOutputRows);
//     };

//     // Phase 1: Upload Excel File & AUTOMATICALLY calculate
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const parsedLeaves: RawLeaveItem[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (lowerStatus.includes("absent") || lowerStatus.includes("½present") || lowerStatus.includes("1/2") || lowerStatus.includes("no outpunch")) {
//                             parsedLeaves.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 if (parsedLeaves.length === 0) {
//                     message.warning("No leave exception entries detected inside the worksheet payload.");
//                     setLoading(false);
//                     return;
//                 }

//                 await runAllocationEngine(parsedLeaves);
//                 message.success(`Successfully uploaded sheet and processed auto-allocations for ${parsedLeaves.length} rows.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An exception fault error triggered reading file contents.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // Phase 2: ALWAYS WORKABLE - Recalculates directly from the database entries 
//     const handleRecalculation = async () => {
//         setRecalculating(true);
//         try {
//             await runAllocationEngine();
//             message.success("Recalculation successful! All database allocated_types updated cleanly.");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Recalculation routing error.");
//         } finally {
//             setRecalculating(false);
//         }
//     };

//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Status Hook", dataIndex: "db_status", render: (status: string) => <Tag color="blue">{status}</Tag> },
//         { title: "Recalculated Allocation Type", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#2f54eb" }}>{type.toUpperCase()}</span>) },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Dynamic Database Engine Active" description="Uploading spreadsheets processes initial records. Clicking 'Recalculate Data' evaluates all database logs directly against live updates like joining dates and granted EL." type="info" showIcon />

//                     {/* Independent Action Controls row */}
//                     <Space size="middle" direction="horizontal">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Upload New Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button 
//                             icon={<SyncOutlined />} 
//                             onClick={handleRecalculation} 
//                             loading={recalculating} 
//                             type="default"
//                             style={{ borderColor: "#1890ff", color: "#1890ff" }}
//                         >
//                             Recalculate Data
//                         </Button>
//                     </Space>

//                     <div>
//                         <Title level={4} style={{ marginBottom: 12 }}><InfoCircleOutlined /> Active System Discrepancies ({discrepancies.length})</Title>
//                         <Table 
//                             dataSource={discrepancies} 
//                             columns={columns} 
//                             loading={recalculating || loading} 
//                             pagination={{ pageSize: 10 }}
//                             locale={{ emptyText: "No active unauthorized leave entries found in the database system." }}
//                         />
//                     </div>
//                 </Space>
//             </Card>
//         </div>
//     );
// }















// "use client";

// import { useState, useEffect } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// interface RawLeaveItem {
//     employee_code: string;
//     leave_date: string;
//     excel_status: string;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [recalculating, setRecalculating] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     useEffect(() => {
//         runAllocationEngine();
//     }, []);

//     const runAllocationEngine = async (providedExcelLeaves?: RawLeaveItem[]) => {
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type, employee_name, department, type, reason")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: employeesList, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             const codeKey = String(emp.employee_code).trim();
//             employeeMap[codeKey] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         const totalLeaveMap: Record<string, any[]> = {};
//         dbLeaves?.forEach((leave) => {
//             const emp = employeeIdMap[leave.employee_id];
//             if (!emp) return;

//             const employeeCode = String(emp.employee_code).trim();
//             const leaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//             const mapKey = `${employeeCode}_${leaveDate}`;

//             if (!totalLeaveMap[mapKey]) {
//                 totalLeaveMap[mapKey] = [];
//             }
//             totalLeaveMap[mapKey].push(leave);
//         });

//         const dynamicPoolCache: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             if (!emp.joining_date) return;

//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             const establishedApprovedLeaves = dbLeaves?.filter(l =>
//                 l.employee_id === emp.id &&
//                 (l.status === "approved" || l.status === "taken") &&
//                 !l.allocated_type?.includes("auto_")
//             ) || [];

//             establishedApprovedLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.id] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};
//         const leavesToUpsert: any[] = [];

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         if (providedExcelLeaves) {
//             const fullDayLeaves = providedExcelLeaves.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return !status.includes("½present") && !status.includes("1/2");
//             });
//             const halfDayLeaves = providedExcelLeaves.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return status.includes("½present") || status.includes("1/2");
//             });
//             const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//             orderedLeaves.forEach((item, index) => {
//                 const empCode = String(item.employee_code).trim();
//                 const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];

//                 const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//                 const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//                 if (!staffLeaveCounter[empCode]) {
//                     staffLeaveCounter[empCode] = {
//                         name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE",
//                         count: 0
//                     };
//                 }
//                 staffLeaveCounter[empCode].count += incrementalWeight;

//                 if (!employee) {
//                     invalidCodeCounter++;
//                     finalRows.push({
//                         key: `err-${index}`,
//                         leave_id: "N/A",
//                         employee_code: empCode,
//                         full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: "Rejected / Skipped",
//                         allocated_type: "NONE",
//                         is_match: false,
//                         issue_type: "INVALID_EMP_CODE",
//                     });
//                     return;
//                 }

//                 const pools = dynamicPoolCache[employee.id];
//                 const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//                 const leaveDay = dayjs(item.leave_date);

//                 let matchFound = false;
//                 let calculatedAllocationsForThisRow: string[] = [];

//                 const processSlotAllocation = (targetHalf: string) => {
//                     const existingRecord = dbMatches.find(m => m.half === targetHalf);

//                     if (existingRecord && existingRecord.status === "approved") {
//                         matchFound = true;
//                         calculatedAllocationsForThisRow.push(existingRecord.allocated_type || "approved");
//                         return;
//                     }

//                     const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                     const targetAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;
//                     calculatedAllocationsForThisRow.push(targetAllocatedType);

//                     const baselinePayload = {
//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Dynamic allocation baseline sync",
//                         status: "Unauthorized_Leave" as const,
//                     };

//                     if (existingRecord) {
//                         leavesToUpsert.push({ id: existingRecord.id, ...baselinePayload });
//                         matchFound = true;
//                     } else {
//                         leavesToUpsert.push(baselinePayload);
//                     }
//                 };

//                 if (isFullDayRow) {
//                     processSlotAllocation("1H");
//                     processSlotAllocation("2H");
//                 } else {
//                     const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                     processSlotAllocation(target);
//                 }

//                 if (matchFound) matchedCounter++;
//                 else unauthorizedCounter++;

//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: dbMatches.map(m => m.id).join(", ") || "New Tracking Record",
//                     employee_code: item.employee_code,
//                     full_name: employee.full_name,
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: matchFound ? "synchronized" : "Unauthorized_Leave (Calculated)",
//                     allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                     is_match: matchFound,
//                     issue_type: matchFound ? "MATCHED" : "UNAUTHORIZED_CREATED",
//                 });
//             });

//             setSummaryStats({
//                 totalRows: orderedLeaves.length,
//                 matchedCount: matchedCounter,
//                 unauthorizedCreated: unauthorizedCounter,
//                 invalidCodes: invalidCodeCounter,
//             });

//         } else {
//             // Context B: RECALCULATING FROM DATABASE SYSTEM DIRECTLY
//             const systemUnauthorizedLeaves = dbLeaves?.filter(l => l.status === "Unauthorized_Leave") || [];

//             systemUnauthorizedLeaves.forEach((leave, index) => {
//                 const pools = dynamicPoolCache[leave.employee_id];
//                 const leaveDay = dayjs(leave.leave_date);
//                 const emp = employeeIdMap[leave.employee_id];
//                 const empCode = emp?.employee_code || "UNKNOWN";

//                 if (!staffLeaveCounter[empCode]) {
//                     staffLeaveCounter[empCode] = {
//                         name: leave.employee_name || "Staff Member",
//                         count: 0
//                     };
//                 }
//                 staffLeaveCounter[empCode].count += 0.5;

//                 const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                 const freshAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                 leavesToUpsert.push({
//                     id: leave.id,
//                     employee_id: leave.employee_id,
//                     employee_name: leave.employee_name,
//                     department: leave.department,
//                     leave_date: leave.leave_date,
//                     half: leave.half,
//                     type: leave.type,
//                     allocated_type: freshAllocatedType,
//                     reason: leave.reason,
//                     status: leave.status
//                 });

//                 unauthorizedCounter++;

//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: leave.id,
//                     employee_code: empCode,
//                     full_name: leave.employee_name || "Staff Member",
//                     leave_date: leave.leave_date,
//                     excel_status: `Logged Exception (${leave.half})`,
//                     db_status: "Unauthorized_Leave",
//                     allocated_type: freshAllocatedType,
//                     is_match: false,
//                     issue_type: "UNAUTHORIZED_CREATED" // Added back so filter behaves cleanly
//                 });
//             });

//             setSummaryStats({
//                 totalRows: systemUnauthorizedLeaves.length,
//                 matchedCount: 0,
//                 unauthorizedCreated: unauthorizedCounter,
//                 invalidCodes: 0,
//             });
//         }

//         if (leavesToUpsert.length > 0) {
//             const { error: upsertError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .upsert(leavesToUpsert, { onConflict: "id" });
//             if (upsertError) throw upsertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setDiscrepancies(finalRows);
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const parsedLeaves: RawLeaveItem[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (lowerStatus.includes("absent") || lowerStatus.includes("½present") || lowerStatus.includes("1/2") || lowerStatus.includes("no outpunch")) {
//                             parsedLeaves.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 if (parsedLeaves.length === 0) {
//                     message.warning("No leave exception entries detected inside the worksheet payload.");
//                     setLoading(false);
//                     return;
//                 }

//                 await runAllocationEngine(parsedLeaves);
//                 message.success(`Successfully uploaded sheet and processed auto-allocations.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred reading file contents.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const handleRecalculation = async () => {
//         setRecalculating(true);
//         try {
//             await runAllocationEngine();
//             message.success("Recalculation successful! System allocations synchronized against updated parameters.");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Recalculation routing exception error.");
//         } finally {
//             setRecalculating(false);
//         }
//     };

//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Status Cause", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         { title: "System Status Hook", dataIndex: "db_status", render: (status: string) => <Tag color="magenta">{status}</Tag> },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#2f54eb" }}>{type.toUpperCase()}</span>) },
//     ];

//     // Filter table records strictly to showcase only system problems/discrepancies
//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Dynamic Database Engine Active" description="Uploading spreadsheets maps data lines. Clicking 'Recalculate Data' executes allocations directly on existing records without file uploads." type="info" showIcon />

//                     <Space size="middle" direction="horizontal">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Upload Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button
//                             icon={<SyncOutlined />}
//                             onClick={handleRecalculation}
//                             loading={recalculating}
//                             type="default"
//                             style={{ borderColor: "#1890ff", color: "#1890ff" }}
//                         >
//                             Recalculate Data
//                         </Button>
//                     </Space>

//                     {discrepancies.length > 0 && (
//                         <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                             <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> System Calculation Metrics</Title>
//                             <Row gutter={16}>
//                                 <Col span={6}>
//                                     <Statistic title="Total Exceptions Evaluated" value={summaryStats.totalRows} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="Synchronized Matches" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="True Problem Rows" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                 </Col>
//                             </Row>
//                         </div>
//                     )}

//                     {staffSummaries.length > 0 && (
//                         <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                             <List
//                                 dataSource={staffSummaries}
//                                 size="small"
//                                 bordered={false}
//                                 renderItem={(staff) => (
//                                     <List.Item style={{ padding: "6px 12px" }}>
//                                         <div>
//                                             <Text strong style={{ marginRight: 12 }}>[Code: {staff.employee_code}]</Text>
//                                             <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                             <Text type="secondary">Total Exception Days: </Text>
//                                             <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                         </div>
//                                     </List.Item>
//                                 )}
//                             />
//                         </Card>
//                     )}

//                     {/* >>> START OF CONVERTED SYSTEM DISCREPANCIES SECTION <<< */}
//                    <Card 
//     title={
//         <span>
//             <AlertOutlined style={{ color: "#cf1322", marginRight: 8 }} /> 
//             Critical System Discrepancies & Flagged Action Items
//         </span>
//     }
//     variant="borderless"
//     style={{ border: "1px solid #f0f0f0", borderRadius: "8px" }}
// >
//     {(() => {
//         // 🛡️ STRICT TYPE-SAFE FILTER: Only catch genuine data-entry/mapping errors
//         const trueDiscrepanciesOnly = discrepancies.filter(row => {
//             // Ignore normal matches completely
//             if (row.issue_type === "MATCHED") return false;

//             // Ignore standard, successfully created unauthorized/absent records
//             if (row.issue_type === "UNAUTHORIZED_CREATED") return false;

//             // Only show structural data errors (like INVALID_EMP_CODE)
//             return row.issue_type === "INVALID_EMP_CODE";
//         });

//         return (
//             <>
//                 <Statistic 
//                     title="Data Sync & Mapping Errors"
//                     value={trueDiscrepanciesOnly.length} 
//                     valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
//                 />

//                 {trueDiscrepanciesOnly.length > 0 ? (
//                     <div style={{ marginTop: 16, maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
//                         {trueDiscrepanciesOnly.map((row) => (
//                             <div
//                                 key={row.key}
//                                 style={{
//                                     display: "flex",
//                                     justifyContent: "space-between",
//                                     alignItems: "center",
//                                     padding: "10px 0",
//                                     borderBottom: "1px solid #f0f0f0",
//                                 }}
//                             >
//                                 <Space direction="vertical" size={2}>
//                                     <Text strong>{row.full_name}</Text>
//                                     <Text type="secondary" style={{ fontSize: "12px" }}>
//                                         Code: {row.employee_code} | Date: {dayjs(row.leave_date).format("DD-MM-YYYY")}
//                                     </Text>
//                                     <Text type="danger" style={{ fontSize: "11px", display: "block" }}>
//                                         Reason: Excel contains an Employee Code that doesn't exist in the HR Database.
//                                     </Text>
//                                 </Space>
//                                 <Tag color="orange" style={{ fontWeight: "600" }}>
//                                     {row.issue_type}
//                                 </Tag>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div style={{ textAlign: "center", padding: "24px 0" }}>
//                         <Text type="success" strong style={{ fontSize: "15px", display: "block", marginBottom: 4 }}>
//                             🎉 System Aligned
//                         </Text>
//                         <Text type="secondary">
//                             Zero unmapped staff or unknown employee codes found. All data matched flawlessly.
//                         </Text>
//                     </div>
//                 )}
//             </>
//         );
//     })()}
// </Card>
//                     {/* >>> END OF CONVERTED SYSTEM DISCREPANCIES SECTION <<< */}
//                 </Space>
//             </Card>
//         </div>
//     );
// }






























// "use client";

// import { useState, useEffect } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     InfoCircleOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status?: string;
//     db_status: string;
//     allocated_type: string;
// }

// interface RawLeaveItem {
//     employee_code: string;
//     leave_date: string;
//     excel_status: string;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [recalculating, setRecalculating] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);

//     // Fetch system discrepancies automatically on mount to show current status without uploading anything
//     useEffect(() => {
//         fetchCurrentSystemDiscrepancies();
//     }, []);

//     const fetchCurrentSystemDiscrepancies = async () => {
//         try {
//             const { data: dbLeaves } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, allocated_type, employee_name, half, employee_id, type, reason")
//                 .eq("status", "Unauthorized_Leave");

//             const { data: employeesList } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code");

//             const empIdToCodeMap: Record<string, string> = {};
//             employeesList?.forEach(e => { empIdToCodeMap[e.id] = e.employee_code; });

//             if (dbLeaves) {
//                 const mapped: DiscrepancyRow[] = dbLeaves.map((l, index) => ({
//                     key: index.toString(),
//                     leave_id: l.id,
//                     employee_code: empIdToCodeMap[l.employee_id] || "UNKNOWN",
//                     full_name: l.employee_name || "Staff Member",
//                     leave_date: l.leave_date,
//                     db_status: `Unauthorized_Leave (${l.half})`,
//                     allocated_type: l.allocated_type || "UNASSIGNED"
//                 }));
//                 setDiscrepancies(mapped);
//             }
//         } catch (err) {
//             console.error("Error fetching initial view logs:", err);
//         }
//     };

//     // Shared Engine: Pulls data fresh from DB, figures pools out, and handles upsert allocations
//     const runAllocationEngine = async (providedExcelLeaves?: RawLeaveItem[]) => {
//         // 1. Fetch clean system baselines
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type, employee_name, department, type, reason")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: employeesList, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             const codeKey = String(emp.employee_code).trim();
//             employeeMap[codeKey] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         // 2. Build dynamic balance pools on the fly (taking fresh joining dates into account)
//         const dynamicPoolCache: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             if (!emp.joining_date) return;

//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             // Re-hydrate static approved assignments safely
//             const establishedApprovedLeaves = dbLeaves?.filter(l => 
//                 l.employee_id === emp.id && 
//                 (l.status === "approved" || l.status === "taken") && 
//                 !l.allocated_type?.includes("auto_")
//             ) || [];

//             establishedApprovedLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.id] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const leavesToUpsert: any[] = [];
//         const uiOutputRows: DiscrepancyRow[] = [];

//         // 3. Determine the evaluation source target payload
//         if (providedExcelLeaves) {
//             // Context A: Executing file parsing upload logic pipelines
//             providedExcelLeaves.forEach((item, index) => {
//                 const empCode = String(item.employee_code).trim();
//                 const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//                 if (!employee) return;

//                 const pools = dynamicPoolCache[employee.id];
//                 const leaveDay = dayjs(item.leave_date);
//                 const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");

//                 const evaluateAndQueue = (targetHalf: string) => {
//                     // Check if an approved row exists to preserve it
//                     const preExistingMatch = dbLeaves?.find(l => l.employee_id === employee.id && l.leave_date === item.leave_date && l.half === targetHalf);
//                     if (preExistingMatch && preExistingMatch.status === "approved") return preExistingMatch.allocated_type;

//                     const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                     const targetAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                     leavesToUpsert.push({
//                         id: preExistingMatch?.id || undefined, // Upsert cleanly if record exists
//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Biometric auto-exception matching",
//                         status: preExistingMatch?.status || "Unauthorized_Leave",
//                     });

//                     return targetAllocatedType;
//                 };

//                 let computedAllocations: string[] = [];
//                 if (isFullDayRow) {
//                     computedAllocations.push(evaluateAndQueue("1H") || "");
//                     computedAllocations.push(evaluateAndQueue("2H") || "");
//                 } else {
//                     const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                     computedAllocations.push(evaluateAndQueue(target) || "");
//                 }

//                 uiOutputRows.push({
//                     key: index.toString(),
//                     leave_id: "Auto Generated",
//                     employee_code: empCode,
//                     full_name: employee.full_name,
//                     leave_date: item.leave_date,
//                     db_status: "Unauthorized_Leave",
//                     allocated_type: computedAllocations.filter(Boolean).join(" + ")
//                 });
//             });
//         } else {
//             // Context B: RECALCULATING FROM DATABASE DIRECTLY (No excel file dependency)
//             const systemUnauthorizedLeaves = dbLeaves?.filter(l => l.status === "Unauthorized_Leave") || [];

//             systemUnauthorizedLeaves.forEach((leave, index) => {
//                 const pools = dynamicPoolCache[leave.employee_id];
//                 const leaveDay = dayjs(leave.leave_date);
//                 const emp = employeeIdMap[leave.employee_id];

//                 const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                 const freshAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                 // Push only the recalculated changes onto the operation stack
//                 leavesToUpsert.push({
//                     id: leave.id,
//                     employee_id: leave.employee_id,
//                     employee_name: leave.employee_name,
//                     department: leave.department,
//                     leave_date: leave.leave_date,
//                     half: leave.half,
//                     type: leave.type,
//                     allocated_type: freshAllocatedType,
//                     reason: leave.reason,
//                     status: leave.status
//                 });

//                 uiOutputRows.push({
//                     key: index.toString(),
//                     leave_id: leave.id,
//                     employee_code: emp?.employee_code || "UNKNOWN",
//                     full_name: leave.employee_name || "Staff Member",
//                     leave_date: leave.leave_date,
//                     db_status: `Recalculated (${leave.half})`,
//                     allocated_type: freshAllocatedType
//                 });
//             });
//         }

//         // 4. Atomic Database Update Operations Execution Block
//         if (leavesToUpsert.length > 0) {
//             const { error: upsertError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .upsert(leavesToUpsert, { onConflict: "id" });
//             if (upsertError) throw upsertError;
//         }

//         setDiscrepancies(uiOutputRows);
//     };

//     // Phase 1: Upload Excel File & AUTOMATICALLY calculate
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const parsedLeaves: RawLeaveItem[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (lowerStatus.includes("absent") || lowerStatus.includes("½present") || lowerStatus.includes("1/2") || lowerStatus.includes("no outpunch")) {
//                             parsedLeaves.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 if (parsedLeaves.length === 0) {
//                     message.warning("No leave exception entries detected inside the worksheet payload.");
//                     setLoading(false);
//                     return;
//                 }

//                 await runAllocationEngine(parsedLeaves);
//                 message.success(`Successfully uploaded sheet and processed auto-allocations for ${parsedLeaves.length} rows.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An exception fault error triggered reading file contents.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // Phase 2: ALWAYS WORKABLE - Recalculates directly from the database entries 
//     const handleRecalculation = async () => {
//         setRecalculating(true);
//         try {
//             await runAllocationEngine();
//             message.success("Recalculation successful! All database allocated_types updated cleanly.");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Recalculation routing error.");
//         } finally {
//             setRecalculating(false);
//         }
//     };

//     const columns = [
//         { title: "Emp Code", dataIndex: "employee_code" },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Status Hook", dataIndex: "db_status", render: (status: string) => <Tag color="blue">{status}</Tag> },
//         { title: "Recalculated Allocation Type", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#2f54eb" }}>{type.toUpperCase()}</span>) },
//     ];

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Dynamic Database Engine Active" description="Uploading spreadsheets processes initial records. Clicking 'Recalculate Data' evaluates all database logs directly against live updates like joining dates and granted EL." type="info" showIcon />

//                     {/* Independent Action Controls row */}
//                     <Space size="middle" direction="horizontal">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Upload New Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button 
//                             icon={<SyncOutlined />} 
//                             onClick={handleRecalculation} 
//                             loading={recalculating} 
//                             type="default"
//                             style={{ borderColor: "#1890ff", color: "#1890ff" }}
//                         >
//                             Recalculate Data
//                         </Button>
//                     </Space>

//                     <div>
//                         <Title level={4} style={{ marginBottom: 12 }}><InfoCircleOutlined /> Active System Discrepancies ({discrepancies.length})</Title>
//                         <Table 
//                             dataSource={discrepancies} 
//                             columns={columns} 
//                             loading={recalculating || loading} 
//                             pagination={{ pageSize: 10 }}
//                             locale={{ emptyText: "No active unauthorized leave entries found in the database system." }}
//                         />
//                     </div>
//                 </Space>
//             </Card>
//         </div>
//     );
// }















// "use client";

// import { useState, useEffect } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// interface RawLeaveItem {
//     employee_code: string;
//     leave_date: string;
//     excel_status: string;
// }

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const month = leaveDay.month();
//     const year = leaveDay.year();

//     const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (cSlot) { cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "casual"; }

//     const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === month && parseInt(s.year || "2026") === year);
//     if (sSlot) { sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); return "sick"; }

//     if (pools.earned?.[month] && pools.earned[month].available > pools.earned[month].taken) {
//         pools.earned[month].taken += 0.5;
//         return "earned";
//     }

//     return "lop";
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [recalculating, setRecalculating] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     useEffect(() => {
//         runAllocationEngine();
//     }, []);

//     const runAllocationEngine = async (providedExcelLeaves?: RawLeaveItem[]) => {
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type, employee_name, department, type, reason")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: employeesList, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             const codeKey = String(emp.employee_code).trim();
//             employeeMap[codeKey] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         const totalLeaveMap: Record<string, any[]> = {};
//         dbLeaves?.forEach((leave) => {
//             const emp = employeeIdMap[leave.employee_id];
//             if (!emp) return;

//             const employeeCode = String(emp.employee_code).trim();
//             const leaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//             const mapKey = `${employeeCode}_${leaveDate}`;

//             if (!totalLeaveMap[mapKey]) {
//                 totalLeaveMap[mapKey] = [];
//             }
//             totalLeaveMap[mapKey].push(leave);
//         });

//         const dynamicPoolCache: Record<string, any> = {};
//         employeesList?.forEach((emp) => {
//             if (!emp.joining_date) return;

//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             const establishedApprovedLeaves = dbLeaves?.filter(l =>
//                 l.employee_id === emp.id &&
//                 (l.status === "approved" || l.status === "taken") &&
//                 !l.allocated_type?.includes("auto_")
//             ) || [];

//             establishedApprovedLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.id] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};
//         const leavesToUpsert: any[] = [];

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         if (providedExcelLeaves) {
//             const fullDayLeaves = providedExcelLeaves.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return !status.includes("½present") && !status.includes("1/2");
//             });
//             const halfDayLeaves = providedExcelLeaves.filter(item => {
//                 const status = item.excel_status.toLowerCase();
//                 return status.includes("½present") || status.includes("1/2");
//             });
//             const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//             orderedLeaves.forEach((item, index) => {
//                 const empCode = String(item.employee_code).trim();
//                 const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];

//                 const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//                 const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//                 if (!staffLeaveCounter[empCode]) {
//                     staffLeaveCounter[empCode] = {
//                         name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE",
//                         count: 0
//                     };
//                 }
//                 staffLeaveCounter[empCode].count += incrementalWeight;

//                 if (!employee) {
//                     invalidCodeCounter++;
//                     finalRows.push({
//                         key: `err-${index}`,
//                         leave_id: "N/A",
//                         employee_code: empCode,
//                         full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: "Rejected / Skipped",
//                         allocated_type: "NONE",
//                         is_match: false,
//                         issue_type: "INVALID_EMP_CODE",
//                     });
//                     return;
//                 }

//                 const pools = dynamicPoolCache[employee.id];
//                 const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//                 const leaveDay = dayjs(item.leave_date);

//                 let matchFound = false;
//                 let calculatedAllocationsForThisRow: string[] = [];

//                 const processSlotAllocation = (targetHalf: string) => {
//                     const existingRecord = dbMatches.find(m => m.half === targetHalf);

//                     if (existingRecord && existingRecord.status === "approved") {
//                         matchFound = true;
//                         calculatedAllocationsForThisRow.push(existingRecord.allocated_type || "approved");
//                         return;
//                     }

//                     const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                     const targetAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;
//                     calculatedAllocationsForThisRow.push(targetAllocatedType);

//                     const baselinePayload = {
//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Dynamic allocation baseline sync",
//                         status: "Unauthorized_Leave" as const,
//                     };

//                     if (existingRecord) {
//                         leavesToUpsert.push({ id: existingRecord.id, ...baselinePayload });
//                         matchFound = true;
//                     } else {
//                         leavesToUpsert.push(baselinePayload);
//                     }
//                 };

//                 if (isFullDayRow) {
//                     processSlotAllocation("1H");
//                     processSlotAllocation("2H");
//                 } else {
//                     const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                     processSlotAllocation(target);
//                 }

//                 if (matchFound) matchedCounter++;
//                 else unauthorizedCounter++;

//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: dbMatches.map(m => m.id).join(", ") || "New Tracking Record",
//                     employee_code: item.employee_code,
//                     full_name: employee.full_name,
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: matchFound ? "synchronized" : "Unauthorized_Leave (Calculated)",
//                     allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                     is_match: matchFound,
//                     issue_type: matchFound ? "MATCHED" : "UNAUTHORIZED_CREATED",
//                 });
//             });

//             setSummaryStats({
//                 totalRows: orderedLeaves.length,
//                 matchedCount: matchedCounter,
//                 unauthorizedCreated: unauthorizedCounter,
//                 invalidCodes: invalidCodeCounter,
//             });

//         } else {
//             // Context B: RECALCULATING FROM DATABASE SYSTEM DIRECTLY
//             const systemUnauthorizedLeaves = dbLeaves?.filter(l => l.status === "Unauthorized_Leave") || [];

//             systemUnauthorizedLeaves.forEach((leave, index) => {
//                 const pools = dynamicPoolCache[leave.employee_id];
//                 const leaveDay = dayjs(leave.leave_date);
//                 const emp = employeeIdMap[leave.employee_id];
//                 const empCode = emp?.employee_code || "UNKNOWN";

//                 if (!staffLeaveCounter[empCode]) {
//                     staffLeaveCounter[empCode] = {
//                         name: leave.employee_name || "Staff Member",
//                         count: 0
//                     };
//                 }
//                 staffLeaveCounter[empCode].count += 0.5;

//                 const determinedType = pools ? decideLeaveType(pools, leaveDay) : "lop";
//                 const freshAllocatedType = `${determinedType}_${leaveDay.format("YYYY_MM")}`;

//                 leavesToUpsert.push({
//                     id: leave.id,
//                     employee_id: leave.employee_id,
//                     employee_name: leave.employee_name,
//                     department: leave.department,
//                     leave_date: leave.leave_date,
//                     half: leave.half,
//                     type: leave.type,
//                     allocated_type: freshAllocatedType,
//                     reason: leave.reason,
//                     status: leave.status
//                 });

//                 unauthorizedCounter++;

//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: leave.id,
//                     employee_code: empCode,
//                     full_name: leave.employee_name || "Staff Member",
//                     leave_date: leave.leave_date,
//                     excel_status: `Logged Exception (${leave.half})`,
//                     db_status: "Unauthorized_Leave",
//                     allocated_type: freshAllocatedType,
//                     is_match: false,
//                     issue_type: "UNAUTHORIZED_CREATED" // Added back so filter behaves cleanly
//                 });
//             });

//             setSummaryStats({
//                 totalRows: systemUnauthorizedLeaves.length,
//                 matchedCount: 0,
//                 unauthorizedCreated: unauthorizedCounter,
//                 invalidCodes: 0,
//             });
//         }

//         if (leavesToUpsert.length > 0) {
//             const { error: upsertError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .upsert(leavesToUpsert, { onConflict: "id" });
//             if (upsertError) throw upsertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setDiscrepancies(finalRows);
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const parsedLeaves: RawLeaveItem[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (lowerStatus.includes("absent") || lowerStatus.includes("½present") || lowerStatus.includes("1/2") || lowerStatus.includes("no outpunch")) {
//                             parsedLeaves.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 if (parsedLeaves.length === 0) {
//                     message.warning("No leave exception entries detected inside the worksheet payload.");
//                     setLoading(false);
//                     return;
//                 }

//                 await runAllocationEngine(parsedLeaves);
//                 message.success(`Successfully uploaded sheet and processed auto-allocations.`);

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred reading file contents.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const handleRecalculation = async () => {
//         setRecalculating(true);
//         try {
//             await runAllocationEngine();
//             message.success("Recalculation successful! System allocations synchronized against updated parameters.");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Recalculation routing exception error.");
//         } finally {
//             setRecalculating(false);
//         }
//     };

//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Status Cause", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         { title: "System Status Hook", dataIndex: "db_status", render: (status: string) => <Tag color="magenta">{status}</Tag> },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#2f54eb" }}>{type.toUpperCase()}</span>) },
//     ];

//     // Filter table records strictly to showcase only system problems/discrepancies
//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Dynamic Database Engine Active" description="Uploading spreadsheets maps data lines. Clicking 'Recalculate Data' executes allocations directly on existing records without file uploads." type="info" showIcon />

//                     <Space size="middle" direction="horizontal">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Upload Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button
//                             icon={<SyncOutlined />}
//                             onClick={handleRecalculation}
//                             loading={recalculating}
//                             type="default"
//                             style={{ borderColor: "#1890ff", color: "#1890ff" }}
//                         >
//                             Recalculate Data
//                         </Button>
//                     </Space>

//                     {discrepancies.length > 0 && (
//                         <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                             <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> System Calculation Metrics</Title>
//                             <Row gutter={16}>
//                                 <Col span={6}>
//                                     <Statistic title="Total Exceptions Evaluated" value={summaryStats.totalRows} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="Synchronized Matches" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="True Problem Rows" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                 </Col>
//                                 <Col span={6}>
//                                     <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                 </Col>
//                             </Row>
//                         </div>
//                     )}

//                     {staffSummaries.length > 0 && (
//                         <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                             <List
//                                 dataSource={staffSummaries}
//                                 size="small"
//                                 bordered={false}
//                                 renderItem={(staff) => (
//                                     <List.Item style={{ padding: "6px 12px" }}>
//                                         <div>
//                                             <Text strong style={{ marginRight: 12 }}>[Code: {staff.employee_code}]</Text>
//                                             <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                             <Text type="secondary">Total Exception Days: </Text>
//                                             <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                         </div>
//                                     </List.Item>
//                                 )}
//                             />
//                         </Card>
//                     )}

//                     {/* >>> START OF CONVERTED SYSTEM DISCREPANCIES SECTION <<< */}
//                    <Card 
//     title={
//         <span>
//             <AlertOutlined style={{ color: "#cf1322", marginRight: 8 }} /> 
//             Critical System Discrepancies & Flagged Action Items
//         </span>
//     }
//     variant="borderless"
//     style={{ border: "1px solid #f0f0f0", borderRadius: "8px" }}
// >
//     {(() => {
//         // 🛡️ STRICT TYPE-SAFE FILTER: Only catch genuine data-entry/mapping errors
//         const trueDiscrepanciesOnly = discrepancies.filter(row => {
//             // Ignore normal matches completely
//             if (row.issue_type === "MATCHED") return false;

//             // Ignore standard, successfully created unauthorized/absent records
//             if (row.issue_type === "UNAUTHORIZED_CREATED") return false;

//             // Only show structural data errors (like INVALID_EMP_CODE)
//             return row.issue_type === "INVALID_EMP_CODE";
//         });

//         return (
//             <>
//                 <Statistic 
//                     title="Data Sync & Mapping Errors"
//                     value={trueDiscrepanciesOnly.length} 
//                     valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
//                 />

//                 {trueDiscrepanciesOnly.length > 0 ? (
//                     <div style={{ marginTop: 16, maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
//                         {trueDiscrepanciesOnly.map((row) => (
//                             <div
//                                 key={row.key}
//                                 style={{
//                                     display: "flex",
//                                     justifyContent: "space-between",
//                                     alignItems: "center",
//                                     padding: "10px 0",
//                                     borderBottom: "1px solid #f0f0f0",
//                                 }}
//                             >
//                                 <Space direction="vertical" size={2}>
//                                     <Text strong>{row.full_name}</Text>
//                                     <Text type="secondary" style={{ fontSize: "12px" }}>
//                                         Code: {row.employee_code} | Date: {dayjs(row.leave_date).format("DD-MM-YYYY")}
//                                     </Text>
//                                     <Text type="danger" style={{ fontSize: "11px", display: "block" }}>
//                                         Reason: Excel contains an Employee Code that doesn't exist in the HR Database.
//                                     </Text>
//                                 </Space>
//                                 <Tag color="orange" style={{ fontWeight: "600" }}>
//                                     {row.issue_type}
//                                 </Tag>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div style={{ textAlign: "center", padding: "24px 0" }}>
//                         <Text type="success" strong style={{ fontSize: "15px", display: "block", marginBottom: 4 }}>
//                             🎉 System Aligned
//                         </Text>
//                         <Text type="secondary">
//                             Zero unmapped staff or unknown employee codes found. All data matched flawlessly.
//                         </Text>
//                     </div>
//                 )}
//             </>
//         );
//     })()}
// </Card>
//                     {/* >>> END OF CONVERTED SYSTEM DISCREPANCIES SECTION <<< */}
//                 </Space>
//             </Card>
//         </div>
//     );
// }


























/////////working code without reallocation////////////




// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };

// const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();

//     // 1. CASUAL LEAVE SCANNING
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
//         const cSlot = pools.casual?.find((s: any) => !s.usedDate && s.monthIndex === m.index && parseInt(s.year || String(targetYear)) === targetYear);
//         if (cSlot) { 
//             cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
//             return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
//         }
//     }

//     // 2. SICK LEAVE SCANNING
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
//         const sSlot = pools.sick?.find((s: any) => !s.usedDate && s.monthIndex === m.index && parseInt(s.year || String(targetYear)) === targetYear);
//         if (sSlot) { 
//             sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
//             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
//         }
//     }

//     // 3. EARNED LEAVE SCANNING
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
//             pools.earned[m.index].taken += 0.5;
//             const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, '0')}`;
//         }
//     }

//     // ==========================================
//     // FIXED: Return LOP appended with current leave month & year
//     // ==========================================
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, '0')}`;
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 // =====================
//                 // 1. PARSE EXCEL
//                 // =====================
//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         const isAbsent = lowerStatus.includes("absent");
//                         const isHalfDay = lowerStatus.includes("½present") || lowerStatus.includes("1/2");
//                         const isNoOutpunch = lowerStatus.includes("no outpunch");

//                         if (isAbsent || isHalfDay || isNoOutpunch) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 // =====================
//                 // 2. FETCH CURRENT DATABASE ENTRIES
//                 // =====================
//                 const { data: dbLeaves, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("leaves")
//                     .select("id, leave_date, status, employee_id, half, allocated_type")
//                     .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//                 if (dbError) throw dbError;

//                 const { data: dbEmployees, error: empError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("id, employee_code, full_name, department, joining_date");
//                 if (empError) throw empError;

//                 const employeeMap: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     employeeMap[String(emp.employee_code).trim()] = emp;
//                 });

//                 const { data: dbCredits, error: creditsError } = await supabase
//                     .schema("leave_management")
//                     .from("el_credits")
//                     .select("*");
//                 if (creditsError) throw creditsError;

//                 const totalLeaveMap: Record<string, any[]> = {};
//                 const employeeIdMap: Record<string, any> = {};

//                 dbEmployees?.forEach((emp) => {
//                     employeeIdMap[emp.id] = emp;
//                 });

//                 dbLeaves?.forEach((leave) => {
//                     const emp = employeeIdMap[leave.employee_id];
//                     if (!emp) return;

//                     const employeeCode = String(emp.employee_code).trim();
//                     const leaveDate = dayjs(leave.leave_date).format("YYYY-MM-DD");
//                     const mapKey = `${employeeCode}_${leaveDate}`;

//                     if (!totalLeaveMap[mapKey]) {
//                         totalLeaveMap[mapKey] = [];
//                     }
//                     totalLeaveMap[mapKey].push(leave);
//                 });

//                 // Generate Pools
//                 const dynamicPoolCache: Record<string, any> = {};
//                 dbEmployees?.forEach((emp) => {
//                     if (!emp.joining_date) return;
//                     const joinDate = dayjs(emp.joining_date);
//                     const casualPool: any[] = [];
//                     const sickPool: any[] = [];
//                     let loopDate = joinDate.startOf("month");
//                     const endOfCalendarBoundary = dayjs().endOf("year");

//                     while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                         const mIdx = loopDate.month();
//                         casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                         loopDate = loopDate.add(1, "month");
//                     }

//                     const earnedMap: Record<number, { taken: number; available: number }> = {};
//                     FINANCIAL_MONTHS.forEach(m => {
//                         const monthlyCredits = dbCredits
//                             .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                             .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                         earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//                     });

//                     const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && (l.status === "taken" || l.status === "Unauthorized_Leave")) || [];

//                     historicalTakenLeaves.forEach((leave) => {
//                         const parts = leave.allocated_type?.split("_") || [];
//                         if (leave.allocated_type?.startsWith("casual")) {
//                             const allocationMonth = Number(parts[3]) - 1;
//                             const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type?.startsWith("sick")) {
//                             const allocationMonth = Number(parts[3]) - 1;
//                             const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                             if (slot) slot.usedDate = leave.leave_date;
//                         } else if (leave.allocated_type?.startsWith("earned")) {
//                             const earnedMonth = Number(parts[2]) - 1;
//                             if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                         }
//                     });

//                     dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//                 });

//                 // =====================
//                 // 3. NEW ALLOCATION ENGINE & TRACKING
//                 // =====================
//                 const idsToUpdate: string[] = [];
//                 const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//                 const unauthorizedLeaves: any[] = [];
//                 const finalRows: DiscrepancyRow[] = [];
//                 const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//                 let matchedCounter = 0;
//                 let unauthorizedCounter = 0;
//                 let invalidCodeCounter = 0;

//                 const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//                     const status = item.excel_status.toLowerCase();
//                     return !status.includes("½present") && !status.includes("1/2");
//                 });

//                 const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//                     const status = item.excel_status.toLowerCase();
//                     return status.includes("½present") || status.includes("1/2");
//                 });

//                 const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//                 orderedLeaves.forEach((item, index) => {
//                     if (!item.employee_code || !item.leave_date) return;

//                     const empCode = String(item.employee_code).trim();
//                     const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//                     const pools = dynamicPoolCache[empCode];

//                     // Track cumulative leave hits per employee
//                     const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//                     const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//                     if (!staffLeaveCounter[empCode]) {
//                         staffLeaveCounter[empCode] = {
//                             name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE",
//                             count: 0
//                         };
//                     }
//                     staffLeaveCounter[empCode].count += incrementalWeight;

//                     if (!employee || !pools) {
//                         invalidCodeCounter++;
//                         finalRows.push({
//                             key: `err-${index}`,
//                             leave_id: "N/A",
//                             employee_code: empCode,
//                             full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                             leave_date: item.leave_date,
//                             excel_status: item.excel_status,
//                             db_status: "Rejected / Skipped",
//                             allocated_type: "NONE",
//                             is_match: false,
//                             issue_type: "INVALID_EMP_CODE",
//                         });
//                         return;
//                     }

//                     const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//                     const leaveDay = dayjs(item.leave_date);

//                     let matchFound = false;
//                     let calculatedAllocationsForThisRow: string[] = [];

//                     const processSlotAllocation = (targetHalf: string) => {
//                         const record = dbMatches.find(m => m.half === targetHalf);

//                         if (record) {
//                             matchFound = true;
//                             calculatedAllocationsForThisRow.push(record.allocated_type || "taken");
//                             if (record.status !== "taken") {
//                                 idsToUpdate.push(record.id);
//                                 leavesToUpdateWithAllocation.push({ id: record.id, allocated_type: record.allocated_type });
//                             }
//                             return;
//                         }

//                         // Call refactored engine to get oldest eligible calculation type back
//                         const targetAllocatedType = decideLeaveType(pools, leaveDay);

//                         unauthorizedLeaves.push({
//                             employee_id: employee.id,
//                             employee_name: employee.full_name,
//                             department: employee.department,
//                             leave_date: item.leave_date,
//                             half: targetHalf,
//                             type: "Leave",
//                             allocated_type: targetAllocatedType,
//                             reason: "Auto-created from biometric",
//                             status: "Unauthorized_Leave",
//                         });
//                         calculatedAllocationsForThisRow.push(targetAllocatedType);
//                     };

//                     if (isFullDayRow) {
//                         processSlotAllocation("1H");
//                         processSlotAllocation("2H");
//                     } else {
//                         const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                         processSlotAllocation(target);
//                     }

//                     if (matchFound) matchedCounter++; 
//                     else unauthorizedCounter++;

//                     finalRows.push({
//                         key: index.toString(),
//                         leave_id: dbMatches.map(m => m.id).join(", "),
//                         employee_code: item.employee_code,
//                         full_name: employee.full_name,
//                         leave_date: item.leave_date,
//                         excel_status: item.excel_status,
//                         db_status: matchFound ? "taken" : "Unauthorized_Leave (Created)",
//                         allocated_type: calculatedAllocationsForThisRow.join(" + "),
//                         is_match: matchFound,
//                         issue_type: matchFound ? "MATCHED" : "UNAUTHORIZED_CREATED",
//                     });
//                 });

//                 if (leavesToUpdateWithAllocation.length > 0) {
//                     for (const item of leavesToUpdateWithAllocation) {
//                         await supabase.schema("leave_management").from("leaves")
//                             .update({ status: "taken", allocated_type: item.allocated_type })
//                             .eq("id", item.id);
//                     }
//                 }

//                 if (unauthorizedLeaves.length > 0) {
//                     const { error: insertError } = await supabase.schema("leave_management")
//                         .from("leaves").insert(unauthorizedLeaves);
//                     if (insertError) throw insertError;
//                 }

//                 // Compile single line staff totals mapping
//                 const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//                     employee_code: code,
//                     full_name: staffLeaveCounter[code].name,
//                     total_leaves: staffLeaveCounter[code].count,
//                 }));

//                 setStaffSummaries(summariesList);
//                 setSummaryStats({
//                     totalRows: orderedLeaves.length,
//                     matchedCount: matchedCounter,
//                     unauthorizedCreated: unauthorizedCounter,
//                     invalidCodes: invalidCodeCounter,
//                 });

//                 setDiscrepancies(finalRows);
//                 setFileUploaded(true);

//                 if (invalidCodeCounter > 0) {
//                     message.warning(`Reconciliation completed with ${invalidCodeCounter} unmapped system errors.`);
//                 } else {
//                     message.success("Reconciliation successfully synchronized!");
//                 }

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     const columns = [
//         { 
//             title: "Emp Code", 
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type.toUpperCase() || "UNASSIGNED"}</span>) },
//     ];

//     // Filter to strictly display exception issues (Unmapped codes & Unauthorized Auto-allocations)
//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space direction="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                         <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                             Choose Attendance Report File
//                         </Button>
//                     </Upload>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <List
//                                     dataSource={staffSummaries}
//                                     size="small"
//                                     bordered={false}
//                                     renderItem={(staff) => (
//                                         <List.Item style={{ padding: "6px 12px" }}>
//                                             <div>
//                                                 <Text strong style={{ marginRight: 12 }}>[Code: {staff.employee_code}]</Text>
//                                                 <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </List.Item>
//                                     )}
//                                 />
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table 
//                                 dataSource={issueRowsOnly} 
//                                 columns={columns} 
//                                 loading={loading} 
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }













// //////working code to add reallocation///////////////////////



// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };

// // const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
// //     const leaveMonth = leaveDay.month();
// //     const leaveYear = leaveDay.year();

// //     // 1. CASUAL LEAVE: Scan back-dated chronological buckets starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

// //         const cSlot = pools.casual?.find((s: any) => 
// //             !s.usedDate && 
// //             s.monthIndex === m.index && 
// //             parseInt(s.year || String(targetYear)) === targetYear
// //         );

// //         if (cSlot) { 
// //             cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
// //             return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
// //         }
// //     }

// //     // 2. SICK LEAVE: Scan back-dated chronological buckets starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

// //         const sSlot = pools.sick?.find((s: any) => 
// //             !s.usedDate && 
// //             s.monthIndex === m.index && 
// //             parseInt(s.year || String(targetYear)) === targetYear
// //         );

// //         if (sSlot) { 
// //             sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
// //             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
// //         }
// //     }

// //     // 3. EARNED LEAVE: Scan back-dated chronological balances starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
// //             pools.earned[m.index].taken += 0.5;
// //             const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
// //             return `earned_${targetYear}_${String(m.index + 1).padStart(2, '0')}`;
// //         }
// //     }

// //     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, '0')}`;
// // };


// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     joiningDate: dayjs.Dayjs,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"

// ): string => {

//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();

//     // ======================================================
//     // 1. CHECK JOINING DATE
//     // ======================================================
//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // ======================================================
//     // 2. CHECK WHETHER CASUAL/SICK ALREADY EXISTS
//     //    IN THE SAME HALF OF THE SAME DAY
//     // ======================================================
//     const hasCasualOrSickInSameHalf = allLeaves.some((leave: any) => {
//         if (!leave.allocated_type) return false;

//         const type = leave.allocated_type.toLowerCase();

//         return (
//             dayjs(leave.leave_date).isSame(leaveDay, "day") &&
//             leave.half === currentHalf &&
//             (
//                 type.startsWith("casual") ||
//                 type.startsWith("sick")
//             )
//         );
//     });

//     // ======================================================
//     // 3. CASUAL LEAVE
//     // ======================================================
//     if (!hasCasualOrSickInSameHalf) {

//         for (const m of FINANCIAL_MONTHS) {

//             if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const cSlot = pools.casual?.find((s: any) =>
//                 !s.usedDate &&
//                 s.monthIndex === m.index &&
//                 parseInt(s.year || String(targetYear)) === targetYear
//             );

//             if (cSlot) {
//                 cSlot.usedDate = leaveDay.format("YYYY-MM-DD");

//                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }

//     }

//     // ======================================================
//     // 4. SICK LEAVE
//     // ======================================================
//     if (!hasCasualOrSickInSameHalf) {

//         for (const m of FINANCIAL_MONTHS) {

//             if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const sSlot = pools.sick?.find((s: any) =>
//                 !s.usedDate &&
//                 s.monthIndex === m.index &&
//                 parseInt(s.year || String(targetYear)) === targetYear
//             );

//             if (sSlot) {
//                 sSlot.usedDate = leaveDay.format("YYYY-MM-DD");

//                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }

//     }

//     // ======================================================
//     // 5. EARNED LEAVE
//     // ======================================================
//     for (const m of FINANCIAL_MONTHS) {

//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

//         const targetYear =
//             m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3
//                     ? leaveYear - 1
//                     : leaveYear);

//         // Skip earned leave months before joining month
//         if (
//             dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`)
//                 .endOf("month")
//                 .isBefore(joiningDate)
//         ) {
//             continue;
//         }

//         if (
//             pools.earned?.[m.index] &&
//             pools.earned[m.index].available > pools.earned[m.index].taken
//         ) {
//             pools.earned[m.index].taken += 0.5;

//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // ======================================================
//     // 6. LOSS OF PAY
//     // ======================================================
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };


// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: dbEmployees, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             employeeMap[String(emp.employee_code).trim()] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         const totalLeaveMap: Record<string, any[]> = {};
//         dbLeaves?.forEach((leave) => {
//             const emp = employeeIdMap[leave.employee_id];
//             if (!emp) return;
//             const mapKey = `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;
//             if (!totalLeaveMap[mapKey]) totalLeaveMap[mapKey] = [];
//             totalLeaveMap[mapKey].push(leave);
//         });

//         // Initialize empty credit trackers
//         const dynamicPoolCache: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             if (!emp.joining_date) return;
//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {

//                 const allocationMonth = dayjs().month(m.index);

//                 if (allocationMonth.endOf("month").isBefore(joinDate)) {
//                     earnedMap[m.index] = {
//                         taken: 0,
//                         available: 0
//                     };

//                     return;
//                 }
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             // Populate calculations using previously approved leaves
//             const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && l.status === "approved") || [];
//             historicalTakenLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             let matchFound = false;
//             let calculatedAllocationsForThisRow: string[] = [];

//             const processSlotAllocation = (targetHalf: string) => {
//                 const record = dbMatches.find(m => m.half === targetHalf);
//                 if (record && record.status === "approved") {
//                     matchFound = true;
//                     calculatedAllocationsForThisRow.push(record.allocated_type || "approved");
//                     return;
//                 }

//                 const targetAllocatedType = decideLeaveType(
//                     pools,
//                     leaveDay,
//                     dayjs(employee.joining_date),
//                     dbLeaves.filter(l => l.employee_id === employee.id),
//                     targetHalf as "1H" | "2H"
//                 );

//                 if (record && record.status === "Unauthorized_Leave") {

//                     matchFound = false;

//                     // Update the in-memory record immediately
//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });
//                 } else {
//                     unauthorizedLeavesToInsert.push({

//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Auto-created from biometric",
//                         status: "Unauthorized_Leave",
//                     });
//                     dbLeaves.push({
//                         id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//                         employee_id: employee.id,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         allocated_type: targetAllocatedType,
//                         status: "Unauthorized_Leave"
//                     });

//                 }
//                 calculatedAllocationsForThisRow.push(targetAllocatedType);
//             };

//             if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 const target = item.excel_status.includes("1H") ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;
//                     const rowText = row.join(" ");

//                     if (rowText.includes("Emp Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && String(cell).includes("Emp Code:"));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     const dateStr = row[1] ? String(row[1]).trim() : "";
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";
//                         for (let i = 10; i <= 18; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (lowerStatus.includes("absent") || lowerStatus.includes("½present") || lowerStatus.includes("1/2") || lowerStatus.includes("no outpunch")) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave");
//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, joining_date");
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full"
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Absent (1H)"
//                                 : "½Absent (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);

//             // 6. Update allocation source metadata
//             // for (const rec of leaves) {
//             //   await supabase
//             //     .schema("leave_management")
//             //     .from("leaves")
//             //     .update({
//             //       allocation_source_year: dayjs(rec.leave_date).year(),
//             //       allocation_source_month: dayjs(rec.leave_date).month() + 1,
//             //       allocation_source_type: "Reallocation"
//             //     })
//             //     .eq("id", rec.id);
//             // }

//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <List
//                                     dataSource={staffSummaries}
//                                     size="small"
//                                     bordered={false}
//                                     renderItem={(staff) => (
//                                         <List.Item style={{ padding: "6px 12px" }}>
//                                             <div>
//                                                 <Text strong style={{ marginRight: 12 }}> {staff.employee_code}</Text>
//                                                 <Text style={{ marginRight: 24, inlineSize: "200px", display: "inline-block" }}>{staff.full_name}</Text>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </List.Item>
//                                     )}
//                                 />
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }













//////working code to while uploading april and may excel///////////////////////



// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };

// // const decideLeaveType = (pools: any, leaveDay: dayjs.Dayjs): string => {
// //     const leaveMonth = leaveDay.month();
// //     const leaveYear = leaveDay.year();

// //     // 1. CASUAL LEAVE: Scan back-dated chronological buckets starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

// //         const cSlot = pools.casual?.find((s: any) => 
// //             !s.usedDate && 
// //             s.monthIndex === m.index && 
// //             parseInt(s.year || String(targetYear)) === targetYear
// //         );

// //         if (cSlot) { 
// //             cSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
// //             return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
// //         }
// //     }

// //     // 2. SICK LEAVE: Scan back-dated chronological buckets starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

// //         const sSlot = pools.sick?.find((s: any) => 
// //             !s.usedDate && 
// //             s.monthIndex === m.index && 
// //             parseInt(s.year || String(targetYear)) === targetYear
// //         );

// //         if (sSlot) { 
// //             sSlot.usedDate = leaveDay.format("YYYY-MM-DD"); 
// //             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, '0')}`; 
// //         }
// //     }

// //     // 3. EARNED LEAVE: Scan back-dated chronological balances starting from April
// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

// //         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
// //             pools.earned[m.index].taken += 0.5;
// //             const targetYear = m.index < 3 && leaveMonth >= 3 ? leaveYear + 1 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
// //             return `earned_${targetYear}_${String(m.index + 1).padStart(2, '0')}`;
// //         }
// //     }

// //     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, '0')}`;
// // };


// // const decideLeaveType = (
// //     pools: any,
// //     leaveDay: dayjs.Dayjs,
// //     joiningDate: dayjs.Dayjs,
// //     allLeaves: any[],
// //     currentHalf: "1H" | "2H"
// // ): string => {
// //     const leaveMonth = leaveDay.month();
// //     const leaveYear = leaveDay.year();

// //     if (leaveDay.isBefore(joiningDate, "day")) {
// //         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// //     }

// //     const hasCasualOrSickInSameHalf = allLeaves.some((leave: any) => {
// //         if (!leave.allocated_type) return false;
// //         const type = leave.allocated_type.toLowerCase();
// //         return (
// //             dayjs(leave.leave_date).isSame(leaveDay, "day") &&
// //             leave.half === currentHalf &&
// //             (type.startsWith("casual") || type.startsWith("sick"))
// //         );
// //     });

// //     if (!hasCasualOrSickInSameHalf) {
// //         for (const m of FINANCIAL_MONTHS) {
// //             if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
// //             const targetYear = m.index < 3 && leaveMonth >= 3
// //                 ? leaveYear + 1
// //                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
// //             const cSlot = pools.casual?.find((s: any) =>
// //                 !s.usedDate &&
// //                 s.monthIndex === m.index &&
// //                 s.half === currentHalf && // 🌟 CHANGED: Ensuring slot half accurately matches current assignment context
// //                 parseInt(s.year || String(targetYear)) === targetYear
// //             );
// //             if (cSlot) {
// //                 cSlot.usedDate = leaveDay.format("YYYY-MM-DD");
// //                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //             }
// //         }
// //     }

// //     if (!hasCasualOrSickInSameHalf) {
// //         for (const m of FINANCIAL_MONTHS) {
// //             if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
// //             const targetYear = m.index < 3 && leaveMonth >= 3
// //                 ? leaveYear + 1
// //                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
// //             const sSlot = pools.sick?.find((s: any) =>
// //                 !s.usedDate &&
// //                 s.monthIndex === m.index &&
// //                 s.half === currentHalf && // 🌟 CHANGED: Ensuring slot half accurately matches current assignment context
// //                 parseInt(s.year || String(targetYear)) === targetYear
// //             );
// //             if (sSlot) {
// //                 sSlot.usedDate = leaveDay.format("YYYY-MM-DD");
// //                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //             }
// //         }
// //     }

// //     for (const m of FINANCIAL_MONTHS) {
// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
// //         const targetYear = m.index < 3 && leaveMonth >= 3
// //             ? leaveYear + 1
// //             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);
// //         if (dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`).endOf("month").isBefore(joiningDate)) {
// //             continue;
// //         }
// //         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
// //             pools.earned[m.index].taken += 0.5;
// //             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //         }
// //     }

// //     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// // };






// // 🌟 CHANGED: Updated decideLeaveType to handle strict 1H/2H pairing on the same date before jumping buckets
// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     joiningDate: dayjs.Dayjs,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {
//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // 1. CHOOSE CASUAL LEAVE (With strict same-date matching or next chronological slot)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         // Look for a slot in this month that matches our target half
//         const cSlot = pools.casual?.find((s: any) =>
//             !s.usedDate &&
//             s.monthIndex === m.index &&
//             s.half === currentHalf &&
//             parseInt(s.year || String(targetYear)) === targetYear
//         );

//         if (cSlot) {
//             cSlot.usedDate = leaveDateStr;
//             return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 2. CHOOSE SICK LEAVE (If casual is exhausted for this half)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         const sSlot = pools.sick?.find((s: any) =>
//             !s.usedDate &&
//             s.monthIndex === m.index &&
//             s.half === currentHalf &&
//             parseInt(s.year || String(targetYear)) === targetYear
//         );

//         if (sSlot) {
//             sSlot.usedDate = leaveDateStr;
//             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 3. CHOOSE EARNED LEAVE (Consume your 1 Earned Leave credit if available)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         if (dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`).endOf("month").isBefore(joiningDate)) {
//             continue;
//         }

//         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
//             pools.earned[m.index].taken += 0.5;
//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 4. FALLBACK TO LOSS OF PAY
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: dbEmployees, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             employeeMap[String(emp.employee_code).trim()] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         const totalLeaveMap: Record<string, any[]> = {};
//         dbLeaves?.forEach((leave) => {
//             const emp = employeeIdMap[leave.employee_id];
//             if (!emp) return;
//             const mapKey = `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;
//             if (!totalLeaveMap[mapKey]) totalLeaveMap[mapKey] = [];
//             totalLeaveMap[mapKey].push(leave);
//         });

//         // Initialize empty credit trackers
//         const dynamicPoolCache: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             if (!emp.joining_date) return;
//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {

//                 const allocationMonth = dayjs().month(m.index);

//                 if (allocationMonth.endOf("month").isBefore(joinDate)) {
//                     earnedMap[m.index] = {
//                         taken: 0,
//                         available: 0
//                     };

//                     return;
//                 }
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             // Populate calculations using previously approved leaves
//             const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && l.status === "approved") || [];
//             historicalTakenLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             let matchFound = false;
//             let calculatedAllocationsForThisRow: string[] = [];

//             const processSlotAllocation = (targetHalf: string) => {
//                 const record = dbMatches.find(m => m.half === targetHalf);
//                 if (record && record.status === "approved") {
//                     matchFound = true;
//                     calculatedAllocationsForThisRow.push(record.allocated_type || "approved");
//                     return;
//                 }

//                 const targetAllocatedType = decideLeaveType(
//                     pools,
//                     leaveDay,
//                     dayjs(employee.joining_date),
//                     dbLeaves.filter(l => l.employee_id === employee.id),
//                     targetHalf as "1H" | "2H"
//                 );

//                 if (record && record.status === "Unauthorized_Leave") {

//                     matchFound = false;

//                     // Update the in-memory record immediately
//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });
//                 } else {
//                     unauthorizedLeavesToInsert.push({

//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Auto-created from biometric",
//                         status: "Unauthorized_Leave",
//                     });
//                     dbLeaves.push({
//                         id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//                         employee_id: employee.id,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         allocated_type: targetAllocatedType,
//                         status: "Unauthorized_Leave"
//                     });

//                 }
//                 calculatedAllocationsForThisRow.push(targetAllocatedType);
//             };

//            if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
//                 const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
//                 const target = isFirstHalf ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//    const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // 🌟 CHANGED: Expanded header validation to support both "Emp Code:" (Excel 1) and "Employee Code:" (Excel 2)
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:")));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // const dateStr = row[1] ? String(row[1]).trim() : "";

//                     let dateStr = "";

// for (const cell of row) {
//     if (!cell) continue;

//     if (cell instanceof Date) {
//         dateStr = dayjs(cell).format("DD-MMM-YYYY");
//         break;
//     }

//     const value = String(cell).trim();

//     if (/^\d{2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//         dateStr = value;
//         break;
//     }
// }
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";

//                         // 🌟 CHANGED: Dynamic column scavenger logic replaces fixed column array indexing.
//                         // Format 1 tracks standard tags at index 14; Format 2 tracks status at index 6.
//                         // This loops through potential data rows dynamically matching the target status strings instead of relying on hardcoded static column positions.
//                         for (let i = 4; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (
//                             lowerStatus.includes("absent") || 
//                             lowerStatus.includes("½present") || 
//                             lowerStatus.includes("1/2") || 
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave");
//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, joining_date");
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);

//             // 6. Update allocation source metadata
//             // for (const rec of leaves) {
//             //   await supabase
//             //     .schema("leave_management")
//             //     .from("leaves")
//             //     .update({
//             //       allocation_source_year: dayjs(rec.leave_date).year(),
//             //       allocation_source_month: dayjs(rec.leave_date).month() + 1,
//             //       allocation_source_type: "Reallocation"
//             //     })
//             //     .eq("id", rec.id);
//             // }

//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//         {staffSummaries.map((staff) => (
//             <div key={staff.employee_code} style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 padding: "6px 0",
//                 borderBottom: '1px solid #f0f0f0' 
//             }}>
//                 <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                 <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                 <div style={{ flex: 1 }}>
//                     <Text type="secondary">Total Sheet Leave Counted: </Text>
//                     <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                 </div>
//             </div>
//         ))}
//     </div>
// </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }









////// code to approved leave allocation///////////////////////



// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };





// // 🌟 CHANGED: Updated decideLeaveType to handle strict 1H/2H pairing on the same date before jumping buckets
// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     joiningDate: dayjs.Dayjs,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {
//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // 1. CHOOSE CASUAL LEAVE (With strict same-date matching or next chronological slot)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         // Look for a slot in this month that matches our target half
//         const cSlot = pools.casual?.find((s: any) =>
//             !s.usedDate &&
//             s.monthIndex === m.index &&
//             s.half === currentHalf &&
//             parseInt(s.year || String(targetYear)) === targetYear
//         );

//         if (cSlot) {
//             cSlot.usedDate = leaveDateStr;
//             return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 2. CHOOSE SICK LEAVE (If casual is exhausted for this half)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         const sSlot = pools.sick?.find((s: any) =>
//             !s.usedDate &&
//             s.monthIndex === m.index &&
//             s.half === currentHalf &&
//             parseInt(s.year || String(targetYear)) === targetYear
//         );

//         if (sSlot) {
//             sSlot.usedDate = leaveDateStr;
//             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 3. CHOOSE EARNED LEAVE (Consume your 1 Earned Leave credit if available)
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;
//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         if (dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`).endOf("month").isBefore(joiningDate)) {
//             continue;
//         }

//         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
//             pools.earned[m.index].taken += 0.5;
//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // 4. FALLBACK TO LOSS OF PAY
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const { data: dbLeaves, error: dbError } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .select("id, leave_date, status, employee_id, half, allocated_type")
//             .in("status", ["approved", "Unauthorized_Leave", "taken"]);
//         if (dbError) throw dbError;

//         const { data: dbEmployees, error: empError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .select("id, employee_code, full_name, department, joining_date");
//         if (empError) throw empError;

//         const { data: dbCredits, error: creditsError } = await supabase
//             .schema("leave_management")
//             .from("el_credits")
//             .select("*");
//         if (creditsError) throw creditsError;

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             employeeMap[String(emp.employee_code).trim()] = emp;
//             employeeIdMap[emp.id] = emp;
//         });

//         const totalLeaveMap: Record<string, any[]> = {};
//         dbLeaves?.forEach((leave) => {
//             const emp = employeeIdMap[leave.employee_id];
//             if (!emp) return;
//             const mapKey = `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;
//             if (!totalLeaveMap[mapKey]) totalLeaveMap[mapKey] = [];
//             totalLeaveMap[mapKey].push(leave);
//         });

//         // Initialize empty credit trackers
//         const dynamicPoolCache: Record<string, any> = {};
//         dbEmployees?.forEach((emp) => {
//             if (!emp.joining_date) return;
//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];
//             let loopDate = joinDate.startOf("month");
//             const endOfCalendarBoundary = dayjs().endOf("year");

//             while (loopDate.isBefore(endOfCalendarBoundary) || loopDate.isSame(endOfCalendarBoundary, "month")) {
//                 const mIdx = loopDate.month();
//                 casualPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 sickPool.push({ monthIndex: mIdx, half: "1H", usedDate: null }, { monthIndex: mIdx, half: "2H", usedDate: null });
//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};
//             FINANCIAL_MONTHS.forEach(m => {

//                 const allocationMonth = dayjs().month(m.index);

//                 if (allocationMonth.endOf("month").isBefore(joinDate)) {
//                     earnedMap[m.index] = {
//                         taken: 0,
//                         available: 0
//                     };

//                     return;
//                 }
//                 const monthlyCredits = dbCredits
//                     .filter(c => c.employee_id === emp.id && c.credit_date && dayjs(c.credit_date).month() === m.index)
//                     .reduce((acc, curr) => acc + Number(curr.count || 0), 0);
//                 earnedMap[m.index] = { taken: 0, available: monthlyCredits };
//             });

//             // Populate calculations using previously approved leaves
//             const historicalTakenLeaves = dbLeaves?.filter(l => l.employee_id === emp.id && l.status === "approved") || [];
//             historicalTakenLeaves.forEach((leave) => {
//                 const parts = leave.allocated_type?.split("_") || [];
//                 if (leave.allocated_type?.startsWith("casual")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = casualPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("sick")) {
//                     const allocationMonth = Number(parts[3]) - 1;
//                     const slot = sickPool.find((s) => s.monthIndex === allocationMonth && s.half === leave.half);
//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type?.startsWith("earned")) {
//                     const earnedMonth = Number(parts[2]) - 1;
//                     if (earnedMap[earnedMonth]) earnedMap[earnedMonth].taken += 0.5;
//                 }
//             });

//             dynamicPoolCache[emp.employee_code] = { casual: casualPool, sick: sickPool, earned: earnedMap };
//         });

//         const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             let matchFound = false;
//             let calculatedAllocationsForThisRow: string[] = [];

//             const processSlotAllocation = (targetHalf: string) => {
//                 const record = dbMatches.find(m => m.half === targetHalf);
//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     record.allocated_type
//                 ) {
//                     matchFound = true;
//                     calculatedAllocationsForThisRow.push(record.allocated_type);
//                     return;
//                 }


//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     !record.allocated_type
//                 ) {
//                     const targetAllocatedType = decideLeaveType(
//                         pools,
//                         leaveDay,
//                         dayjs(employee.joining_date),
//                         dbLeaves.filter(l => l.employee_id === employee.id),
//                         targetHalf as "1H" | "2H"
//                     );

//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });

//                     calculatedAllocationsForThisRow.push(targetAllocatedType);
//                     matchFound = true;
//                     return;
//                 }



//                 const targetAllocatedType = decideLeaveType(
//                     pools,
//                     leaveDay,
//                     dayjs(employee.joining_date),
//                     dbLeaves.filter(l => l.employee_id === employee.id),
//                     targetHalf as "1H" | "2H"
//                 );

//                 if (record && record.status === "Unauthorized_Leave") {

//                     matchFound = false;

//                     // Update the in-memory record immediately
//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });
//                 } else {
//                     unauthorizedLeavesToInsert.push({

//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Auto-created from biometric",
//                         status: "Unauthorized_Leave",
//                     });
//                     dbLeaves.push({
//                         id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//                         employee_id: employee.id,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         allocated_type: targetAllocatedType,
//                         status: "Unauthorized_Leave"
//                     });

//                 }
//                 calculatedAllocationsForThisRow.push(targetAllocatedType);
//             };

//             if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
//                 const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
//                 const target = isFirstHalf ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: "binary", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // 🌟 CHANGED: Expanded header validation to support both "Emp Code:" (Excel 1) and "Employee Code:" (Excel 2)
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex((cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:")));
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // const dateStr = row[1] ? String(row[1]).trim() : "";

//                     let dateStr = "";

//                     for (const cell of row) {
//                         if (!cell) continue;

//                         if (cell instanceof Date) {
//                             dateStr = dayjs(cell).format("DD-MMM-YYYY");
//                             break;
//                         }

//                         const value = String(cell).trim();

//                         if (/^\d{2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//                             dateStr = value;
//                             break;
//                         }
//                     }
//                     const isDateRow = /^\d{2}[-\/][A-Za-z0-9]{3,}[-\/]\d{4}/.test(dateStr);

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";

//                         // 🌟 CHANGED: Dynamic column scavenger logic replaces fixed column array indexing.
//                         // Format 1 tracks standard tags at index 14; Format 2 tracks status at index 6.
//                         // This loops through potential data rows dynamically matching the target status strings instead of relying on hardcoded static column positions.
//                         for (let i = 4; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (
//                                 cellVal.toLowerCase().includes("present") ||
//                                 cellVal.toLowerCase().includes("absent") ||
//                                 cellVal.toLowerCase().includes("weeklyoff")
//                             ) {
//                                 statusStr = cellVal;
//                                 break;
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         if (
//                             lowerStatus.includes("absent") ||
//                             lowerStatus.includes("½present") ||
//                             lowerStatus.includes("1/2") ||
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsBinaryString(file);
//         return false;
//     };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave");
//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, joining_date");
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);



//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//                                     {staffSummaries.map((staff) => (
//                                         <div key={staff.employee_code} style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             padding: "6px 0",
//                                             borderBottom: '1px solid #f0f0f0'
//                                         }}>
//                                             <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                                             <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                                             <div style={{ flex: 1 }}>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }







// ////////code with allocation and reallocation issue//////





// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };





// // 🌟 CHANGED: Updated decideLeaveType to handle strict 1H/2H pairing on the same date before jumping buckets
// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     joiningDate: dayjs.Dayjs,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {
//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // --- HELPER TO FIND SLOT SAFELY ---
//     const findAndConsumeSlot = (
//         pool: any[],
//         targetMonthIndex: number,
//         targetYear: number,
//         half: string
//     ) => {
//         return pool?.find((s: any) => {
//             // Strict availability check
//             if (s.usedDate) return false;

//             // Match half and month
//             if (s.monthIndex !== targetMonthIndex || s.half !== half) return false;

//             // Strict Year Check
//             const slotYear = s.year ? parseInt(String(s.year), 10) : null;
//             if (slotYear !== null && slotYear !== targetYear) return false;

//             return true;
//         });
//     };

//     // -------------------------------------------------------------
//     // 1. CHOOSE CASUAL LEAVE (Same month preferred first, then past months)
//     // -------------------------------------------------------------
//     if (pools.casual) {
//         // Sort months so current month is checked FIRST, then earlier months chronologically
//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) => (a.index === leaveMonth ? -1 : b.index === leaveMonth ? 1 : 0));

//         for (const m of sortedMonths) {
//             const targetYear = m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//             const cSlot = findAndConsumeSlot(pools.casual, m.index, targetYear, currentHalf);

//             if (cSlot) {
//                 cSlot.usedDate = leaveDateStr; // Stamp date directly
//                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // 2. CHOOSE SICK LEAVE (Same month preferred first, then past months)
//     // -------------------------------------------------------------
//     if (pools.sick) {
//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) => (a.index === leaveMonth ? -1 : b.index === leaveMonth ? 1 : 0));

//         for (const m of sortedMonths) {
//             const targetYear = m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//             const sSlot = findAndConsumeSlot(pools.sick, m.index, targetYear, currentHalf);

//             if (sSlot) {
//                 sSlot.usedDate = leaveDateStr;
//                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // 3. CHOOSE EARNED LEAVE
//     // -------------------------------------------------------------
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         const monthStartDate = dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`);
//         if (monthStartDate.endOf("month").isBefore(joiningDate)) {
//             continue;
//         }

//         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
//             pools.earned[m.index].taken += 0.5;
//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     // -------------------------------------------------------------
//     // 4. FALLBACK TO LOSS OF PAY
//     // -------------------------------------------------------------
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const [
//             leavesResult,
//             employeesResult,
//             creditsResult
//         ] = await Promise.all([
//             supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, employee_id, half, allocated_type, frozen")
//                 .in("status", ["approved", "Unauthorized_Leave", "taken"]),

//             supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, full_name, department, joining_date"),

//             supabase
//                 .schema("leave_management")
//                 .from("el_credits")
//                 .select("*")
//         ]);

//         if (leavesResult.error) throw leavesResult.error;
//         if (employeesResult.error) throw employeesResult.error;
//         if (creditsResult.error) throw creditsResult.error;

//         const dbLeaves = leavesResult.data || [];
//         const dbEmployees = employeesResult.data || [];
//         const dbCredits = creditsResult.data || [];


//         // =====================================================
//         // BUILD FAST LOOKUP MAPS
//         // =====================================================

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};

//         const employeeLeavesMap: Record<string, any[]> = {};

//         const totalLeaveMap: Record<string, any[]> = {};

//         const creditMap: Record<string, Record<number, number>> = {};


//         // =====================================================
//         // EMPLOYEE MAP
//         // =====================================================

//         for (const emp of dbEmployees) {

//             employeeMap[String(emp.employee_code).trim()] = emp;

//             employeeIdMap[emp.id] = emp;

//             employeeLeavesMap[emp.id] = [];
//         }


//         // =====================================================
//         // CREDIT MAP
//         // creditMap[employeeId][month]
//         // =====================================================

//         for (const credit of dbCredits) {

//             if (!credit.credit_date) continue;

//             const month = dayjs(credit.credit_date).month();

//             if (!creditMap[credit.employee_id]) {

//                 creditMap[credit.employee_id] = {};
//             }

//             creditMap[credit.employee_id][month] =
//                 (creditMap[credit.employee_id][month] || 0) +
//                 Number(credit.count || 0);
//         }


//         // =====================================================
//         // LEAVE MAPS
//         // =====================================================

//         for (const leave of dbLeaves) {

//             employeeLeavesMap[leave.employee_id].push(leave);

//             const emp = employeeIdMap[leave.employee_id];

//             if (!emp) continue;

//             const mapKey =
//                 `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;

//             if (!totalLeaveMap[mapKey]) {

//                 totalLeaveMap[mapKey] = [];
//             }

//             totalLeaveMap[mapKey].push(leave);
//         }


//         // =====================================================
//         // BUILD DYNAMIC POOLS
//         // =====================================================

//         const dynamicPoolCache: Record<string, any> = {};

//         const endOfCalendarBoundary = dayjs().endOf("year");

//         for (const emp of dbEmployees) {

//             if (!emp.joining_date) continue;

//             const joinDate = dayjs(emp.joining_date);

//             const casualPool: any[] = [];

//             const sickPool: any[] = [];

//             let loopDate = joinDate.startOf("month");

//             while (
//                 loopDate.isBefore(endOfCalendarBoundary) ||
//                 loopDate.isSame(endOfCalendarBoundary, "month")
//             ) {

//                 const mIdx = loopDate.month();

//                 const year = loopDate.year();

//                 casualPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: null
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: null
//                     }
//                 );

//                 sickPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: null
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: null
//                     }
//                 );

//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};

//             for (const m of FINANCIAL_MONTHS) {

//                 const allocationMonth = dayjs().month(m.index);

//                 if (allocationMonth.endOf("month").isBefore(joinDate)) {

//                     earnedMap[m.index] = {
//                         taken: 0,
//                         available: 0
//                     };

//                     continue;
//                 }

//                 earnedMap[m.index] = {

//                     taken: 0,

//                     available:
//                         creditMap[emp.id]?.[m.index] || 0
//                 };
//             }

//             const historicalTakenLeaves =
//                 employeeLeavesMap[emp.id].filter(
//                     l =>
//                         l.status === "approved"
//                     // l.status === "Unauthorized_Leave"
//                 );

//             for (const leave of historicalTakenLeaves) {

//                 if (!leave.allocated_type) continue;

//                 const parts = leave.allocated_type.split("_");

//                 if (leave.allocated_type.startsWith("casual")) {

//                     const year = Number(parts[2]);

//                     const month = Number(parts[3]) - 1;

//                     const slot = casualPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 }

//                 else if (leave.allocated_type.startsWith("sick")) {

//                     const year = Number(parts[2]);

//                     const month = Number(parts[3]) - 1;

//                     const slot = sickPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 }

//                 else if (leave.allocated_type.startsWith("earned")) {

//                     const month = Number(parts[2]) - 1;

//                     if (earnedMap[month]) {

//                         earnedMap[month].taken += 0.5;
//                     }
//                 }
//             }

//             dynamicPoolCache[emp.employee_code] = {

//                 casual: casualPool,

//                 sick: sickPool,

//                 earned: earnedMap
//             };
//         }


//         const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             let matchFound = false;
//             let calculatedAllocationsForThisRow: string[] = [];

//             const processSlotAllocation = (targetHalf: string) => {
//                 const record = dbMatches.find(m => m.half === targetHalf);
//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     record.allocated_type
//                 ) {
//                     matchFound = true;
//                     calculatedAllocationsForThisRow.push(record.allocated_type);
//                     return;
//                 }


//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     !record.allocated_type
//                 ) {
//                     const targetAllocatedType = decideLeaveType(
//                         pools,
//                         leaveDay,
//                         dayjs(employee.joining_date),
//                         dbLeaves.filter(l => l.employee_id === employee.id),
//                         targetHalf as "1H" | "2H"
//                     );

//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });

//                     calculatedAllocationsForThisRow.push(targetAllocatedType);
//                     matchFound = true;
//                     return;
//                 }



//                 const targetAllocatedType = decideLeaveType(
//                     pools,
//                     leaveDay,
//                     dayjs(employee.joining_date),
//                     dbLeaves.filter(l => l.employee_id === employee.id),
//                     targetHalf as "1H" | "2H"
//                 );

//                 if (record && record.status === "Unauthorized_Leave") {

//                     matchFound = false;

//                     // Update the in-memory record immediately
//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });
//                 } else {
//                     unauthorizedLeavesToInsert.push({

//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Auto-created from biometric",
//                         status: "Unauthorized_Leave",
//                         frozen: false
//                     });
//                     dbLeaves.push({
//                         id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//                         employee_id: employee.id,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         allocated_type: targetAllocatedType,
//                         status: "Unauthorized_Leave",
//                         frozen: false
//                     });

//                 }
//                 calculatedAllocationsForThisRow.push(targetAllocatedType);
//             };

//             if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
//                 const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
//                 const target = isFirstHalf ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id)
//                     .eq("frozen", false);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 // 🌟 IMPROVED: Using ArrayBuffer instead of binary string for better encoding support
//                 const workbook = XLSX.read(data, { type: "array", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // Match employee code row header
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:"))
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // Locate date column
//                     let dateStr = "";
//                     for (const cell of row) {
//                         if (!cell) continue;

//                         if (cell instanceof Date) {
//                             dateStr = dayjs(cell).format("DD-MMM-YYYY");
//                             break;
//                         }

//                         const value = String(cell).trim();
//                         // 🌟 IMPROVED: Handles both single/double digit days (e.g., 1-Jan-2026 vs 01-Jan-2026)
//                         if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//                             dateStr = value;
//                             break;
//                         }
//                     }

//                     const isDateRow = Boolean(dateStr) && dayjs(dateStr).isValid();

//                     if (isDateRow && currentEmpCode) {
//                         let statusStr = "";

//                         // 🌟 IMPROVED: Dynamic status detection
//                         for (let i = 2; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (!cellVal) continue;

//                             const lower = cellVal.toLowerCase();
//                             if (
//                                 lower.includes("absent") ||
//                                 lower.includes("present") ||
//                                 lower.includes("weeklyoff") ||
//                                 lower.includes("no outpunch") ||
//                                 lower.includes("1/2") ||
//                                 lower.includes("½")
//                             ) {
//                                 statusStr = cellVal;
//                                 // Keep going if we hit standard 'present' to see if a more specific flag (like ½present) exists in later cells
//                                 if (lower !== "present") {
//                                     break;
//                                 }
//                             }
//                         }

//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         // Filter relevant non-full presence statuses
//                         if (
//                             lowerStatus.includes("absent") ||
//                             lowerStatus.includes("½present") ||
//                             lowerStatus.includes("half") ||
//                             lowerStatus.includes("1/2") ||
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };


//     // =============================================
//     // FREEZE BUTTON
//     // =============================================



//    const handleFreezeAllocation = async () => {
//     try {
//         setLoading(true);

//         // 1. Freeze all leave records
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .update({
//                 frozen: true,
//                 frozen_at: new Date().toISOString(),
//             })
//             .eq("frozen", false)
//             .select();

//         if (error) throw error;

//         // 2. Freeze all employee joining dates
//         const { error: employeeFreezeError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 joining_date_frozen: true,
//                 joining_date_frozen_at: new Date().toISOString(),
//             })
//             .eq("joining_date_frozen", false);

//         if (employeeFreezeError) throw employeeFreezeError;

//         message.success(
//             `${data?.length ?? 0} leave records and all employee joining dates frozen successfully 🔒`
//         );

//     } catch (err: any) {
//         console.error(err);
//         message.error(err.message || "Freeze failed");
//     } finally {
//         setLoading(false);
//     }
// };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave")
//                 .eq("frozen", false);

//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, joining_date");
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);



//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                         <Button
//                             type="primary"
//                             danger
//                             onClick={handleFreezeAllocation}
//                         >
//                             🔒 Freeze Leave Allocation
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//                                     {staffSummaries.map((staff) => (
//                                         <div key={staff.employee_code} style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             padding: "6px 0",
//                                             borderBottom: '1px solid #f0f0f0'
//                                         }}>
//                                             <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                                             <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                                             <div style={{ flex: 1 }}>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }










// ////////working code to skip daily wages data//////





// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };





// // 🌟 CHANGED: Pass the full employee object to check for daily wage restrictions
// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     employee: any, // Changed from joiningDate: dayjs.Dayjs
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {
//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");
//     const joiningDate = employee.joining_date ? dayjs(employee.joining_date) : dayjs(0);

//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // 🌟 ADDED: Lock CL, SL, and EL if employee is on daily wages during this specific month/date
//   const isPermanentlyDaily = employee.is_permanently_daily;

// let isTemporaryDaily = false;

// if (employee.daily_wage_end_month) {

//     const leaveMonth = leaveDay.startOf("month");

//     const endMonth = dayjs(employee.daily_wage_end_month).startOf("month");

//     if (
//         leaveMonth.isSame(endMonth) ||
//         leaveMonth.isBefore(endMonth)
//     ) {
//         isTemporaryDaily = true;
//     }
// }

//     if (isPermanentlyDaily || isTemporaryDaily) {
//         // Automatically bypasses all paid leave rules and assigns Loss of Pay (LOP)
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // --- HELPER TO FIND SLOT SAFELY ---
//     const findAndConsumeSlot = (
//         pool: any[],
//         targetMonthIndex: number,
//         targetYear: number,
//         half: string
//     ) => {
//         return pool?.find((s: any) => {
//             if (s.usedDate) return false;
//             if (s.monthIndex !== targetMonthIndex || s.half !== half) return false;
//             const slotYear = s.year ? parseInt(String(s.year), 10) : null;
//             if (slotYear !== null && slotYear !== targetYear) return false;
//             return true;
//         });
//     };

//     // -------------------------------------------------------------
//     // 1. CHOOSE CASUAL LEAVE (Same month preferred first, then past months)
//     // -------------------------------------------------------------
//     if (pools.casual) {
//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) => (a.index === leaveMonth ? -1 : b.index === leaveMonth ? 1 : 0));

//         for (const m of sortedMonths) {
//             const targetYear = m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//             const cSlot = findAndConsumeSlot(pools.casual, m.index, targetYear, currentHalf);

//             if (cSlot) {
//                 cSlot.usedDate = leaveDateStr;
//                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // 2. CHOOSE SICK LEAVE (Same month preferred first, then past months)
//     // -------------------------------------------------------------
//     if (pools.sick) {
//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) => (a.index === leaveMonth ? -1 : b.index === leaveMonth ? 1 : 0));

//         for (const m of sortedMonths) {
//             const targetYear = m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//             const sSlot = findAndConsumeSlot(pools.sick, m.index, targetYear, currentHalf);

//             if (sSlot) {
//                 sSlot.usedDate = leaveDateStr;
//                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // 3. CHOOSE EARNED LEAVE
//     // -------------------------------------------------------------
//     for (const m of FINANCIAL_MONTHS) {
//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth)) break;

//         const targetYear = m.index < 3 && leaveMonth >= 3
//             ? leaveYear + 1
//             : (m.index >= 3 && leaveMonth < 3 ? leaveYear - 1 : leaveYear);

//         const monthStartDate = dayjs(`${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`);
//         if (monthStartDate.endOf("month").isBefore(joiningDate)) {
//             continue;
//         }

//         if (pools.earned?.[m.index] && pools.earned[m.index].available > pools.earned[m.index].taken) {
//             pools.earned[m.index].taken += 0.5;
//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };

// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const [
//             leavesResult,
//             employeesResult,
//             creditsResult
//         ] = await Promise.all([
//             supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, employee_id, half, allocated_type, frozen")
//                 .in("status", ["approved", "Unauthorized_Leave", "taken"]),

//             supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, full_name, department, joining_date, is_permanently_daily, daily_wage_until"), // 🌟 ADDED STATUS COLUMNS

//             supabase
//                 .schema("leave_management")
//                 .from("el_credits")
//                 .select("*")
//         ]);

//         if (leavesResult.error) throw leavesResult.error;
//         if (employeesResult.error) throw employeesResult.error;
//         if (creditsResult.error) throw creditsResult.error;

//         const dbLeaves = leavesResult.data || [];
//         const dbEmployees = employeesResult.data || [];
//         const dbCredits = creditsResult.data || [];


//         // =====================================================
//         // BUILD FAST LOOKUP MAPS
//         // =====================================================

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};

//         const employeeLeavesMap: Record<string, any[]> = {};

//         const totalLeaveMap: Record<string, any[]> = {};

//         const creditMap: Record<string, Record<number, number>> = {};


//         // =====================================================
//         // EMPLOYEE MAP
//         // =====================================================

//         for (const emp of dbEmployees) {

//             employeeMap[String(emp.employee_code).trim()] = emp;

//             employeeIdMap[emp.id] = emp;

//             employeeLeavesMap[emp.id] = [];
//         }


//         // =====================================================
//         // CREDIT MAP
//         // creditMap[employeeId][month]
//         // =====================================================

//         for (const credit of dbCredits) {

//             if (!credit.credit_date) continue;

//             const month = dayjs(credit.credit_date).month();

//             if (!creditMap[credit.employee_id]) {

//                 creditMap[credit.employee_id] = {};
//             }

//             creditMap[credit.employee_id][month] =
//                 (creditMap[credit.employee_id][month] || 0) +
//                 Number(credit.count || 0);
//         }


//         // =====================================================
//         // LEAVE MAPS
//         // =====================================================

//         for (const leave of dbLeaves) {

//             employeeLeavesMap[leave.employee_id].push(leave);

//             const emp = employeeIdMap[leave.employee_id];

//             if (!emp) continue;

//             const mapKey =
//                 `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;

//             if (!totalLeaveMap[mapKey]) {

//                 totalLeaveMap[mapKey] = [];
//             }

//             totalLeaveMap[mapKey].push(leave);
//         }


//         // =====================================================
//         // BUILD DYNAMIC POOLS
//         // =====================================================

//         const dynamicPoolCache: Record<string, any> = {};

//         const endOfCalendarBoundary = dayjs().endOf("year");

//         for (const emp of dbEmployees) {

//             if (!emp.joining_date) continue;

//             const joinDate = dayjs(emp.joining_date);

//             const casualPool: any[] = [];

//             const sickPool: any[] = [];

//             let loopDate = joinDate.startOf("month");

//             while (
//                 loopDate.isBefore(endOfCalendarBoundary) ||
//                 loopDate.isSame(endOfCalendarBoundary, "month")
//             ) {

//                 const mIdx = loopDate.month();

//                 const year = loopDate.year();

//                 casualPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: null
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: null
//                     }
//                 );

//                 sickPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: null
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: null
//                     }
//                 );

//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};

//             for (const m of FINANCIAL_MONTHS) {

//                 const allocationMonth = dayjs().month(m.index);

//                 if (allocationMonth.endOf("month").isBefore(joinDate)) {

//                     earnedMap[m.index] = {
//                         taken: 0,
//                         available: 0
//                     };

//                     continue;
//                 }

//                 earnedMap[m.index] = {

//                     taken: 0,

//                     available:
//                         creditMap[emp.id]?.[m.index] || 0
//                 };
//             }

//             const historicalTakenLeaves =
//                 employeeLeavesMap[emp.id].filter(
//                     l =>
//                         l.status === "approved"
//                     // l.status === "Unauthorized_Leave"
//                 );

//             for (const leave of historicalTakenLeaves) {

//                 if (!leave.allocated_type) continue;

//                 const parts = leave.allocated_type.split("_");

//                 if (leave.allocated_type.startsWith("casual")) {

//                     const year = Number(parts[2]);

//                     const month = Number(parts[3]) - 1;

//                     const slot = casualPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 }

//                 else if (leave.allocated_type.startsWith("sick")) {

//                     const year = Number(parts[2]);

//                     const month = Number(parts[3]) - 1;

//                     const slot = sickPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 }

//                 else if (leave.allocated_type.startsWith("earned")) {

//                     const month = Number(parts[2]) - 1;

//                     if (earnedMap[month]) {

//                         earnedMap[month].taken += 0.5;
//                     }
//                 }
//             }

//             dynamicPoolCache[emp.employee_code] = {

//                 casual: casualPool,

//                 sick: sickPool,

//                 earned: earnedMap
//             };
//         }


//         const leavesToUpdateWithAllocation: Array<{ id: string; allocated_type: string }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             let matchFound = false;
//             let calculatedAllocationsForThisRow: string[] = [];

//             const processSlotAllocation = (targetHalf: string) => {
//                 const record = dbMatches.find(m => m.half === targetHalf);
//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     record.allocated_type
//                 ) {
//                     matchFound = true;
//                     calculatedAllocationsForThisRow.push(record.allocated_type);
//                     return;
//                 }


//                 if (
//                     record &&
//                     record.status === "approved" &&
//                     !record.allocated_type
//                 ) {
//                     const targetAllocatedType = decideLeaveType(
//                         pools,
//                         leaveDay,
//                         dayjs(employee.joining_date),
//                         dbLeaves.filter(l => l.employee_id === employee.id),
//                         targetHalf as "1H" | "2H"
//                     );

//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });

//                     calculatedAllocationsForThisRow.push(targetAllocatedType);
//                     matchFound = true;
//                     return;
//                 }



//                 const targetAllocatedType = decideLeaveType(
//                     pools,
//                     leaveDay,
//                     dayjs(employee.joining_date),
//                     dbLeaves.filter(l => l.employee_id === employee.id),
//                     targetHalf as "1H" | "2H"
//                 );

//                 if (record && record.status === "Unauthorized_Leave") {

//                     matchFound = false;

//                     // Update the in-memory record immediately
//                     record.allocated_type = targetAllocatedType;

//                     leavesToUpdateWithAllocation.push({
//                         id: record.id,
//                         allocated_type: targetAllocatedType
//                     });
//                 } else {
//                     unauthorizedLeavesToInsert.push({

//                         employee_id: employee.id,
//                         employee_name: employee.full_name,
//                         department: employee.department,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         type: "Leave",
//                         allocated_type: targetAllocatedType,
//                         reason: "Auto-created from biometric",
//                         status: "Unauthorized_Leave",
//                         frozen: false
//                     });
//                     dbLeaves.push({
//                         id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//                         employee_id: employee.id,
//                         leave_date: item.leave_date,
//                         half: targetHalf,
//                         allocated_type: targetAllocatedType,
//                         status: "Unauthorized_Leave",
//                         frozen: false
//                     });

//                 }
//                 calculatedAllocationsForThisRow.push(targetAllocatedType);
//             };

//             if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
//                 const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
//                 const target = isFirstHalf ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id)
//                     .eq("frozen", false);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 // 🌟 IMPROVED: Using ArrayBuffer instead of binary string for better encoding support
//                 const workbook = XLSX.read(data, { type: "array", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("employee_code, is_permanently_daily, daily_wage_until")
//                     .eq("role", "staff");

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);
//                 // 👆 --------------------------------- 👆

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // Match employee code row header
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:"))
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // Locate date column
//                     let dateStr = "";
//                     for (const cell of row) {
//                         if (!cell) continue;

//                         if (cell instanceof Date) {
//                             dateStr = dayjs(cell).format("DD-MMM-YYYY");
//                             break;
//                         }

//                         const value = String(cell).trim();
//                         // 🌟 IMPROVED: Handles both single/double digit days (e.g., 1-Jan-2026 vs 01-Jan-2026)
//                         if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//                             dateStr = value;
//                             break;
//                         }
//                     }

//                     const isDateRow = Boolean(dateStr) && dayjs(dateStr).isValid();

//                   if (isDateRow && currentEmpCode) {
//     const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

//     const empRecord = dbEmployees?.find(
//         (emp) => String(emp.employee_code).trim() === currentEmpCode
//     );

//     if (empRecord) {
//         if (empRecord.is_permanently_daily) return;

//         // 🌟 HIGHLIGHTED CHANGE: Auto-transition Month Comparison Engine
//         // if (empRecord.daily_wage_until) {
//         //     // Converts "2026-07-31" into "2026-07-01"
//         //     const dailyWageLimitMonth = dayjs(empRecord.daily_wage_until).startOf("month");
//         //     // Converts current row date (e.g. "2026-07-10") into "2026-07-01"
//         //     const targetMonthStart = dayjs(standardizedDate).startOf("month");

//         //     // If the row month is July or earlier, it is skipped (daily wage rules apply).
//         //     // Once the row hits August 1st, targetMonthStart (Aug 1) IS after dailyWageLimitMonth (July 1).
//         //     // It will stop returning and process them normally as regular staff!
//         //     if (!targetMonthStart.isAfter(dailyWageLimitMonth)) {
//         //         return; 
//         //     }
//         // }
//     }
//                         let statusStr = "";

//                         // 🌟 IMPROVED: Dynamic status detection
//                         for (let i = 2; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (!cellVal) continue;

//                             const lower = cellVal.toLowerCase();
//                             if (
//                                 lower.includes("absent") ||
//                                 lower.includes("present") ||
//                                 lower.includes("weeklyoff") ||
//                                 lower.includes("no outpunch") ||
//                                 lower.includes("1/2") ||
//                                 lower.includes("½")
//                             ) {
//                                 statusStr = cellVal;
//                                 // Keep going if we hit standard 'present' to see if a more specific flag (like ½present) exists in later cells
//                                 if (lower !== "present") {
//                                     break;
//                                 }
//                             }
//                         }

//                         // const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         // Filter relevant non-full presence statuses
//                         if (
//                             lowerStatus.includes("absent") ||
//                             lowerStatus.includes("½present") ||
//                             lowerStatus.includes("half") ||
//                             lowerStatus.includes("1/2") ||
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };


//     // =============================================
//     // FREEZE BUTTON
//     // =============================================



//    const handleFreezeAllocation = async () => {
//     try {
//         setLoading(true);

//         // 1. Freeze all leave records
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .update({
//                 frozen: true,
//                 frozen_at: new Date().toISOString(),
//             })
//             .eq("frozen", false)
//             .select();

//         if (error) throw error;

//         // 2. Freeze all employee joining dates
//         const { error: employeeFreezeError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 joining_date_frozen: true,
//                 joining_date_frozen_at: new Date().toISOString(),
//             })
//             .eq("joining_date_frozen", false);

//         if (employeeFreezeError) throw employeeFreezeError;

//         message.success(
//             `${data?.length ?? 0} leave records and all employee joining dates frozen successfully 🔒`
//         );

//     } catch (err: any) {
//         console.error(err);
//         message.error(err.message || "Freeze failed");
//     } finally {
//         setLoading(false);
//     }
// };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave")
//                 .eq("frozen", false);

//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, full_name, employee_code, joining_date, is_permanently_daily, daily_wage_until")
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);



//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                         <Button
//                             type="primary"
//                             danger
//                             onClick={handleFreezeAllocation}
//                         >
//                             🔒 Freeze Leave Allocation
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//                                     {staffSummaries.map((staff) => (
//                                         <div key={staff.employee_code} style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             padding: "6px 0",
//                                             borderBottom: '1px solid #f0f0f0'
//                                         }}>
//                                             <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                                             <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                                             <div style={{ flex: 1 }}>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }















// ////////working code to match upload allocation and reallocation//////





// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// // Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
// const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
//     const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
//     return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
// };





// // 🌟 CHANGED: Pass the full employee object to check for daily wage restrictions
// // const decideLeaveType = (
// //     pools: any,
// //     leaveDay: dayjs.Dayjs,
// //     employee: any,
// //     allLeaves: any[],
// //     currentHalf: "1H" | "2H"
// // ): string => {

// //     const leaveMonth = leaveDay.month();
// //     const leaveYear = leaveDay.year();
// //     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

// // const joiningDate = employee.joining_date
// //     ? dayjs(employee.joining_date)
// //     : dayjs(0);

// // // -------------------------------------------------------------
// // // BEFORE JOINING DATE
// // // -------------------------------------------------------------
// // if (
// //     joiningDate.date() > 1 &&
// //     leaveDay.year() === joiningDate.year() &&
// //     leaveDay.month() === joiningDate.month()
// // ) {
// //     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// // }

// // // -------------------------------------------------------------
// // // DAILY WAGE JOINING MONTH
// // // Don't allocate CL/SL/EL during joining month
// // // Return empty string so no LOP is created.
// // // -------------------------------------------------------------
// // const joinedMidMonth =
// //     joiningDate.date() > 1 &&
// //     leaveDay.year() === joiningDate.year() &&
// //     leaveDay.month() === joiningDate.month();

// // if (joinedMidMonth) {
// //     return "";
// // }

// //     // -------------------------------------------------------------
// //     // HELPER
// //     // -------------------------------------------------------------
// //     const findAndConsumeSlot = (
// //         pool: any[],
// //         targetMonthIndex: number,
// //         targetYear: number,
// //         half: string
// //     ) => {
// //         return pool?.find((s: any) => {
// //             if (s.usedDate) return false;
// //             if (s.monthIndex !== targetMonthIndex) return false;
// //             if (s.half !== half) return false;

// //             const slotYear = s.year
// //                 ? parseInt(String(s.year), 10)
// //                 : null;

// //             if (slotYear !== null && slotYear !== targetYear)
// //                 return false;

// //             return true;
// //         });
// //     };

// //     // -------------------------------------------------------------
// //     // CASUAL
// //     // -------------------------------------------------------------
// //     if (pools.casual) {

// //         const sortedMonths = [...FINANCIAL_MONTHS]
// //             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
// //             .sort((a, b) =>
// //                 a.index === leaveMonth ? -1 :
// //                 b.index === leaveMonth ? 1 : 0
// //             );

// //         for (const m of sortedMonths) {

// //             const targetYear =
// //                 m.index < 3 && leaveMonth >= 3
// //                     ? leaveYear + 1
// //                     : (m.index >= 3 && leaveMonth < 3
// //                         ? leaveYear - 1
// //                         : leaveYear);

// //             const slot = findAndConsumeSlot(
// //                 pools.casual,
// //                 m.index,
// //                 targetYear,
// //                 currentHalf
// //             );

// //             if (slot) {
// //                 slot.usedDate = leaveDateStr;
// //                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //             }
// //         }
// //     }

// //     // -------------------------------------------------------------
// //     // SICK
// //     // -------------------------------------------------------------
// //     if (pools.sick) {

// //         const sortedMonths = [...FINANCIAL_MONTHS]
// //             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
// //             .sort((a, b) =>
// //                 a.index === leaveMonth ? -1 :
// //                 b.index === leaveMonth ? 1 : 0
// //             );

// //         for (const m of sortedMonths) {

// //             const targetYear =
// //                 m.index < 3 && leaveMonth >= 3
// //                     ? leaveYear + 1
// //                     : (m.index >= 3 && leaveMonth < 3
// //                         ? leaveYear - 1
// //                         : leaveYear);

// //             const slot = findAndConsumeSlot(
// //                 pools.sick,
// //                 m.index,
// //                 targetYear,
// //                 currentHalf
// //             );

// //             if (slot) {
// //                 slot.usedDate = leaveDateStr;
// //                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //             }
// //         }
// //     }

// //     // -------------------------------------------------------------
// //     // EARNED
// //     // -------------------------------------------------------------
// //     for (const m of FINANCIAL_MONTHS) {

// //         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth))
// //             break;

// //         const targetYear =
// //             m.index < 3 && leaveMonth >= 3
// //                 ? leaveYear + 1
// //                 : (m.index >= 3 && leaveMonth < 3
// //                     ? leaveYear - 1
// //                     : leaveYear);

// //         const monthStartDate = dayjs(
// //             `${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`
// //         );

// //         if (
// //     monthStartDate.endOf("month").isBefore(joiningDate)
// // ) {
// //     continue;
// // }

// //         if (
// //             pools.earned?.[m.index] &&
// //             pools.earned[m.index].available >
// //             pools.earned[m.index].taken
// //         ) {
// //             pools.earned[m.index].taken += 0.5;

// //             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
// //         }
// //     }

// //     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// // };




























// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     employee: any,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {

//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

//     const joiningDate = employee.joining_date
//         ? dayjs(employee.joining_date)
//         : dayjs(0);

//     // -------------------------------------------------------------
//     // DAILY WAGE JOINING MONTH FLAG
//     // Check solely if employee has daily wage joining month active
//     // -------------------------------------------------------------
//     const isDailyWageJoiningMonth = 
//         employee.is_daily_wage_joining_month === true || 
//         String(employee.is_daily_wage_joining_month) === "true";

//     // -------------------------------------------------------------
//     // BEFORE JOINING DATE (If leave date is literally before they joined)
//     // -------------------------------------------------------------
//     if (leaveDay.isBefore(joiningDate, "day")) {
//         return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
//     }

//     // -------------------------------------------------------------
//     // DAILY WAGE JOINING MONTH
//     // Don't allocate CL/SL/EL during joining month if flag is set.
//     // Return empty string so no regular leave/LOP is auto-created here.
//     // -------------------------------------------------------------
//     if (isDailyWageJoiningMonth) {
//         return "";
//     }

//     // -------------------------------------------------------------
//     // HELPER
//     // -------------------------------------------------------------
//     const findAndConsumeSlot = (
//         pool: any[],
//         targetMonthIndex: number,
//         targetYear: number,
//         half: string
//     ) => {
//         return pool?.find((s: any) => {
//             if (s.usedDate) return false;
//             if (s.monthIndex !== targetMonthIndex) return false;
//             if (s.half !== half) return false;

//             const slotYear = s.year
//                 ? parseInt(String(s.year), 10)
//                 : null;

//             if (slotYear !== null && slotYear !== targetYear)
//                 return false;

//             return true;
//         });
//     };

//     // -------------------------------------------------------------
//     // CASUAL
//     // -------------------------------------------------------------
//     if (pools.casual) {

//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) =>
//                 a.index === leaveMonth ? -1 :
//                 b.index === leaveMonth ? 1 : 0
//             );

//         for (const m of sortedMonths) {

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const slot = findAndConsumeSlot(
//                 pools.casual,
//                 m.index,
//                 targetYear,
//                 currentHalf
//             );

//             if (slot) {
//                 slot.usedDate = leaveDateStr;
//                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // SICK
//     // -------------------------------------------------------------
//     if (pools.sick) {

//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) =>
//                 a.index === leaveMonth ? -1 :
//                 b.index === leaveMonth ? 1 : 0
//             );

//         for (const m of sortedMonths) {

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const slot = findAndConsumeSlot(
//                 pools.sick,
//                 m.index,
//                 targetYear,
//                 currentHalf
//             );

//             if (slot) {
//                 slot.usedDate = leaveDateStr;
//                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // EARNED
//     // -------------------------------------------------------------
//     for (const m of FINANCIAL_MONTHS) {

//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             break;

//         const targetYear =
//             m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3
//                     ? leaveYear - 1
//                     : leaveYear);

//         const monthStartDate = dayjs(
//             `${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`
//         );

//         if (
//             monthStartDate.endOf("month").isBefore(joiningDate)
//         ) {
//             continue;
//         }

//         if (
//             pools.earned?.[m.index] &&
//             pools.earned[m.index].available >
//             pools.earned[m.index].taken
//         ) {
//             pools.earned[m.index].taken += 0.5;

//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };



























// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const [
//             leavesResult,
//             employeesResult,
//             creditsResult
//         ] = await Promise.all([
//             supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, employee_id, half, allocated_type, frozen")
//                 .in("status", ["approved", "Unauthorized_Leave", "taken"]),

//             supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, full_name, department, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month"), // 🌟 ADDED STATUS COLUMNS

//             supabase
//                 .schema("leave_management")
//                 .from("el_credits")
//                 .select("*")
//         ]);

//         if (leavesResult.error) throw leavesResult.error;
//         if (employeesResult.error) throw employeesResult.error;
//         if (creditsResult.error) throw creditsResult.error;

//         const dbLeaves = leavesResult.data || [];
//         const dbEmployees = employeesResult.data || [];
//         const dbCredits = creditsResult.data || [];


//         // =====================================================
//         // BUILD FAST LOOKUP MAPS
//         // =====================================================

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};

//         const employeeLeavesMap: Record<string, any[]> = {};

//         const totalLeaveMap: Record<string, any[]> = {};

//         const creditMap: Record<string, Record<number, number>> = {};


//         // =====================================================
//         // EMPLOYEE MAP
//         // =====================================================

//         for (const emp of dbEmployees) {

//             employeeMap[String(emp.employee_code).trim()] = emp;

//             employeeIdMap[emp.id] = emp;

//             employeeLeavesMap[emp.id] = [];
//         }


//         // =====================================================
//         // CREDIT MAP
//         // creditMap[employeeId][month]
//         // =====================================================

//         for (const credit of dbCredits) {

//             if (!credit.credit_date) continue;

//             const month = dayjs(credit.credit_date).month();

//             if (!creditMap[credit.employee_id]) {

//                 creditMap[credit.employee_id] = {};
//             }

//             creditMap[credit.employee_id][month] =
//                 (creditMap[credit.employee_id][month] || 0) +
//                 Number(credit.count || 0);
//         }


//         // =====================================================
//         // LEAVE MAPS
//         // =====================================================

//         for (const leave of dbLeaves) {

//             employeeLeavesMap[leave.employee_id].push(leave);

//             const emp = employeeIdMap[leave.employee_id];

//             if (!emp) continue;

//             const mapKey =
//                 `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;

//             if (!totalLeaveMap[mapKey]) {

//                 totalLeaveMap[mapKey] = [];
//             }

//             totalLeaveMap[mapKey].push(leave);
//         }


//         // =====================================================
//         // BUILD DYNAMIC POOLS
//         // =====================================================

//         const dynamicPoolCache: Record<string, any> = {};
// const endOfCalendarBoundary = dayjs().endOf("year");

// for (const emp of dbEmployees) {
//     if (!emp.joining_date) continue;

//     const joinDate = dayjs(emp.joining_date);
//     const casualPool: any[] = [];
//     const sickPool: any[] = [];

//     // 1. Determine the start of the financial year (April 1st) for the joining date
//     // If joining date is Jan-Mar (e.g. Feb 2026), financial year started April previous year (2025)
//     const joinYear = joinDate.year();
//     const joinMonth = joinDate.month(); // 0-indexed (0 = Jan, 3 = Apr)
//     const fyStartYear = joinMonth < 3 ? joinYear - 1 : joinYear;

//     let loopDate = dayjs(`${fyStartYear}-04-01`).startOf("month");

//     // Start loop from April 1st up to end of calendar year
//     while (
//         loopDate.isBefore(endOfCalendarBoundary) ||
//         loopDate.isSame(endOfCalendarBoundary, "month")
//     ) {
//         const mIdx = loopDate.month();
//         const year = loopDate.year();

//         // 2. Block the entire month if it is before the employee's joining month
//         const isBeforeJoiningMonth = loopDate.isBefore(joinDate, "month");
//         const blockedStatus = isBeforeJoiningMonth ? "BLOCKED_JOINING" : null;

//         casualPool.push(
//             {
//                 year,
//                 monthIndex: mIdx,
//                 half: "1H",
//                 usedDate: blockedStatus
//             },
//             {
//                 year,
//                 monthIndex: mIdx,
//                 half: "2H",
//                 usedDate: blockedStatus
//             }
//         );

//         sickPool.push(
//             {
//                 year,
//                 monthIndex: mIdx,
//                 half: "1H",
//                 usedDate: blockedStatus
//             },
//             {
//                 year,
//                 monthIndex: mIdx,
//                 half: "2H",
//                 usedDate: blockedStatus
//             }
//         );

//         loopDate = loopDate.add(1, "month");
//     }

//     const earnedMap: Record<number, { taken: number; available: number }> = {};

//     for (const m of FINANCIAL_MONTHS) {
//         const allocationMonth = dayjs().month(m.index);

//         if (allocationMonth.endOf("month").isBefore(joinDate)) {
//             earnedMap[m.index] = {
//                 taken: 0,
//                 available: 0
//             };
//             continue;
//         }

//         earnedMap[m.index] = {
//             taken: 0,
//             available: creditMap[emp.id]?.[m.index] || 0
//         };
//     }

//     const historicalTakenLeaves = (employeeLeavesMap[emp.id] || []).filter(
//         l => l.status === "approved" || l.status === "Unauthorized_Leave"
//     );

//     for (const leave of historicalTakenLeaves) {
//         if (!leave.allocated_type) continue;

//         const parts = leave.allocated_type.split("_");

//         if (leave.allocated_type.startsWith("casual")) {
//             const year = Number(parts[2]);
//             const month = Number(parts[3]) - 1;

//             const slot = casualPool.find(
//                 s =>
//                     s.year === year &&
//                     s.monthIndex === month &&
//                     s.half === leave.half
//             );

//             if (slot) slot.usedDate = leave.leave_date;
//         } else if (leave.allocated_type.startsWith("sick")) {
//             const year = Number(parts[2]);
//             const month = Number(parts[3]) - 1;

//             const slot = sickPool.find(
//                 s =>
//                     s.year === year &&
//                     s.monthIndex === month &&
//                     s.half === leave.half
//             );

//             if (slot) slot.usedDate = leave.leave_date;
//         } else if (leave.allocated_type.startsWith("earned")) {
//             const month = Number(parts[2]) - 1;

//             if (earnedMap[month]) {
//                 earnedMap[month].taken += 0.5;
//             }
//         }
//     }

//     dynamicPoolCache[emp.employee_code] = {
//         casual: casualPool,
//         sick: sickPool,
//         earned: earnedMap
//     };
// }


//        const leavesToUpdateWithAllocation: Array<{
//     id: string;
//     allocated_type: string | null;
// }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

// const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
// const leaveDay = dayjs(item.leave_date);
// const joiningDate = dayjs(employee.joining_date);

// let matchFound = false;
// let calculatedAllocationsForThisRow: (string | null)[] = [];

// // --------------------------------------------------
// // Skip entire joining month if joined after 1st
// // --------------------------------------------------
// // const skipJoiningMonth =
// //     joiningDate.date() > 1 &&
// //     leaveDay.year() === joiningDate.year() &&
// //     leaveDay.month() === joiningDate.month();

// // if (skipJoiningMonth) {

// //     // Clear any existing Unauthorized Leave allocation
// //     dbMatches
// //         .filter(
// //             r =>
// //                 r.status === "Unauthorized_Leave" &&
// //                 r.allocated_type
// //         )
// //         .forEach(r => {
// //             leavesToUpdateWithAllocation.push({
// //                 id: r.id,
// //                 allocated_type: ""
// //             });

// //             r.allocated_type = "";
// //         });

// //     return;
// // }









// // const processSlotAllocation = (targetHalf: "1H" | "2H") => {
// //     const record = dbMatches.find(m => m.half === targetHalf);
// //     const joiningDate = dayjs(employee.joining_date);

// //     // --------------------------------------------------
// //     // Mid-Month Joiner Flag
// //     // Joined after the 1st of the month AND leave date is in the joining month
// //     // --------------------------------------------------
// //     const isMidMonthJoiningMonth = 
// //         joiningDate.date() > 1 && 
// //         leaveDay.isSame(joiningDate, "month");

// //     // --------------------------------------------------
// //     // 1. Already approved with allocation
// //     // --------------------------------------------------
// //     if (
// //         record &&
// //         record.status === "approved" &&
// //         record.allocated_type
// //     ) {
// //         matchFound = true;
// //         calculatedAllocationsForThisRow.push(record.allocated_type);
// //         return;
// //     }

// //     // --------------------------------------------------
// //     // 2. Approved but allocation missing
// //     // --------------------------------------------------
// //     if (
// //         record &&
// //         record.status === "approved" &&
// //         !record.allocated_type
// //     ) {
// //         // If mid-month joiner in joining month, block SL/CL/EL. 
// //         // Set to "LOP" (or null if you want completely unassigned)
// //         const targetAllocatedType = isMidMonthJoiningMonth
// //             ? "LOP"  // 👈 Blocks SL/CL/EL and marks as LOP / Daily Wage
// //             : decideLeaveType(
// //                 pools,
// //                 leaveDay,
// //                 employee,
// //                 dbLeaves.filter(l => l.employee_id === employee.id),
// //                 targetHalf
// //             );

// //         if (!targetAllocatedType) return;

// //         record.allocated_type = targetAllocatedType;

// //         leavesToUpdateWithAllocation.push({
// //             id: record.id,
// //             allocated_type: targetAllocatedType
// //         });

// //         calculatedAllocationsForThisRow.push(targetAllocatedType);
// //         matchFound = true;
// //         return;
// //     }

// //     // --------------------------------------------------
// //     // 3. Auto-Allocation for Unauthorized / Biometric Absences
// //     // --------------------------------------------------
// //     const targetAllocatedType = isMidMonthJoiningMonth
// //         ? "LOP" // 👈 Forces LOP (Daily Wage treatment) during joining month
// //         : decideLeaveType(
// //             pools,
// //             leaveDay,
// //             employee,
// //             dbLeaves.filter(l => l.employee_id === employee.id),
// //             targetHalf
// //         );

// //     // Existing Unauthorized Leave record in DB
// //     if (
// //         record &&
// //         record.status === "Unauthorized_Leave"
// //     ) {
// //         if (targetAllocatedType !== null) {
// //             record.allocated_type = targetAllocatedType;
// //         }

// //         leavesToUpdateWithAllocation.push({
// //             id: record.id,
// //             allocated_type: targetAllocatedType
// //         });
// //     } 
// //     // Create new Unauthorized Leave
// //     else {
// //         if (!targetAllocatedType) return;

// //         unauthorizedLeavesToInsert.push({
// //             employee_id: employee.id,
// //             employee_name: employee.full_name,
// //             department: employee.department,
// //             leave_date: item.leave_date,
// //             half: targetHalf,
// //             type: "Leave",
// //             allocated_type: targetAllocatedType,
// //             reason: isMidMonthJoiningMonth 
// //                 ? "Auto-created: Mid-month joiner (Daily Wage / LOP)" 
// //                 : "Auto-created from biometric",
// //             status: "Unauthorized_Leave",
// //             frozen: false
// //         });

// //         dbLeaves.push({
// //             id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
// //             employee_id: employee.id,
// //             leave_date: item.leave_date,
// //             half: targetHalf,
// //             allocated_type: targetAllocatedType,
// //             status: "Unauthorized_Leave",
// //             frozen: false
// //         });
// //     }

// //     calculatedAllocationsForThisRow.push(targetAllocatedType);
// // };








// console.log("Employee Data:", {
//   id: employee?.id,
//   is_daily_wage_joining_month: employee?.is_daily_wage_joining_month
// });



// const processSlotAllocation = (targetHalf: "1H" | "2H") => {
//     const record = dbMatches.find(m => m.half === targetHalf);
//     const joiningDate = dayjs(employee.joining_date);

//     // --------------------------------------------------
//     // Mid-Month Joiner Flag
//     // Checks if staff joined after the 1st AND has the daily wage flag enabled
//     // --------------------------------------------------
//     const isMidMonthJoiningMonth = 
//         // joiningDate.date() > 1 && 
//         employee.is_daily_wage_joining_month === true;

//     // --------------------------------------------------
//     // 1. Already approved with allocation
//     // --------------------------------------------------
//     if (
//         record &&
//         record.status === "approved" &&
//         record.allocated_type
//     ) {
//         matchFound = true;
//         calculatedAllocationsForThisRow.push(record.allocated_type);
//         return;
//     }

//     // --------------------------------------------------
//     // 2. Approved but allocation missing
//     // --------------------------------------------------
//     if (
//         record &&
//         record.status === "approved" &&
//         !record.allocated_type
//     ) {
//         // If mid-month joiner with daily wage flag, set to "LOP". 
//         // Otherwise use standard leave allocation (CL/EL/SL/LOP).
//         const targetAllocatedType = isMidMonthJoiningMonth
//             ? "LOP"
//             : decideLeaveType(
//                 pools,
//                 leaveDay,
//                 employee,
//                 dbLeaves.filter(l => l.employee_id === employee.id),
//                 targetHalf
//             );

//         if (!targetAllocatedType) return;

//         record.allocated_type = targetAllocatedType;

//         leavesToUpdateWithAllocation.push({
//             id: record.id,
//             allocated_type: targetAllocatedType
//         });

//         calculatedAllocationsForThisRow.push(targetAllocatedType);
//         matchFound = true;
//         return;
//     }

//     // --------------------------------------------------
//     // 3. Auto-Allocation for Unauthorized / Biometric Absences
//     // --------------------------------------------------
//     const targetAllocatedType = isMidMonthJoiningMonth
//         ? "LOP"
//         : decideLeaveType(
//             pools,
//             leaveDay,
//             employee,
//             dbLeaves.filter(l => l.employee_id === employee.id),
//             targetHalf
//         );

//     // Existing Unauthorized Leave record in DB
//     if (
//         record &&
//         record.status === "Unauthorized_Leave"
//     ) {
//         if (targetAllocatedType !== null) {
//             record.allocated_type = targetAllocatedType;
//         }

//         leavesToUpdateWithAllocation.push({
//             id: record.id,
//             allocated_type: targetAllocatedType
//         });
//     } 
//     // Create new Unauthorized Leave
//     else {
//         if (!targetAllocatedType) return;

//         unauthorizedLeavesToInsert.push({
//             employee_id: employee.id,
//             employee_name: employee.full_name,
//             department: employee.department,
//             leave_date: item.leave_date,
//             half: targetHalf,
//             type: "Leave",
//             allocated_type: targetAllocatedType,
//             reason: isMidMonthJoiningMonth 
//                 ? "Auto-created: Mid-month joiner (Daily Wage / LOP)" 
//                 : "Auto-created from biometric",
//             status: "Unauthorized_Leave",
//             frozen: false
//         });

//         dbLeaves.push({
//             id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//             employee_id: employee.id,
//             leave_date: item.leave_date,
//             half: targetHalf,
//             allocated_type: targetAllocatedType,
//             status: "Unauthorized_Leave",
//             frozen: false
//         });
//     }

//     calculatedAllocationsForThisRow.push(targetAllocatedType);
// };
















//             if (isFullDayRow) {
//                 processSlotAllocation("1H");
//                 processSlotAllocation("2H");
//             } else {
//                 // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
//                 const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
//                 const target = isFirstHalf ? "1H" : "2H";
//                 processSlotAllocation(target);
//             }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id)
//                     .eq("frozen", false);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 // 🌟 IMPROVED: Using ArrayBuffer instead of binary string for better encoding support
//                 const workbook = XLSX.read(data, { type: "array", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("employee_code, is_permanently_daily, daily_wage_until, is_daily_wage_joining_month")
//                     .eq("role", "staff");

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);
//                 // 👆 --------------------------------- 👆

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // Match employee code row header
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:"))
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // Locate date column
//                     let dateStr = "";
//                     for (const cell of row) {
//                         if (!cell) continue;

//                         if (cell instanceof Date) {
//                             dateStr = dayjs(cell).format("DD-MMM-YYYY");
//                             break;
//                         }

//                         const value = String(cell).trim();
//                         // 🌟 IMPROVED: Handles both single/double digit days (e.g., 1-Jan-2026 vs 01-Jan-2026)
//                         if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//                             dateStr = value;
//                             break;
//                         }
//                     }

//                     const isDateRow = Boolean(dateStr) && dayjs(dateStr).isValid();

//                   if (isDateRow && currentEmpCode) {
//     const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

//     const empRecord = dbEmployees?.find(
//         (emp) => String(emp.employee_code).trim() === currentEmpCode
//     );

//     if (empRecord) {
//         if (empRecord.is_permanently_daily) return;

//         // 🌟 HIGHLIGHTED CHANGE: Auto-transition Month Comparison Engine
//         // if (empRecord.daily_wage_until) {
//         //     // Converts "2026-07-31" into "2026-07-01"
//         //     const dailyWageLimitMonth = dayjs(empRecord.daily_wage_until).startOf("month");
//         //     // Converts current row date (e.g. "2026-07-10") into "2026-07-01"
//         //     const targetMonthStart = dayjs(standardizedDate).startOf("month");

//         //     // If the row month is July or earlier, it is skipped (daily wage rules apply).
//         //     // Once the row hits August 1st, targetMonthStart (Aug 1) IS after dailyWageLimitMonth (July 1).
//         //     // It will stop returning and process them normally as regular staff!
//         //     if (!targetMonthStart.isAfter(dailyWageLimitMonth)) {
//         //         return; 
//         //     }
//         // }
//     }
//                         let statusStr = "";

//                         // 🌟 IMPROVED: Dynamic status detection
//                         for (let i = 2; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (!cellVal) continue;

//                             const lower = cellVal.toLowerCase();
//                             if (
//                                 lower.includes("absent") ||
//                                 lower.includes("present") ||
//                                 lower.includes("weeklyoff") ||
//                                 lower.includes("no outpunch") ||
//                                 lower.includes("1/2") ||
//                                 lower.includes("½")
//                             ) {
//                                 statusStr = cellVal;
//                                 // Keep going if we hit standard 'present' to see if a more specific flag (like ½present) exists in later cells
//                                 if (lower !== "present") {
//                                     break;
//                                 }
//                             }
//                         }

//                         // const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         // Filter relevant non-full presence statuses
//                         if (
//                             lowerStatus.includes("absent") ||
//                             lowerStatus.includes("½present") ||
//                             lowerStatus.includes("half") ||
//                             lowerStatus.includes("1/2") ||
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };


//     // =============================================
//     // FREEZE BUTTON
//     // =============================================



//    const handleFreezeAllocation = async () => {
//     try {
//         setLoading(true);

//         // 1. Freeze all leave records
//         const { data, error } = await supabase
//             .schema("leave_management")
//             .from("leaves")
//             .update({
//                 frozen: true,
//                 frozen_at: new Date().toISOString(),
//             })
//             .eq("frozen", false)
//             .select();

//         if (error) throw error;

//         // 2. Freeze all employee joining dates
//         const { error: employeeFreezeError } = await supabase
//             .schema("leave_management")
//             .from("employees")
//             .update({
//                 joining_date_frozen: true,
//                 joining_date_frozen_at: new Date().toISOString(),
//             })
//             .eq("joining_date_frozen", false);

//         if (employeeFreezeError) throw employeeFreezeError;

//         message.success(
//             `${data?.length ?? 0} leave records and all employee joining dates frozen successfully 🔒`
//         );

//     } catch (err: any) {
//         console.error(err);
//         message.error(err.message || "Freeze failed");
//     } finally {
//         setLoading(false);
//     }
// };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave")
//                 .eq("frozen", false);

//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, full_name, employee_code, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month")
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);



//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                         <Button
//                             type="primary"
//                             danger
//                             onClick={handleFreezeAllocation}
//                         >
//                             🔒 Freeze Leave Allocation
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//                                     {staffSummaries.map((staff) => (
//                                         <div key={staff.employee_code} style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             padding: "6px 0",
//                                             borderBottom: '1px solid #f0f0f0'
//                                         }}>
//                                             <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                                             <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                                             <div style={{ flex: 1 }}>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }















// ////////working code perfectly on 20-08-2026//////




"use client";

import { useState } from "react";
import {
    Upload,
    Button,
    Table,
    Card,
    Tag,
    message,
    Space,
    Typography,
    Alert,
    Statistic,
    Row,
    Col,
    List,
} from "antd";
import {
    UploadOutlined,
    AlertOutlined,
    UserDeleteOutlined,
    InfoCircleOutlined,
    UserOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import type { RcFile } from "antd/es/upload/interface";

const { Title, Text } = Typography;

const FINANCIAL_MONTHS = [
    { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
    { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
    { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
    { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
];

interface DiscrepancyRow {
    key: string;
    employee_code: string;
    full_name: string;
    leave_date: string;
    leave_id: string;
    excel_status: string;
    db_status: string;
    allocated_type: string;
    is_match: boolean;
    issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
}

interface StaffSummary {
    employee_code: string;
    full_name: string;
    total_leaves: number;
}

interface LeaveSlot {
    year: number;
    monthIndex: number;
    half: "1H" | "2H";
    usedDate: string | null;
}

// Helper to determine if financial month A comes before or is equal to financial month B (Apr -> Mar cycle)
const isFinancialMonthBeforeOrSame = (checkMonthIdx: number, leaveMonthIdx: number): boolean => {
    const getFinancialOrder = (m: number) => (m >= 3 ? m - 3 : m + 9);
    return getFinancialOrder(checkMonthIdx) <= getFinancialOrder(leaveMonthIdx);
};





// 🌟 CHANGED: Pass the full employee object to check for daily wage restrictions
// const decideLeaveType = (
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     employee: any,
//     allLeaves: any[],
//     currentHalf: "1H" | "2H"
// ): string => {

//     const leaveMonth = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveDateStr = leaveDay.format("YYYY-MM-DD");

// const joiningDate = employee.joining_date
//     ? dayjs(employee.joining_date)
//     : dayjs(0);

// // -------------------------------------------------------------
// // BEFORE JOINING DATE
// // -------------------------------------------------------------
// if (
//     joiningDate.date() > 1 &&
//     leaveDay.year() === joiningDate.year() &&
//     leaveDay.month() === joiningDate.month()
// ) {
//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// }

// // -------------------------------------------------------------
// // DAILY WAGE JOINING MONTH
// // Don't allocate CL/SL/EL during joining month
// // Return empty string so no LOP is created.
// // -------------------------------------------------------------
// const joinedMidMonth =
//     joiningDate.date() > 1 &&
//     leaveDay.year() === joiningDate.year() &&
//     leaveDay.month() === joiningDate.month();

// if (joinedMidMonth) {
//     return "";
// }

//     // -------------------------------------------------------------
//     // HELPER
//     // -------------------------------------------------------------
//     const findAndConsumeSlot = (
//         pool: any[],
//         targetMonthIndex: number,
//         targetYear: number,
//         half: string
//     ) => {
//         return pool?.find((s: any) => {
//             if (s.usedDate) return false;
//             if (s.monthIndex !== targetMonthIndex) return false;
//             if (s.half !== half) return false;

//             const slotYear = s.year
//                 ? parseInt(String(s.year), 10)
//                 : null;

//             if (slotYear !== null && slotYear !== targetYear)
//                 return false;

//             return true;
//         });
//     };

//     // -------------------------------------------------------------
//     // CASUAL
//     // -------------------------------------------------------------
//     if (pools.casual) {

//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) =>
//                 a.index === leaveMonth ? -1 :
//                 b.index === leaveMonth ? 1 : 0
//             );

//         for (const m of sortedMonths) {

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const slot = findAndConsumeSlot(
//                 pools.casual,
//                 m.index,
//                 targetYear,
//                 currentHalf
//             );

//             if (slot) {
//                 slot.usedDate = leaveDateStr;
//                 return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // SICK
//     // -------------------------------------------------------------
//     if (pools.sick) {

//         const sortedMonths = [...FINANCIAL_MONTHS]
//             .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             .sort((a, b) =>
//                 a.index === leaveMonth ? -1 :
//                 b.index === leaveMonth ? 1 : 0
//             );

//         for (const m of sortedMonths) {

//             const targetYear =
//                 m.index < 3 && leaveMonth >= 3
//                     ? leaveYear + 1
//                     : (m.index >= 3 && leaveMonth < 3
//                         ? leaveYear - 1
//                         : leaveYear);

//             const slot = findAndConsumeSlot(
//                 pools.sick,
//                 m.index,
//                 targetYear,
//                 currentHalf
//             );

//             if (slot) {
//                 slot.usedDate = leaveDateStr;
//                 return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//             }
//         }
//     }

//     // -------------------------------------------------------------
//     // EARNED
//     // -------------------------------------------------------------
//     for (const m of FINANCIAL_MONTHS) {

//         if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//             break;

//         const targetYear =
//             m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3
//                     ? leaveYear - 1
//                     : leaveYear);

//         const monthStartDate = dayjs(
//             `${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`
//         );

//         if (
//     monthStartDate.endOf("month").isBefore(joiningDate)
// ) {
//     continue;
// }

//         if (
//             pools.earned?.[m.index] &&
//             pools.earned[m.index].available >
//             pools.earned[m.index].taken
//         ) {
//             pools.earned[m.index].taken += 0.5;

//             return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }

//     return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
// };




























const decideLeaveType = (
    pools: any,
    leaveDay: dayjs.Dayjs,
    employee: any,
    allLeaves: any[],
    currentHalf: "1H" | "2H"
): string => {

    const leaveMonth = leaveDay.month();
    const leaveYear = leaveDay.year();
    const leaveDateStr = leaveDay.format("YYYY-MM-DD");

    const joiningDate = employee.joining_date
        ? dayjs(employee.joining_date)
        : dayjs(0);

    // -------------------------------------------------------------
    // DAILY WAGE JOINING MONTH FLAG
    // Check solely if employee has daily wage joining month active
    // -------------------------------------------------------------
    const isDailyWageJoiningMonth =
        employee.is_daily_wage_joining_month === true ||
        String(employee.is_daily_wage_joining_month) === "true";

    // -------------------------------------------------------------
    // BEFORE JOINING DATE (If leave date is literally before they joined)
    // -------------------------------------------------------------
    if (leaveDay.isBefore(joiningDate, "day")) {
        return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
    }

    // -------------------------------------------------------------
    // DAILY WAGE JOINING MONTH
    // Don't allocate CL/SL/EL during joining month if flag is set.
    // Return empty string so no regular leave/LOP is auto-created here.
    // -------------------------------------------------------------
const dailyWageUntil = employee.daily_wage_until
    ? dayjs(employee.daily_wage_until).endOf("month")
    : null;

// Any leave falling within the daily wage period
if (
    isDailyWageJoiningMonth &&
    dailyWageUntil &&
    (
        leaveDay.isBefore(dailyWageUntil, "day") ||
        leaveDay.isSame(dailyWageUntil, "day")
    )
) {
    // No CL / SL / EL / LOP
    return "";
}

    // -------------------------------------------------------------
    // HELPER
    // -------------------------------------------------------------
    const findAndConsumeSlot = (
        pool: any[],
        targetMonthIndex: number,
        targetYear: number,
        half: string
    ) => {
        return pool?.find((s: any) => {
            if (s.usedDate) return false;
            if (s.monthIndex !== targetMonthIndex) return false;
            if (s.half !== half) return false;

            const slotYear = s.year
                ? parseInt(String(s.year), 10)
                : null;

            if (slotYear !== null && slotYear !== targetYear)
                return false;

            return true;
        });
    };

    // -------------------------------------------------------------
    // CASUAL
    // -------------------------------------------------------------
    if (pools.casual) {

        const sortedMonths = [...FINANCIAL_MONTHS]
            .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
            .sort((a, b) =>
                a.index === leaveMonth ? -1 :
                    b.index === leaveMonth ? 1 : 0
            );

        for (const m of sortedMonths) {

            const targetYear =
                m.index < 3 && leaveMonth >= 3
                    ? leaveYear + 1
                    : (m.index >= 3 && leaveMonth < 3
                        ? leaveYear - 1
                        : leaveYear);

            const slot = findAndConsumeSlot(
                pools.casual,
                m.index,
                targetYear,
                currentHalf
            );

            if (slot) {
                slot.usedDate = leaveDateStr;
                return `casual_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
            }
        }
    }

    // -------------------------------------------------------------
    // SICK
    // -------------------------------------------------------------
    // if (pools.sick) {

    //     const sortedMonths = [...FINANCIAL_MONTHS]
    //         .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
    //         .sort((a, b) =>
    //             a.index === leaveMonth ? -1 :
    //                 b.index === leaveMonth ? 1 : 0
    //         );

    //     for (const m of sortedMonths) {

    //         const targetYear =
    //             m.index < 3 && leaveMonth >= 3
    //                 ? leaveYear + 1
    //                 : (m.index >= 3 && leaveMonth < 3
    //                     ? leaveYear - 1
    //                     : leaveYear);

    //         const slot = findAndConsumeSlot(
    //             pools.sick,
    //             m.index,
    //             targetYear,
    //             currentHalf
    //         );

    //         if (slot) {
    //             slot.usedDate = leaveDateStr;
    //             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
    //         }
    //     }
    // }








// if (pools.sick) {

//     const sortedMonths = [...FINANCIAL_MONTHS]
//         .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
//         .sort((a, b) =>
//             a.index === leaveMonth ? -1 :
//             b.index === leaveMonth ? 1 : 0
//         );

//     for (const m of sortedMonths) {

//         const targetYear =
//             m.index < 3 && leaveMonth >= 3
//                 ? leaveYear + 1
//                 : (m.index >= 3 && leaveMonth < 3
//                     ? leaveYear - 1
//                     : leaveYear);

//         // ================= DEBUG =================
//         console.log("BEFORE", {
//             leaveDate: leaveDateStr,
//             currentHalf,
//             month: m.name,
//             slots: (pools.sick as LeaveSlot[])
//                 .filter((s: LeaveSlot) =>
//                     s.monthIndex === m.index &&
//                     s.year === targetYear
//                 )
//                 .map((s: LeaveSlot) => ({
//                     half: s.half,
//                     usedDate: s.usedDate
//                 }))
//         });

//         // Try requested half first
//         let slot = findAndConsumeSlot(
//             pools.sick,
//             m.index,
//             targetYear,
//             currentHalf
//         );

//         console.log(
//     "Looking for",
//     {
//         month: m.name,
//         targetYear,
//         targetHalf: currentHalf,
//         available: pools.sick.filter((s: any) => s.monthIndex === m.index)
//     }
// );

//         // If not available, try the opposite half
//         if (!slot) {

//             slot = findAndConsumeSlot(
//                 pools.sick,
//                 m.index,
//                 targetYear,
//                 currentHalf === "1H" ? "2H" : "1H"
//             );

//             console.log("Opposite Half Result", slot);
//         }

//         if (slot) {

//             slot.usedDate = leaveDateStr;

//             console.log("AFTER", {
//                 leaveDate: leaveDateStr,
//                 allocatedHalf: slot.half,
//                 slots: (pools.sick as LeaveSlot[])
//                     .filter((s: LeaveSlot) =>
//                         s.monthIndex === m.index &&
//                         s.year === targetYear
//                     )
//                     .map((s: LeaveSlot) => ({
//                         half: s.half,
//                         usedDate: s.usedDate
//                     }))
//             });

//             return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
//         }
//     }
// }










if (pools.sick) {

    const sortedMonths = [...FINANCIAL_MONTHS]
        .filter(m => isFinancialMonthBeforeOrSame(m.index, leaveMonth))
        .sort((a, b) =>
            a.index === leaveMonth ? -1 :
            b.index === leaveMonth ? 1 : 0
        );

    for (const m of sortedMonths) {

        const targetYear =
            m.index < 3 && leaveMonth >= 3
                ? leaveYear + 1
                : (m.index >= 3 && leaveMonth < 3
                    ? leaveYear - 1
                    : leaveYear);

        // ONLY SAME HALF
        const slot = findAndConsumeSlot(
            pools.sick,
            m.index,
            targetYear,
            currentHalf
        );

        if (slot) {
            slot.usedDate = leaveDateStr;

            return `sick_allocated_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
        }
    }
}



    // -------------------------------------------------------------
    // EARNED
    // -------------------------------------------------------------
    for (const m of FINANCIAL_MONTHS) {

        if (!isFinancialMonthBeforeOrSame(m.index, leaveMonth))
            break;

        const targetYear =
            m.index < 3 && leaveMonth >= 3
                ? leaveYear + 1
                : (m.index >= 3 && leaveMonth < 3
                    ? leaveYear - 1
                    : leaveYear);

        const monthStartDate = dayjs(
            `${targetYear}-${String(m.index + 1).padStart(2, "0")}-01`
        );

        if (
            monthStartDate.endOf("month").isBefore(joiningDate)
        ) {
            continue;
        }

        if (
            pools.earned?.[m.index] &&
            pools.earned[m.index].available >
            pools.earned[m.index].taken
        ) {
            pools.earned[m.index].taken += 0.5;

            return `earned_${targetYear}_${String(m.index + 1).padStart(2, "0")}`;
        }
    }

    return `lop_${leaveYear}_${String(leaveMonth + 1).padStart(2, "0")}`;
};


























export default function VerifyAttendancePage() {
    const [loading, setLoading] = useState(false);
    const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
    const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
    const [fileUploaded, setFileUploaded] = useState(false);

    const [summaryStats, setSummaryStats] = useState({
        totalRows: 0,
        matchedCount: 0,
        unauthorizedCreated: 0,
        invalidCodes: 0,
    });

    // ==========================================
    // CORE POOL BUILDER & ENGINE RUNNER
    // ==========================================
    const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
        // Fetch all base data arrays
        const [
            leavesResult,
            employeesResult,
            creditsResult
        ] = await Promise.all([
            supabase
                .schema("leave_management")
                .from("leaves")
                .select("id, leave_date, status, employee_id, half, allocated_type, frozen")
                .in("status", ["approved", "Unauthorized_Leave", "taken"]),

            supabase
                .schema("leave_management")
                .from("employees")
                .select("id, employee_code, full_name, department, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month"), // 🌟 ADDED STATUS COLUMNS

            supabase
                .schema("leave_management")
                .from("el_credits")
                .select("*")
        ]);

        if (leavesResult.error) throw leavesResult.error;
        if (employeesResult.error) throw employeesResult.error;
        if (creditsResult.error) throw creditsResult.error;

        const dbLeaves = leavesResult.data || [];
        const dbEmployees = employeesResult.data || [];
        const dbCredits = creditsResult.data || [];


// // =====================================================
// // DEBUG - PREVIOUS MONTHS WITH BLANK ALLOCATION
// // =====================================================

// const uploadedMonth = rawAbsentAndHalfPresentList.length
//     ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).month()
//     : dayjs().month();

// const uploadedYear = rawAbsentAndHalfPresentList.length
//     ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).year()
//     : dayjs().year();

// console.log("========================================");
// console.log("UPLOAD INFORMATION");
// console.log("Uploaded Date :", rawAbsentAndHalfPresentList[0]?.leave_date);
// console.log("Uploaded Month:", uploadedMonth);
// console.log("Uploaded Year :", uploadedYear);
// console.log("Total DB Leaves:", dbLeaves.length);
// console.log("========================================");

// console.table(
//     dbLeaves
//         .filter(l => {

//             const leaveMonth = dayjs(l.leave_date).month();
//             const leaveYear = dayjs(l.leave_date).year();

//             return (
//                 (
//                     !l.allocated_type ||
//                     String(l.allocated_type).trim() === ""
//                 ) &&
//                 leaveMonth < uploadedMonth &&
//                 leaveYear === uploadedYear &&
//                 (
//                     l.status === "approved" ||
//                     l.status === "Unauthorized_Leave"
//                 )
//             );
//         })
//         .map((l, index) => {

//             const emp = dbEmployees.find(e => e.id === l.employee_id);

//             return {
//                 Row: index + 1,
//                 Employee: emp?.full_name,
//                 Code: emp?.employee_code,
//                 Date: l.leave_date,
//                 Half: l.half,
//                 Status: l.status
//             };
//         })
// );
// const previousBlankAllocations = dbLeaves
//     .filter(l => {

//         const leaveMonth = dayjs(l.leave_date).month();
//         const leaveYear = dayjs(l.leave_date).year();

//         return (
//             (
//                 !l.allocated_type ||
//                 String(l.allocated_type).trim() === ""
//             ) &&
//             leaveYear === uploadedYear &&
//             leaveMonth < uploadedMonth &&
//             (
//                 l.status === "approved" ||
//                 l.status === "Unauthorized_Leave"
//             )
//         );
//     })
//     .map(l => {

//         const emp = dbEmployees.find(e => e.id === l.employee_id);

//         return {
//             employee_name: emp?.full_name,
//             employee_code: emp?.employee_code,
//             employee_id: l.employee_id,

//             leave_date: l.leave_date,
//             month: dayjs(l.leave_date).month() + 1,
//             year: dayjs(l.leave_date).year(),

//             allocated_type: l.allocated_type,
//             half: l.half,
//             status: l.status
//         };
//     });

// console.log("========================================");
// console.log("PREVIOUS MONTH BLANK ALLOCATIONS");
// console.table(previousBlankAllocations);
// console.log("Total Found:", previousBlankAllocations.length);
// console.log("========================================");









        // =====================================================
        // BUILD FAST LOOKUP MAPS
        // =====================================================

        const employeeMap: Record<string, any> = {};
        const employeeIdMap: Record<string, any> = {};

        const employeeLeavesMap: Record<string, any[]> = {};

        const totalLeaveMap: Record<string, any[]> = {};

        const creditMap: Record<string, Record<number, number>> = {};


        // =====================================================
        // EMPLOYEE MAP
        // =====================================================

        for (const emp of dbEmployees) {

            employeeMap[String(emp.employee_code).trim()] = emp;

            employeeIdMap[emp.id] = emp;

            employeeLeavesMap[emp.id] = [];
        }


        // =====================================================
        // CREDIT MAP
        // creditMap[employeeId][month]
        // =====================================================

        for (const credit of dbCredits) {

            if (!credit.credit_date) continue;

            const month = dayjs(credit.credit_date).month();

            if (!creditMap[credit.employee_id]) {

                creditMap[credit.employee_id] = {};
            }

            creditMap[credit.employee_id][month] =
                (creditMap[credit.employee_id][month] || 0) +
                Number(credit.count || 0);
        }

// console.log(
//     creditMap["59d28d55-f130-4f0b-95d0-e83f66c0aa9a"]
// );


        // =====================================================
        // LEAVE MAPS
        // =====================================================

        for (const leave of dbLeaves) {

            employeeLeavesMap[leave.employee_id].push(leave);

            const emp = employeeIdMap[leave.employee_id];

            if (!emp) continue;

            const mapKey =
                `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;

            if (!totalLeaveMap[mapKey]) {

                totalLeaveMap[mapKey] = [];
            }

            totalLeaveMap[mapKey].push(leave);
        }


        // =====================================================
        // BUILD DYNAMIC POOLS
        // =====================================================

        const dynamicPoolCache: Record<string, any> = {};
        const endOfCalendarBoundary = dayjs().endOf("year");

        for (const emp of dbEmployees) {
            if (!emp.joining_date) continue;

            const joinDate = dayjs(emp.joining_date);
            const casualPool: any[] = [];
            const sickPool: any[] = [];

            // 1. Determine the start of the financial year (April 1st) for the joining date
            // If joining date is Jan-Mar (e.g. Feb 2026), financial year started April previous year (2025)
            const joinYear = joinDate.year();
            const joinMonth = joinDate.month(); // 0-indexed (0 = Jan, 3 = Apr)
            const fyStartYear = joinMonth < 3 ? joinYear - 1 : joinYear;

            let loopDate = dayjs(`${fyStartYear}-04-01`).startOf("month");

            // Start loop from April 1st up to end of calendar year
            while (
                loopDate.isBefore(endOfCalendarBoundary) ||
                loopDate.isSame(endOfCalendarBoundary, "month")
            ) {
                const mIdx = loopDate.month();
                const year = loopDate.year();

                // 2. Block the entire month if it is before the employee's joining month
                // Last month that should be blocked
// -------------------------------------------------------------
// 1. Block months before the employee joined
// -------------------------------------------------------------
const isBeforeJoiningMonth = loopDate.isBefore(joinDate, "month");

// -------------------------------------------------------------
// 2. Daily Wage Joining Month
// -------------------------------------------------------------
const isDailyWageJoiningMonth =
    emp.is_daily_wage_joining_month === true ||
    String(emp.is_daily_wage_joining_month) === "true";

const dailyWageUntil = emp.daily_wage_until
    ? dayjs(emp.daily_wage_until).endOf("month")
    : null;

const isDailyWageBlocked =
    isDailyWageJoiningMonth &&
    dailyWageUntil &&
    (
        loopDate.isBefore(dailyWageUntil, "month") ||
        loopDate.isSame(dailyWageUntil, "month")
    );

// -------------------------------------------------------------
// Final Blocking
// -------------------------------------------------------------
const blockedStatus =
    (isBeforeJoiningMonth || isDailyWageBlocked)
        ? "BLOCKED"
        : null;





                casualPool.push(
                    {
                        year,
                        monthIndex: mIdx,
                        half: "1H",
                        usedDate: blockedStatus
                    },
                    {
                        year,
                        monthIndex: mIdx,
                        half: "2H",
                        usedDate: blockedStatus
                    }
                );

                sickPool.push(
                    {
                        year,
                        monthIndex: mIdx,
                        half: "1H",
                        usedDate: blockedStatus
                    },
                    {
                        year,
                        monthIndex: mIdx,
                        half: "2H",
                        usedDate: blockedStatus
                    }
                );

                loopDate = loopDate.add(1, "month");
            }

            const earnedMap: Record<number, { taken: number; available: number }> = {};

            for (const m of FINANCIAL_MONTHS) {
                // const allocationMonth = dayjs().month(m.index);
                    const allocationMonth = dayjs(`${fyStartYear}-${String(m.index + 1).padStart(2,"0")}-01`);


               const isDailyWageJoiningMonth =
    emp.is_daily_wage_joining_month === true ||
    String(emp.is_daily_wage_joining_month) === "true";

const dailyWageUntil = emp.daily_wage_until
    ? dayjs(emp.daily_wage_until).endOf("month")
    : null;

if (
    isDailyWageJoiningMonth &&
    dailyWageUntil &&
    (
        allocationMonth.isBefore(dailyWageUntil, "month") ||
        allocationMonth.isSame(dailyWageUntil, "month")
    )
) {
    earnedMap[m.index] = {
        taken: 0,
        available: 0
    };
    continue;
} 
// console.log({
//     employee: emp.employee_code,
//     empId: emp.id,
//     month: m.name,
//     monthIndex: m.index,
//     creditMapForEmployee: creditMap[emp.id],
//     monthCredit: creditMap[emp.id]?.[m.index]
// });
                earnedMap[m.index] = {
                    taken: 0,
                    available: creditMap[emp.id]?.[m.index] || 0
                };

//                             console.log(
//     "EarnedMap Build",
//     emp.employee_code,
//     m.name,
//     creditMap[emp.id]?.[m.index],
//     earnedMap[m.index]
// );
            }



            const historicalTakenLeaves = (employeeLeavesMap[emp.id] || []).filter(
                l => l.status === "approved" || l.status === "Unauthorized_Leave"
            );

            for (const leave of historicalTakenLeaves) {
                if (!leave.allocated_type) continue;

                const parts = leave.allocated_type.split("_");

                if (leave.allocated_type.startsWith("casual")) {
                    const year = Number(parts[2]);
                    const month = Number(parts[3]) - 1;

                    const slot = casualPool.find(
                        s =>
                            s.year === year &&
                            s.monthIndex === month &&
                            s.half === leave.half
                    );

                    if (slot) slot.usedDate = leave.leave_date;
                } else if (leave.allocated_type.startsWith("sick")) {
                    const year = Number(parts[2]);
                    const month = Number(parts[3]) - 1;

                    const slot = sickPool.find(
                        s =>
                            s.year === year &&
                            s.monthIndex === month &&
                            s.half === leave.half
                    );

                    if (slot) slot.usedDate = leave.leave_date;
                } else if (leave.allocated_type.startsWith("earned")) {
                    const month = Number(parts[2]) - 1;

                    if (earnedMap[month]) {
                        earnedMap[month].taken += 0.5;
                    }
                }
            }

            dynamicPoolCache[emp.employee_code] = {
                casual: casualPool,
                sick: sickPool,
                earned: earnedMap
            };

        }






const uploadedMonth = rawAbsentAndHalfPresentList.length
    ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).month()
    : dayjs().month();

const uploadedYear = rawAbsentAndHalfPresentList.length
    ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).year()
    : dayjs().year();

console.log("========== UNUSED CL / SL SLOTS ==========");

const unusedSlots: any[] = [];

Object.entries(dynamicPoolCache).forEach(([empCode, pools]: any) => {

    const emp = dbEmployees.find(
        e => String(e.employee_code).trim() === String(empCode).trim()
    );

    ["casual", "sick"].forEach(type => {

        pools[type]
            .filter((slot: LeaveSlot) => {

                const slotFinancialOrder =
                    slot.monthIndex >= 3
                        ? slot.monthIndex - 3
                        : slot.monthIndex + 9;

                const uploadedFinancialOrder =
                    uploadedMonth >= 3
                        ? uploadedMonth - 3
                        : uploadedMonth + 9;

                return (
                    slot.usedDate === null &&
                    slot.year === uploadedYear &&
                    slotFinancialOrder <= uploadedFinancialOrder
                );

            })
            .forEach((slot: LeaveSlot) => {

                unusedSlots.push({
                    Employee: emp?.full_name ?? "",
                    EmployeeCode: emp?.employee_code ?? "",
                    LeaveType: type.toUpperCase(),
                    Month: FINANCIAL_MONTHS.find(
                        m => m.index === slot.monthIndex
                    )?.name,
                    Year: slot.year,
                    Half: slot.half
                });

            });

    });

});

// Sort nicely before printing
unusedSlots.sort((a, b) =>
    a.Employee.localeCompare(b.Employee) ||
    a.LeaveType.localeCompare(b.LeaveType) ||
    FINANCIAL_MONTHS.findIndex(m => m.name === a.Month) -
    FINANCIAL_MONTHS.findIndex(m => m.name === b.Month) ||
    a.Half.localeCompare(b.Half)
);

// Only ONE table
console.table(unusedSlots);

console.log("Total Unused Slots:", unusedSlots.length);
console.log("==========================================");


        const leavesToUpdateWithAllocation: Array<{
            id: string;
            allocated_type: string | null;
        }> = [];
        const unauthorizedLeavesToInsert: any[] = [];
        const finalRows: DiscrepancyRow[] = [];
        const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

        let matchedCounter = 0;
        let unauthorizedCounter = 0;
        let invalidCodeCounter = 0;

        const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
            const status = item.excel_status.toLowerCase();
            return !status.includes("½present") && !status.includes("1/2");
        });
        const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
            const status = item.excel_status.toLowerCase();
            return status.includes("½present") || status.includes("1/2");
        });
        const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

        orderedLeaves.forEach((item, index) => {
            if (!item.employee_code || !item.leave_date) return;

            const empCode = String(item.employee_code).trim();
            const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
            const pools = dynamicPoolCache[empCode];

            const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
            const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

            if (!staffLeaveCounter[empCode]) {
                staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
            }
            staffLeaveCounter[empCode].count += incrementalWeight;

            if (!employee || !pools) {
                invalidCodeCounter++;
                finalRows.push({
                    key: `err-${index}`,
                    leave_id: "N/A",
                    employee_code: empCode,
                    full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
                    leave_date: item.leave_date,
                    excel_status: item.excel_status,
                    db_status: "Rejected / Skipped",
                    allocated_type: "NONE",
                    is_match: false,
                    issue_type: "INVALID_EMP_CODE",
                });
                return;
            }

            const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
            const leaveDay = dayjs(item.leave_date);
            const joiningDate = dayjs(employee.joining_date);

            let matchFound = false;
            let calculatedAllocationsForThisRow: (string | null)[] = [];

            // --------------------------------------------------
            // Skip entire joining month if joined after 1st
            // --------------------------------------------------
            // const skipJoiningMonth =
            //     joiningDate.date() > 1 &&
            //     leaveDay.year() === joiningDate.year() &&
            //     leaveDay.month() === joiningDate.month();

            // if (skipJoiningMonth) {

            //     // Clear any existing Unauthorized Leave allocation
            //     dbMatches
            //         .filter(
            //             r =>
            //                 r.status === "Unauthorized_Leave" &&
            //                 r.allocated_type
            //         )
            //         .forEach(r => {
            //             leavesToUpdateWithAllocation.push({
            //                 id: r.id,
            //                 allocated_type: ""
            //             });

            //             r.allocated_type = "";
            //         });

            //     return;
            // }









            // const processSlotAllocation = (targetHalf: "1H" | "2H") => {
            //     const record = dbMatches.find(m => m.half === targetHalf);
            //     const joiningDate = dayjs(employee.joining_date);

            //     // --------------------------------------------------
            //     // Mid-Month Joiner Flag
            //     // Joined after the 1st of the month AND leave date is in the joining month
            //     // --------------------------------------------------
            //     const isMidMonthJoiningMonth = 
            //         joiningDate.date() > 1 && 
            //         leaveDay.isSame(joiningDate, "month");

            //     // --------------------------------------------------
            //     // 1. Already approved with allocation
            //     // --------------------------------------------------
            //     if (
            //         record &&
            //         record.status === "approved" &&
            //         record.allocated_type
            //     ) {
            //         matchFound = true;
            //         calculatedAllocationsForThisRow.push(record.allocated_type);
            //         return;
            //     }

            //     // --------------------------------------------------
            //     // 2. Approved but allocation missing
            //     // --------------------------------------------------
            //     if (
            //         record &&
            //         record.status === "approved" &&
            //         !record.allocated_type
            //     ) {
            //         // If mid-month joiner in joining month, block SL/CL/EL. 
            //         // Set to "LOP" (or null if you want completely unassigned)
            //         const targetAllocatedType = isMidMonthJoiningMonth
            //             ? "LOP"  // 👈 Blocks SL/CL/EL and marks as LOP / Daily Wage
            //             : decideLeaveType(
            //                 pools,
            //                 leaveDay,
            //                 employee,
            //                 dbLeaves.filter(l => l.employee_id === employee.id),
            //                 targetHalf
            //             );

            //         if (!targetAllocatedType) return;

            //         record.allocated_type = targetAllocatedType;

            //         leavesToUpdateWithAllocation.push({
            //             id: record.id,
            //             allocated_type: targetAllocatedType
            //         });

            //         calculatedAllocationsForThisRow.push(targetAllocatedType);
            //         matchFound = true;
            //         return;
            //     }

            //     // --------------------------------------------------
            //     // 3. Auto-Allocation for Unauthorized / Biometric Absences
            //     // --------------------------------------------------
            //     const targetAllocatedType = isMidMonthJoiningMonth
            //         ? "LOP" // 👈 Forces LOP (Daily Wage treatment) during joining month
            //         : decideLeaveType(
            //             pools,
            //             leaveDay,
            //             employee,
            //             dbLeaves.filter(l => l.employee_id === employee.id),
            //             targetHalf
            //         );

            //     // Existing Unauthorized Leave record in DB
            //     if (
            //         record &&
            //         record.status === "Unauthorized_Leave"
            //     ) {
            //         if (targetAllocatedType !== null) {
            //             record.allocated_type = targetAllocatedType;
            //         }

            //         leavesToUpdateWithAllocation.push({
            //             id: record.id,
            //             allocated_type: targetAllocatedType
            //         });
            //     } 
            //     // Create new Unauthorized Leave
            //     else {
            //         if (!targetAllocatedType) return;

            //         unauthorizedLeavesToInsert.push({
            //             employee_id: employee.id,
            //             employee_name: employee.full_name,
            //             department: employee.department,
            //             leave_date: item.leave_date,
            //             half: targetHalf,
            //             type: "Leave",
            //             allocated_type: targetAllocatedType,
            //             reason: isMidMonthJoiningMonth 
            //                 ? "Auto-created: Mid-month joiner (Daily Wage / LOP)" 
            //                 : "Auto-created from biometric",
            //             status: "Unauthorized_Leave",
            //             frozen: false
            //         });

            //         dbLeaves.push({
            //             id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
            //             employee_id: employee.id,
            //             leave_date: item.leave_date,
            //             half: targetHalf,
            //             allocated_type: targetAllocatedType,
            //             status: "Unauthorized_Leave",
            //             frozen: false
            //         });
            //     }

            //     calculatedAllocationsForThisRow.push(targetAllocatedType);
            // };








            // console.log("Employee Data:", {
            //     id: employee?.id,
            //     is_daily_wage_joining_month: employee?.is_daily_wage_joining_month
            // });



            const processSlotAllocation = (targetHalf: "1H" | "2H") => {
                const record = dbMatches.find(m => m.half === targetHalf);
                const joiningDate = dayjs(employee.joining_date);

                // --------------------------------------------------
                // Mid-Month Joiner Flag
                // Checks if staff joined after the 1st AND has the daily wage flag enabled
                // --------------------------------------------------
const dailyWageUntil = employee.daily_wage_until
    ? dayjs(employee.daily_wage_until).endOf("month")
    : null;

const isMidMonthJoiningMonth =
    (employee.is_daily_wage_joining_month === true ||
     String(employee.is_daily_wage_joining_month) === "true")
    &&
    dailyWageUntil &&
    (
        leaveDay.isBefore(dailyWageUntil, "day") ||
        leaveDay.isSame(dailyWageUntil, "day")
    );

                // --------------------------------------------------
                // 1. Already approved with allocation
                // --------------------------------------------------
                if (
                    record &&
                    record.status === "approved" &&
                    record.allocated_type
                ) {
                    matchFound = true;
                    calculatedAllocationsForThisRow.push(record.allocated_type);
                    return;
                }

                // --------------------------------------------------
                // 2. Approved but allocation missing
                // --------------------------------------------------
                if (
                    record &&
                    record.status === "approved" &&
                    !record.allocated_type
                ) {
                    // If mid-month joiner with daily wage flag, set to "LOP". 
                    // Otherwise use standard leave allocation (CL/EL/SL/LOP).
                    const targetAllocatedType = isMidMonthJoiningMonth
                        ? "LOP"
                        : decideLeaveType(
                            pools,
                            leaveDay,
                            employee,
                            dbLeaves.filter(l => l.employee_id === employee.id),
                            targetHalf
                        );

                    if (!targetAllocatedType) return;

                    record.allocated_type = targetAllocatedType;

                    leavesToUpdateWithAllocation.push({
                        id: record.id,
                        allocated_type: targetAllocatedType
                    });

                    calculatedAllocationsForThisRow.push(targetAllocatedType);
                    matchFound = true;
                    return;
                }

                // --------------------------------------------------
                // 3. Auto-Allocation for Unauthorized / Biometric Absences
                // --------------------------------------------------
                const targetAllocatedType = isMidMonthJoiningMonth
                    ? "LOP"
                    : decideLeaveType(
                        pools,
                        leaveDay,
                        employee,
                        dbLeaves.filter(l => l.employee_id === employee.id),
                        targetHalf
                    );

                // Existing Unauthorized Leave record in DB
                if (
                    record &&
                    record.status === "Unauthorized_Leave"
                ) {
                    if (targetAllocatedType !== null) {
                        record.allocated_type = targetAllocatedType;
                    }

                    leavesToUpdateWithAllocation.push({
                        id: record.id,
                        allocated_type: targetAllocatedType
                    });
                }
                // Create new Unauthorized Leave
                else {
                    if (!targetAllocatedType) return;

                    unauthorizedLeavesToInsert.push({
                        employee_id: employee.id,
                        employee_name: employee.full_name,
                        department: employee.department,
                        leave_date: item.leave_date,
                        half: targetHalf,
                        type: "Leave",
                        allocated_type: targetAllocatedType,
                        reason: isMidMonthJoiningMonth
                            ? "Auto-created: Mid-month joiner (Daily Wage / LOP)"
                            : "Auto-created from biometric",
                        status: "Unauthorized_Leave",
                        frozen: false
                    });

                    dbLeaves.push({
                        id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
                        employee_id: employee.id,
                        leave_date: item.leave_date,
                        half: targetHalf,
                        allocated_type: targetAllocatedType,
                        status: "Unauthorized_Leave",
                        frozen: false
                    });
                }

                calculatedAllocationsForThisRow.push(targetAllocatedType);
            };
















            if (isFullDayRow) {
                processSlotAllocation("1H");
                processSlotAllocation("2H");
            } else {
                // 🌟 CHANGED: Explicit targeting structure to capture precise reallocation strings
                const isFirstHalf = item.excel_status.includes("1H") || (!item.excel_status.includes("2H") && item.excel_status.includes("1/2"));
                const target = isFirstHalf ? "1H" : "2H";
                processSlotAllocation(target);
            }

            if (matchFound) matchedCounter++;
            else unauthorizedCounter++;

            if (!employee || !pools) {
                finalRows.push({
                    key: index.toString(),
                    leave_id: "",
                    employee_code: item.employee_code,
                    full_name: "Employee not found",
                    leave_date: item.leave_date,
                    excel_status: item.excel_status,
                    db_status: "Employee code missing",
                    allocated_type: "",
                    is_match: false,
                    issue_type: "INVALID_EMP_CODE",
                });
            }
        });

        // Submit updates/insertions to DB
        if (leavesToUpdateWithAllocation.length > 0) {
            for (const item of leavesToUpdateWithAllocation) {
                await supabase.schema("leave_management").from("leaves")
                    .update({
                        allocated_type: item.allocated_type,
                        allocation_source_year: null,
                        allocation_source_month: null,
                        allocation_source_type: null
                    })
                    .eq("id", item.id)
                    .eq("frozen", false);
            }
        }

        if (unauthorizedLeavesToInsert.length > 0) {
            const { error: insertError } = await supabase.schema("leave_management")
                .from("leaves").insert(unauthorizedLeavesToInsert);
            if (insertError) throw insertError;
        }

        const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
            employee_code: code,
            full_name: staffLeaveCounter[code].name,
            total_leaves: staffLeaveCounter[code].count,
        }));

        setStaffSummaries(summariesList);
        setSummaryStats({
            totalRows: orderedLeaves.length,
            matchedCount: matchedCounter,
            unauthorizedCreated: unauthorizedCounter,
            invalidCodes: invalidCodeCounter,
        });
        setDiscrepancies(finalRows);
        setFileUploaded(true);
    };

    // ==========================================
    // ACTION HANDLER: EXCEL FILE UPLOAD
    // ==========================================
    const handleFileUpload = (file: RcFile): boolean => {
        setLoading(true);
        setDiscrepancies([]);
        setStaffSummaries([]);
        setFileUploaded(false);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                // 🌟 IMPROVED: Using ArrayBuffer instead of binary string for better encoding support
                const workbook = XLSX.read(data, { type: "array", cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const { data: dbEmployees, error: dbError } = await supabase
                    .schema("leave_management")
                    .from("employees")
                    .select("employee_code, is_permanently_daily, daily_wage_until, is_daily_wage_joining_month")
                    .eq("role", "staff");

                if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);
                // 👆 --------------------------------- 👆

                let currentEmpCode = "";
                const rawAbsentAndHalfPresentList: any[] = [];

                rawRows.forEach((row: any[]) => {
                    if (!row || row.length === 0) return;

                    // Match employee code row header
                    const rowText = row.join(" ");
                    if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
                        const empCodeIndex = row.findIndex(
                            (cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:"))
                        );
                        if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
                            currentEmpCode = String(row[empCodeIndex + 1]).trim();
                        }
                        return;
                    }

                    // Locate date column
                    let dateStr = "";
                    for (const cell of row) {
                        if (!cell) continue;

                        if (cell instanceof Date) {
                            dateStr = dayjs(cell).format("DD-MMM-YYYY");
                            break;
                        }

                        const value = String(cell).trim();
                        // 🌟 IMPROVED: Handles both single/double digit days (e.g., 1-Jan-2026 vs 01-Jan-2026)
                        if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
                            dateStr = value;
                            break;
                        }
                    }

                    const isDateRow = Boolean(dateStr) && dayjs(dateStr).isValid();

                    if (isDateRow && currentEmpCode) {
                        const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

                        const empRecord = dbEmployees?.find(
                            (emp) => String(emp.employee_code).trim() === currentEmpCode
                        );

                        if (empRecord) {
                            if (empRecord.is_permanently_daily) return;

                            // 🌟 HIGHLIGHTED CHANGE: Auto-transition Month Comparison Engine
                            // if (empRecord.daily_wage_until) {
                            //     // Converts "2026-07-31" into "2026-07-01"
                            //     const dailyWageLimitMonth = dayjs(empRecord.daily_wage_until).startOf("month");
                            //     // Converts current row date (e.g. "2026-07-10") into "2026-07-01"
                            //     const targetMonthStart = dayjs(standardizedDate).startOf("month");

                            //     // If the row month is July or earlier, it is skipped (daily wage rules apply).
                            //     // Once the row hits August 1st, targetMonthStart (Aug 1) IS after dailyWageLimitMonth (July 1).
                            //     // It will stop returning and process them normally as regular staff!
                            //     if (!targetMonthStart.isAfter(dailyWageLimitMonth)) {
                            //         return; 
                            //     }
                            // }
                        }
                        let statusStr = "";

                        // 🌟 IMPROVED: Dynamic status detection
                        for (let i = 2; i < row.length; i++) {
                            const cellVal = row[i] ? String(row[i]).trim() : "";
                            if (!cellVal) continue;

                            const lower = cellVal.toLowerCase();
                            if (
                                lower.includes("absent") ||
                                lower.includes("present") ||
                                lower.includes("weeklyoff") ||
                                lower.includes("no outpunch") ||
                                lower.includes("1/2") ||
                                lower.includes("½")
                            ) {
                                statusStr = cellVal;
                                // Keep going if we hit standard 'present' to see if a more specific flag (like ½present) exists in later cells
                                if (lower !== "present") {
                                    break;
                                }
                            }
                        }

                        // const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
                        const lowerStatus = statusStr.toLowerCase();

                        // Filter relevant non-full presence statuses
                        if (
                            lowerStatus.includes("absent") ||
                            lowerStatus.includes("½present") ||
                            lowerStatus.includes("half") ||
                            lowerStatus.includes("1/2") ||
                            lowerStatus.includes("no outpunch")
                        ) {
                            rawAbsentAndHalfPresentList.push({
                                employee_code: String(currentEmpCode).trim(),
                                leave_date: standardizedDate,
                                excel_status: statusStr,
                            });
                        }
                    }
                });

                await runReconciliationEngine(rawAbsentAndHalfPresentList);
                message.success("Reconciliation successfully synchronized!");

            } catch (err: any) {
                console.error(err);
                message.error(err.message || "An error occurred during reconciliation");
            } finally {
                setLoading(false);
            }
        };





        reader.readAsArrayBuffer(file);
        return false;
    };


    // =============================================
    // FREEZE BUTTON
    // =============================================



    const handleFreezeAllocation = async () => {
        try {
            setLoading(true);

            // 1. Freeze all leave records
            const { data, error } = await supabase
                .schema("leave_management")
                .from("leaves")
                .update({
                    frozen: true,
                    frozen_at: new Date().toISOString(),
                })
                .eq("frozen", false)
                .select();

            if (error) throw error;

            // 2. Freeze all employee joining dates
            const { error: employeeFreezeError } = await supabase
                .schema("leave_management")
                .from("employees")
                .update({
                    joining_date_frozen: true,
                    joining_date_frozen_at: new Date().toISOString(),
                })
                .eq("joining_date_frozen", false);

            if (employeeFreezeError) throw employeeFreezeError;

            message.success(
                `${data?.length ?? 0} leave records and all employee joining dates frozen successfully 🔒`
            );

        } catch (err: any) {
            console.error(err);
            message.error(err.message || "Freeze failed");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // ACTION HANDLER: RUN REALLOCATION ENGINE
    // ==========================================
    const handleReallocation = async () => {
        setLoading(true);
        try {
            // 1. Wipe old allocations
            const { error: clearError } = await supabase
                .schema("leave_management")
                .from("leaves")
                .update({
                    allocated_type: null,
                    allocation_source_year: null,
                    allocation_source_month: null,
                    allocation_source_type: null
                })
                .eq("status", "Unauthorized_Leave")
                .eq("frozen", false);

            if (clearError) throw clearError;

            // 2. Fetch unauthorized leaves
            const { data: leaves, error: fetchError } = await supabase
                .schema("leave_management")
                .from("leaves")
                .select("id, leave_date, half, status, employee_id")
                .eq("status", "Unauthorized_Leave");
            if (fetchError) throw fetchError;

            if (!leaves || leaves.length === 0) {
                message.info("No auto-generated biometric leaves found to reallocate.");
                return;
            }

            // 3. Fetch employees separately
            const { data: employees, error: empError } = await supabase
                .schema("leave_management")
                .from("employees")
                .select("id, full_name, employee_code, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month")
            if (empError) throw empError;

            const employeeMap = Object.fromEntries(
                employees.map(e => [e.id, e.employee_code])
            );

            // 4. Map input for engine
            const mappedInputList = leaves
                .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
                .map(rec => ({
                    employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
                    leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
                    excel_status:
                        rec.half === "Full" || !rec.half
                            ? "Absent"
                            : rec.half === "1H"
                                ? "½Present (1H)"
                                : "½Present (2H)",
                }));
            // 5. Run engine
            await runReconciliationEngine(mappedInputList);



            message.success("Leave bucket reallocation successfully recalculated!");
        } catch (err: any) {
            console.error(err);
            message.error(err.message || "Error running bucket reallocation mapping loop.");
        } finally {
            setLoading(false);
        }
    };


    const columns = [
        {
            title: "Emp Code",
            dataIndex: "employee_code",
            render: (code: string, record: DiscrepancyRow) => {
                if (record.issue_type === "INVALID_EMP_CODE") {
                    return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
                }
                return code;
            }
        },
        { title: "Employee Name", dataIndex: "full_name" },
        { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
        { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
        {
            title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
                let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
                return <Tag color={color}>{status}</Tag>;
            }
        },
        { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
    ];

    const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

    return (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
            <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
                <Space orientation="vertical" style={{ width: "100%" }} size="large">
                    <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

                    {/* Button Layout Row Component */}
                    <Space size="middle">
                        <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
                            <Button icon={<UploadOutlined />} loading={loading} type="primary">
                                Choose Attendance Report File
                            </Button>
                        </Upload>

                        <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
                            Reallocate Leave Buckets
                        </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={handleFreezeAllocation}
                        >
                            🔒 Freeze Leave Allocation
                        </Button>
                    </Space>

                    {fileUploaded && (
                        <>
                            {/* Upload Brief Summary Stats */}
                            <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
                                    </Col>
                                </Row>
                            </div>

                            {/* Single Line Per Staff Statement Sheet Summary */}
                            <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                                    {staffSummaries.map((staff) => (
                                        <div key={staff.employee_code} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: "6px 0",
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
                                            <Text style={{ width: "200px" }}>{staff.full_name}</Text>
                                            <div style={{ flex: 1 }}>
                                                <Text type="secondary">Total Sheet Leave Counted: </Text>
                                                <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Discrepancies Table Log */}
                            <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
                            <Table
                                dataSource={issueRowsOnly}
                                columns={columns}
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                                locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
                            />
                        </>
                    )}
                </Space>
            </Card>
        </div>
    );
}































// ////////working code //////




// "use client";

// import { useState } from "react";
// import {
//     Upload,
//     Button,
//     Table,
//     Card,
//     Tag,
//     message,
//     Space,
//     Typography,
//     Alert,
//     Statistic,
//     Row,
//     Col,
//     List,
// } from "antd";
// import {
//     UploadOutlined,
//     AlertOutlined,
//     UserDeleteOutlined,
//     InfoCircleOutlined,
//     UserOutlined,
//     SyncOutlined,
// } from "@ant-design/icons";
// import { supabase } from "@/lib/supabase";
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
// import type { RcFile } from "antd/es/upload/interface";

// const { Title, Text } = Typography;

// const FINANCIAL_MONTHS = [
//     { name: "APR", index: 3 }, { name: "MAY", index: 4 }, { name: "JUN", index: 5 },
//     { name: "JUL", index: 6 }, { name: "AUG", index: 7 }, { name: "SEP", index: 8 },
//     { name: "OCT", index: 9 }, { name: "NOV", index: 10 }, { name: "DEC", index: 11 },
//     { name: "JAN", index: 0 }, { name: "FEB", index: 1 }, { name: "MAR", index: 2 },
// ];

// interface DiscrepancyRow {
//     key: string;
//     employee_code: string;
//     full_name: string;
//     leave_date: string;
//     leave_id: string;
//     excel_status: string;
//     db_status: string;
//     allocated_type: string;
//     is_match: boolean;
//     issue_type: "MATCHED" | "UNAUTHORIZED_CREATED" | "INVALID_EMP_CODE";
// }

// interface StaffSummary {
//     employee_code: string;
//     full_name: string;
//     total_leaves: number;
// }

// interface LeaveSlot {
//     year: number;
//     monthIndex: number;
//     half: "1H" | "2H";
//     usedDate: string | null;
// }




// // Helper to convert calendar month index (0=Jan..11=Dec) to Financial Year sequence (0=Apr..11=Mar)
// function getFinancialMonthOrder(monthIndex: number): number {
//     return monthIndex >= 3 ? monthIndex - 3 : monthIndex + 9;
// }

// function decideLeaveType(
//     pools: any,
//     leaveDay: dayjs.Dayjs,
//     employee: any,
//     historicalLeaves: any[],
//     preferredHalf?: "1H" | "2H" // Optional hint from excel (1H or 2H)
// ): string {
//     const leaveMonthIdx = leaveDay.month();
//     const leaveYear = leaveDay.year();
//     const leaveFinOrder = getFinancialMonthOrder(leaveMonthIdx);
//     const dateStr = leaveDay.format("YYYY-MM-DD");

//     // Helper to search available unallocated slot in a pool
//     const findSlot = (pool: LeaveSlot[], halfOrder: ("1H" | "2H")[]) => {
//         // Collect all unallocated candidate slots up to current financial month
//         const candidates = pool.filter((s: LeaveSlot) => {
//             if (s.usedDate !== null) return false; // Already used by another date!

//             const slotFinOrder = getFinancialMonthOrder(s.monthIndex);
//             const isSameOrPriorMonth =
//                 s.year < leaveYear ||
//                 (s.year === leaveYear && slotFinOrder <= leaveFinOrder);

//             return isSameOrPriorMonth;
//         });

//         // Try requested half first (or 1H), then fallback half
//         for (const half of halfOrder) {
//             const availableSlots = candidates
//                 .filter((s) => s.half === half)
//                 .sort((a, b) => {
//                     if (a.year !== b.year) return a.year - b.year;
//                     return getFinancialMonthOrder(a.monthIndex) - getFinancialMonthOrder(b.monthIndex);
//                 });

//             if (availableSlots.length > 0) {
//                 return availableSlots[0]; // Oldest available slot for this half
//             }
//         }

//         return null;
//     };

//     // Determine priority search order for halves
//     const halfPriority: ("1H" | "2H")[] = preferredHalf 
//         ? [preferredHalf, preferredHalf === "1H" ? "2H" : "1H"]
//         : ["1H", "2H"];

//     // 1. Try Casual Leave Pool (1H first, then 2H across months)
//     const casualSlot = findSlot(pools.casual, halfPriority);
//     if (casualSlot) {
//         casualSlot.usedDate = dateStr; // Lock slot immediately so next dates can't use it!
//         return `casual_${casualSlot.half}_${casualSlot.year}_${casualSlot.monthIndex + 1}`;
//     }

//     // 2. Try Sick Leave Pool (1H first, then 2H across months)
//     const sickSlot = findSlot(pools.sick, halfPriority);
//     if (sickSlot) {
//         sickSlot.usedDate = dateStr; // Lock slot immediately!
//         return `sick_${sickSlot.half}_${sickSlot.year}_${sickSlot.monthIndex + 1}`;
//     }

//     // 3. Fallback to LOP
//     return "LOP";
// }





// export default function VerifyAttendancePage() {
//     const [loading, setLoading] = useState(false);
//     const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([]);
//     const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
//     const [fileUploaded, setFileUploaded] = useState(false);

//     const [summaryStats, setSummaryStats] = useState({
//         totalRows: 0,
//         matchedCount: 0,
//         unauthorizedCreated: 0,
//         invalidCodes: 0,
//     });

//     // ==========================================
//     // CORE POOL BUILDER & ENGINE RUNNER
//     // ==========================================
//     const runReconciliationEngine = async (rawAbsentAndHalfPresentList: any[]) => {
//         // Fetch all base data arrays
//         const [
//             leavesResult,
//             employeesResult,
//             creditsResult
//         ] = await Promise.all([
//             supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, status, employee_id, half, allocated_type, frozen")
//                 .in("status", ["approved", "Unauthorized_Leave", "taken"]),

//             supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, employee_code, full_name, department, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month"), // 🌟 ADDED STATUS COLUMNS

//             supabase
//                 .schema("leave_management")
//                 .from("el_credits")
//                 .select("*")
//         ]);

//         if (leavesResult.error) throw leavesResult.error;
//         if (employeesResult.error) throw employeesResult.error;
//         if (creditsResult.error) throw creditsResult.error;

//         const dbLeaves = leavesResult.data || [];
//         const dbEmployees = employeesResult.data || [];
//         const dbCredits = creditsResult.data || [];



//         // =====================================================
//         // BUILD FAST LOOKUP MAPS
//         // =====================================================

//         const employeeMap: Record<string, any> = {};
//         const employeeIdMap: Record<string, any> = {};

//         const employeeLeavesMap: Record<string, any[]> = {};

//         const totalLeaveMap: Record<string, any[]> = {};

//         const creditMap: Record<string, Record<number, number>> = {};


//         // =====================================================
//         // EMPLOYEE MAP
//         // =====================================================

//         for (const emp of dbEmployees) {

//             employeeMap[String(emp.employee_code).trim()] = emp;

//             employeeIdMap[emp.id] = emp;

//             employeeLeavesMap[emp.id] = [];
//         }


//         // =====================================================
//         // CREDIT MAP
//         // creditMap[employeeId][month]
//         // =====================================================

//         for (const credit of dbCredits) {

//             if (!credit.credit_date) continue;

//             const month = dayjs(credit.credit_date).month();

//             if (!creditMap[credit.employee_id]) {

//                 creditMap[credit.employee_id] = {};
//             }

//             creditMap[credit.employee_id][month] =
//                 (creditMap[credit.employee_id][month] || 0) +
//                 Number(credit.count || 0);
//         }




//         // =====================================================
//         // LEAVE MAPS
//         // =====================================================

//         for (const leave of dbLeaves) {

//             employeeLeavesMap[leave.employee_id].push(leave);

//             const emp = employeeIdMap[leave.employee_id];

//             if (!emp) continue;

//             const mapKey =
//                 `${String(emp.employee_code).trim()}_${dayjs(leave.leave_date).format("YYYY-MM-DD")}`;

//             if (!totalLeaveMap[mapKey]) {

//                 totalLeaveMap[mapKey] = [];
//             }

//             totalLeaveMap[mapKey].push(leave);
//         }


//         // =====================================================
//         // BUILD DYNAMIC POOLS
//         // =====================================================

//         const dynamicPoolCache: Record<string, any> = {};
//         const endOfCalendarBoundary = dayjs().endOf("year");

//         for (const emp of dbEmployees) {
//             if (!emp.joining_date) continue;

//             const joinDate = dayjs(emp.joining_date);
//             const casualPool: any[] = [];
//             const sickPool: any[] = [];

//             // 1. Determine the start of the financial year (April 1st) for the joining date
//             // If joining date is Jan-Mar (e.g. Feb 2026), financial year started April previous year (2025)
//             const joinYear = joinDate.year();
//             const joinMonth = joinDate.month(); // 0-indexed (0 = Jan, 3 = Apr)
//             const fyStartYear = joinMonth < 3 ? joinYear - 1 : joinYear;

//             let loopDate = dayjs(`${fyStartYear}-04-01`).startOf("month");

//             // Start loop from April 1st up to end of calendar year
//             while (
//                 loopDate.isBefore(endOfCalendarBoundary) ||
//                 loopDate.isSame(endOfCalendarBoundary, "month")
//             ) {
//                 const mIdx = loopDate.month();
//                 const year = loopDate.year();

//                 // 2. Block the entire month if it is before the employee's joining month
//                 // Last month that should be blocked
// // -------------------------------------------------------------
// // 1. Block months before the employee joined
// // -------------------------------------------------------------
// const isBeforeJoiningMonth = loopDate.isBefore(joinDate, "month");

// // -------------------------------------------------------------
// // 2. Daily Wage Joining Month
// // -------------------------------------------------------------
// const isDailyWageJoiningMonth =
//     emp.is_daily_wage_joining_month === true ||
//     String(emp.is_daily_wage_joining_month) === "true";

// const dailyWageUntil = emp.daily_wage_until
//     ? dayjs(emp.daily_wage_until).endOf("month")
//     : null;

// const isDailyWageBlocked =
//     isDailyWageJoiningMonth &&
//     dailyWageUntil &&
//     (
//         loopDate.isBefore(dailyWageUntil, "month") ||
//         loopDate.isSame(dailyWageUntil, "month")
//     );

// // -------------------------------------------------------------
// // Final Blocking
// // -------------------------------------------------------------
// const blockedStatus =
//     (isBeforeJoiningMonth || isDailyWageBlocked)
//         ? "BLOCKED"
//         : null;





//                 casualPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: blockedStatus
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: blockedStatus
//                     }
//                 );

//                 sickPool.push(
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "1H",
//                         usedDate: blockedStatus
//                     },
//                     {
//                         year,
//                         monthIndex: mIdx,
//                         half: "2H",
//                         usedDate: blockedStatus
//                     }
//                 );

//                 loopDate = loopDate.add(1, "month");
//             }

//             const earnedMap: Record<number, { taken: number; available: number }> = {};

//             for (const m of FINANCIAL_MONTHS) {
//                 // const allocationMonth = dayjs().month(m.index);
//                     const allocationMonth = dayjs(`${fyStartYear}-${String(m.index + 1).padStart(2,"0")}-01`);


//                const isDailyWageJoiningMonth =
//     emp.is_daily_wage_joining_month === true ||
//     String(emp.is_daily_wage_joining_month) === "true";

// const dailyWageUntil = emp.daily_wage_until
//     ? dayjs(emp.daily_wage_until).endOf("month")
//     : null;

// if (
//     isDailyWageJoiningMonth &&
//     dailyWageUntil &&
//     (
//         allocationMonth.isBefore(dailyWageUntil, "month") ||
//         allocationMonth.isSame(dailyWageUntil, "month")
//     )
// ) {
//     earnedMap[m.index] = {
//         taken: 0,
//         available: 0
//     };
//     continue;
// } 

//                 earnedMap[m.index] = {
//                     taken: 0,
//                     available: creditMap[emp.id]?.[m.index] || 0
//                 };

//             }



//             const historicalTakenLeaves = (employeeLeavesMap[emp.id] || []).filter(
//                 l => l.status === "approved" || l.status === "Unauthorized_Leave"
//             );

//             for (const leave of historicalTakenLeaves) {
//                 if (!leave.allocated_type) continue;

//                 const parts = leave.allocated_type.split("_");

//                 if (leave.allocated_type.startsWith("casual")) {
//                     const year = Number(parts[2]);
//                     const month = Number(parts[3]) - 1;

//                     const slot = casualPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type.startsWith("sick")) {
//                     const year = Number(parts[2]);
//                     const month = Number(parts[3]) - 1;

//                     const slot = sickPool.find(
//                         s =>
//                             s.year === year &&
//                             s.monthIndex === month &&
//                             s.half === leave.half
//                     );

//                     if (slot) slot.usedDate = leave.leave_date;
//                 } else if (leave.allocated_type.startsWith("earned")) {
//                     const month = Number(parts[2]) - 1;

//                     if (earnedMap[month]) {
//                         earnedMap[month].taken += 0.5;
//                     }
//                 }
//             }

//             dynamicPoolCache[emp.employee_code] = {
//                 casual: casualPool,
//                 sick: sickPool,
//                 earned: earnedMap
//             };

//         }

// const uploadedMonth = rawAbsentAndHalfPresentList.length
//     ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).month()
//     : dayjs().month();

// const uploadedYear = rawAbsentAndHalfPresentList.length
//     ? dayjs(rawAbsentAndHalfPresentList[0].leave_date).year()
//     : dayjs().year();

// console.log("========== UNUSED CL / SL SLOTS ==========");

// const unusedSlots: any[] = [];

// Object.entries(dynamicPoolCache).forEach(([empCode, pools]: any) => {

//     const emp = dbEmployees.find(
//         e => String(e.employee_code).trim() === String(empCode).trim()
//     );

//     ["casual", "sick"].forEach(type => {

//         pools[type]
//             .filter((slot: LeaveSlot) => {

//                 const slotFinancialOrder =
//                     slot.monthIndex >= 3
//                         ? slot.monthIndex - 3
//                         : slot.monthIndex + 9;

//                 const uploadedFinancialOrder =
//                     uploadedMonth >= 3
//                         ? uploadedMonth - 3
//                         : uploadedMonth + 9;

//                 return (
//                     slot.usedDate === null &&
//                     slot.year === uploadedYear &&
//                     slotFinancialOrder <= uploadedFinancialOrder
//                 );

//             })
//             .forEach((slot: LeaveSlot) => {

//                 unusedSlots.push({
//                     Employee: emp?.full_name ?? "",
//                     EmployeeCode: emp?.employee_code ?? "",
//                     LeaveType: type.toUpperCase(),
//                     Month: FINANCIAL_MONTHS.find(
//                         m => m.index === slot.monthIndex
//                     )?.name,
//                     Year: slot.year,
//                     Half: slot.half
//                 });

//             });

//     });

// });

// // Sort nicely before printing
// unusedSlots.sort((a, b) =>
//     a.Employee.localeCompare(b.Employee) ||
//     a.LeaveType.localeCompare(b.LeaveType) ||
//     FINANCIAL_MONTHS.findIndex(m => m.name === a.Month) -
//     FINANCIAL_MONTHS.findIndex(m => m.name === b.Month) ||
//     a.Half.localeCompare(b.Half)
// );

// // Only ONE table
// console.table(unusedSlots);

// console.log("Total Unused Slots:", unusedSlots.length);
// console.log("==========================================");


//         const leavesToUpdateWithAllocation: Array<{
//             id: string;
//             allocated_type: string | null;
//         }> = [];
//         const unauthorizedLeavesToInsert: any[] = [];
//         const finalRows: DiscrepancyRow[] = [];
//         const staffLeaveCounter: Record<string, { name: string; count: number }> = {};

//         let matchedCounter = 0;
//         let unauthorizedCounter = 0;
//         let invalidCodeCounter = 0;

//         const fullDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return !status.includes("½present") && !status.includes("1/2");
//         });
//         const halfDayLeaves = rawAbsentAndHalfPresentList.filter(item => {
//             const status = item.excel_status.toLowerCase();
//             return status.includes("½present") || status.includes("1/2");
//         });
//         const orderedLeaves = [...fullDayLeaves, ...halfDayLeaves];

//         orderedLeaves.forEach((item, index) => {
//             if (!item.employee_code || !item.leave_date) return;

//             const empCode = String(item.employee_code).trim();
//             const employee = employeeMap[empCode] || employeeMap[empCode.replace(/^0+/, "")];
//             const pools = dynamicPoolCache[empCode];

//             const isFullDayRow = !item.excel_status.toLowerCase().includes("½") && !item.excel_status.includes("1/2");
//             const incrementalWeight = isFullDayRow ? 1.0 : 0.5;

//             if (!staffLeaveCounter[empCode]) {
//                 staffLeaveCounter[empCode] = { name: employee?.full_name || "⚠️ UNKNOWN EMPLOYEE", count: 0 };
//             }
//             staffLeaveCounter[empCode].count += incrementalWeight;

//             if (!employee || !pools) {
//                 invalidCodeCounter++;
//                 finalRows.push({
//                     key: `err-${index}`,
//                     leave_id: "N/A",
//                     employee_code: empCode,
//                     full_name: "⚠️ UNKNOWN EMPLOYEE (Not in DB)",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Rejected / Skipped",
//                     allocated_type: "NONE",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//                 return;
//             }

//             const dbMatches = totalLeaveMap[`${empCode}_${item.leave_date}`] || [];
//             const leaveDay = dayjs(item.leave_date);
//             const joiningDate = dayjs(employee.joining_date);

//             let matchFound = false;
//             let calculatedAllocationsForThisRow: (string | null)[] = [];

// // Inside the orderedLeaves.forEach loop:

// const processSlotAllocation = (targetHalf: "1H" | "2H") => {
//     const record = dbMatches.find((m) => m.half === targetHalf);

//     const dailyWageUntil = employee.daily_wage_until
//         ? dayjs(employee.daily_wage_until).endOf("month")
//         : null;

//     const isMidMonthJoiningMonth =
//         (employee.is_daily_wage_joining_month === true ||
//             String(employee.is_daily_wage_joining_month) === "true") &&
//         dailyWageUntil &&
//         (leaveDay.isBefore(dailyWageUntil, "day") ||
//             leaveDay.isSame(dailyWageUntil, "day"));

//     if (record && record.status === "approved" && record.allocated_type) {
//         matchFound = true;
//         calculatedAllocationsForThisRow.push(record.allocated_type);
//         return;
//     }

//     // 1. Determine initial leave type decision
//     const initialAllocatedType = isMidMonthJoiningMonth
//         ? "LOP"
//         : decideLeaveType(
//               pools,
//               leaveDay,
//               employee,
//               dbLeaves.filter((l) => l.employee_id === employee.id),
//               targetHalf
//           );

//     let finalAllocatedType = initialAllocatedType;
//     let sourceYear: number | null = leaveDay.year();
//     let sourceMonth: number | null = leaveDay.month() + 1; // 1-indexed month
//     let sourceType: string = "LOP";

//     // 🛑 2. STRICT GUARD: Prevent duplicate allocation of the exact pool tag (e.g., sick_1H_2026_4)
//     if (finalAllocatedType && !finalAllocatedType.toUpperCase().startsWith("LOP")) {
//         const typeUpper = finalAllocatedType.toUpperCase();
//         const isRestrictedType =
//             typeUpper.includes("SICK") ||
//             typeUpper.includes("SL") ||
//             typeUpper.includes("CASUAL") ||
//             typeUpper.includes("CL");

//         if (isRestrictedType) {
//             // Check if the EXACT allocated pool tag already exists in dbLeaves
//             const exactTagExists = dbLeaves.some((l: any) => {
//                 if (String(l.employee_id) !== String(employee.id)) return false;
//                 const existingTag = String(l.allocated_type || "").toLowerCase();
//                 return existingTag === finalAllocatedType.toLowerCase();
//             });

//             if (exactTagExists) {
//                 finalAllocatedType = "LOP";
//             }
//         }
//     }

//     // 3. Extract metadata or format LOP with Month & Year context
//     if (!finalAllocatedType || finalAllocatedType.toUpperCase().startsWith("LOP")) {
//         finalAllocatedType = `LOP_${targetHalf}_${leaveDay.year()}_${leaveDay.month() + 1}`;
//         sourceType = "LOP";
//         sourceYear = leaveDay.year();
//         sourceMonth = leaveDay.month() + 1;
//     } else {
//         // Extract metadata from returned pool string (e.g., "sick_2H_2026_4")
//         const parts = finalAllocatedType.split("_");
//         if (parts.length >= 4) {
//             sourceType = parts[0];
//             sourceYear = parseInt(parts[2], 10) || leaveDay.year();
//             sourceMonth = parseInt(parts[3], 10) || (leaveDay.month() + 1);
//         }
//     }

//     // 4. Update or Insert Leaves with full metadata
//     if (record && record.status === "approved" && !record.allocated_type) {
//         if (!finalAllocatedType) return;

//         record.allocated_type = finalAllocatedType;
//         record.allocation_source_year = sourceYear;
//         record.allocation_source_month = sourceMonth;
//         record.allocation_source_type = sourceType;

//         leavesToUpdateWithAllocation.push({
//             id: record.id,
//             allocated_type: finalAllocatedType,
//             allocation_source_year: sourceYear,
//             allocation_source_month: sourceMonth,
//             allocation_source_type: sourceType,
//         } as any);

//         calculatedAllocationsForThisRow.push(finalAllocatedType);
//         matchFound = true;
//         return;
//     }

//     if (record && record.status === "Unauthorized_Leave") {
//         if (finalAllocatedType !== null) {
//             record.allocated_type = finalAllocatedType;
//             record.allocation_source_year = sourceYear;
//             record.allocation_source_month = sourceMonth;
//             record.allocation_source_type = sourceType;
//         }

//         leavesToUpdateWithAllocation.push({
//             id: record.id,
//             allocated_type: finalAllocatedType,
//             allocation_source_year: sourceYear,
//             allocation_source_month: sourceMonth,
//             allocation_source_type: sourceType,
//         } as any);
//     } else {
//         if (!finalAllocatedType) return;

//         unauthorizedLeavesToInsert.push({
//             employee_id: employee.id,
//             employee_name: employee.full_name,
//             department: employee.department,
//             leave_date: item.leave_date,
//             half: targetHalf,
//             type: "Leave",
//             allocated_type: finalAllocatedType,
//             allocation_source_year: sourceYear,
//             allocation_source_month: sourceMonth,
//             allocation_source_type: sourceType,
//             reason: isMidMonthJoiningMonth
//                 ? "Auto-created: Mid-month joiner (Daily Wage / LOP)"
//                 : "Auto-created from biometric",
//             status: "Unauthorized_Leave",
//             frozen: false,
//         } as any);

//         dbLeaves.push({
//             id: `temp_${employee.id}_${item.leave_date}_${targetHalf}`,
//             employee_id: employee.id,
//             leave_date: item.leave_date,
//             half: targetHalf,
//             allocated_type: finalAllocatedType,
//             allocation_source_year: sourceYear,
//             allocation_source_month: sourceMonth,
//             allocation_source_type: sourceType,
//             status: "Unauthorized_Leave",
//             frozen: false,
//         } as any);
//     }

//     calculatedAllocationsForThisRow.push(finalAllocatedType);
// };

//            if (isFullDayRow) {
//     processSlotAllocation("1H");
//     processSlotAllocation("2H");
// } else {
//     const rawStatus = (item.excel_status || "").toString().toLowerCase();

//     // Check explicit second-half indicators first
//     const isSecondHalf = rawStatus.includes("2h") || 
//                          rawStatus.includes("second") || 
//                          rawStatus.includes("afternoon");

//     // Check explicit first-half indicators
//     const isFirstHalf = rawStatus.includes("1h") || 
//                         rawStatus.includes("first") || 
//                         rawStatus.includes("morning");

//     let target: "1H" | "2H";

//     if (isSecondHalf) {
//         target = "2H";
//     } else if (isFirstHalf) {
//         target = "1H";
//     } else {
//         // Fallback for general half-day tokens like "1/2", "½", "0.5", or "half"
//         // Defaulting to "1H" (First Half) unless explicitly marked as Second Half
//         target = "1H";
//     }

//     processSlotAllocation(target);
// }

//             if (matchFound) matchedCounter++;
//             else unauthorizedCounter++;

//             if (!employee || !pools) {
//                 finalRows.push({
//                     key: index.toString(),
//                     leave_id: "",
//                     employee_code: item.employee_code,
//                     full_name: "Employee not found",
//                     leave_date: item.leave_date,
//                     excel_status: item.excel_status,
//                     db_status: "Employee code missing",
//                     allocated_type: "",
//                     is_match: false,
//                     issue_type: "INVALID_EMP_CODE",
//                 });
//             }
//         });

//         // Submit updates/insertions to DB
//         if (leavesToUpdateWithAllocation.length > 0) {
//             for (const item of leavesToUpdateWithAllocation) {
//                 await supabase.schema("leave_management").from("leaves")
//                     .update({
//                         allocated_type: item.allocated_type,
//                         allocation_source_year: null,
//                         allocation_source_month: null,
//                         allocation_source_type: null
//                     })
//                     .eq("id", item.id)
//                     .eq("frozen", false);
//             }
//         }

//         if (unauthorizedLeavesToInsert.length > 0) {
//             const { error: insertError } = await supabase.schema("leave_management")
//                 .from("leaves").insert(unauthorizedLeavesToInsert);
//             if (insertError) throw insertError;
//         }

//         const summariesList: StaffSummary[] = Object.keys(staffLeaveCounter).map(code => ({
//             employee_code: code,
//             full_name: staffLeaveCounter[code].name,
//             total_leaves: staffLeaveCounter[code].count,
//         }));

//         setStaffSummaries(summariesList);
//         setSummaryStats({
//             totalRows: orderedLeaves.length,
//             matchedCount: matchedCounter,
//             unauthorizedCreated: unauthorizedCounter,
//             invalidCodes: invalidCodeCounter,
//         });
//         setDiscrepancies(finalRows);
//         setFileUploaded(true);
//     };

//     // ==========================================
//     // ACTION HANDLER: EXCEL FILE UPLOAD
//     // ==========================================
//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setDiscrepancies([]);
//         setStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 // 🌟 IMPROVED: Using ArrayBuffer instead of binary string for better encoding support
//                 const workbook = XLSX.read(data, { type: "array", cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema("leave_management")
//                     .from("employees")
//                     .select("employee_code, is_permanently_daily, daily_wage_until, is_daily_wage_joining_month")
//                     .eq("role", "staff");

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);
//                 // 👆 --------------------------------- 👆

//                 let currentEmpCode = "";
//                 const rawAbsentAndHalfPresentList: any[] = [];

//                 rawRows.forEach((row: any[]) => {
//                     if (!row || row.length === 0) return;

//                     // Match employee code row header
//                     const rowText = row.join(" ");
//                     if (rowText.includes("Emp Code:") || rowText.includes("Employee Code:")) {
//                         const empCodeIndex = row.findIndex(
//                             (cell) => cell && (String(cell).includes("Emp Code:") || String(cell).includes("Employee Code:"))
//                         );
//                         if (empCodeIndex !== -1 && row[empCodeIndex + 1]) {
//                             currentEmpCode = String(row[empCodeIndex + 1]).trim();
//                         }
//                         return;
//                     }

//                     // Locate date column
//                     let dateStr = "";
//                     for (const cell of row) {
//                         if (!cell) continue;

//                         if (cell instanceof Date) {
//                             dateStr = dayjs(cell).format("DD-MMM-YYYY");
//                             break;
//                         }

//                         const value = String(cell).trim();
//                         // 🌟 IMPROVED: Handles both single/double digit days (e.g., 1-Jan-2026 vs 01-Jan-2026)
//                         if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}$/.test(value)) {
//                             dateStr = value;
//                             break;
//                         }
//                     }

//                     const isDateRow = Boolean(dateStr) && dayjs(dateStr).isValid();

//                     if (isDateRow && currentEmpCode) {
//                         const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");

//                         const empRecord = dbEmployees?.find(
//                             (emp) => String(emp.employee_code).trim() === currentEmpCode
//                         );

//                         if (empRecord) {
//                             if (empRecord.is_permanently_daily) return;

//                         }
//                         let statusStr = "";

//                         // 🌟 IMPROVED: Dynamic status detection
//                         for (let i = 2; i < row.length; i++) {
//                             const cellVal = row[i] ? String(row[i]).trim() : "";
//                             if (!cellVal) continue;

//                             const lower = cellVal.toLowerCase();
//                             if (
//                                 lower.includes("absent") ||
//                                 lower.includes("present") ||
//                                 lower.includes("weeklyoff") ||
//                                 lower.includes("no outpunch") ||
//                                 lower.includes("1/2") ||
//                                 lower.includes("½")
//                             ) {
//                                 statusStr = cellVal;
//                                 // Keep going if we hit standard 'present' to see if a more specific flag (like ½present) exists in later cells
//                                 if (lower !== "present") {
//                                     break;
//                                 }
//                             }
//                         }

//                         // const standardizedDate = dayjs(dateStr).format("YYYY-MM-DD");
//                         const lowerStatus = statusStr.toLowerCase();

//                         // Filter relevant non-full presence statuses
//                         if (
//                             lowerStatus.includes("absent") ||
//                             lowerStatus.includes("½present") ||
//                             lowerStatus.includes("half") ||
//                             lowerStatus.includes("1/2") ||
//                             lowerStatus.includes("no outpunch")
//                         ) {
//                             rawAbsentAndHalfPresentList.push({
//                                 employee_code: String(currentEmpCode).trim(),
//                                 leave_date: standardizedDate,
//                                 excel_status: statusStr,
//                             });
//                         }
//                     }
//                 });

//                 await runReconciliationEngine(rawAbsentAndHalfPresentList);
//                 message.success("Reconciliation successfully synchronized!");

//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || "An error occurred during reconciliation");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };


//     // =============================================
//     // FREEZE BUTTON
//     // =============================================



//     const handleFreezeAllocation = async () => {
//         try {
//             setLoading(true);

//             // 1. Freeze all leave records
//             const { data, error } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     frozen: true,
//                     frozen_at: new Date().toISOString(),
//                 })
//                 .eq("frozen", false)
//                 .select();

//             if (error) throw error;

//             // 2. Freeze all employee joining dates
//             const { error: employeeFreezeError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .update({
//                     joining_date_frozen: true,
//                     joining_date_frozen_at: new Date().toISOString(),
//                 })
//                 .eq("joining_date_frozen", false);

//             if (employeeFreezeError) throw employeeFreezeError;

//             message.success(
//                 `${data?.length ?? 0} leave records and all employee joining dates frozen successfully 🔒`
//             );

//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Freeze failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ==========================================
//     // ACTION HANDLER: RUN REALLOCATION ENGINE
//     // ==========================================
//     const handleReallocation = async () => {
//         setLoading(true);
//         try {
//             // 1. Wipe old allocations
//             const { error: clearError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .update({
//                     allocated_type: null,
//                     allocation_source_year: null,
//                     allocation_source_month: null,
//                     allocation_source_type: null
//                 })
//                 .eq("status", "Unauthorized_Leave")
//                 .eq("frozen", false);

//             if (clearError) throw clearError;

//             // 2. Fetch unauthorized leaves
//             const { data: leaves, error: fetchError } = await supabase
//                 .schema("leave_management")
//                 .from("leaves")
//                 .select("id, leave_date, half, status, employee_id")
//                 .eq("status", "Unauthorized_Leave");
//             if (fetchError) throw fetchError;

//             if (!leaves || leaves.length === 0) {
//                 message.info("No auto-generated biometric leaves found to reallocate.");
//                 return;
//             }

//             // 3. Fetch employees separately
//             const { data: employees, error: empError } = await supabase
//                 .schema("leave_management")
//                 .from("employees")
//                 .select("id, full_name, employee_code, joining_date, is_permanently_daily, daily_wage_until,is_daily_wage_joining_month")
//             if (empError) throw empError;

//             const employeeMap = Object.fromEntries(
//                 employees.map(e => [e.id, e.employee_code])
//             );

//             // 4. Map input for engine
//             const mappedInputList = leaves
//                 .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//                 .map(rec => ({
//                     employee_code: employeeMap[rec.employee_id] || String(rec.employee_id),
//                     leave_date: dayjs(rec.leave_date).format("YYYY-MM-DD"),
//                     excel_status:
//                         rec.half === "Full" || !rec.half
//                             ? "Absent"
//                             : rec.half === "1H"
//                                 ? "½Present (1H)"
//                                 : "½Present (2H)",
//                 }));
//             // 5. Run engine
//             await runReconciliationEngine(mappedInputList);



//             message.success("Leave bucket reallocation successfully recalculated!");
//         } catch (err: any) {
//             console.error(err);
//             message.error(err.message || "Error running bucket reallocation mapping loop.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const columns = [
//         {
//             title: "Emp Code",
//             dataIndex: "employee_code",
//             render: (code: string, record: DiscrepancyRow) => {
//                 if (record.issue_type === "INVALID_EMP_CODE") {
//                     return <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>{code} ⚠️</span>;
//                 }
//                 return code;
//             }
//         },
//         { title: "Employee Name", dataIndex: "full_name" },
//         { title: "Leave Date", dataIndex: "leave_date", render: (d: string) => dayjs(d).format("DD-MM-YYYY") },
//         { title: "Excel Status", dataIndex: "excel_status", render: (txt: string) => (<Tag color={txt.toLowerCase().includes("absent") ? "error" : "warning"}>{txt}</Tag>) },
//         {
//             title: "System Result Status", dataIndex: "db_status", render: (status: string, record: DiscrepancyRow) => {
//                 let color = record.issue_type === "INVALID_EMP_CODE" ? "magenta" : "red";
//                 return <Tag color={color}>{status}</Tag>;
//             }
//         },
//         { title: "Allocated Bucket", dataIndex: "allocated_type", render: (type: string) => (<span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#555" }}>{type ? type.toUpperCase() : "UNASSIGNED"}</span>) },
//     ];

//     const issueRowsOnly = discrepancies.filter(row => row.issue_type !== "MATCHED");

//     return (
//         <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
//             <Card title={<Title level={3} style={{ margin: 0 }}>HR Panel Attendance Reconciliation</Title>}>
//                 <Space orientation="vertical" style={{ width: "100%" }} size="large">
//                     <Alert title="Automatic Exception Identification Enabled" description="Uploading biometric documents identifies discrepancies and records auto-allocated unauthorized leave buckets dynamically into the system logs." type="info" showIcon />

//                     {/* Button Layout Row Component */}
//                     <Space size="middle">
//                         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xls,.xlsx">
//                             <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                                 Choose Attendance Report File
//                             </Button>
//                         </Upload>

//                         <Button icon={<SyncOutlined />} loading={loading} onClick={handleReallocation} type="default" style={{ borderColor: "#d9d9d9" }}>
//                             Reallocate Leave Buckets
//                         </Button>
//                         <Button
//                             type="primary"
//                             danger
//                             onClick={handleFreezeAllocation}
//                         >
//                             🔒 Freeze Leave Allocation
//                         </Button>
//                     </Space>

//                     {fileUploaded && (
//                         <>
//                             {/* Upload Brief Summary Stats */}
//                             <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
//                                 <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}><InfoCircleOutlined /> Upload Summary Metrics</Title>
//                                 <Row gutter={16}>
//                                     <Col span={6}>
//                                         <Statistic title="Total Leave Rows Processed" value={summaryStats.totalRows} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Auto-Resolved Pre-Approved" value={summaryStats.matchedCount} styles={{ content: { color: "#3f8600" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="Total Discrepancies Flagged" value={issueRowsOnly.length} styles={{ content: { color: "#cf1322", fontWeight: "bold" } }} />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic title="System Code Errors" value={summaryStats.invalidCodes} styles={{ content: { color: "#722ed1" } }} />
//                                     </Col>
//                                 </Row>
//                             </div>

//                             {/* Single Line Per Staff Statement Sheet Summary */}
//                             <Card title={<span style={{ fontWeight: "600" }}><UserOutlined /> Staff Consolidated Overview Statements</span>} size="small" style={{ borderColor: "#d9d9d9" }}>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
//                                     {staffSummaries.map((staff) => (
//                                         <div key={staff.employee_code} style={{
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             padding: "6px 0",
//                                             borderBottom: '1px solid #f0f0f0'
//                                         }}>
//                                             <Text strong style={{ width: "80px" }}>{staff.employee_code}</Text>
//                                             <Text style={{ width: "200px" }}>{staff.full_name}</Text>
//                                             <div style={{ flex: 1 }}>
//                                                 <Text type="secondary">Total Sheet Leave Counted: </Text>
//                                                 <Tag color="blue" style={{ fontWeight: "bold" }}>{staff.total_leaves} Day(s)</Tag>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* Discrepancies Table Log */}
//                             <Title level={4} style={{ marginBottom: 8, marginTop: 12 }}><AlertOutlined style={{ color: "#cf1322" }} /> System Discrepancies & Flagged Action Items ({issueRowsOnly.length})</Title>
//                             <Table
//                                 dataSource={issueRowsOnly}
//                                 columns={columns}
//                                 loading={loading}
//                                 pagination={{ pageSize: 10 }}
//                                 locale={{ emptyText: "No discrepancies or unauthorized leaves discovered in this statement file!" }}
//                             />
//                         </>
//                     )}
//                 </Space>
//             </Card>
//         </div>
//     );
// }













