



// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// interface EmployeeAttendanceSummary {
//   employee_code: string;
//   total_worked_hours: number;
//   overtime_hours: number;
//   shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [staffSummaries, setStaffSummaries] = useState<any[]>([]);
//   const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//   const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//   // Helper to normalize employee codes ("005" -> "5") to prevent mismatching
//   const cleanEmpCode = (code: any): string => {
//     if (!code) return '';
//     return String(code).trim().replace(/^0+/, '');
//   };

//   const parseTimeToDecimalHours = (timeVal: any): number | null => {
//     if (timeVal === undefined || timeVal === null) return null;
//     const str = String(timeVal).trim();
//     if (!str || str.toLowerCase() === 'nan') return null;

//     const parts = str.split(':');
//     if (parts.length >= 2) {
//       const hrs = parseInt(parts[0], 10);
//       const mins = parseInt(parts[1], 10);
//       if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//     }
//     return null;
//   };

//   const handleFileUpload = (file: RcFile): boolean => {
//     setLoading(true);
//     setStaffSummaries([]);
//     setFileUploaded(false);

//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       try {
//         const data = e.target?.result;
//         const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//         // 1. Detect Month & Year from "Att. Date"
//         let detectedMonth: number | null = null;
//         let detectedYear: number | null = null;
//         let dateColIdx = -1;

//         for (const row of rawRows) {
//           if (!row || row.length === 0) continue;
//           const rowCells = row.map((cell: any) =>
//             cell !== undefined && cell !== null ? String(cell).trim() : ''
//           );

//           if (rowCells.includes('Att. Date')) {
//             dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//             continue;
//           }

//           if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//             const rawDateVal = rowCells[dateColIdx];
//             if (rawDateVal) {
//               const parsedDate = dayjs(rawDateVal);
//               if (parsedDate.isValid()) {
//                 detectedMonth = parsedDate.month() + 1; // 1 to 12
//                 detectedYear = parsedDate.year();
//                 break;
//               }
//             }
//           }
//         }

//         const autoMonth = detectedMonth || dayjs().month() + 1;
//         const autoYear = detectedYear || dayjs().year();
//         setDetectedPeriod({ month: autoMonth, year: autoYear });

//         const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;

//         // 2. Fetch staff employees from Supabase
//         const { data: dbEmployees, error: dbError } = await supabase
//           .schema('leave_management')
//           .from('employees')
//           .select(`
//             id,
//             employee_code,
//             full_name,
//             role,
//             retention_amount,
//             salary_structures (
//               stage_name,
//               base_salary,
//               effective_from,
//               effective_to
//             )
//           `)
//           .eq('role', 'staff');

//         if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//         // 3. Fetch LOP records for auto-detected month & year
//         const { data: lopRecords, error: lopError } = await supabase
//           .schema('leave_management')
//           .from('leaves')
//           .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//         if (lopError) {
//           console.warn('Could not fetch LOP records:', lopError.message);
//         }

//         const lopDaysMap = new Map<string, number>();

//         (lopRecords || []).forEach((rec: any) => {
//           const allocatedType = String(rec.allocated_type || '').toUpperCase();
//           const sourceYear = rec.allocation_source_year;
//           const sourceMonth = rec.allocation_source_month;

//           const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//           const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//           const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//           if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//             let dayWeight = 1.0;

//             const halfStr = String(rec.half || '').toUpperCase();
//             if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//               dayWeight = 0.5;
//             }

//             const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//             lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//           }
//         });

//         // 4. Parse Biometric Excel solely based on Tot. Dur. using standard for...of loop
//         let currentEmpCode = '';
//         let totDurColIdx = -1;

//         const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//         for (const row of rawRows) {
//           if (!row || row.length === 0) continue;

//           const rowCells = row.map((cell: any) =>
//             cell !== undefined && cell !== null ? String(cell).trim() : ''
//           );
//           const rowText = rowCells.join(' ');

//           // Detect Employee Code row
//           if (rowText.includes('Emp Code:') || rowText.includes('Employee Code:')) {
//             const empCodeIdx = rowCells.findIndex((c: string) => c === 'Emp Code:' || c === 'Employee Code:');
//             if (empCodeIdx !== -1 && rowCells[empCodeIdx + 1]) {
//               currentEmpCode = cleanEmpCode(rowCells[empCodeIdx + 1]);
//               if (!attendanceMap.has(currentEmpCode)) {
//                 attendanceMap.set(currentEmpCode, {
//                   employee_code: currentEmpCode,
//                   total_worked_hours: 0,
//                   overtime_hours: 0,
//                   shortage_hours: 0,
//                 });
//               }
//             }
//             continue;
//           }

//           // Detect Column Headers
//           if (rowText.includes('Att. Date') || rowText.includes('Tot. Dur.')) {
//             dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//             totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.' || c === 'Work Dur.');
//             continue;
//           }

//           // Process Attendance Row
//           if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//             const dateStr = rowCells[dateColIdx];

//             if (dateStr && dateStr.includes('-') && dateStr.length >= 8) {
//               const summary = attendanceMap.get(currentEmpCode) || {
//                 employee_code: currentEmpCode,
//                 total_worked_hours: 0,
//                 overtime_hours: 0,
//                 shortage_hours: 0,
//               };

//               const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//               const dailyWorkedHours = parseTimeToDecimalHours(totDurStr);

//               // Ignore 00:00 / Absent / Invalid records
//               if (dailyWorkedHours !== null && dailyWorkedHours > 0) {
//                 summary.total_worked_hours += dailyWorkedHours;

//                 // Determine target: Half-day (4h standard) vs Full-day (8h standard)
//                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                 if (dailyWorkedHours > targetHours) {
//                   summary.overtime_hours += dailyWorkedHours - targetHours;
//                 } else if (dailyWorkedHours < targetHours) {
//                   summary.shortage_hours += targetHours - dailyWorkedHours;
//                 }
//               }

//               attendanceMap.set(currentEmpCode, summary);
//             }
//           }
//         }

//         // 5. Build final report objects
//         const calculatedPayrolls = (dbEmployees || []).map((emp) => {
//           const empCodeClean = cleanEmpCode(emp.employee_code);

//           const attendance = attendanceMap.get(empCodeClean) || {
//             employee_code: emp.employee_code,
//             total_worked_hours: 0,
//             overtime_hours: 0,
//             shortage_hours: 0,
//           };

//           const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

//           const salaryResult = calculateSalary(emp, {
//             targetDate: targetDateStr,
//             lopDays: lopDaysFromDb,
//           });

//           return {
//             key: emp.id,
//             ...attendance,
//             ...salaryResult,
//             full_name: emp.full_name,
//             total_worked_hours: Number(attendance.total_worked_hours.toFixed(2)),
//             overtime_hours: Number(attendance.overtime_hours.toFixed(2)),
//             shortage_hours: Number(attendance.shortage_hours.toFixed(2)),
//           };
//         });

//         setStaffSummaries(calculatedPayrolls);
//         setFileUploaded(true);
//         message.success(
//           `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//         );
//       } catch (err: any) {
//         console.error(err);
//         message.error(err.message || 'An error occurred during calculation');
//       } finally {
//         setLoading(false);
//       }
//     };

//     reader.readAsArrayBuffer(file);
//     return false;
//   };

//   const columns = [
//     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//     {
//       title: 'Active Stage',
//       dataIndex: 'activeStage',
//       key: 'activeStage',
//       render: (stage: string) => <Tag color="blue">{stage}</Tag>,
//     },
//     {
//       title: 'Base Salary',
//       dataIndex: 'baseSalary',
//       key: 'baseSalary',
//       render: (amt: number) => `₹${amt?.toLocaleString()}`,
//     },
//     {
//       title: 'Total Worked Hours',
//       dataIndex: 'total_worked_hours',
//       key: 'total_worked_hours',
//       render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//     },
//     {
//       title: 'Overtime Hours',
//       dataIndex: 'overtime_hours',
//       key: 'overtime_hours',
//       render: (hrs: number) => (
//         <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//           {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//         </span>
//       ),
//     },
//     {
//       title: 'Shortage Hours',
//       dataIndex: 'shortage_hours',
//       key: 'shortage_hours',
//       render: (hrs: number) => (
//         <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//           {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//         </span>
//       ),
//     },
//     {
//       title: 'LOP Days',
//       dataIndex: 'lopDays',
//       key: 'lopDays',
//       render: (days: number) => (
//         <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//           {days} days
//         </span>
//       ),
//     },
//     {
//       title: 'LOP Deduction',
//       dataIndex: 'lopDeduction',
//       key: 'lopDeduction',
//       render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{amt?.toLocaleString()}</span>,
//     },
//     {
//       title: 'Retention Deducted',
//       dataIndex: 'retainedAmount',
//       key: 'retainedAmount',
//       render: (amt: number) => <span style={{ color: '#d32f2f' }}>-₹{amt?.toLocaleString()}</span>,
//     },
//     {
//       title: 'Net Payable',
//       dataIndex: 'netPayable',
//       key: 'netPayable',
//       render: (amt: number) => <strong>₹{amt?.toLocaleString()}</strong>,
//     },
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//           <Button icon={<UploadOutlined />} loading={loading} type="primary">
//             Select & Parse Biometric Excel
//           </Button>
//         </Upload>
//       </Card>

//       {fileUploaded && detectedPeriod && (
//         <Card
//           title={`Verified Salary & Attendance Report (${dayjs()
//             .month(detectedPeriod.month - 1)
//             .format('MMMM')} ${detectedPeriod.year})`}
//         >
//           <Table 
//             dataSource={staffSummaries} 
//             columns={columns} 
//             loading={loading} 
//             pagination={{ pageSize: 10 }} 
//             scroll={{ x: true }}
//           />
//         </Card>
//       )}
//     </div>
//   );
// }








// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//     employee_code: string;
//     total_worked_hours: number;
//     overtime_hours: number;
//     shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//     const [loading, setLoading] = useState<boolean>(false);
//     const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//     const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//     const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//     const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//     // Helper to normalize employee codes ("005" -> "5") to prevent mismatching
//     const cleanEmpCode = (code: any): string => {
//         if (!code) return '';
//         return String(code).trim().replace(/^0+/, '');
//     };

//     const parseTimeToDecimalHours = (timeVal: any): number | null => {
//         if (timeVal === undefined || timeVal === null) return null;
//         const str = String(timeVal).trim();
//         if (!str || str.toLowerCase() === 'nan') return null;

//         const parts = str.split(':');
//         if (parts.length >= 2) {
//             const hrs = parseInt(parts[0], 10);
//             const mins = parseInt(parts[1], 10);
//             if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//         }
//         return null;
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setRegularStaffSummaries([]);
//         setDailyWageStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 // 1. Detect Month & Year from "Att. Date"
//                 let detectedMonth: number | null = null;
//                 let detectedYear: number | null = null;
//                 let dateColIdx = -1;

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;
//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );

//                     if (rowCells.includes('Att. Date')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const rawDateVal = rowCells[dateColIdx];
//                         if (rawDateVal) {
//                             const parsedDate = dayjs(rawDateVal);
//                             if (parsedDate.isValid()) {
//                                 detectedMonth = parsedDate.month() + 1; // 1 to 12
//                                 detectedYear = parsedDate.year();
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 const autoMonth = detectedMonth || dayjs().month() + 1;
//                 const autoYear = detectedYear || dayjs().year();
//                 setDetectedPeriod({ month: autoMonth, year: autoYear });

//                 const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//                 const payrollStartMonthDate = dayjs(targetDateStr);

//                 // 2. Fetch staff employees using column 'daily_wage_rate'
//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema('leave_management')
//                     .from('employees')
//                     .select(`
//   id,
//   employee_code,
//   full_name,
//   role,
//   normal_salary,
//   probation_salary,
//   retention_amount,
//   is_daily_wage_joining_month,
//   daily_wage_until,
//   is_permanently_daily,
//   daily_wage_rate,
//   salary_structures (
//     stage_name,
//     base_salary,
//     effective_from,
//     effective_to
//   )
// `)
//                     .eq('role', 'staff');

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//                 // 3. Fetch LOP records for auto-detected month & year
//                 const { data: lopRecords, error: lopError } = await supabase
//                     .schema('leave_management')
//                     .from('leaves')
//                     .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//                 if (lopError) {
//                     console.warn('Could not fetch LOP records:', lopError.message);
//                 }

//                 const lopDaysMap = new Map<string, number>();

//                 (lopRecords || []).forEach((rec: any) => {
//                     const allocatedType = String(rec.allocated_type || '').toUpperCase();
//                     const sourceYear = rec.allocation_source_year;
//                     const sourceMonth = rec.allocation_source_month;

//                     const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//                     const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//                     const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//                     if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//                         let dayWeight = 1.0;

//                         const halfStr = String(rec.half || '').toUpperCase();
//                         if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//                             dayWeight = 0.5;
//                         }

//                         const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//                         lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//                     }
//                 });

//                 // Helper: Clean up employee code string safely
//                 const cleanEmpCode = (code: any): string => {
//                     if (!code) return '';
//                     return String(code).trim();
//                 };

//                 // 4. Parse Biometric Excel
//                 let currentEmpCode = '';

//                 let totDurColIdx = -1;
//                 let workDurColIdx = -1;

//                 const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;

//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );
//                     const rowText = rowCells.join(' ');

//                     // 1. Detect Employee Code
//                     if (rowText.includes('Emp Code:') || rowText.includes('Employee Code:')) {
//                         const empCodeIdx = rowCells.findIndex((c: string) => c === 'Emp Code:' || c === 'Employee Code:');
//                         if (empCodeIdx !== -1 && rowCells[empCodeIdx + 1]) {
//                             currentEmpCode = cleanEmpCode(rowCells[empCodeIdx + 1]);
//                             if (!attendanceMap.has(currentEmpCode)) {
//                                 attendanceMap.set(currentEmpCode, {
//                                     employee_code: currentEmpCode,
//                                     total_worked_hours: 0,
//                                     overtime_hours: 0,
//                                     shortage_hours: 0,
//                                 });
//                             }
//                         }
//                         continue;
//                     }

//                     // 2. Detect Table Headers
//                     if (rowText.includes('Att. Date') || rowText.includes('Tot. Dur.') || rowText.includes('Work Dur.')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.');
//                         workDurColIdx = rowCells.findIndex((c: string) => c === 'Work Dur.');
//                         continue;
//                     }

//                     // 3. Process Daily Rows
//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const dateVal = rowCells[dateColIdx];

//                         // Verify row has a valid date entry (e.g. "27-Jun-2026")
//                         const isValidDateRow =
//                             dateVal &&
//                             (dayjs(dateVal).isValid() ||
//                                 dateVal.includes('-') ||
//                                 dateVal.includes('/') ||
//                                 String(dateVal).length >= 8);

//                         if (isValidDateRow && currentEmpCode) {
//                             const summary = attendanceMap.get(currentEmpCode) || {
//                                 employee_code: currentEmpCode,
//                                 total_worked_hours: 0,
//                                 overtime_hours: 0,
//                                 shortage_hours: 0,
//                             };

//                             // Fallback: Read Tot. Dur. first, if 0 / null, fall back to Work Dur.
//                             const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//                             const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//                             const totHours = parseTimeToDecimalHours(totDurStr) || 0;
//                             const workHours = parseTimeToDecimalHours(workDurStr) || 0;

//                             // Pick the max duration present for the row
//                             const dailyWorkedHours = Math.max(totHours, workHours);

//                             if (dailyWorkedHours > 0) {
//                                 summary.total_worked_hours += dailyWorkedHours;

//                                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                                 if (dailyWorkedHours > targetHours) {
//                                     summary.overtime_hours += dailyWorkedHours - targetHours;
//                                 } else if (dailyWorkedHours < targetHours) {
//                                     summary.shortage_hours += targetHours - dailyWorkedHours;
//                                 }
//                             }

//                             attendanceMap.set(currentEmpCode, summary);
//                         }
//                     }
//                 }

//                 // 5. Separate calculations
//                 const regularStaff: any[] = [];
//                 const dailyWageStaff: any[] = [];

//                 (dbEmployees || []).forEach((emp) => {
//                     const empCodeClean = cleanEmpCode(emp.employee_code);

//                     const attendance = attendanceMap.get(empCodeClean) || {
//                         employee_code: emp.employee_code,
//                         total_worked_hours: 0,
//                         overtime_hours: 0,
//                         shortage_hours: 0,
//                     };

//                     // Check if Daily Wage
//                     let isDailyWage = false;

//                     if (emp.is_permanently_daily === true) {
//                         isDailyWage = true;
//                     } else if (emp.is_daily_wage_joining_month === true) {
//                         if (emp.daily_wage_until) {
//                             const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
//                                 ? dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'])
//                                 : dayjs(emp.daily_wage_until);

//                             // Daily wage if payroll month is on or before the untilDate's month
//                             isDailyWage = untilDate.isSameOrAfter(payrollStartMonthDate, 'month');
//                         } else {
//                             isDailyWage = true;
//                         }
//                     }

//                     if (isDailyWage) {
//                         // 1. Cleanly parse and round total worked hours to 2 decimal places
//                         const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;

//                         // 2. Hourly rate directly from database
//                         const hourlyRate = emp.daily_wage_rate || 0;

//                         // 3. Final salary calculation
//                         const netPayable = Math.round(totalWorkedHours * hourlyRate);

//                         dailyWageStaff.push({
//                             key: emp.id,
//                             employeeCode: emp.employee_code,
//                             full_name: emp.full_name,
//                             total_worked_hours: totalWorkedHours,
//                             daily_wage_rate: hourlyRate,
//                             netPayable: netPayable,
//                         });
//                     } else {
//                         // Regular Staff logic
//                         const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;
//                         const salaryResult = calculateSalary(emp, {
//                             targetDate: targetDateStr,
//                             lopDays: lopDaysFromDb,
//                         });

//                         regularStaff.push({
//                             key: emp.id,
//                             ...attendance,
//                             ...salaryResult,
//                             full_name: emp.full_name,
//                             total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//                             overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//                             shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//                         });
//                     }
//                 });

//                 setRegularStaffSummaries(regularStaff);
//                 setDailyWageStaffSummaries(dailyWageStaff);
//                 setFileUploaded(true);

//                 message.success(
//                     `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || 'An error occurred during calculation');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };

//     // Regular Staff Table Columns
//     const regularColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Active Stage',
//             dataIndex: 'activeStage',
//             key: 'activeStage',
//             render: (stage: string) => <Tag color="blue">{stage}</Tag>,
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'baseSalary',
//             key: 'baseSalary',
//             render: (amt: number) => `₹${amt?.toLocaleString()}`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Overtime Hours',
//             dataIndex: 'overtime_hours',
//             key: 'overtime_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Shortage Hours',
//             dataIndex: 'shortage_hours',
//             key: 'shortage_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Days',
//             dataIndex: 'lopDays',
//             key: 'lopDays',
//             render: (days: number) => (
//                 <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//                     {days} days
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Deduction',
//             dataIndex: 'lopDeduction',
//             key: 'lopDeduction',
//             render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{amt?.toLocaleString()}</span>,
//         },
//         {
//             title: 'Retention Deducted',
//             dataIndex: 'retainedAmount',
//             key: 'retainedAmount',
//             render: (amt: number) => <span style={{ color: '#d32f2f' }}>-₹{amt?.toLocaleString()}</span>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     // Daily Wage Staff Table Columns
//     const dailyWageColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Hourly Rate',
//             dataIndex: 'daily_wage_rate',
//             key: 'daily_wage_rate',
//             render: (amt: number) => `₹${amt?.toLocaleString() || 0} / hr`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//                 <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//                     <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                         Select & Parse Biometric Excel
//                     </Button>
//                 </Upload>
//             </Card>

//             {fileUploaded && detectedPeriod && (
//                 <Card
//                     title={`Payroll Report (${dayjs()
//                         .month(detectedPeriod.month - 1)
//                         .format('MMMM')} ${detectedPeriod.year})`}
//                 >
//                     <Tabs
//                         defaultActiveKey="regular"
//                         items={[
//                             {
//                                 key: 'regular',
//                                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={regularStaffSummaries}
//                                         columns={regularColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                             {
//                                 key: 'dailyWage',
//                                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={dailyWageStaffSummaries}
//                                         columns={dailyWageColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                         ]}
//                     />
//                 </Card>
//             )}
//         </div>
//     );
// }














// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//     employee_code: string;
//     total_worked_hours: number;
//     overtime_hours: number;
//     shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//     const [loading, setLoading] = useState<boolean>(false);
//     const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//     const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//     const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//     const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//     // Helper to normalize employee codes ("005" -> "5") to prevent mismatching
//     const cleanEmpCode = (code: any): string => {
//         if (!code) return '';
//         return String(code).trim().replace(/^0+/, '');
//     };

//     const parseTimeToDecimalHours = (timeVal: any): number | null => {
//         if (timeVal === undefined || timeVal === null) return null;
//         const str = String(timeVal).trim();
//         if (!str || str.toLowerCase() === 'nan') return null;

//         const parts = str.split(':');
//         if (parts.length >= 2) {
//             const hrs = parseInt(parts[0], 10);
//             const mins = parseInt(parts[1], 10);
//             if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//         }
//         return null;
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setRegularStaffSummaries([]);
//         setDailyWageStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 // 1. Detect Month & Year from "Att. Date"
//                 let detectedMonth: number | null = null;
//                 let detectedYear: number | null = null;
//                 let dateColIdx = -1;

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;
//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );

//                     if (rowCells.includes('Att. Date')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const rawDateVal = rowCells[dateColIdx];
//                         if (rawDateVal) {
//                             const parsedDate = dayjs(rawDateVal);
//                             if (parsedDate.isValid()) {
//                                 detectedMonth = parsedDate.month() + 1; // 1 to 12
//                                 detectedYear = parsedDate.year();
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 const autoMonth = detectedMonth || dayjs().month() + 1;
//                 const autoYear = detectedYear || dayjs().year();
//                 setDetectedPeriod({ month: autoMonth, year: autoYear });

//                 const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//                 const payrollStartMonthDate = dayjs(targetDateStr);

//                 // 2. Fetch staff employees using column 'daily_wage_rate'
//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema('leave_management')
//                     .from('employees')
//                     .select(`
//   id,
//   employee_code,
//   full_name,
//   role,
//   normal_salary,
//   probation_salary,
//   retention_amount,
//   is_daily_wage_joining_month,
//   daily_wage_until,
//   is_permanently_daily,
//   daily_wage_rate,
//   salary_structures (
//     stage_name,
//     base_salary,
//     effective_from,
//     effective_to
//   )
// `)
//                     .eq('role', 'staff');

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//                 // 3. Fetch LOP records for auto-detected month & year
//                 const { data: lopRecords, error: lopError } = await supabase
//                     .schema('leave_management')
//                     .from('leaves')
//                     .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//                 if (lopError) {
//                     console.warn('Could not fetch LOP records:', lopError.message);
//                 }

//                 const lopDaysMap = new Map<string, number>();

//                 (lopRecords || []).forEach((rec: any) => {
//                     const allocatedType = String(rec.allocated_type || '').toUpperCase();
//                     const sourceYear = rec.allocation_source_year;
//                     const sourceMonth = rec.allocation_source_month;

//                     const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//                     const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//                     const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//                     if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//                         let dayWeight = 1.0;

//                         const halfStr = String(rec.half || '').toUpperCase();
//                         if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//                             dayWeight = 0.5;
//                         }

//                         const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//                         lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//                     }
//                 });

//                 // Helper: Clean up employee code string safely
//                 const cleanEmpCode = (code: any): string => {
//                     if (!code) return '';
//                     return String(code).trim();
//                 };

//                 // 4. Parse Biometric Excel
//                 let currentEmpCode = '';

//                 let totDurColIdx = -1;
//                 let workDurColIdx = -1;

//                 const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;

//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );
//                     const rowText = rowCells.join(' ');

//                     // 1. Detect Employee Code
//                     if (rowText.includes('Emp Code:') || rowText.includes('Employee Code:')) {
//                         const empCodeIdx = rowCells.findIndex((c: string) => c === 'Emp Code:' || c === 'Employee Code:');
//                         if (empCodeIdx !== -1 && rowCells[empCodeIdx + 1]) {
//                             currentEmpCode = cleanEmpCode(rowCells[empCodeIdx + 1]);
//                             if (!attendanceMap.has(currentEmpCode)) {
//                                 attendanceMap.set(currentEmpCode, {
//                                     employee_code: currentEmpCode,
//                                     total_worked_hours: 0,
//                                     overtime_hours: 0,
//                                     shortage_hours: 0,
//                                 });
//                             }
//                         }
//                         continue;
//                     }

//                     // 2. Detect Table Headers
//                     if (rowText.includes('Att. Date') || rowText.includes('Tot. Dur.') || rowText.includes('Work Dur.')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.');
//                         workDurColIdx = rowCells.findIndex((c: string) => c === 'Work Dur.');
//                         continue;
//                     }

//                     // 3. Process Daily Rows
//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const dateVal = rowCells[dateColIdx];

//                         // Verify row has a valid date entry (e.g. "27-Jun-2026")
//                         const isValidDateRow =
//                             dateVal &&
//                             (dayjs(dateVal).isValid() ||
//                                 dateVal.includes('-') ||
//                                 dateVal.includes('/') ||
//                                 String(dateVal).length >= 8);

//                         if (isValidDateRow && currentEmpCode) {
//                             const summary = attendanceMap.get(currentEmpCode) || {
//                                 employee_code: currentEmpCode,
//                                 total_worked_hours: 0,
//                                 overtime_hours: 0,
//                                 shortage_hours: 0,
//                             };

//                             // Fallback: Read Tot. Dur. first, if 0 / null, fall back to Work Dur.
//                             const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//                             const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//                             const totHours = parseTimeToDecimalHours(totDurStr) || 0;
//                             const workHours = parseTimeToDecimalHours(workDurStr) || 0;

//                             // Pick the max duration present for the row
//                             const dailyWorkedHours = Math.max(totHours, workHours);

//                             if (dailyWorkedHours > 0) {
//                                 summary.total_worked_hours += dailyWorkedHours;

//                                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                                 if (dailyWorkedHours > targetHours) {
//                                     summary.overtime_hours += dailyWorkedHours - targetHours;
//                                 } else if (dailyWorkedHours < targetHours) {
//                                     summary.shortage_hours += targetHours - dailyWorkedHours;
//                                 }
//                             }

//                             attendanceMap.set(currentEmpCode, summary);
//                         }
//                     }
//                 }

//                 // 5. Separate calculations
//                 const regularStaff: any[] = [];
//                 const dailyWageStaff: any[] = [];

//                 (dbEmployees || []).forEach((emp) => {
//                     const empCodeClean = cleanEmpCode(emp.employee_code);

//                     const attendance = attendanceMap.get(empCodeClean) || {
//                         employee_code: emp.employee_code,
//                         total_worked_hours: 0,
//                         overtime_hours: 0,
//                         shortage_hours: 0,
//                     };

//                     // Check if Daily Wage
//                     let isDailyWage = false;

//                     // if (emp.is_permanently_daily === true) {
//                     //     isDailyWage = true;
//                     // } else if (emp.is_daily_wage_joining_month === true) {
//                     //     if (emp.daily_wage_until) {
//                     //         const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
//                     //             ? dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'])
//                     //             : dayjs(emp.daily_wage_until);

//                     //         // Daily wage if payroll month is on or before the untilDate's month
//                     //         isDailyWage = untilDate.isSameOrAfter(payrollStartMonthDate, 'month');
//                     //     } else {
//                     //         isDailyWage = true;
//                     //     }
//                     // }





//                     if (isDailyWage) {
//                         // 1. Cleanly parse and round total worked hours to 2 decimal places
//                         const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;

//                         // 2. Hourly rate directly from database
//                         const hourlyRate = emp.daily_wage_rate || 0;

//                         // 3. Final salary calculation
//                         const netPayable = Math.round(totalWorkedHours * hourlyRate);

//                         dailyWageStaff.push({
//                             key: emp.id,
//                             employeeCode: emp.employee_code,
//                             full_name: emp.full_name,
//                             total_worked_hours: totalWorkedHours,
//                             daily_wage_rate: hourlyRate,
//                             netPayable: netPayable,
//                         });
//                     } else {
//                         // Regular Staff logic
//                         const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;
//                         const salaryResult = calculateSalary(emp, {
//                             targetDate: targetDateStr,
//                             lopDays: lopDaysFromDb,
//                         });

//                         regularStaff.push({
//                             key: emp.id,
//                             ...attendance,
//                             ...salaryResult,
//                             full_name: emp.full_name,
//                             total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//                             overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//                             shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//                         });
//                     }
//                 });

//                 setRegularStaffSummaries(regularStaff);
//                 setDailyWageStaffSummaries(dailyWageStaff);
//                 setFileUploaded(true);

//                 message.success(
//                     `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || 'An error occurred during calculation');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };

//     // Regular Staff Table Columns
//     const regularColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Active Stage',
//             dataIndex: 'activeStage',
//             key: 'activeStage',
//             render: (stage: string) => <Tag color="blue">{stage}</Tag>,
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'baseSalary',
//             key: 'baseSalary',
//             render: (amt: number) => `₹${amt?.toLocaleString()}`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Overtime Hours',
//             dataIndex: 'overtime_hours',
//             key: 'overtime_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Shortage Hours',
//             dataIndex: 'shortage_hours',
//             key: 'shortage_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Days',
//             dataIndex: 'lopDays',
//             key: 'lopDays',
//             render: (days: number) => (
//                 <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//                     {days} days
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Deduction',
//             dataIndex: 'lopDeduction',
//             key: 'lopDeduction',
//             render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{amt?.toLocaleString()}</span>,
//         },
//         {
//             title: 'Retention Deducted',
//             dataIndex: 'retainedAmount',
//             key: 'retainedAmount',
//             render: (amt: number) => <span style={{ color: '#d32f2f' }}>-₹{amt?.toLocaleString()}</span>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     // Daily Wage Staff Table Columns
//     const dailyWageColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Hourly Rate',
//             dataIndex: 'daily_wage_rate',
//             key: 'daily_wage_rate',
//             render: (amt: number) => `₹${amt?.toLocaleString() || 0} / hr`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//                 <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//                     <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                         Select & Parse Biometric Excel
//                     </Button>
//                 </Upload>
//             </Card>

//             {fileUploaded && detectedPeriod && (
//                 <Card
//                     title={`Payroll Report (${dayjs()
//                         .month(detectedPeriod.month - 1)
//                         .format('MMMM')} ${detectedPeriod.year})`}
//                 >
//                     <Tabs
//                         defaultActiveKey="regular"
//                         items={[
//                             {
//                                 key: 'regular',
//                                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={regularStaffSummaries}
//                                         columns={regularColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                             {
//                                 key: 'dailyWage',
//                                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={dailyWageStaffSummaries}
//                                         columns={dailyWageColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                         ]}
//                     />
//                 </Card>
//             )}
//         </div>
//     );
// }













// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//     employee_code: string;
//     total_worked_hours: number;
//     overtime_hours: number;
//     shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//     const [loading, setLoading] = useState<boolean>(false);
//     const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//     const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//     const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//     const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//     const cleanEmpCode = (code: any): string => {
//         if (!code) return '';
//         return String(code).trim().replace(/^0+/, '');
//     };

//     const parseTimeToDecimalHours = (timeVal: any): number | null => {
//         if (timeVal === undefined || timeVal === null) return null;
//         const str = String(timeVal).trim();
//         if (!str || str.toLowerCase() === 'nan') return null;

//         const parts = str.split(':');
//         if (parts.length >= 2) {
//             const hrs = parseInt(parts[0], 10);
//             const mins = parseInt(parts[1], 10);
//             if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//         }
//         return null;
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setRegularStaffSummaries([]);
//         setDailyWageStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 // 1. Detect Month & Year from "Att. Date"
//                 let detectedMonth: number | null = null;
//                 let detectedYear: number | null = null;
//                 let dateColIdx = -1;

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;
//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );

//                     if (rowCells.includes('Att. Date')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const rawDateVal = rowCells[dateColIdx];
//                         if (rawDateVal) {
//                             const parsedDate = dayjs(rawDateVal);
//                             if (parsedDate.isValid()) {
//                                 detectedMonth = parsedDate.month() + 1; // 1 to 12
//                                 detectedYear = parsedDate.year();
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 const autoMonth = detectedMonth || dayjs().month() + 1;
//                 const autoYear = detectedYear || dayjs().year();
//                 setDetectedPeriod({ month: autoMonth, year: autoYear });

//                 const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//                 const payrollStartMonthDate = dayjs(targetDateStr);

//                 // 2. Fetch staff employees
//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema('leave_management')
//                     .from('employees')
//                     .select(`
//                       id,
//                       employee_code,
//                       full_name,
//                       role,
//                       normal_salary,
//                       probation_salary,
//                       retention_amount,
//                       is_daily_wage_joining_month,
//                       daily_wage_until,
//                       is_permanently_daily,
//                       daily_wage_rate,
//                       salary_structures (
//                         stage_name,
//                         base_salary,
//                         effective_from,
//                         effective_to
//                       )
//                     `)
//                     .eq('role', 'staff');

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//                 // 3. Fetch LOP records for auto-detected month & year
//                 const { data: lopRecords, error: lopError } = await supabase
//                     .schema('leave_management')
//                     .from('leaves')
//                     .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//                 if (lopError) {
//                     console.warn('Could not fetch LOP records:', lopError.message);
//                 }

//                 const lopDaysMap = new Map<string, number>();

//                 (lopRecords || []).forEach((rec: any) => {
//                     const allocatedType = String(rec.allocated_type || '').toUpperCase();
//                     const sourceYear = rec.allocation_source_year;
//                     const sourceMonth = rec.allocation_source_month;

//                     const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//                     const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//                     const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//                     if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//                         let dayWeight = 1.0;

//                         const halfStr = String(rec.half || '').toUpperCase();
//                         if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//                             dayWeight = 0.5;
//                         }

//                         const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//                         lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//                     }
//                 });

//                 // 4. Parse Biometric Excel
//                 let currentEmpCode = '';
//                 let totDurColIdx = -1;
//                 let workDurColIdx = -1;

//                 const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;

//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );
//                     const rowText = rowCells.join(' ');

//                     if (rowText.includes('Emp Code:') || rowText.includes('Employee Code:')) {
//                         const empCodeIdx = rowCells.findIndex((c: string) => c === 'Emp Code:' || c === 'Employee Code:');
//                         if (empCodeIdx !== -1 && rowCells[empCodeIdx + 1]) {
//                             currentEmpCode = cleanEmpCode(rowCells[empCodeIdx + 1]);
//                             if (!attendanceMap.has(currentEmpCode)) {
//                                 attendanceMap.set(currentEmpCode, {
//                                     employee_code: currentEmpCode,
//                                     total_worked_hours: 0,
//                                     overtime_hours: 0,
//                                     shortage_hours: 0,
//                                 });
//                             }
//                         }
//                         continue;
//                     }

//                     if (rowText.includes('Att. Date') || rowText.includes('Tot. Dur.') || rowText.includes('Work Dur.')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.');
//                         workDurColIdx = rowCells.findIndex((c: string) => c === 'Work Dur.');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const dateVal = rowCells[dateColIdx];

//                         const isValidDateRow =
//                             dateVal &&
//                             (dayjs(dateVal).isValid() ||
//                                 dateVal.includes('-') ||
//                                 dateVal.includes('/') ||
//                                 String(dateVal).length >= 8);

//                         if (isValidDateRow && currentEmpCode) {
//                             const summary = attendanceMap.get(currentEmpCode) || {
//                                 employee_code: currentEmpCode,
//                                 total_worked_hours: 0,
//                                 overtime_hours: 0,
//                                 shortage_hours: 0,
//                             };

//                             const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//                             const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//                             const totHours = parseTimeToDecimalHours(totDurStr) || 0;
//                             const workHours = parseTimeToDecimalHours(workDurStr) || 0;

//                             const dailyWorkedHours = Math.max(totHours, workHours);

//                             if (dailyWorkedHours > 0) {
//                                 summary.total_worked_hours += dailyWorkedHours;

//                                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                                 if (dailyWorkedHours > targetHours) {
//                                     summary.overtime_hours += dailyWorkedHours - targetHours;
//                                 } else if (dailyWorkedHours < targetHours) {
//                                     summary.shortage_hours += targetHours - dailyWorkedHours;
//                                 }
//                             }

//                             attendanceMap.set(currentEmpCode, summary);
//                         }
//                     }
//                 }

//                 // 5. Separate calculations
//                 const regularStaff: any[] = [];
//                 const dailyWageStaff: any[] = [];

//                 (dbEmployees || []).forEach((emp) => {
//                     const empCodeClean = cleanEmpCode(emp.employee_code);

//                     const attendance = attendanceMap.get(empCodeClean) || {
//                         employee_code: emp.employee_code,
//                         total_worked_hours: 0,
//                         overtime_hours: 0,
//                         shortage_hours: 0,
//                     };

//                     // Evaluate Daily Wage vs Regular
//                     let isDailyWage = false;

//                     if (emp.is_permanently_daily === true) {
//                         isDailyWage = true;
//                     } else if (emp.is_daily_wage_joining_month === true) {
//                         if (emp.daily_wage_until) {
//                             const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
//                                 ? dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'])
//                                 : dayjs(emp.daily_wage_until);

//                             isDailyWage = untilDate.isSameOrAfter(payrollStartMonthDate, 'month');
//                         } else {
//                             isDailyWage = true;
//                         }
//                     }

//                     if (isDailyWage) {
//                         const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
//                         const hourlyRate = emp.daily_wage_rate || 0;
//                         const netPayable = Math.round(totalWorkedHours * hourlyRate);

//                         dailyWageStaff.push({
//                             key: emp.id,
//                             employeeCode: emp.employee_code,
//                             full_name: emp.full_name,
//                             total_worked_hours: totalWorkedHours,
//                             daily_wage_rate: hourlyRate,
//                             netPayable: netPayable,
//                         });
//                     } else {
//                         const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;
//                         const salaryResult = calculateSalary(emp, {
//                             targetDate: targetDateStr,
//                             lopDays: lopDaysFromDb,
//                         });

//                         // RETENTION LOGIC:
//                         // Only deduct retention if employee is out of probation
//                         const isProbation = salaryResult.activeStage === 'Probation';
//                         const retainedAmount = isProbation ? 0 : (emp.retention_amount || 0);

//                         // Recalculate Net Payable considering retention
//                         const netPayable = (salaryResult.netPayable || 0) - retainedAmount;

//                         regularStaff.push({
//                             key: emp.id,
//                             ...attendance,
//                             ...salaryResult,
//                             retainedAmount: retainedAmount,
//                             netPayable: netPayable,
//                             full_name: emp.full_name,
//                             total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//                             overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//                             shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//                         });
//                     }
//                 });

//                 setRegularStaffSummaries(regularStaff);
//                 setDailyWageStaffSummaries(dailyWageStaff);
//                 setFileUploaded(true);

//                 message.success(
//                     `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || 'An error occurred during calculation');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };

//     // Regular Staff Table Columns
//     const regularColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Active Stage',
//             dataIndex: 'activeStage',
//             key: 'activeStage',
//             render: (stage: string) => (
//                 <Tag color={stage === 'Probation' ? 'orange' : 'blue'}>{stage}</Tag>
//             ),
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'baseSalary',
//             key: 'baseSalary',
//             render: (amt: number) => `₹${amt?.toLocaleString()}`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Overtime Hours',
//             dataIndex: 'overtime_hours',
//             key: 'overtime_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Shortage Hours',
//             dataIndex: 'shortage_hours',
//             key: 'shortage_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Days',
//             dataIndex: 'lopDays',
//             key: 'lopDays',
//             render: (days: number) => (
//                 <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//                     {days} days
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Deduction',
//             dataIndex: 'lopDeduction',
//             key: 'lopDeduction',
//             render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{amt?.toLocaleString()}</span>,
//         },
//         {
//             title: 'Retention Deducted',
//             dataIndex: 'retainedAmount',
//             key: 'retainedAmount',
//             render: (amt: number) => (
//                 <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c' }}>
//                     {amt > 0 ? `-₹${amt?.toLocaleString()}` : '₹0'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     // Daily Wage Staff Table Columns
//     const dailyWageColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Hourly Rate',
//             dataIndex: 'daily_wage_rate',
//             key: 'daily_wage_rate',
//             render: (amt: number) => `₹${amt?.toLocaleString() || 0} / hr`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{amt?.toLocaleString()}</strong>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//                 <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//                     <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                         Select & Parse Biometric Excel
//                     </Button>
//                 </Upload>
//             </Card>

//             {fileUploaded && detectedPeriod && (
//                 <Card
//                     title={`Payroll Report (${dayjs()
//                         .month(detectedPeriod.month - 1)
//                         .format('MMMM')} ${detectedPeriod.year})`}
//                 >
//                     <Tabs
//                         defaultActiveKey="regular"
//                         items={[
//                             {
//                                 key: 'regular',
//                                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={regularStaffSummaries}
//                                         columns={regularColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                             {
//                                 key: 'dailyWage',
//                                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={dailyWageStaffSummaries}
//                                         columns={dailyWageColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                         ]}
//                     />
//                 </Card>
//             )}
//         </div>
//     );
// }













// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//     employee_code: string;
//     total_worked_hours: number;
//     overtime_hours: number;
//     shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//     const [loading, setLoading] = useState<boolean>(false);
//     const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//     const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//     const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//     const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//     const cleanEmpCode = (code: any): string => {
//         if (!code) return '';
//         return String(code).trim().replace(/^0+/, '');
//     };

//     const parseTimeToDecimalHours = (timeVal: any): number | null => {
//         if (timeVal === undefined || timeVal === null) return null;
//         const str = String(timeVal).trim();
//         if (!str || str.toLowerCase() === 'nan') return null;

//         const parts = str.split(':');
//         if (parts.length >= 2) {
//             const hrs = parseInt(parts[0], 10);
//             const mins = parseInt(parts[1], 10);
//             if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//         }
//         return null;
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setRegularStaffSummaries([]);
//         setDailyWageStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 // 1. Detect Month & Year from "Att. Date"
//                 let detectedMonth: number | null = null;
//                 let detectedYear: number | null = null;
//                 let dateColIdx = -1;

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;
//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );

//                     if (rowCells.includes('Att. Date')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const rawDateVal = rowCells[dateColIdx];
//                         if (rawDateVal) {
//                             const parsedDate = dayjs(rawDateVal);
//                             if (parsedDate.isValid()) {
//                                 detectedMonth = parsedDate.month() + 1; // 1 to 12
//                                 detectedYear = parsedDate.year();
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 const autoMonth = detectedMonth || dayjs().month() + 1;
//                 const autoYear = detectedYear || dayjs().year();
//                 setDetectedPeriod({ month: autoMonth, year: autoYear });

//                 const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//                 const payrollStartMonthDate = dayjs(targetDateStr);

//                 // 2. Fetch staff employees
//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema('leave_management')
//                     .from('employees')
//                     .select(`
//                       id,
//                       employee_code,
//                       full_name,
//                       role,
//                       normal_salary,
//                       probation_salary,
//                       retention_amount,
//                       is_daily_wage_joining_month,
//                       daily_wage_until,
//                       is_permanently_daily,
//                       daily_wage_rate,
//                       salary_structures (
//                         stage_name,
//                         base_salary,
//                         effective_from,
//                         effective_to
//                       )
//                     `)
//                     .eq('role', 'staff');

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//                 // 3. Fetch LOP records for auto-detected month & year
//                 const { data: lopRecords, error: lopError } = await supabase
//                     .schema('leave_management')
//                     .from('leaves')
//                     .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//                 if (lopError) {
//                     console.warn('Could not fetch LOP records:', lopError.message);
//                 }

//                 const lopDaysMap = new Map<string, number>();

//                 (lopRecords || []).forEach((rec: any) => {
//                     const allocatedType = String(rec.allocated_type || '').toUpperCase();
//                     const sourceYear = rec.allocation_source_year;
//                     const sourceMonth = rec.allocation_source_month;

//                     const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//                     const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//                     const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//                     if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//                         let dayWeight = 1.0;

//                         const halfStr = String(rec.half || '').toUpperCase();
//                         if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//                             dayWeight = 0.5;
//                         }

//                         const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//                         lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//                     }
//                 });

//                 // 4. Parse Biometric Excel
//                 let currentEmpCode = '';
//                 let totDurColIdx = -1;
//                 let workDurColIdx = -1;

//                 const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;

//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );
//                     const rowText = rowCells.join(' ');

//                     if (rowText.includes('Emp Code:') || rowText.includes('Employee Code:')) {
//                         const empCodeIdx = rowCells.findIndex((c: string) => c === 'Emp Code:' || c === 'Employee Code:');
//                         if (empCodeIdx !== -1 && rowCells[empCodeIdx + 1]) {
//                             currentEmpCode = cleanEmpCode(rowCells[empCodeIdx + 1]);
//                             if (!attendanceMap.has(currentEmpCode)) {
//                                 attendanceMap.set(currentEmpCode, {
//                                     employee_code: currentEmpCode,
//                                     total_worked_hours: 0,
//                                     overtime_hours: 0,
//                                     shortage_hours: 0,
//                                 });
//                             }
//                         }
//                         continue;
//                     }

//                     if (rowText.includes('Att. Date') || rowText.includes('Tot. Dur.') || rowText.includes('Work Dur.')) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date');
//                         totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.');
//                         workDurColIdx = rowCells.findIndex((c: string) => c === 'Work Dur.');
//                         continue;
//                     }

//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const dateVal = rowCells[dateColIdx];

//                         const isValidDateRow =
//                             dateVal &&
//                             (dayjs(dateVal).isValid() ||
//                                 dateVal.includes('-') ||
//                                 dateVal.includes('/') ||
//                                 String(dateVal).length >= 8);

//                         if (isValidDateRow && currentEmpCode) {
//                             const summary = attendanceMap.get(currentEmpCode) || {
//                                 employee_code: currentEmpCode,
//                                 total_worked_hours: 0,
//                                 overtime_hours: 0,
//                                 shortage_hours: 0,
//                             };

//                             const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//                             const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//                             const totHours = parseTimeToDecimalHours(totDurStr) || 0;
//                             const workHours = parseTimeToDecimalHours(workDurStr) || 0;

//                             const dailyWorkedHours = Math.max(totHours, workHours);

//                             if (dailyWorkedHours > 0) {
//                                 summary.total_worked_hours += dailyWorkedHours;

//                                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                                 if (dailyWorkedHours > targetHours) {
//                                     summary.overtime_hours += dailyWorkedHours - targetHours;
//                                 } else if (dailyWorkedHours < targetHours) {
//                                     summary.shortage_hours += targetHours - dailyWorkedHours;
//                                 }
//                             }

//                             attendanceMap.set(currentEmpCode, summary);
//                         }
//                     }
//                 }

//                 // 5. Separate calculations
//                 const regularStaff: any[] = [];
// const dailyWageStaff: any[] = [];

// (dbEmployees || []).forEach((emp) => {
//     const empCodeClean = cleanEmpCode(emp.employee_code);

//     const attendance = attendanceMap.get(empCodeClean) || {
//         employee_code: emp.employee_code,
//         total_worked_hours: 0,
//         overtime_hours: 0,
//         shortage_hours: 0,
//     };

//     // Evaluate Daily Wage vs Regular
//     let isDailyWage = false;

//     if (emp.is_permanently_daily === true) {
//         isDailyWage = true;
//     } else if (emp.is_daily_wage_joining_month === true) {
//         if (emp.daily_wage_until) {
//             const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
//                 ? dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'])
//                 : dayjs(emp.daily_wage_until);

//             isDailyWage = untilDate.isSameOrAfter(payrollStartMonthDate, 'month');
//         } else {
//             isDailyWage = true;
//         }
//     }

//     if (isDailyWage) {
//         const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
//         const hourlyRate = emp.daily_wage_rate || 0;
//         const netPayable = Math.round(totalWorkedHours * hourlyRate);

//         dailyWageStaff.push({
//             key: emp.id,
//             employeeCode: emp.employee_code,
//             full_name: emp.full_name,
//             total_worked_hours: totalWorkedHours,
//             daily_wage_rate: hourlyRate,
//             netPayable: netPayable,
//         });
//     } else {
//     const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

//     const salaryResult = calculateSalary(emp, {
//         targetDate: targetDateStr,
//         lopDays: lopDaysFromDb,
//         overtimeHours: attendance.overtime_hours || 0,
//         shortageHours: attendance.shortage_hours || 0,
//     });

//     regularStaff.push({
//         key: emp.id,
//         ...attendance,
//         ...salaryResult,
//         employeeCode: emp.employee_code,
//         full_name: emp.full_name,
//         retainedAmount: salaryResult.retainedAmount,
//         netPayable: salaryResult.netPayable,
//         total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//         overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//         shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//     });
//     }
// });
//                 setRegularStaffSummaries(regularStaff);
//                 setDailyWageStaffSummaries(dailyWageStaff);
//                 setFileUploaded(true);

//                 message.success(
//                     `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || 'An error occurred during calculation');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };

//     // Regular Staff Table Columns
//    // Regular Staff Table Columns
// const regularColumns = [
//     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//     // {
//     //     title: 'Active Stage',
//     //     dataIndex: 'activeStage',
//     //     key: 'activeStage',
//     //     render: (stage: string) => (
//     //         <Tag color={stage === 'Probation' ? 'orange' : 'blue'}>{stage}</Tag>
//     //     ),
//     // },
//     {
//         title: 'Base Salary',
//         dataIndex: 'baseSalary',
//         key: 'baseSalary',
//         render: (amt: number) => `₹${(amt || 0).toLocaleString()}`,
//     },
//     {
//         title: 'Total Worked Hours',
//         dataIndex: 'total_worked_hours',
//         key: 'total_worked_hours',
//         render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//     },
//     {
//         title: 'Overtime Hours',
//         dataIndex: 'overtime_hours',
//         key: 'overtime_hours',
//         render: (hrs: number) => (
//             <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                 {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//             </span>
//         ),
//     },
//     {
//         title: 'Overtime Pay',
//         dataIndex: 'overtimePay',
//         key: 'overtimePay',
//         render: (amt: number) => (
//             <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                 {amt > 0 ? `+₹${amt.toLocaleString()}` : '₹0'}
//             </span>
//         ),
//     },
//     {
//         title: 'Shortage Hours',
//         dataIndex: 'shortage_hours',
//         key: 'shortage_hours',
//         render: (hrs: number) => (
//             <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                 {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//             </span>
//         ),
//     },
//     {
//         title: 'Shortage Deduction',
//         dataIndex: 'shortageDeduction',
//         key: 'shortageDeduction',
//         render: (amt: number) => (
//             <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                 {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//             </span>
//         ),
//     },
//     {
//         title: 'LOP Days',
//         dataIndex: 'lopDays',
//         key: 'lopDays',
//         render: (days: number) => (
//             <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//                 {days || 0} days
//             </span>
//         ),
//     },
//     {
//         title: 'LOP Deduction',
//         dataIndex: 'lopDeduction',
//         key: 'lopDeduction',
//         render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{(amt || 0).toLocaleString()}</span>,
//     },
//     {
//         title: 'Retention Deducted',
//         dataIndex: 'retainedAmount',
//         key: 'retainedAmount',
//         render: (amt: number) => (
//             <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                 {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//             </span>
//         ),
//     },
//     {
//         title: 'Net Payable',
//         dataIndex: 'netPayable',
//         key: 'netPayable',
//         render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
//     },
// ];

//     // Daily Wage Staff Table Columns
//     const dailyWageColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Hourly Rate',
//             dataIndex: 'daily_wage_rate',
//             key: 'daily_wage_rate',
//             render: (amt: number) => `₹${(amt || 0).toLocaleString()} / hr`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{(amt || 0).toLocaleString()}</strong>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//                 <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//                     <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                         Select & Parse Biometric Excel
//                     </Button>
//                 </Upload>
//             </Card>

//             {fileUploaded && detectedPeriod && (
//                 <Card
//                     title={`Payroll Report (${dayjs()
//                         .month(detectedPeriod.month - 1)
//                         .format('MMMM')} ${detectedPeriod.year})`}
//                 >
//                     <Tabs
//                         defaultActiveKey="regular"
//                         items={[
//                             {
//                                 key: 'regular',
//                                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={regularStaffSummaries}
//                                         columns={regularColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                             {
//                                 key: 'dailyWage',
//                                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={dailyWageStaffSummaries}
//                                         columns={dailyWageColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                         ]}
//                     />
//                 </Card>
//             )}
//         </div>
//     );
// }














// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//     employee_code: string;
//     total_worked_hours: number;
//     overtime_hours: number;
//     shortage_hours: number;
// }

// export default function HRSalaryCalculatorPage() {
//     const [loading, setLoading] = useState<boolean>(false);
//     const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//     const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//     const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//     const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//     const cleanEmpCode = (code: any): string => {
//         if (!code) return '';
//         return String(code).trim().replace(/^0+/, '');
//     };

//     const parseTimeToDecimalHours = (timeVal: any): number | null => {
//         if (timeVal === undefined || timeVal === null) return null;
//         const str = String(timeVal).trim();
//         if (!str || str.toLowerCase() === 'nan') return null;

//         const parts = str.split(':');
//         if (parts.length >= 2) {
//             const hrs = parseInt(parts[0], 10);
//             const mins = parseInt(parts[1], 10);
//             if (!isNaN(hrs) && !isNaN(mins)) return hrs + mins / 60;
//         }
//         return null;
//     };

//     const handleFileUpload = (file: RcFile): boolean => {
//         setLoading(true);
//         setRegularStaffSummaries([]);
//         setDailyWageStaffSummaries([]);
//         setFileUploaded(false);

//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 const data = e.target?.result;
//                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//                 // Helper to parse duration strings ("8:57", "08:57", "8.5") into decimal hours
//                 const parseTimeToDecimalHours = (val: any): number => {
//                     if (val === undefined || val === null || val === '') return 0;
//                     if (typeof val === 'number') {
//                         if (val > 0 && val < 1) return val * 24; // Handle Excel time fraction
//                         return val;
//                     }
//                     const str = String(val).trim();
//                     if (!str || str === '00:00' || str === '0') return 0;

//                     if (str.includes(':')) {
//                         const parts = str.split(':');
//                         const h = parseFloat(parts[0]) || 0;
//                         const m = parseFloat(parts[1]) || 0;
//                         return h + m / 60;
//                     }
//                     const parsed = parseFloat(str);
//                     return isNaN(parsed) ? 0 : parsed;
//                 };

//                 // 1. Detect Month & Year across all file formats
//                 let detectedMonth: number | null = null;
//                 let detectedYear: number | null = null;

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;
//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );
//                     const rowText = rowCells.join(' ');

//                     // Pattern A: Date range string e.g., "Apr 01 2026 To Apr 30 2026" or "01-Apr-2026 To 30-Apr-2026"
//                     const rangeMatch = rowText.match(/([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}\s+To\s+([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}/i);
//                     if (rangeMatch) {
//                         const parts = rangeMatch[0].split(/\s+To\s+/i);
//                         const pDate = dayjs(parts[0].trim());
//                         if (pDate.isValid()) {
//                             detectedMonth = pDate.month() + 1;
//                             detectedYear = pDate.year();
//                             break;
//                         }
//                     }

//                     // Pattern B: Search for individual date values in cells (e.g. "01-Apr-2026" or "2026-04-01")
//                     for (const cell of rowCells) {
//                         if (!cell || cell === 'Att. Date' || cell === 'Date' || cell === 'InTime' || cell === 'OutTime') continue;
//                         if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(cell) || /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{2}\/\d{2}\/\d{4}$/.test(cell)) {
//                             const pDate = dayjs(cell);
//                             if (pDate.isValid()) {
//                                 detectedMonth = pDate.month() + 1;
//                                 detectedYear = pDate.year();
//                                 break;
//                             }
//                         }
//                     }
//                     if (detectedMonth && detectedYear) break;
//                 }

//                 const autoMonth = detectedMonth || dayjs().month() + 1;
//                 const autoYear = detectedYear || dayjs().year();
//                 setDetectedPeriod({ month: autoMonth, year: autoYear });

//                 const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//                 const payrollStartMonthDate = dayjs(targetDateStr);

//                 // 2. Fetch staff employees
//                 const { data: dbEmployees, error: dbError } = await supabase
//                     .schema('leave_management')
//                     .from('employees')
//                     .select(`
//                     id,
//                     employee_code,
//                     full_name,
//                     role,
//                     normal_salary,
//                     probation_salary,
//                     retention_amount,
//                     is_daily_wage_joining_month,
//                     daily_wage_until,
//                     is_permanently_daily,
//                     daily_wage_rate,
//                     salary_structures (
//                         stage_name,
//                         base_salary,
//                         effective_from,
//                         effective_to
//                     )
//                 `)
//                     .eq('role', 'staff');

//                 if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//                 // 3. Fetch LOP records for auto-detected month & year
//                 const { data: lopRecords, error: lopError } = await supabase
//                     .schema('leave_management')
//                     .from('leaves')
//                     .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//                 if (lopError) {
//                     console.warn('Could not fetch LOP records:', lopError.message);
//                 }

//                 const lopDaysMap = new Map<string, number>();

//                 (lopRecords || []).forEach((rec: any) => {
//                     const allocatedType = String(rec.allocated_type || '').toUpperCase();
//                     const sourceYear = rec.allocation_source_year;
//                     const sourceMonth = rec.allocation_source_month;

//                     const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';

//                     const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//                     const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//                     if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//                         let dayWeight = 1.0;

//                         const halfStr = String(rec.half || '').toUpperCase();
//                         if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//                             dayWeight = 0.5;
//                         }

//                         const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//                         lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//                     }
//                 });

//                 // 4. Multi-Format Biometric Parser
//                 let currentEmpCode = '';
//                 let dateColIdx = -1;
//                 let totDurColIdx = -1;
//                 let workDurColIdx = -1;

//                 const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//                 for (const row of rawRows) {
//                     if (!row || row.length === 0) continue;

//                     const rowCells = row.map((cell: any) =>
//                         cell !== undefined && cell !== null ? String(cell).trim() : ''
//                     );

//                     // A. Check for Employee Header row
//                     const empCodeIdx = rowCells.findIndex((c: string) =>
//                         c === 'Emp Code:' || c === 'Employee Code:' || c === 'Emp Code' || c === 'Employee Code'
//                     );

//                     if (empCodeIdx !== -1) {
//                         let extractedCode = '';
//                         for (let k = empCodeIdx + 1; k < rowCells.length; k++) {
//                             if (rowCells[k] && !rowCells[k].startsWith('Employee Name') && !rowCells[k].startsWith('Name')) {
//                                 extractedCode = rowCells[k];
//                                 break;
//                             }
//                         }

//                         if (extractedCode) {
//                             currentEmpCode = cleanEmpCode(extractedCode);
//                             if (!attendanceMap.has(currentEmpCode)) {
//                                 attendanceMap.set(currentEmpCode, {
//                                     employee_code: currentEmpCode,
//                                     total_worked_hours: 0,
//                                     overtime_hours: 0,
//                                     shortage_hours: 0,
//                                 });
//                             }
//                         }
//                         continue;
//                     }

//                     // B. Detect Header Column Indices with explicit string types
//                     const hasDateHeader = rowCells.some((c: string) => c === 'Att. Date' || c === 'Date');
//                     const hasDurationHeader = rowCells.some((c: string) => c === 'Tot. Dur.' || c === 'Total Duration' || c === 'Work Dur.');

//                     if (hasDateHeader || hasDurationHeader) {
//                         dateColIdx = rowCells.findIndex((c: string) => c === 'Att. Date' || c === 'Date');
//                         totDurColIdx = rowCells.findIndex((c: string) => c === 'Tot. Dur.' || c === 'Total Duration');
//                         workDurColIdx = rowCells.findIndex((c: string) => c === 'Work Dur.');
//                         continue;
//                     }

//                     // C. Parse Attendance Record Rows
//                     if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//                         const dateVal = rowCells[dateColIdx];

//                         const isValidDateRow =
//                             dateVal &&
//                             (dayjs(dateVal).isValid() ||
//                                 /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal) ||
//                                 /^\d{4}-\d{2}-\d{2}$/.test(dateVal) ||
//                                 /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal));

//                         if (isValidDateRow && currentEmpCode) {
//                             const summary = attendanceMap.get(currentEmpCode) || {
//                                 employee_code: currentEmpCode,
//                                 total_worked_hours: 0,
//                                 overtime_hours: 0,
//                                 shortage_hours: 0,
//                             };

//                             const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//                             const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//                             const totHours = parseTimeToDecimalHours(totDurStr);
//                             const workHours = parseTimeToDecimalHours(workDurStr);

//                             const dailyWorkedHours = Math.max(totHours, workHours);

//                             if (dailyWorkedHours > 0) {
//                                 summary.total_worked_hours += dailyWorkedHours;

//                                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                                 if (dailyWorkedHours > targetHours) {
//                                     summary.overtime_hours += dailyWorkedHours - targetHours;
//                                 } else if (dailyWorkedHours < targetHours) {
//                                     summary.shortage_hours += targetHours - dailyWorkedHours;
//                                 }
//                             }

//                             attendanceMap.set(currentEmpCode, summary);
//                         }
//                     }
//                 }

//                 // 5. Separate calculations for Regular and Daily Wage Staff
//                 const regularStaff: any[] = [];
//                 const dailyWageStaff: any[] = [];

//                 (dbEmployees || []).forEach((emp) => {
//                     const empCodeClean = cleanEmpCode(emp.employee_code);

//                     const attendance = attendanceMap.get(empCodeClean) || {
//                         employee_code: emp.employee_code,
//                         total_worked_hours: 0,
//                         overtime_hours: 0,
//                         shortage_hours: 0,
//                     };

//                     // Evaluate Daily Wage vs Regular
//                     let isDailyWage = false;

//                     if (emp.is_permanently_daily === true) {
//                         isDailyWage = true;
//                     } else if (emp.is_daily_wage_joining_month === true) {
//                         if (emp.daily_wage_until) {
//                             const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
//                                 ? dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY'])
//                                 : dayjs(emp.daily_wage_until);

//                             isDailyWage = untilDate.isSameOrAfter(payrollStartMonthDate, 'month');
//                         } else {
//                             isDailyWage = true;
//                         }
//                     }

//                     if (isDailyWage) {
//                         const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
//                         const hourlyRate = emp.daily_wage_rate || 0;
//                         const netPayable = Math.round(totalWorkedHours * hourlyRate);

//                         dailyWageStaff.push({
//                             key: emp.id,
//                             employeeCode: emp.employee_code,
//                             full_name: emp.full_name,
//                             total_worked_hours: totalWorkedHours,
//                             daily_wage_rate: hourlyRate,
//                             netPayable: netPayable,
//                         });
//                     } else {
//                         const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

//                         const salaryResult = calculateSalary(emp, {
//                             targetDate: targetDateStr,
//                             lopDays: lopDaysFromDb,
//                             overtimeHours: attendance.overtime_hours || 0,
//                             shortageHours: attendance.shortage_hours || 0,
//                         });

//                         regularStaff.push({
//                             key: emp.id,
//                             ...attendance,
//                             ...salaryResult,
//                             employeeCode: emp.employee_code,
//                             full_name: emp.full_name,
//                             retainedAmount: salaryResult.retainedAmount,
//                             netPayable: salaryResult.netPayable,
//                             total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//                             overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//                             shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//                         });
//                     }
//                 });

//                 setRegularStaffSummaries(regularStaff);
//                 setDailyWageStaffSummaries(dailyWageStaff);
//                 setFileUploaded(true);

//                 message.success(
//                     `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//                 );
//             } catch (err: any) {
//                 console.error(err);
//                 message.error(err.message || 'An error occurred during calculation');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         reader.readAsArrayBuffer(file);
//         return false;
//     };

//     // Regular Staff Table Columns
//     // Regular Staff Table Columns
//     const regularColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         // {
//         //     title: 'Active Stage',
//         //     dataIndex: 'activeStage',
//         //     key: 'activeStage',
//         //     render: (stage: string) => (
//         //         <Tag color={stage === 'Probation' ? 'orange' : 'blue'}>{stage}</Tag>
//         //     ),
//         // },
//         {
//             title: 'Base Salary',
//             dataIndex: 'baseSalary',
//             key: 'baseSalary',
//             render: (amt: number) => `₹${(amt || 0).toLocaleString()}`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Overtime Hours',
//             dataIndex: 'overtime_hours',
//             key: 'overtime_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Overtime Pay',
//             dataIndex: 'overtimePay',
//             key: 'overtimePay',
//             render: (amt: number) => (
//                 <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                     {amt > 0 ? `+₹${amt.toLocaleString()}` : '₹0'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Shortage Hours',
//             dataIndex: 'shortage_hours',
//             key: 'shortage_hours',
//             render: (hrs: number) => (
//                 <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//                     {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Shortage Deduction',
//             dataIndex: 'shortageDeduction',
//             key: 'shortageDeduction',
//             render: (amt: number) => (
//                 <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                     {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Days',
//             dataIndex: 'lopDays',
//             key: 'lopDays',
//             render: (days: number) => (
//                 <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//                     {days || 0} days
//                 </span>
//             ),
//         },
//         {
//             title: 'LOP Deduction',
//             dataIndex: 'lopDeduction',
//             key: 'lopDeduction',
//             render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{(amt || 0).toLocaleString()}</span>,
//         },
//         {
//             title: 'Retention Deducted',
//             dataIndex: 'retainedAmount',
//             key: 'retainedAmount',
//             render: (amt: number) => (
//                 <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//                     {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
//         },
//     ];

//     // Daily Wage Staff Table Columns
//     const dailyWageColumns = [
//         { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//         { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//         {
//             title: 'Hourly Rate',
//             dataIndex: 'daily_wage_rate',
//             key: 'daily_wage_rate',
//             render: (amt: number) => `₹${(amt || 0).toLocaleString()} / hr`,
//         },
//         {
//             title: 'Total Worked Hours',
//             dataIndex: 'total_worked_hours',
//             key: 'total_worked_hours',
//             render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//         },
//         {
//             title: 'Net Payable',
//             dataIndex: 'netPayable',
//             key: 'netPayable',
//             render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{(amt || 0).toLocaleString()}</strong>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px' }}>
//             <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//                 <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//                     <Button icon={<UploadOutlined />} loading={loading} type="primary">
//                         Select & Parse Biometric Excel
//                     </Button>
//                 </Upload>
//             </Card>

//             {fileUploaded && detectedPeriod && (
//                 <Card
//                     title={`Payroll Report (${dayjs()
//                         .month(detectedPeriod.month - 1)
//                         .format('MMMM')} ${detectedPeriod.year})`}
//                 >
//                     <Tabs
//                         defaultActiveKey="regular"
//                         items={[
//                             {
//                                 key: 'regular',
//                                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={regularStaffSummaries}
//                                         columns={regularColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                             {
//                                 key: 'dailyWage',
//                                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                                 children: (
//                                     <Table
//                                         dataSource={dailyWageStaffSummaries}
//                                         columns={dailyWageColumns}
//                                         loading={loading}
//                                         pagination={{ pageSize: 10 }}
//                                         scroll={{ x: true }}
//                                     />
//                                 ),
//                             },
//                         ]}
//                     />
//                 </Card>
//             )}
//         </div>
//     );
// }


















// 'use client';

// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//   employee_code: string;
//   total_worked_hours: number;
//   overtime_hours: number;
//   shortage_hours: number;
// }

// // Global robust duration parser
// const parseTimeToDecimalHours = (val: any): number => {
//   if (val === undefined || val === null || val === '') return 0;
//   if (typeof val === 'number') {
//     if (val > 0 && val < 1) return val * 24; // Convert Excel fractional day
//     return val;
//   }
//   const str = String(val).trim();
//   if (!str || str.toLowerCase() === 'nan' || str === '00:00' || str === '0') return 0;

//   if (str.includes(':')) {
//     const parts = str.split(':');
//     const h = parseFloat(parts[0]) || 0;
//     const m = parseFloat(parts[1]) || 0;
//     return h + m / 60;
//   }
//   const parsed = parseFloat(str);
//   return isNaN(parsed) ? 0 : parsed;
// };

// const cleanEmpCode = (code: any): string => {
//   if (!code) return '';
//   return String(code).trim().replace(/^0+/, '');
// };

// export default function HRSalaryCalculatorPage() {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//   const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//   const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//   const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);

//   const handleFileUpload = (file: RcFile): boolean => {
//     setLoading(true);
//     setRegularStaffSummaries([]);
//     setDailyWageStaffSummaries([]);
//     setFileUploaded(false);

//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       try {
//         const data = e.target?.result;
//         const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//         // 1. Detect Month & Year across all file formats
//         let detectedMonth: number | null = null;
//         let detectedYear: number | null = null;

//         for (const row of rawRows) {
//           if (!row || row.length === 0) continue;
//           const rowCells = row.map((cell: any) =>
//             cell !== undefined && cell !== null ? String(cell).trim() : ''
//           );
//           const rowText = rowCells.join(' ');

//           const rangeMatch = rowText.match(/([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}\s+To\s+([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}/i);
//           if (rangeMatch) {
//             const parts = rangeMatch[0].split(/\s+To\s+/i);
//             const pDate = dayjs(parts[0].trim(), ['DD-MMM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']);
//             if (pDate.isValid()) {
//               detectedMonth = pDate.month() + 1;
//               detectedYear = pDate.year();
//               break;
//             }
//           }

//           for (const cell of rowCells) {
//             if (!cell || ['Att. Date', 'Date', 'InTime', 'OutTime'].includes(cell)) continue;
//             if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(cell) || /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{2}\/\d{2}\/\d{4}$/.test(cell)) {
//               const pDate = dayjs(cell, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']);
//               if (pDate.isValid()) {
//                 detectedMonth = pDate.month() + 1;
//                 detectedYear = pDate.year();
//                 break;
//               }
//             }
//           }
//           if (detectedMonth && detectedYear) break;
//         }

//         const autoMonth = detectedMonth || dayjs().month() + 1;
//         const autoYear = detectedYear || dayjs().year();
//         setDetectedPeriod({ month: autoMonth, year: autoYear });

//         const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//         const payrollStartMonthDate = dayjs(targetDateStr);

//         // 2. Fetch staff employees
//         const { data: dbEmployees, error: dbError } = await supabase
//           .schema('leave_management')
//           .from('employees')
//           .select(`
//             id,
//             employee_code,
//             full_name,
//             role,
//             normal_salary,
//             probation_salary,
//             retention_amount,
//             is_daily_wage_joining_month,
//             daily_wage_until,
//             is_permanently_daily,
//             daily_wage_rate,
//             salary_structures (
//                 stage_name,
//                 base_salary,
//                 effective_from,
//                 effective_to
//             )
//           `)
//           .eq('role', 'staff');

//         if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

//         // 3. Fetch LOP records for auto-detected month & year
//         const { data: lopRecords, error: lopError } = await supabase
//           .schema('leave_management')
//           .from('leaves')
//           .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//         if (lopError) {
//           console.warn('Could not fetch LOP records:', lopError.message);
//         }

//         const lopDaysMap = new Map<string, number>();

//         (lopRecords || []).forEach((rec: any) => {
//           const allocatedType = String(rec.allocated_type || '').toUpperCase();
//           const sourceYear = rec.allocation_source_year;
//           const sourceMonth = rec.allocation_source_month;

//           const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';
//           const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//           const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//           if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//             let dayWeight = 1.0;
//             const halfStr = String(rec.half || '').toUpperCase();
//             if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//               dayWeight = 0.5;
//             }
//             const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//             lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//           }
//         });

//         // 4. Multi-Format Biometric Parser
//         let currentEmpCode = '';
//         let dateColIdx = -1;
//         let totDurColIdx = -1;
//         let workDurColIdx = -1;

//         const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

//         for (const row of rawRows) {
//           if (!row || row.length === 0) continue;

//           const rowCells = row.map((cell: any) =>
//             cell !== undefined && cell !== null ? String(cell).trim() : ''
//           );

//           // Header: Employee Code
//           const empCodeIdx = rowCells.findIndex((c: string) =>
//             ['Emp Code:', 'Employee Code:', 'Emp Code', 'Employee Code'].includes(c)
//           );

//           if (empCodeIdx !== -1) {
//             let extractedCode = '';
//             for (let k = empCodeIdx + 1; k < rowCells.length; k++) {
//               if (rowCells[k] && !rowCells[k].startsWith('Employee Name') && !rowCells[k].startsWith('Name')) {
//                 extractedCode = rowCells[k];
//                 break;
//               }
//             }

//             if (extractedCode) {
//               currentEmpCode = cleanEmpCode(extractedCode);
//               if (!attendanceMap.has(currentEmpCode)) {
//                 attendanceMap.set(currentEmpCode, {
//                   employee_code: currentEmpCode,
//                   total_worked_hours: 0,
//                   overtime_hours: 0,
//                   shortage_hours: 0,
//                 });
//               }
//             }
//             continue;
//           }

//           // Header: Column Indices
//           const hasDateHeader = rowCells.some((c: string) => ['Att. Date', 'Date'].includes(c));
//           const hasDurationHeader = rowCells.some((c: string) => ['Tot. Dur.', 'Total Duration', 'Work Dur.'].includes(c));

//           if (hasDateHeader || hasDurationHeader) {
//             dateColIdx = rowCells.findIndex((c: string) => ['Att. Date', 'Date'].includes(c));
//             totDurColIdx = rowCells.findIndex((c: string) => ['Tot. Dur.', 'Total Duration'].includes(c));
//             workDurColIdx = rowCells.findIndex((c: string) => ['Work Dur.'].includes(c));
//             continue;
//           }

//           // Row Parsing
//           if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
//             const dateVal = rowCells[dateColIdx];
//             const isValidDateRow =
//               dateVal &&
//               (dayjs(dateVal, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).isValid() ||
//                 /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal) ||
//                 /^\d{4}-\d{2}-\d{2}$/.test(dateVal) ||
//                 /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal));

//             if (isValidDateRow && currentEmpCode) {
//               const summary = attendanceMap.get(currentEmpCode) || {
//                 employee_code: currentEmpCode,
//                 total_worked_hours: 0,
//                 overtime_hours: 0,
//                 shortage_hours: 0,
//               };

//               const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
//               const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

//               const totHours = parseTimeToDecimalHours(totDurStr);
//               const workHours = parseTimeToDecimalHours(workDurStr);
//               const dailyWorkedHours = Math.max(totHours, workHours);

//               if (dailyWorkedHours > 0) {
//                 summary.total_worked_hours += dailyWorkedHours;
//                 const targetHours = dailyWorkedHours < 6 ? 4 : 8;

//                 if (dailyWorkedHours > targetHours) {
//                   summary.overtime_hours += dailyWorkedHours - targetHours;
//                 } else if (dailyWorkedHours < targetHours) {
//                   summary.shortage_hours += targetHours - dailyWorkedHours;
//                 }
//               }

//               attendanceMap.set(currentEmpCode, summary);
//             }
//           }
//         }

//         // 5. Separate calculations for Regular and Daily Wage Staff
//         const regularStaff: any[] = [];
//         const dailyWageStaff: any[] = [];

//         (dbEmployees || []).forEach((emp) => {
//           const empCodeClean = cleanEmpCode(emp.employee_code);

//           const attendance = attendanceMap.get(empCodeClean) || {
//             employee_code: emp.employee_code,
//             total_worked_hours: 0,
//             overtime_hours: 0,
//             shortage_hours: 0,
//           };

//           let isDailyWage = false;

//           if (emp.is_permanently_daily === true) {
//             isDailyWage = true;
//           } else if (emp.is_daily_wage_joining_month === true) {
//             if (emp.daily_wage_until) {
//               const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY']);
//               isDailyWage = untilDate.isValid() ? untilDate.isSameOrAfter(payrollStartMonthDate, 'month') : true;
//             } else {
//               isDailyWage = true;
//             }
//           }

//           if (isDailyWage) {
//             const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
//             const hourlyRate = emp.daily_wage_rate || 0;
//             const netPayable = Math.round(totalWorkedHours * hourlyRate);

//             dailyWageStaff.push({
//               key: emp.id,
//               employeeCode: emp.employee_code,
//               full_name: emp.full_name,
//               total_worked_hours: totalWorkedHours,
//               daily_wage_rate: hourlyRate,
//               netPayable: netPayable,
//             });
//           } else {
//             const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

//             const salaryResult = calculateSalary(emp, {
//               targetDate: targetDateStr,
//               lopDays: lopDaysFromDb,
//               overtimeHours: attendance.overtime_hours || 0,
//               shortageHours: attendance.shortage_hours || 0,
//             });

//             regularStaff.push({
//               key: emp.id,
//               ...attendance,
//               ...salaryResult,
//               employeeCode: emp.employee_code,
//               full_name: emp.full_name,
//               retainedAmount: salaryResult?.retainedAmount || 0,
//               netPayable: salaryResult?.netPayable || 0,
//               total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//               overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//               shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//             });
//           }
//         });

//         setRegularStaffSummaries(regularStaff);
//         setDailyWageStaffSummaries(dailyWageStaff);
//         setFileUploaded(true);

//         message.success(
//           `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//         );
//       } catch (err: any) {
//         console.error(err);
//         message.error(err.message || 'An error occurred during calculation');
//       } finally {
//         setLoading(false);
//       }
//     };

//     reader.readAsArrayBuffer(file);
//     return false;
//   };

//   const regularColumns = [
//     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//     {
//       title: 'Base Salary',
//       dataIndex: 'baseSalary',
//       key: 'baseSalary',
//       render: (amt: number) => `₹${(amt || 0).toLocaleString()}`,
//     },
//     {
//       title: 'Total Worked Hours',
//       dataIndex: 'total_worked_hours',
//       key: 'total_worked_hours',
//       render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//     },
//     {
//       title: 'Overtime Hours',
//       dataIndex: 'overtime_hours',
//       key: 'overtime_hours',
//       render: (hrs: number) => (
//         <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//           {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
//         </span>
//       ),
//     },
//     {
//       title: 'Overtime Pay',
//       dataIndex: 'overtimePay',
//       key: 'overtimePay',
//       render: (amt: number) => (
//         <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//           {amt > 0 ? `+₹${amt.toLocaleString()}` : '₹0'}
//         </span>
//       ),
//     },
//     {
//       title: 'Shortage Hours',
//       dataIndex: 'shortage_hours',
//       key: 'shortage_hours',
//       render: (hrs: number) => (
//         <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//           {hrs > 0 ? `-${hrs} hrs` : '0 hrs'}
//         </span>
//       ),
//     },
//     {
//       title: 'Shortage Deduction',
//       dataIndex: 'shortageDeduction',
//       key: 'shortageDeduction',
//       render: (amt: number) => (
//         <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//           {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//         </span>
//       ),
//     },
//     {
//       title: 'LOP Days',
//       dataIndex: 'lopDays',
//       key: 'lopDays',
//       render: (days: number) => (
//         <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//           {days || 0} days
//         </span>
//       ),
//     },
//     {
//       title: 'LOP Deduction',
//       dataIndex: 'lopDeduction',
//       key: 'lopDeduction',
//       render: (amt: number) => <span style={{ color: '#c62828' }}>-₹{(amt || 0).toLocaleString()}</span>,
//     },
//     {
//       title: 'Retention Deducted',
//       dataIndex: 'retainedAmount',
//       key: 'retainedAmount',
//       render: (amt: number) => (
//         <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//           {amt > 0 ? `-₹${amt.toLocaleString()}` : '₹0'}
//         </span>
//       ),
//     },
//     {
//       title: 'Net Payable',
//       dataIndex: 'netPayable',
//       key: 'netPayable',
//       render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
//     },
//   ];

//   const dailyWageColumns = [
//     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//     {
//       title: 'Hourly Rate',
//       dataIndex: 'daily_wage_rate',
//       key: 'daily_wage_rate',
//       render: (amt: number) => `₹${(amt || 0).toLocaleString()} / hr`,
//     },
//     {
//       title: 'Total Worked Hours',
//       dataIndex: 'total_worked_hours',
//       key: 'total_worked_hours',
//       render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//     },
//     {
//       title: 'Net Payable',
//       dataIndex: 'netPayable',
//       key: 'netPayable',
//       render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{(amt || 0).toLocaleString()}</strong>,
//     },
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//           <Button icon={<UploadOutlined />} loading={loading} type="primary">
//             Select & Parse Biometric Excel
//           </Button>
//         </Upload>
//       </Card>

//       {fileUploaded && detectedPeriod && (
//         <Card title={`Payroll Report (${dayjs().month(detectedPeriod.month - 1).format('MMMM')} ${detectedPeriod.year})`}>
//           <Tabs
//             defaultActiveKey="regular"
//             items={[
//               {
//                 key: 'regular',
//                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                 children: (
//                   <Table
//                     dataSource={regularStaffSummaries}
//                     columns={regularColumns}
//                     loading={loading}
//                     pagination={{ pageSize: 10 }}
//                     scroll={{ x: true }}
//                   />
//                 ),
//               },
//               {
//                 key: 'dailyWage',
//                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                 children: (
//                   <Table
//                     dataSource={dailyWageStaffSummaries}
//                     columns={dailyWageColumns}
//                     loading={loading}
//                     pagination={{ pageSize: 10 }}
//                     scroll={{ x: true }}
//                   />
//                 ),
//               },
//             ]}
//           />
//         </Card>
//       )}
//     </div>
//   );
// }












// 'use client';



// import { useState } from 'react';
// import dayjs from 'dayjs';
// import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import * as XLSX from 'xlsx';
// import { RcFile } from 'antd/es/upload';
// import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';
// import { calculateSalary } from '@/lib/salary-calculator';

// dayjs.extend(isSameOrAfter);
// dayjs.extend(customParseFormat);

// interface EmployeeAttendanceSummary {
//   employee_code: string;
//   total_worked_hours: number;
//   overtime_hours: number;
//   shortage_hours: number;
// }



// // // Global robust duration parser
// // const parseTimeToDecimalHours = (val: any): number => {
// //   if (val === undefined || val === null || val === '') return 0;
// //   if (typeof val === 'number') {
// //     if (val > 0 && val < 1) return val * 24; // Convert Excel fractional day
// //     return val;
// //   }
// //   const str = String(val).trim();
// //   if (!str || str.toLowerCase() === 'nan' || str === '00:00' || str === '0') return 0;

// //   if (str.includes(':')) {
// //     const parts = str.split(':');
// //     const h = parseFloat(parts[0]) || 0;
// //     const m = parseFloat(parts[1]) || 0;
// //     return h + m / 60;
// //   }
// //   const parsed = parseFloat(str);
// //   return isNaN(parsed) ? 0 : parsed;
// // };







// function parseTimeToDecimalHours(timeVal: any): number {
//   if (timeVal === null || timeVal === undefined || timeVal === '') {
//     return 0;
//   }

//   // ---------------------------------------------------------
//   // 1. Excel numeric time
//   // Example:
//   // 0.333333 = 08:00
//   // 0.375000 = 09:00
//   // ---------------------------------------------------------
//   if (typeof timeVal === 'number') {
//     if (!Number.isFinite(timeVal)) {
//       return 0;
//     }

//     // Excel stores time as fraction of a day.
//     // If it is less than 1, convert to hours.
//     if (timeVal >= 0 && timeVal < 1) {
//       return timeVal * 24;
//     }

//     // If already supplied as decimal hours
//     // e.g. 8.5 = 08:30
//     return timeVal;
//   }

//   // ---------------------------------------------------------
//   // Convert everything else to string
//   // ---------------------------------------------------------
//   const value = String(timeVal).trim();

//   if (!value) {
//     return 0;
//   }

//   // ---------------------------------------------------------
//   // 2. JavaScript Date string / Excel Date representation
//   //
//   // Example:
//   // Sat Dec 30 1899 08:59:00 GMT+0521 (...)
//   //
//   // We ONLY extract HH:MM:SS.
//   // We do NOT use new Date() because the timezone of
//   // Excel's 1899 date can cause unexpected results.
//   // ---------------------------------------------------------
//   const dateTimeMatch = value.match(
//     /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/
//   );

//   if (
//     dateTimeMatch &&
//     (
//       value.includes('1899') ||
//       value.includes('1900') ||
//       value.includes('GMT') ||
//       value.includes('Standard Time')
//     )
//   ) {
//     const hours = Number(dateTimeMatch[1]);
//     const minutes = Number(dateTimeMatch[2]);
//     const seconds = Number(dateTimeMatch[3] || 0);

//     if (
//       hours >= 0 &&
//       hours <= 23 &&
//       minutes >= 0 &&
//       minutes <= 59 &&
//       seconds >= 0 &&
//       seconds <= 59
//     ) {
//       return hours + minutes / 60 + seconds / 3600;
//     }

//     return 0;
//   }

//   // ---------------------------------------------------------
//   // 3. ISO date/time
//   //
//   // Example:
//   // 1899-12-30T08:59:00
//   // ---------------------------------------------------------
//   if (value.includes('T')) {
//     const isoMatch = value.match(
//       /T(\d{1,2}):(\d{2})(?::(\d{2}))?/
//     );

//     if (isoMatch) {
//       const hours = Number(isoMatch[1]);
//       const minutes = Number(isoMatch[2]);
//       const seconds = Number(isoMatch[3] || 0);

//       if (
//         hours <= 23 &&
//         minutes <= 59 &&
//         seconds <= 59
//       ) {
//         return hours + minutes / 60 + seconds / 3600;
//       }
//     }

//     return 0;
//   }

//   // ---------------------------------------------------------
//   // 4. Normal HH:MM or HH:MM:SS
//   //
//   // Examples:
//   // 08:00
//   // 08:59
//   // 8:05
//   // 08:59:30
//   // ---------------------------------------------------------
//   const timeMatch = value.match(
//     /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/
//   );

//   if (timeMatch) {
//     const hours = Number(timeMatch[1]);
//     const minutes = Number(timeMatch[2]);
//     const seconds = Number(timeMatch[3] || 0);

//     if (
//       minutes >= 0 &&
//       minutes <= 59 &&
//       seconds >= 0 &&
//       seconds <= 59
//     ) {
//       return hours + minutes / 60 + seconds / 3600;
//     }

//     return 0;
//   }

//   // ---------------------------------------------------------
//   // 5. Numeric text
//   //
//   // Example:
//   // "0.333333"
//   // "8.5"
//   // ---------------------------------------------------------
//   const numericValue = Number(value);

//   if (Number.isFinite(numericValue)) {
//     if (numericValue >= 0 && numericValue < 1) {
//       return numericValue * 24;
//     }

//     return numericValue;
//   }

//   // Unknown format
//   return 0;
// }







// const cleanEmpCode = (code: any): string => {
//   if (!code) return '';
//   return String(code).trim().replace(/^0+/, '');
// };

// export default function HRSalaryCalculatorPage() {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
//   const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
//   const [fileUploaded, setFileUploaded] = useState<boolean>(false);
//   const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);
//   const [saving, setSaving] = useState<boolean>(false);




// const handleSavePayroll = async () => {
//   if (!detectedPeriod || (regularStaffSummaries.length === 0 && dailyWageStaffSummaries.length === 0)) {
//     message.warning('No payroll data available to save.');
//     return;
//   }

//   setSaving(true);

//   try {
//     const totalDaysInMonth = dayjs(`${detectedPeriod.year}-${detectedPeriod.month}-01`).daysInMonth();

//     // 1. Prepare Regular Staff Records
//     const regularRecords = regularStaffSummaries.map((emp) => {
//       const grossSalary = (emp.baseSalary || 0) + (emp.totalAllowance || 0) + (emp.overtimePay || 0);

//       return {
//         employee_id: emp.key,
//         employee_name: emp.full_name, // Added employee name
//         pay_period_year: detectedPeriod.year,
//         pay_period_month: detectedPeriod.month,
//         present_days: Math.max(0, totalDaysInMonth - (emp.lopDays || 0)),
//         total_days_in_month: totalDaysInMonth,
//         salary_type: 'regular',
//         applied_rate: emp.baseSalary || 0,
//         per_day_rate: Number(((emp.baseSalary || 0) / totalDaysInMonth).toFixed(2)),
//         gross_salary: grossSalary,
//         retained_amount: emp.retainedAmount || 0,
//         net_payable: emp.netPayable || 0,
//         status: 'DRAFT',
//       };
//     });

//     // 2. Prepare Daily Wage Staff Records
//     const dailyRecords = dailyWageStaffSummaries.map((emp) => {
//       const grossSalary = emp.netPayable || 0;

//       return {
//         employee_id: emp.key,
//         employee_name: emp.full_name, // Added employee name
//         pay_period_year: detectedPeriod.year,
//         pay_period_month: detectedPeriod.month,
//         present_days: Number(((emp.total_worked_hours || 0) / 8).toFixed(2)),
//         total_days_in_month: totalDaysInMonth,
//         salary_type: 'daily_wage',
//         applied_rate: emp.daily_wage_rate || 0,
//         per_day_rate: (emp.daily_wage_rate || 0) * 8,
//         gross_salary: grossSalary,
//         retained_amount: 0,
//         net_payable: emp.netPayable || 0,
//         status: 'DRAFT',
//       };
//     });

//     const payload = [...regularRecords, ...dailyRecords];

//     // 3. Upsert into Supabase
//     const { error } = await supabase
//       .schema('leave_management')
//       .from('payrolls')
//       .upsert(payload, {
//         onConflict: 'employee_id,pay_period_year,pay_period_month',
//       });

//     if (error) throw new Error(error.message);

//     message.success(
//       `Payroll saved successfully for ${dayjs()
//         .month(detectedPeriod.month - 1)
//         .format('MMMM')} ${detectedPeriod.year}!`
//     );
//   } catch (err: any) {
//     console.error('Error saving payroll:', err);
//     message.error(`Failed to save payroll: ${err.message}`);
//   } finally {
//     setSaving(false);
//   }
// };




//   const handleFileUpload = (file: RcFile): boolean => {
//     setLoading(true);
//     setRegularStaffSummaries([]);
//     setDailyWageStaffSummaries([]);
//     setFileUploaded(false);

//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       try {
//         const data = e.target?.result;
//         const workbook = XLSX.read(data, { type: 'array', cellDates: true });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//         // 1. Detect Month & Year across all file formats
//         let detectedMonth: number | null = null;
//         let detectedYear: number | null = null;

//         for (const row of rawRows) {
//           if (!row || row.length === 0) continue;
//           const rowCells = row.map((cell: any) =>
//             cell !== undefined && cell !== null ? String(cell).trim() : ''
//           );
//           const rowText = rowCells.join(' ');

//           const rangeMatch = rowText.match(/([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}\s+To\s+([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}/i);
//           if (rangeMatch) {
//             const parts = rangeMatch[0].split(/\s+To\s+/i);
//             const pDate = dayjs(parts[0].trim(), ['DD-MMM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']);
//             if (pDate.isValid()) {
//               detectedMonth = pDate.month() + 1;
//               detectedYear = pDate.year();
//               break;
//             }
//           }

//           for (const cell of rowCells) {
//             if (!cell || ['Att. Date', 'Date', 'InTime', 'OutTime'].includes(cell)) continue;
//             if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(cell) || /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{2}\/\d{2}\/\d{4}$/.test(cell)) {
//               const pDate = dayjs(cell, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']);
//               if (pDate.isValid()) {
//                 detectedMonth = pDate.month() + 1;
//                 detectedYear = pDate.year();
//                 break;
//               }
//             }
//           }
//           if (detectedMonth && detectedYear) break;
//         }

//         const autoMonth = detectedMonth || dayjs().month() + 1;
//         const autoYear = detectedYear || dayjs().year();
//         setDetectedPeriod({ month: autoMonth, year: autoYear });

//         const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
//         const payrollStartMonthDate = dayjs(targetDateStr);

//         // 2. Fetch staff employees
//        // 1. Fetch employees
// // 1. Fetch staff employees
// const { data: dbEmployees, error: dbError } = await supabase
//   .schema('leave_management')
//   .from('employees')
//   .select(`
//     id,
//     employee_code,
//     full_name,
//     role,
//     normal_salary,
//     probation_salary,
//     retention_amount,
//     is_daily_wage_joining_month,
//     daily_wage_until,
//     is_permanently_daily,
//     daily_wage_rate,
//     salary_structures (
//         stage_name,
//         base_salary,
//         effective_from,
//         effective_to,
//         hra_amount,
//         mobile_recharge_amount,
//         health_insurance_amount,
//         allowance_effective_from
//     )
//   `)
//   .eq('role', 'staff');

// if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

// // 2. Fetch employee allowances directly
// const { data: dbAllowances, error: allowanceError } = await supabase
//   .schema('leave_management')
//   .from('employee_allowances')
//   .select('*'); // Select all fields to avoid column mismatch issues

// if (allowanceError) {
//   console.warn('Could not fetch allowances:', allowanceError.message);
// }

// // 3. Populate Allowances Map with flexible status checking
// const allowancesMap = new Map<string, number>();

// (dbAllowances || []).forEach((a: any) => {
//   // Support boolean true, string 'true', or missing/null is_active
//   const isActive =
//     a.is_active === undefined ||
//     a.is_active === null ||
//     a.is_active === true ||
//     String(a.is_active).toLowerCase() === 'true';

//   const amount = Number(a.amount || a.allowance_amount || 0);

//   if (isActive && amount > 0) {
//     const empId = a.employee_id || a.emp_id;
//     if (empId) {
//       const currentTotal = allowancesMap.get(empId) || 0;
//       allowancesMap.set(empId, currentTotal + amount);
//     }
//   }
// });

































// function getActiveAllowanceTotal(salaryStructures: any[], targetDateStr: string): number {
//   if (!salaryStructures || salaryStructures.length === 0) return 0;

//   const targetDate = dayjs(targetDateStr);

//   // Find the active salary structure for the payroll period
//   const activeStructure = salaryStructures.find((struct) => {
//     const effectiveFrom = struct.effective_from ? dayjs(struct.effective_from) : null;
//     const effectiveTo = struct.effective_to ? dayjs(struct.effective_to) : null;

//     const isAfterStart = !effectiveFrom || effectiveFrom.isBefore(targetDate, 'day') || effectiveFrom.isSame(targetDate, 'day');
//     const isBeforeEnd = !effectiveTo || effectiveTo.isAfter(targetDate, 'day') || effectiveTo.isSame(targetDate, 'day');

//     return isAfterStart && isBeforeEnd;
//   }) || salaryStructures[0]; // Fallback to first record if single record exists

//   if (!activeStructure) return 0;

//   // Verify allowance_effective_from date
//   const allowanceEffectiveFrom = activeStructure.allowance_effective_from 
//     ? dayjs(activeStructure.allowance_effective_from) 
//     : (activeStructure.effective_from ? dayjs(activeStructure.effective_from) : null);

//   const isAllowanceActive = !allowanceEffectiveFrom || allowanceEffectiveFrom.isBefore(targetDate, 'day') || allowanceEffectiveFrom.isSame(targetDate, 'day');

//   if (!isAllowanceActive) return 0;

//   // Sum up all allowance columns from the salary_structures table
//   const hra = Number(activeStructure.hra_amount || 0);
//   const mobile = Number(activeStructure.mobile_recharge_amount || 0);
//   const health = Number(activeStructure.health_insurance_amount || 0);

//   return hra + mobile + health;
// }



















//         // 3. Fetch LOP records for auto-detected month & year
//         const { data: lopRecords, error: lopError } = await supabase
//           .schema('leave_management')
//           .from('leaves')
//           .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

//         if (lopError) {
//           console.warn('Could not fetch LOP records:', lopError.message);
//         }

//         const lopDaysMap = new Map<string, number>();

//         (lopRecords || []).forEach((rec: any) => {
//           const allocatedType = String(rec.allocated_type || '').toUpperCase();
//           const sourceYear = rec.allocation_source_year;
//           const sourceMonth = rec.allocation_source_month;

//           const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';
//           const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
//           const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

//           if (isLop && matchesYear && matchesMonth && rec.employee_id) {
//             let dayWeight = 1.0;
//             const halfStr = String(rec.half || '').toUpperCase();
//             if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
//               dayWeight = 0.5;
//             }
//             const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
//             lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
//           }
//         });

// //         // 4. Multi-Format Biometric Parser
// //         let currentEmpCode = '';
// //         let dateColIdx = -1;
// //         let totDurColIdx = -1;
// //         let workDurColIdx = -1;

// //         const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

// //         for (const row of rawRows) {
// //           if (!row || row.length === 0) continue;

// //           const rowCells = row.map((cell: any) =>
// //             cell !== undefined && cell !== null ? String(cell).trim() : ''
// //           );

// //           // Header: Employee Code
// //           const empCodeIdx = rowCells.findIndex((c: string) =>
// //             ['Emp Code:', 'Employee Code:', 'Emp Code', 'Employee Code'].includes(c)
// //           );

// //           if (empCodeIdx !== -1) {
// //             let extractedCode = '';
// //             for (let k = empCodeIdx + 1; k < rowCells.length; k++) {
// //               if (rowCells[k] && !rowCells[k].startsWith('Employee Name') && !rowCells[k].startsWith('Name')) {
// //                 extractedCode = rowCells[k];
// //                 break;
// //               }
// //             }

// //             if (extractedCode) {
// //               currentEmpCode = cleanEmpCode(extractedCode);
// //               if (!attendanceMap.has(currentEmpCode)) {
// //                 attendanceMap.set(currentEmpCode, {
// //                   employee_code: currentEmpCode,
// //                   total_worked_hours: 0,
// //                   overtime_hours: 0,
// //                   shortage_hours: 0,
// //                 });
// //               }
// //             }
// //             continue;
// //           }

// //           // Header: Column Indices
// //           const hasDateHeader = rowCells.some((c: string) => ['Att. Date', 'Date'].includes(c));
// //           const hasDurationHeader = rowCells.some((c: string) => ['Tot. Dur.', 'Total Duration', 'Work Dur.'].includes(c));

// //           if (hasDateHeader || hasDurationHeader) {
// //             dateColIdx = rowCells.findIndex((c: string) => ['Att. Date', 'Date'].includes(c));
// //             totDurColIdx = rowCells.findIndex((c: string) => ['Tot. Dur.', 'Total Duration'].includes(c));
// //             workDurColIdx = rowCells.findIndex((c: string) => ['Work Dur.'].includes(c));
// //             continue;
// //           }

// //           // Row Parsing
// //           if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
// //             const dateVal = rowCells[dateColIdx];
// //             const isValidDateRow =
// //               dateVal &&
// //               (dayjs(dateVal, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).isValid() ||
// //                 /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal) ||
// //                 /^\d{4}-\d{2}-\d{2}$/.test(dateVal) ||
// //                 /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal));

// //             if (isValidDateRow && currentEmpCode) {
// //               const summary = attendanceMap.get(currentEmpCode) || {
// //                 employee_code: currentEmpCode,
// //                 total_worked_hours: 0,
// //                 overtime_hours: 0,
// //                 shortage_hours: 0,
// //               };

// //               const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
// //               const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';

// //               const totHours = parseTimeToDecimalHours(totDurStr);
// //               const workHours = parseTimeToDecimalHours(workDurStr);
// //               const dailyWorkedHours = Math.max(totHours, workHours);

// //               // if (dailyWorkedHours > 0) {
// //               //   summary.total_worked_hours += dailyWorkedHours;
// //               //   const targetHours = dailyWorkedHours < 6 ? 4 : 8;

// //               //   if (dailyWorkedHours > targetHours) {
// //               //     summary.overtime_hours += dailyWorkedHours - targetHours;
// //               //   } else if (dailyWorkedHours < targetHours) {
// //               //     summary.shortage_hours += targetHours - dailyWorkedHours;
// //               //   }
// //               // }



// //               if (dailyWorkedHours > 0) {
// //   summary.total_worked_hours += dailyWorkedHours;
// //   const targetHours = dailyWorkedHours < 6 ? 4 : 8;

// //   if (dailyWorkedHours > targetHours) {
// //     summary.overtime_hours += dailyWorkedHours - targetHours;
// //   } else if (dailyWorkedHours < targetHours) {
// //     const dailyShortage = targetHours - dailyWorkedHours;
// //     summary.shortage_hours += dailyShortage;

// //     // 🟢 Keep the log INSIDE the else-if block where dailyShortage exists
// //     console.log(
// //       `[SHORTAGE TRACE] Emp: ${currentEmpCode} | Date: ${dateVal} | ` +
// //       `Worked: ${dailyWorkedHours.toFixed(2)}h | Shift Target: ${targetHours}h | ` +
// //       `Daily Shortage: +${dailyShortage.toFixed(2)}h | Running Total: ${summary.shortage_hours.toFixed(2)}h`
// //     );
// //   }
// // }


// //               attendanceMap.set(currentEmpCode, summary);
// //             }
// //           }
// //         }
















// //         // 4. Multi-Format Biometric Parser
// //         let currentEmpCode = '';
// //         let dateColIdx = -1;
// //         let totDurColIdx = -1;
// //         let workDurColIdx = -1;
// //         let statusColIdx = -1;

// //         // Ensure the map starts completely fresh
// //         const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

// //         for (const row of rawRows) {
// //           if (!row || row.length === 0) continue;

// //           const rowCells = row.map((cell: any) =>
// //             cell !== undefined && cell !== null ? String(cell).trim() : ''
// //           );

// //           // Header: Employee Code detection
// //           const empCodeIdx = rowCells.findIndex((c: string) =>
// //             ['Emp Code:', 'Employee Code:', 'Emp Code', 'Employee Code'].includes(c)
// //           );

// //           if (empCodeIdx !== -1) {
// //             let extractedCode = '';
// //             for (let k = empCodeIdx + 1; k < rowCells.length; k++) {
// //               if (rowCells[k] && !rowCells[k].startsWith('Employee Name') && !rowCells[k].startsWith('Name')) {
// //                 extractedCode = rowCells[k];
// //                 break;
// //               }
// //             }

// //             if (extractedCode) {
// //               currentEmpCode = cleanEmpCode(extractedCode);
// //               // 🟢 CRITICAL RESET: Ensure every new employee starts at exactly ZERO hours
// //               if (!attendanceMap.has(currentEmpCode)) {
// //                 attendanceMap.set(currentEmpCode, {
// //                   employee_code: currentEmpCode,
// //                   total_worked_hours: 0,
// //                   overtime_hours: 0,
// //                   shortage_hours: 0,
// //                 });
// //               }
// //             }
// //             continue;
// //           }

// //           // Header: Column Indices mapping
// //           const hasDateHeader = rowCells.some((c: string) => ['Att. Date', 'Date'].includes(c));
// //           const hasDurationHeader = rowCells.some((c: string) => ['Tot. Dur.', 'Total Duration', 'Work Dur.'].includes(c));

// //           if (hasDateHeader || hasDurationHeader) {
// //             dateColIdx = rowCells.findIndex((c: string) => ['Att. Date', 'Date'].includes(c));
// //             totDurColIdx = rowCells.findIndex((c: string) => ['Tot. Dur.', 'Total Duration'].includes(c));
// //             workDurColIdx = rowCells.findIndex((c: string) => ['Work Dur.'].includes(c));
// //             statusColIdx = rowCells.findIndex((c: string) => ['Status'].includes(c));
// //             continue;
// //           }

// //           // Row Parsing
// //           if (dateColIdx !== -1 && dateColIdx < rowCells.length) {
// //             const dateVal = rowCells[dateColIdx];
// // const isValidDateRow =
// //   dateVal &&
// //   (
// //     dayjs(
// //       dateVal,
// //       [
// //         'DD-MMM-YYYY',
// //         'YYYY-MM-DD',
// //         'DD/MM/YYYY',
// //         'MM/DD/YYYY'
// //       ],
// //       true
// //     ).isValid() ||

// //     /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal) ||

// //     /^\d{4}-\d{2}-\d{2}$/.test(dateVal) ||

// //     /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)
// //   );

// //             if (isValidDateRow && currentEmpCode) {
// //               const summary = attendanceMap.get(currentEmpCode) || {
// //                 employee_code: currentEmpCode,
// //                 total_worked_hours: 0,
// //                 overtime_hours: 0,
// //                 shortage_hours: 0,
// //               };

// //               const totDurStr = totDurColIdx !== -1 ? rowCells[totDurColIdx] : '';
// //               const workDurStr = workDurColIdx !== -1 ? rowCells[workDurColIdx] : '';
// //               const statusStr = statusColIdx !== -1 ? rowCells[statusColIdx] : '';

// //               if (['WeeklyOff', 'Absent'].includes(statusStr) || totDurStr === '00:00') {
// //                 continue;
// //               }

// //               // const totHours = parseTimeToDecimalHours(totDurStr);
// //               // const workHours = parseTimeToDecimalHours(workDurStr);
// //               // const dailyWorkedHours = Math.max(totHours, workHours);

// //               // if (dailyWorkedHours > 0) {
// //               //   summary.total_worked_hours += dailyWorkedHours;
                
// //               //   const targetHours = statusStr.includes('1/2') ? 4 : 8;

// //               //   // 🟢 RE-ENGINEERED WITH THE EXACT WORKING SHORTAGE TECHNIQUE:
// //               //   if (dailyWorkedHours > targetHours) {
// //               //     // If they worked 8.5 hours and target is 8, overtime is 0.5 hours
// //               //     const dailyOvertime = dailyWorkedHours - targetHours;
// //               //     summary.overtime_hours += dailyOvertime; // Add the clean daily difference
// //               //   } 
// //               //   else if (dailyWorkedHours < targetHours) {
// //               //     const dailyShortage = targetHours - dailyWorkedHours;
// //               //     summary.shortage_hours += dailyShortage;
// //               //   }
// //               // }






// // const totHours = parseTimeToDecimalHours(totDurStr);
// // const workHours = parseTimeToDecimalHours(workDurStr);

// // const dailyWorkedHours = Math.max(totHours, workHours);

// // // Work internally in minutes.
// // // This avoids floating point problems such as:
// // // 0.5166666666666675
// // const workedMinutes = Math.round(dailyWorkedHours * 60);

// // if (workedMinutes > 0) {
// //   summary.total_worked_hours += workedMinutes / 60;

// //   const targetHours = statusStr.includes('1/2') ? 4 : 8;
// // const isHalfDayStatus =
// //   statusStr.includes('1/2') ||
// //   statusStr.includes('½');

// // const targetMinutes =
// //   isHalfDayStatus && workedMinutes < 8 * 60
// //     ? 4 * 60
// //     : 8 * 60;

// //   if (workedMinutes > targetMinutes) {
// //     const overtimeMinutes =
// //       workedMinutes - targetMinutes;

// //     summary.overtime_hours += overtimeMinutes / 60;

// //     // ONLY log the employee we are debugging
// //     if (currentEmpCode === 'EXR1009') {
// //     console.log(
// //       `🟢 ${dateVal} | Worked ${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m | Target ${Math.floor(targetMinutes / 60)}h ${targetMinutes % 60}m | OT ${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m | Status="${statusStr}"`
// //     );
// //   }
// //   } else if (workedMinutes < targetMinutes) {
// //     const shortageMinutes =
// //       targetMinutes - workedMinutes;

// //     summary.shortage_hours += shortageMinutes / 60;

// //     // Only log shortage for EXR1008
// //      if (currentEmpCode === 'EXR1009') {
// //     console.log(
// //       `🔴 ${dateVal} | Worked ${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m | Target ${Math.floor(targetMinutes / 60)}h ${targetMinutes % 60}m | Short ${Math.floor(shortageMinutes / 60)}h ${shortageMinutes % 60}m | Status="${statusStr}"`
// //     );
// //   }
// //   }
// // }




// //               attendanceMap.set(currentEmpCode, summary);
// //             }
// //           }
// //         }




















// // ============================================================
// // 4. Multi-Format Biometric Parser
// // ============================================================

// let currentEmpCode = '';

// let dateColIdx = -1;
// let totDurColIdx = -1;
// let workDurColIdx = -1;
// let statusColIdx = -1;

// // Ensure the map starts completely fresh
// const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

// // ------------------------------------------------------------
// // DEBUG EMPLOYEE
// // Change this to another employee code when required.
// // Set to '' to disable debug logs completely.
// // ------------------------------------------------------------
// const DEBUG_EMPLOYEE = 'EXR1011';


// // ============================================================
// // PROCESS EVERY EXCEL ROW
// // ============================================================

// for (const row of rawRows) {

//   if (!row || row.length === 0) continue;

//   // ----------------------------------------------------------
//   // Convert all cells to clean strings
//   // ----------------------------------------------------------
//   const rowCells = row.map((cell: any) =>
//     cell !== undefined && cell !== null
//       ? String(cell).trim()
//       : ''
//   );


//   // ==========================================================
//   // 1. EMPLOYEE CODE HEADER
//   // ==========================================================

//   const empCodeIdx = rowCells.findIndex((c: string) =>
//     [
//       'Emp Code:',
//       'Employee Code:',
//       'Emp Code',
//       'Employee Code'
//     ].includes(c)
//   );

//   if (empCodeIdx !== -1) {

//     let extractedCode = '';

//     for (
//       let k = empCodeIdx + 1;
//       k < rowCells.length;
//       k++
//     ) {

//       if (
//         rowCells[k] &&
//         !rowCells[k].startsWith('Employee Name') &&
//         !rowCells[k].startsWith('Name')
//       ) {
//         extractedCode = rowCells[k];
//         break;
//       }
//     }

//     if (extractedCode) {

//       currentEmpCode = cleanEmpCode(extractedCode);

//       // ------------------------------------------------------
//       // Start a fresh summary for this employee
//       // ------------------------------------------------------
//       if (!attendanceMap.has(currentEmpCode)) {

//         attendanceMap.set(currentEmpCode, {
//           employee_code: currentEmpCode,
//           total_worked_hours: 0,
//           overtime_hours: 0,
//           shortage_hours: 0,
//         });
//       }
//     }

//     continue;
//   }


//   // ==========================================================
//   // 2. ATTENDANCE TABLE HEADER
//   // ==========================================================

//   const hasDateHeader = rowCells.some((c: string) =>
//     [
//       'Att. Date',
//       'Date'
//     ].includes(c)
//   );

//   const hasDurationHeader = rowCells.some((c: string) =>
//     [
//       'Tot. Dur.',
//       'Total Duration',
//       'Work Dur.'
//     ].includes(c)
//   );


//   if (hasDateHeader || hasDurationHeader) {

//     dateColIdx = rowCells.findIndex((c: string) =>
//       [
//         'Att. Date',
//         'Date'
//       ].includes(c)
//     );

//     totDurColIdx = rowCells.findIndex((c: string) =>
//       [
//         'Tot. Dur.',
//         'Total Duration'
//       ].includes(c)
//     );

//     workDurColIdx = rowCells.findIndex((c: string) =>
//       [
//         'Work Dur.'
//       ].includes(c)
//     );

//     statusColIdx = rowCells.findIndex((c: string) =>
//       [
//         'Status'
//       ].includes(c)
//     );

//     continue;
//   }


//   // ==========================================================
//   // 3. ATTENDANCE ROW
//   // ==========================================================

//   if (
//     dateColIdx === -1 ||
//     dateColIdx >= rowCells.length
//   ) {
//     continue;
//   }


//   const dateVal = rowCells[dateColIdx];


//   // ----------------------------------------------------------
//   // Validate date
//   // ----------------------------------------------------------

//   const isValidDateRow =
//     !!dateVal &&
//     (
//       dayjs(
//         dateVal,
//         [
//           'DD-MMM-YYYY',
//           'YYYY-MM-DD',
//           'DD/MM/YYYY',
//           'MM/DD/YYYY'
//         ],
//         true
//       ).isValid()

//       ||

//       /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal)

//       ||

//       /^\d{4}-\d{2}-\d{2}$/.test(dateVal)

//       ||

//       /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)
//     );


//   if (!isValidDateRow || !currentEmpCode) {
//     continue;
//   }


//   // ==========================================================
//   // 4. GET EMPLOYEE SUMMARY
//   // ==========================================================

//   const summary =
//     attendanceMap.get(currentEmpCode) || {

//       employee_code: currentEmpCode,

//       total_worked_hours: 0,

//       overtime_hours: 0,

//       shortage_hours: 0,
//     };


//   // ==========================================================
//   // 5. GET RAW ATTENDANCE VALUES
//   // ==========================================================

//   const totDurStr =
//     totDurColIdx !== -1
//       ? rowCells[totDurColIdx]
//       : '';

//   const workDurStr =
//     workDurColIdx !== -1
//       ? rowCells[workDurColIdx]
//       : '';

//   const statusStr =
//     statusColIdx !== -1
//       ? rowCells[statusColIdx]
//       : '';


//   // ==========================================================
//   // 6. NORMALIZE STATUS
//   // ==========================================================

//   const normalizedStatus =
//     statusStr
//       .toLowerCase()
//       .replace(/\s+/g, ' ')
//       .trim();


//   const isAbsent =
//     normalizedStatus.includes('absent');

//   const isWeeklyOff =
//     normalizedStatus.includes('weeklyoff') ||
//     normalizedStatus.includes('weekly off');

//   const isHalfDayStatus =
//     normalizedStatus.includes('1/2') ||
//     normalizedStatus.includes('½');


//   // ==========================================================
//   // 7. PARSE WORKING HOURS
//   // ==========================================================

//   const totHours =
//     parseTimeToDecimalHours(totDurStr);

//   const workHours =
//     parseTimeToDecimalHours(workDurStr);


//   // ----------------------------------------------------------
//   // Use whichever duration is greater.
//   // ----------------------------------------------------------

//   const dailyWorkedHours =
//     Math.max(
//       totHours,
//       workHours
//     );


//   // ----------------------------------------------------------
//   // Convert to minutes to avoid floating-point errors.
//   // ----------------------------------------------------------

//   const workedMinutes =
//     Math.round(
//       dailyWorkedHours * 60
//     );


//   // ==========================================================
//   // 8. ABSENT BUT ACTUALLY WORKED
//   // ==========================================================
//   //
//   // Example:
//   //
//   // 27-Apr-2026
//   // In      09:56
//   // Out     11:17
//   // Duration 1:21
//   // Status   Absent
//   //
//   // We DO NOT discard this row.
//   //
//   // Actual worked time = 1h 21m
//   //
//   // Salary calculation can therefore use
//   // 1h 21m of actual working time.
//   //
//   // No overtime.
//   // No normal 8-hour shortage calculation.
//   // No automatic full-day leave here.
//   //
//   // ==========================================================

//  if (
//   isAbsent &&
//   workedMinutes > 0 &&
//   workedMinutes < 120
// ) {
//   // Count actual worked time
//   summary.total_worked_hours +=
//     workedMinutes / 60;

//   // Treat actual worked time as OT because
//   // this is an Absent biometric status but the employee
//   // actually worked.
//   summary.overtime_hours +=
//     workedMinutes / 60;

//   if (currentEmpCode === DEBUG_EMPLOYEE) {
//     console.log(
//       `🟡 ${dateVal} | ` +
//       `Absent but worked ` +
//       `${Math.floor(workedMinutes / 60)}h ` +
//       `${workedMinutes % 60}m | ` +
//       `Counted as OT | ` +
//       `Status="${statusStr}"`
//     );
//   }

//   attendanceMap.set(
//     currentEmpCode,
//     summary
//   );

//   continue;
// }


//   // ==========================================================
//   // 9. COMPLETELY ABSENT / WEEKLY OFF
//   // ==========================================================
//   //
//   // If there is no actual working time, don't add anything
//   // to worked/overtime/shortage totals here.
//   //
//   // The existing leave reconciliation logic can handle
//   // the actual Absent day later.
//   //
//   // ==========================================================

//   if (
//     isWeeklyOff ||
//     (isAbsent && workedMinutes === 0) ||
//     totDurStr === '00:00'
//   ) {

//     attendanceMap.set(
//       currentEmpCode,
//       summary
//     );

//     continue;
//   }


//   // ==========================================================
//   // 10. NO WORKING TIME
//   // ==========================================================

//   if (workedMinutes <= 0) {

//     attendanceMap.set(
//       currentEmpCode,
//       summary
//     );

//     continue;
//   }


//   // ==========================================================
//   // 11. ADD ACTUAL WORKED HOURS
//   // ==========================================================

//   summary.total_worked_hours +=
//     workedMinutes / 60;


//   // ==========================================================
//   // 12. DETERMINE TARGET HOURS
//   // ==========================================================
//   //
//   // Normal Present:
//   //      Target = 8 hours
//   //
//   // Half-day Present:
//   //
//   //      Worked < 8 hours
//   //          Target = 4 hours
//   //
//   //      Worked >= 8 hours
//   //          Target = 8 hours
//   //
//   // This handles:
//   //
//   // 13-Apr:
//   // 1/2Present + 8h18m
//   // => Target 8h
//   // => OT 18m
//   //
//   // 14-Apr:
//   // ½Present + 4h12m
//   // => Target 4h
//   // => OT 12m
//   //
//   // ==========================================================

//   let targetMinutes = 8 * 60;


//   if (
//     isHalfDayStatus &&
//     workedMinutes < 8 * 60
//   ) {

//     targetMinutes = 4 * 60;
//   }


//   // ==========================================================
//   // 13. OVERTIME
//   // ==========================================================

//   if (workedMinutes > targetMinutes) {

//     const overtimeMinutes =
//       workedMinutes -
//       targetMinutes;


//     summary.overtime_hours +=
//       overtimeMinutes / 60;


//     // --------------------------------------------------------
//     // Compact debug log
//     // --------------------------------------------------------

//     if (
//       currentEmpCode === DEBUG_EMPLOYEE
//     ) {

//       console.log(
//         `🟢 ${dateVal} | ` +
//         `Worked ${Math.floor(workedMinutes / 60)}h ` +
//         `${workedMinutes % 60}m | ` +
//         `Target ${Math.floor(targetMinutes / 60)}h ` +
//         `${targetMinutes % 60}m | ` +
//         `OT ${Math.floor(overtimeMinutes / 60)}h ` +
//         `${overtimeMinutes % 60}m | ` +
//         `Status="${statusStr}"`
//       );
//     }

//   }


//   // ==========================================================
//   // 14. SHORTAGE
//   // ==========================================================

//   else if (workedMinutes < targetMinutes) {

//     const shortageMinutes =
//       targetMinutes -
//       workedMinutes;


//     summary.shortage_hours +=
//       shortageMinutes / 60;


//     // --------------------------------------------------------
//     // Compact debug log
//     // --------------------------------------------------------

//     if (
//       currentEmpCode === DEBUG_EMPLOYEE
//     ) {

//       console.log(
//         `🔴 ${dateVal} | ` +
//         `Worked ${Math.floor(workedMinutes / 60)}h ` +
//         `${workedMinutes % 60}m | ` +
//         `Target ${Math.floor(targetMinutes / 60)}h ` +
//         `${targetMinutes % 60}m | ` +
//         `Short ${Math.floor(shortageMinutes / 60)}h ` +
//         `${shortageMinutes % 60}m | ` +
//         `Status="${statusStr}"`
//       );
//     }
//   }


//   // ==========================================================
//   // 15. SAVE EMPLOYEE SUMMARY
//   // ==========================================================

//   attendanceMap.set(
//     currentEmpCode,
//     summary
//   );
// }


// // ============================================================
// // 16. FINAL DEBUG SUMMARY
// // ============================================================

// if (DEBUG_EMPLOYEE) {

//   const debugEmployee =
//     attendanceMap.get(DEBUG_EMPLOYEE);


//   if (debugEmployee) {

//     console.log(
//       '========== ' +
//       DEBUG_EMPLOYEE +
//       ' OT SUMMARY =========='
//     );

//     console.log({
//       employee:
//         debugEmployee.employee_code,

//       totalWorkedHours:
//         Number(
//           debugEmployee.total_worked_hours.toFixed(2)
//         ),

//       overtimeHours:
//         Number(
//           debugEmployee.overtime_hours.toFixed(2)
//         ),

//       shortageHours:
//         Number(
//           debugEmployee.shortage_hours.toFixed(2)
//         ),
//     });

//     console.log(
//       '========================================='
//     );
//   }
// }

















// // =====================================================
// // DEBUG ONLY: FINAL SUMMARY
// // =====================================================
// const debugEmployee = attendanceMap.get('EXR1011');

// if (debugEmployee) {
//   console.log('========== EXR1011 OT SUMMARY ==========');
//   console.log({
//     employee: debugEmployee.employee_code,
//     totalWorkedHours: Number(
//       debugEmployee.total_worked_hours.toFixed(2)
//     ),
//     overtimeHours: Number(
//       debugEmployee.overtime_hours.toFixed(2)
//     ),
//     shortageHours: Number(
//       debugEmployee.shortage_hours.toFixed(2)
//     ),
//   });
//   console.log('=========================================');
// }








//         // 5. Separate calculations for Regular and Daily Wage Staff
//         const regularStaff: any[] = [];
//         const dailyWageStaff: any[] = [];

// (dbEmployees || []).forEach((emp) => {
//   const empCodeClean = cleanEmpCode(emp.employee_code);

//   const attendance = attendanceMap.get(empCodeClean) || {
//     employee_code: emp.employee_code,
//     total_worked_hours: 0,
//     overtime_hours: 0,
//     shortage_hours: 0,
//   };

//   // Calculate active allowance sum from salary_structures using targetDateStr
//   const totalAllowance = getActiveAllowanceTotal(emp.salary_structures, targetDateStr);

//   let isDailyWage = false;
//   if (emp.is_permanently_daily === true) {
//     isDailyWage = true;
//   } else if (emp.is_daily_wage_joining_month === true) {
//     if (emp.daily_wage_until) {
//       const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY']);
//       isDailyWage = untilDate.isValid() ? untilDate.isSameOrAfter(payrollStartMonthDate, 'month') : true;
//     } else {
//       isDailyWage = true;
//     }
//   }

//   if (isDailyWage) {
//     const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
//     const hourlyRate = emp.daily_wage_rate || 0;
//     const baseWages = Math.round(totalWorkedHours * hourlyRate);
//     const netPayable = baseWages + totalAllowance;

//     dailyWageStaff.push({
//       key: emp.id,
//       employeeCode: emp.employee_code,
//       full_name: emp.full_name,
//       total_worked_hours: totalWorkedHours,
//       daily_wage_rate: hourlyRate,
//       totalAllowance: totalAllowance,
//       netPayable: netPayable,
//     });
//   } else {
//     const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

//     const salaryResult = calculateSalary(emp, {
//       targetDate: targetDateStr,
//       lopDays: lopDaysFromDb,
//       overtimeHours: attendance.overtime_hours || 0,
//       shortageHours: attendance.shortage_hours || 0,
//     });

//     const baseNetPayable = salaryResult?.netPayable || 0;
//     const finalNetPayable = baseNetPayable + totalAllowance;

//     regularStaff.push({
//       key: emp.id,
//       ...attendance,
//       ...salaryResult,
//       employeeCode: emp.employee_code,
//       full_name: emp.full_name,
//       totalAllowance: totalAllowance,
//       retainedAmount: salaryResult?.retainedAmount || 0,
//       netPayable: finalNetPayable,
//       total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
//       overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
//       shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
//     });
//   }
// });

//         setRegularStaffSummaries(regularStaff);
//         setDailyWageStaffSummaries(dailyWageStaff);
//         setFileUploaded(true);

//         message.success(
//           `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
//         );
//       } catch (err: any) {
//         console.error(err);
//         message.error(err.message || 'An error occurred during calculation');
//       } finally {
//         setLoading(false);
//       }
//     };

//     reader.readAsArrayBuffer(file);
//     return false;
//   };

// //   const regularColumns = [
// //     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
// //     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
// //     {
// //       title: 'Base Salary',
// //       dataIndex: 'baseSalary',
// //       key: 'baseSalary',
// //       render: (amt: number) => `₹${(amt || 0).toLocaleString()}`,
// //     },
// // {
// //   title: 'Allowances',
// //   dataIndex: 'totalAllowance',
// //   key: 'totalAllowance',
// //   render: (amt: number) => {
// //     const val = Number(amt || 0);
// //     return (
// //       <span style={{ color: val > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: val > 0 ? 'bold' : 'normal', textAlign: 'center', }}>
// //         {val > 0 ? `${val.toLocaleString()}` : '₹0'}
// //       </span>
// //     );
// //   },
// // },
// //     {
// //       title: 'Total Worked Hours',
// //       dataIndex: 'total_worked_hours',
// //       key: 'total_worked_hours',
// //       render: (hrs: number) => <strong>{hrs || 0}</strong>,
// //     },
// //     {
// //       title: 'Overtime Hours',
// //       dataIndex: 'overtime_hours',
// //       key: 'overtime_hours',
// //       render: (hrs: number) => (
// //         <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
// //           {hrs > 0 ? `${hrs} ` : '0 hrs'}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'Overtime Pay',
// //       dataIndex: 'overtimePay',
// //       key: 'overtimePay',
// //       render: (amt: number) => (
// //         <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
// //           {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'Shortage Hours',
// //       dataIndex: 'shortage_hours',
// //       key: 'shortage_hours',
// //       render: (hrs: number) => (
// //         <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
// //           {hrs > 0 ? `${hrs} ` : '0 hrs'}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'Shortage Deduction',
// //       dataIndex: 'shortageDeduction',
// //       key: 'shortageDeduction',
// //       render: (amt: number) => (
// //         <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
// //           {amt > 0 ? `₹${amt.toLocaleString()}` : '₹0'}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'LOP Days',
// //       dataIndex: 'lopDays',
// //       key: 'lopDays',
// //       render: (days: number) => (
// //         <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
// //           {days || 0} 
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'LOP Deduction',
// //       dataIndex: 'lopDeduction',
// //       key: 'lopDeduction',
// //       render: (amt: number) => <span style={{ color: '#c62828' }}>{(amt || 0).toLocaleString()}</span>,
// //     },
// //     {
// //       title: 'Retention Deducted',
// //       dataIndex: 'retainedAmount',
// //       key: 'retainedAmount',
// //       render: (amt: number) => (
// //         <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
// //           {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: 'Net Payable',
// //       dataIndex: 'netPayable',
// //       key: 'netPayable',
// //       render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
// //     },
// //   ]





// const regularColumns = [
//   { 
//     title: 'Code', 
//     dataIndex: 'employeeCode', 
//     key: 'employeeCode',
//     width: 70,
//   },
//   { 
//     title: 'Name', 
//     dataIndex: 'full_name', 
//     key: 'full_name',
//     width: 130,
//     ellipsis: true,
//   },
//   {
//     title: 'Base',
//     dataIndex: 'baseSalary',
//     key: 'baseSalary',
//     align: 'right' as const,
//     width: 85,
//     render: (amt: number) => `${(amt || 0).toLocaleString()}`,
//   },
//   {
//     title: 'Allow.',
//     dataIndex: 'totalAllowance',
//     key: 'totalAllowance',
//     align: 'right' as const,
//     width: 75,
//     render: (amt: number) => {
//       const val = Number(amt || 0);
//       return (
//         <span style={{ color: val > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: val > 0 ? 'bold' : 'normal' }}>
//           {val > 0 ? `${val.toLocaleString()}` : '₹0'}
//         </span>
//       );
//     },
//   },
//   {
//     title: 'Hours',
//     dataIndex: 'total_worked_hours',
//     key: 'total_worked_hours',
//     align: 'center' as const,
//     width: 65,
//     render: (hrs: number) => <strong>{hrs || 0}</strong>,
//   },
//   {
//     title: 'OT Hrs',
//     dataIndex: 'overtime_hours',
//     key: 'overtime_hours',
//     align: 'center' as const,
//     width: 65,
//     render: (hrs: number) => (
//       <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//         {hrs > 0 ? hrs : 0}
//       </span>
//     ),
//   },
//   {
//     title: 'OT Pay',
//     dataIndex: 'overtimePay',
//     key: 'overtimePay',
//     align: 'right' as const,
//     width: 75,
//     render: (amt: number) => (
//       <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//         {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
//       </span>
//     ),
//   },
//   {
//     title: 'Short Hrs',
//     dataIndex: 'shortage_hours',
//     key: 'shortage_hours',
//     align: 'center' as const,
//     width: 75,
//     render: (hrs: number) => (
//       <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
//         {hrs > 0 ? hrs : 0}
//       </span>
//     ),
//   },
//   {
//     title: 'Short Ded.',
//     dataIndex: 'shortageDeduction',
//     key: 'shortageDeduction',
//     align: 'right' as const,
//     width: 85,
//     render: (amt: number) => (
//       <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//         {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
//       </span>
//     ),
//   },
//   {
//     title: 'LOP',
//     dataIndex: 'lopDays',
//     key: 'lopDays',
//     align: 'center' as const,
//     width: 55,
//     render: (days: number) => (
//       <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
//         {days || 0}
//       </span>
//     ),
//   },
//   {
//     title: 'LOP Ded.',
//     dataIndex: 'lopDeduction',
//     key: 'lopDeduction',
//     align: 'right' as const,
//     width: 80,
//     render: (amt: number) => (
//       <span style={{ color: amt > 0 ? '#c62828' : '#8c8c8c' }}>
//         {amt > 0 ? `₹${amt.toLocaleString()}` : '₹0'}
//       </span>
//     ),
//   },
//   {
//     title: 'Ret. Ded.',
//     dataIndex: 'retainedAmount',
//     key: 'retainedAmount',
//     align: 'right' as const,
//     width: 80,
//     render: (amt: number) => (
//       <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
//         {amt > 0 ? `₹${amt.toLocaleString()}` : '₹0'}
//       </span>
//     ),
//   },
//   {
//     title: 'Net Payable',
//     dataIndex: 'netPayable',
//     key: 'netPayable',
//     align: 'right' as const,
//     width: 100,
//     render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
//   },
// ];;








//   const dailyWageColumns = [
//     { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
//     { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
//     {
//       title: 'Hourly Rate',
//       dataIndex: 'daily_wage_rate',
//       key: 'daily_wage_rate',
//       render: (amt: number) => `₹${(amt || 0).toLocaleString()} / hr`,
//     },
//     {
//       title: 'Total Worked Hours',
//       dataIndex: 'total_worked_hours',
//       key: 'total_worked_hours',
//       render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
//     },
//     {
//       title: 'Net Payable',
//       dataIndex: 'netPayable',
//       key: 'netPayable',
//       render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{(amt || 0).toLocaleString()}</strong>,
//     },
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
//         <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
//           <Button icon={<UploadOutlined />} loading={loading} type="primary">
//             Select & Parse Biometric Excel
//           </Button>
//         </Upload>
//       </Card>

//       {/* {fileUploaded && detectedPeriod && (
//         <Card title={`Payroll Report (${dayjs().month(detectedPeriod.month - 1).format('MMMM')} ${detectedPeriod.year})`}>
//           <Tabs
//             defaultActiveKey="regular"
//             items={[
//               {
//                 key: 'regular',
//                 label: `Regular Staff (${regularStaffSummaries.length})`,
//                 children: (
//                   <Table
//                     dataSource={regularStaffSummaries}
//                     columns={regularColumns}
//                     loading={loading}
//                     pagination={{ pageSize: 10 }}
//                     scroll={{ x: true }}
//                   />
//                 ),
//               },
//               {
//                 key: 'dailyWage',
//                 label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//                 children: (
//                   <Table
//                     dataSource={dailyWageStaffSummaries}
//                     columns={dailyWageColumns}
//                     loading={loading}
//                     pagination={{ pageSize: 10 }}
//                     scroll={{ x: true }}
//                   />
//                 ),
//               },
//             ]}
//           />
//         </Card>
//       )} */}





//       {fileUploaded && detectedPeriod && (
//   <Card
//     title={`Payroll Report (${dayjs().month(detectedPeriod.month - 1).format('MMMM')} ${detectedPeriod.year})`}
//     extra={
//       <Button type="primary" loading={saving} onClick={handleSavePayroll}>
//         Save Payroll Records
//       </Button>
//     }
//     bodyStyle={{ overflowX: 'hidden', padding: '12px' }}
//   >
//     <Tabs
//       defaultActiveKey="regular"
//       items={[
//         {
//           key: 'regular',
//           label: `Regular Staff (${regularStaffSummaries.length})`,
//           children: (
//             <Table
//               dataSource={regularStaffSummaries}
//               columns={regularColumns}
//               loading={loading}
//               size="small"
//               tableLayout="fixed"
//               pagination={{ pageSize: 10 }}
//             />
//           ),
//         },
//         {
//           key: 'dailyWage',
//           label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
//           children: (
//             <Table
//               dataSource={dailyWageStaffSummaries}
//               columns={dailyWageColumns}
//               loading={loading}
//               size="small"
//               tableLayout="fixed"
//               pagination={{ pageSize: 10 }}
//             />
//           ),
//         },
//       ]}
//     />
//   </Card>
// )}
//     </div>
//   );
// }





















'use client';



import { useState } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import * as XLSX from 'xlsx';
import { RcFile } from 'antd/es/upload';
import { message, Upload, Button, Table, Card, Tag, Tabs } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { supabase } from '@/lib/supabase';
import { calculateSalary } from '@/lib/salary-calculator';

dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

interface EmployeeAttendanceSummary {
  employee_code: string;
  total_worked_hours: number;
  overtime_hours: number;
  shortage_hours: number;
}





function parseTimeToDecimalHours(timeVal: any): number {
  if (timeVal === null || timeVal === undefined || timeVal === '') {
    return 0;
  }

  // ---------------------------------------------------------
  // 1. Excel numeric time
  // Example:
  // 0.333333 = 08:00
  // 0.375000 = 09:00
  // ---------------------------------------------------------
  if (typeof timeVal === 'number') {
    if (!Number.isFinite(timeVal)) {
      return 0;
    }

    // Excel stores time as fraction of a day.
    // If it is less than 1, convert to hours.
    if (timeVal >= 0 && timeVal < 1) {
      return timeVal * 24;
    }

    // If already supplied as decimal hours
    // e.g. 8.5 = 08:30
    return timeVal;
  }

  // ---------------------------------------------------------
  // Convert everything else to string
  // ---------------------------------------------------------
  const value = String(timeVal).trim();

  if (!value) {
    return 0;
  }

  // ---------------------------------------------------------
  // 2. JavaScript Date string / Excel Date representation
  //
  // Example:
  // Sat Dec 30 1899 08:59:00 GMT+0521 (...)
  //
  // We ONLY extract HH:MM:SS.
  // We do NOT use new Date() because the timezone of
  // Excel's 1899 date can cause unexpected results.
  // ---------------------------------------------------------
  const dateTimeMatch = value.match(
    /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/
  );

  if (
    dateTimeMatch &&
    (
      value.includes('1899') ||
      value.includes('1900') ||
      value.includes('GMT') ||
      value.includes('Standard Time')
    )
  ) {
    const hours = Number(dateTimeMatch[1]);
    const minutes = Number(dateTimeMatch[2]);
    const seconds = Number(dateTimeMatch[3] || 0);

    if (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59
    ) {
      return hours + minutes / 60 + seconds / 3600;
    }

    return 0;
  }

  // ---------------------------------------------------------
  // 3. ISO date/time
  //
  // Example:
  // 1899-12-30T08:59:00
  // ---------------------------------------------------------
  if (value.includes('T')) {
    const isoMatch = value.match(
      /T(\d{1,2}):(\d{2})(?::(\d{2}))?/
    );

    if (isoMatch) {
      const hours = Number(isoMatch[1]);
      const minutes = Number(isoMatch[2]);
      const seconds = Number(isoMatch[3] || 0);

      if (
        hours <= 23 &&
        minutes <= 59 &&
        seconds <= 59
      ) {
        return hours + minutes / 60 + seconds / 3600;
      }
    }

    return 0;
  }

  // ---------------------------------------------------------
  // 4. Normal HH:MM or HH:MM:SS
  //
  // Examples:
  // 08:00
  // 08:59
  // 8:05
  // 08:59:30
  // ---------------------------------------------------------
  const timeMatch = value.match(
    /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/
  );

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] || 0);

    if (
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59
    ) {
      return hours + minutes / 60 + seconds / 3600;
    }

    return 0;
  }

  // ---------------------------------------------------------
  // 5. Numeric text
  //
  // Example:
  // "0.333333"
  // "8.5"
  // ---------------------------------------------------------
  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    if (numericValue >= 0 && numericValue < 1) {
      return numericValue * 24;
    }

    return numericValue;
  }

  // Unknown format
  return 0;
}







const cleanEmpCode = (code: any): string => {
  if (!code) return '';
  return String(code).trim().replace(/^0+/, '');
};

export default function HRSalaryCalculatorPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [regularStaffSummaries, setRegularStaffSummaries] = useState<any[]>([]);
  const [dailyWageStaffSummaries, setDailyWageStaffSummaries] = useState<any[]>([]);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [detectedPeriod, setDetectedPeriod] = useState<{ month: number; year: number } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);




const handleSavePayroll = async () => {
  if (!detectedPeriod || (regularStaffSummaries.length === 0 && dailyWageStaffSummaries.length === 0)) {
    message.warning('No payroll data available to save.');
    return;
  }

  setSaving(true);

  try {
    const totalDaysInMonth = dayjs(`${detectedPeriod.year}-${detectedPeriod.month}-01`).daysInMonth();

    // 1. Prepare Regular Staff Records
    const regularRecords = regularStaffSummaries.map((emp) => {
      const grossSalary = (emp.baseSalary || 0) + (emp.totalAllowance || 0) + (emp.overtimePay || 0);

      return {
        employee_id: emp.key,
        employee_name: emp.full_name, // Added employee name
        pay_period_year: detectedPeriod.year,
        pay_period_month: detectedPeriod.month,
        present_days: Math.max(0, totalDaysInMonth - (emp.lopDays || 0)),
        total_days_in_month: totalDaysInMonth,
        salary_type: 'regular',
        applied_rate: emp.baseSalary || 0,
        per_day_rate: Number(((emp.baseSalary || 0) / totalDaysInMonth).toFixed(2)),
        gross_salary: grossSalary,
        retained_amount: emp.retainedAmount || 0,
        net_payable: emp.netPayable || 0,
        status: 'DRAFT',
      };
    });

    // 2. Prepare Daily Wage Staff Records
    const dailyRecords = dailyWageStaffSummaries.map((emp) => {
      const grossSalary = emp.netPayable || 0;

      return {
        employee_id: emp.key,
        employee_name: emp.full_name, // Added employee name
        pay_period_year: detectedPeriod.year,
        pay_period_month: detectedPeriod.month,
        present_days: Number(((emp.total_worked_hours || 0) / 8).toFixed(2)),
        total_days_in_month: totalDaysInMonth,
        salary_type: 'daily_wage',
        applied_rate: emp.daily_wage_rate || 0,
        per_day_rate: (emp.daily_wage_rate || 0) * 8,
        gross_salary: grossSalary,
        retained_amount: 0,
        net_payable: emp.netPayable || 0,
        status: 'DRAFT',
      };
    });

    const payload = [...regularRecords, ...dailyRecords];

    // 3. Upsert into Supabase
    const { error } = await supabase
      .schema('leave_management')
      .from('payrolls')
      .upsert(payload, {
        onConflict: 'employee_id,pay_period_year,pay_period_month',
      });

    if (error) throw new Error(error.message);

    message.success(
      `Payroll saved successfully for ${dayjs()
        .month(detectedPeriod.month - 1)
        .format('MMMM')} ${detectedPeriod.year}!`
    );
  } catch (err: any) {
    console.error('Error saving payroll:', err);
    message.error(`Failed to save payroll: ${err.message}`);
  } finally {
    setSaving(false);
  }
};




  const handleFileUpload = (file: RcFile): boolean => {
    setLoading(true);
    setRegularStaffSummaries([]);
    setDailyWageStaffSummaries([]);
    setFileUploaded(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 1. Detect Month & Year across all file formats
        let detectedMonth: number | null = null;
        let detectedYear: number | null = null;

        for (const row of rawRows) {
          if (!row || row.length === 0) continue;
          const rowCells = row.map((cell: any) =>
            cell !== undefined && cell !== null ? String(cell).trim() : ''
          );
          const rowText = rowCells.join(' ');

          const rangeMatch = rowText.match(/([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}\s+To\s+([A-Za-z]{3}|\d{1,2})[\s\/-]\d{1,2}[\s\/-]\d{2,4}/i);
          if (rangeMatch) {
            const parts = rangeMatch[0].split(/\s+To\s+/i);
            const pDate = dayjs(parts[0].trim(), ['DD-MMM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']);
            if (pDate.isValid()) {
              detectedMonth = pDate.month() + 1;
              detectedYear = pDate.year();
              break;
            }
          }

          for (const cell of rowCells) {
            if (!cell || ['Att. Date', 'Date', 'InTime', 'OutTime'].includes(cell)) continue;
            if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(cell) || /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{2}\/\d{2}\/\d{4}$/.test(cell)) {
              const pDate = dayjs(cell, ['DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']);
              if (pDate.isValid()) {
                detectedMonth = pDate.month() + 1;
                detectedYear = pDate.year();
                break;
              }
            }
          }
          if (detectedMonth && detectedYear) break;
        }

        const autoMonth = detectedMonth || dayjs().month() + 1;
        const autoYear = detectedYear || dayjs().year();
        setDetectedPeriod({ month: autoMonth, year: autoYear });

        const targetDateStr = `${autoYear}-${String(autoMonth).padStart(2, '0')}-01`;
        const payrollStartMonthDate = dayjs(targetDateStr);

        // 2. Fetch staff employees
       // 1. Fetch employees
// 1. Fetch staff employees
const { data: dbEmployees, error: dbError } = await supabase
  .schema('leave_management')
  .from('employees')
  .select(`
    id,
    employee_code,
    full_name,
    role,
    normal_salary,
    probation_salary,
    retention_amount,
    is_daily_wage_joining_month,
    daily_wage_until,
    is_permanently_daily,
    daily_wage_rate,
    salary_structures (
        stage_name,
        base_salary,
        effective_from,
        effective_to,
        hra_amount,
        mobile_recharge_amount,
        health_insurance_amount,
        allowance_effective_from
    )
  `)
  .eq('role', 'staff');

if (dbError) throw new Error(`Could not fetch employee configurations: ${dbError.message}`);

// 2. Fetch employee allowances directly
const { data: dbAllowances, error: allowanceError } = await supabase
  .schema('leave_management')
  .from('employee_allowances')
  .select('*'); // Select all fields to avoid column mismatch issues

if (allowanceError) {
  console.warn('Could not fetch allowances:', allowanceError.message);
}

// 3. Populate Allowances Map with flexible status checking
const allowancesMap = new Map<string, number>();

(dbAllowances || []).forEach((a: any) => {
  // Support boolean true, string 'true', or missing/null is_active
  const isActive =
    a.is_active === undefined ||
    a.is_active === null ||
    a.is_active === true ||
    String(a.is_active).toLowerCase() === 'true';

  const amount = Number(a.amount || a.allowance_amount || 0);

  if (isActive && amount > 0) {
    const empId = a.employee_id || a.emp_id;
    if (empId) {
      const currentTotal = allowancesMap.get(empId) || 0;
      allowancesMap.set(empId, currentTotal + amount);
    }
  }
});



function getActiveAllowanceTotal(salaryStructures: any[], targetDateStr: string): number {
  if (!salaryStructures || salaryStructures.length === 0) return 0;

  const targetDate = dayjs(targetDateStr);

  // Find the active salary structure for the payroll period
  const activeStructure = salaryStructures.find((struct) => {
    const effectiveFrom = struct.effective_from ? dayjs(struct.effective_from) : null;
    const effectiveTo = struct.effective_to ? dayjs(struct.effective_to) : null;

    const isAfterStart = !effectiveFrom || effectiveFrom.isBefore(targetDate, 'day') || effectiveFrom.isSame(targetDate, 'day');
    const isBeforeEnd = !effectiveTo || effectiveTo.isAfter(targetDate, 'day') || effectiveTo.isSame(targetDate, 'day');

    return isAfterStart && isBeforeEnd;
  }) || salaryStructures[0]; // Fallback to first record if single record exists

  if (!activeStructure) return 0;

  // Verify allowance_effective_from date
  const allowanceEffectiveFrom = activeStructure.allowance_effective_from 
    ? dayjs(activeStructure.allowance_effective_from) 
    : (activeStructure.effective_from ? dayjs(activeStructure.effective_from) : null);

  const isAllowanceActive = !allowanceEffectiveFrom || allowanceEffectiveFrom.isBefore(targetDate, 'day') || allowanceEffectiveFrom.isSame(targetDate, 'day');

  if (!isAllowanceActive) return 0;

  // Sum up all allowance columns from the salary_structures table
  const hra = Number(activeStructure.hra_amount || 0);
  const mobile = Number(activeStructure.mobile_recharge_amount || 0);
  const health = Number(activeStructure.health_insurance_amount || 0);

  return hra + mobile + health;
}





        // 3. Fetch LOP records for auto-detected month & year
        const { data: lopRecords, error: lopError } = await supabase
          .schema('leave_management')
          .from('leaves')
          .select('employee_id, half, allocated_type, allocation_source_type, allocation_source_year, allocation_source_month');

        if (lopError) {
          console.warn('Could not fetch LOP records:', lopError.message);
        }

        const lopDaysMap = new Map<string, number>();

        (lopRecords || []).forEach((rec: any) => {
          const allocatedType = String(rec.allocated_type || '').toUpperCase();
          const sourceYear = rec.allocation_source_year;
          const sourceMonth = rec.allocation_source_month;

          const isLop = allocatedType.startsWith('LOP') || rec.allocation_source_type?.toUpperCase() === 'LOP';
          const matchesYear = sourceYear ? sourceYear === autoYear : allocatedType.includes(`_${autoYear}_`);
          const matchesMonth = sourceMonth ? sourceMonth === autoMonth : allocatedType.endsWith(`_${autoMonth}`);

          if (isLop && matchesYear && matchesMonth && rec.employee_id) {
            let dayWeight = 1.0;
            const halfStr = String(rec.half || '').toUpperCase();
            if (allocatedType.includes('_1H_') || allocatedType.includes('_2H_') || halfStr === '1H' || halfStr === '2H') {
              dayWeight = 0.5;
            }
            const currentTotal = lopDaysMap.get(rec.employee_id) || 0;
            lopDaysMap.set(rec.employee_id, currentTotal + dayWeight);
          }
        });





// ============================================================
// 4. Multi-Format Biometric Parser
// ============================================================

let currentEmpCode = '';

let dateColIdx = -1;
let totDurColIdx = -1;
let workDurColIdx = -1;
let statusColIdx = -1;

// Ensure the map starts completely fresh
const attendanceMap = new Map<string, EmployeeAttendanceSummary>();

// ------------------------------------------------------------
// DEBUG EMPLOYEE
// Change this to another employee code when required.
// Set to '' to disable debug logs completely.
// ------------------------------------------------------------
const DEBUG_EMPLOYEE = 'EXR1011';


// ============================================================
// PROCESS EVERY EXCEL ROW
// ============================================================

for (const row of rawRows) {

  if (!row || row.length === 0) continue;

  // ----------------------------------------------------------
  // Convert all cells to clean strings
  // ----------------------------------------------------------
  const rowCells = row.map((cell: any) =>
    cell !== undefined && cell !== null
      ? String(cell).trim()
      : ''
  );


  // ==========================================================
  // 1. EMPLOYEE CODE HEADER
  // ==========================================================

  const empCodeIdx = rowCells.findIndex((c: string) =>
    [
      'Emp Code:',
      'Employee Code:',
      'Emp Code',
      'Employee Code'
    ].includes(c)
  );

  if (empCodeIdx !== -1) {

    let extractedCode = '';

    for (
      let k = empCodeIdx + 1;
      k < rowCells.length;
      k++
    ) {

      if (
        rowCells[k] &&
        !rowCells[k].startsWith('Employee Name') &&
        !rowCells[k].startsWith('Name')
      ) {
        extractedCode = rowCells[k];
        break;
      }
    }

    if (extractedCode) {

      currentEmpCode = cleanEmpCode(extractedCode);

      // ------------------------------------------------------
      // Start a fresh summary for this employee
      // ------------------------------------------------------
      if (!attendanceMap.has(currentEmpCode)) {

        attendanceMap.set(currentEmpCode, {
          employee_code: currentEmpCode,
          total_worked_hours: 0,
          overtime_hours: 0,
          shortage_hours: 0,
        });
      }
    }

    continue;
  }


  // ==========================================================
  // 2. ATTENDANCE TABLE HEADER
  // ==========================================================

  const hasDateHeader = rowCells.some((c: string) =>
    [
      'Att. Date',
      'Date'
    ].includes(c)
  );

  const hasDurationHeader = rowCells.some((c: string) =>
    [
      'Tot. Dur.',
      'Total Duration',
      'Work Dur.'
    ].includes(c)
  );


  if (hasDateHeader || hasDurationHeader) {

    dateColIdx = rowCells.findIndex((c: string) =>
      [
        'Att. Date',
        'Date'
      ].includes(c)
    );

    totDurColIdx = rowCells.findIndex((c: string) =>
      [
        'Tot. Dur.',
        'Total Duration'
      ].includes(c)
    );

    workDurColIdx = rowCells.findIndex((c: string) =>
      [
        'Work Dur.'
      ].includes(c)
    );

    statusColIdx = rowCells.findIndex((c: string) =>
      [
        'Status'
      ].includes(c)
    );

    continue;
  }


  // ==========================================================
  // 3. ATTENDANCE ROW
  // ==========================================================

  if (
    dateColIdx === -1 ||
    dateColIdx >= rowCells.length
  ) {
    continue;
  }


  const dateVal = rowCells[dateColIdx];


  // ----------------------------------------------------------
  // Validate date
  // ----------------------------------------------------------

  const isValidDateRow =
    !!dateVal &&
    (
      dayjs(
        dateVal,
        [
          'DD-MMM-YYYY',
          'YYYY-MM-DD',
          'DD/MM/YYYY',
          'MM/DD/YYYY'
        ],
        true
      ).isValid()

      ||

      /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateVal)

      ||

      /^\d{4}-\d{2}-\d{2}$/.test(dateVal)

      ||

      /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)
    );


  if (!isValidDateRow || !currentEmpCode) {
    continue;
  }


  // ==========================================================
  // 4. GET EMPLOYEE SUMMARY
  // ==========================================================

  const summary =
    attendanceMap.get(currentEmpCode) || {

      employee_code: currentEmpCode,

      total_worked_hours: 0,

      overtime_hours: 0,

      shortage_hours: 0,
    };


  // ==========================================================
  // 5. GET RAW ATTENDANCE VALUES
  // ==========================================================

  const totDurStr =
    totDurColIdx !== -1
      ? rowCells[totDurColIdx]
      : '';

  const workDurStr =
    workDurColIdx !== -1
      ? rowCells[workDurColIdx]
      : '';

  const statusStr =
    statusColIdx !== -1
      ? rowCells[statusColIdx]
      : '';


  // ==========================================================
  // 6. NORMALIZE STATUS
  // ==========================================================

  const normalizedStatus =
    statusStr
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();


  const isAbsent =
    normalizedStatus.includes('absent');

  const isWeeklyOff =
    normalizedStatus.includes('weeklyoff') ||
    normalizedStatus.includes('weekly off');

  const isHalfDayStatus =
    normalizedStatus.includes('1/2') ||
    normalizedStatus.includes('½');


  // ==========================================================
  // 7. PARSE WORKING HOURS
  // ==========================================================

  const totHours =
    parseTimeToDecimalHours(totDurStr);

  const workHours =
    parseTimeToDecimalHours(workDurStr);


  // ----------------------------------------------------------
  // Use whichever duration is greater.
  // ----------------------------------------------------------

  const dailyWorkedHours =
    Math.max(
      totHours,
      workHours
    );


  // ----------------------------------------------------------
  // Convert to minutes to avoid floating-point errors.
  // ----------------------------------------------------------

  const workedMinutes =
    Math.round(
      dailyWorkedHours * 60
    );



 if (
  isAbsent &&
  workedMinutes > 0 &&
  workedMinutes < 120
) {
  // Count actual worked time
  summary.total_worked_hours +=
    workedMinutes / 60;

  // Treat actual worked time as OT because
  // this is an Absent biometric status but the employee
  // actually worked.
  summary.overtime_hours +=
    workedMinutes / 60;

  if (currentEmpCode === DEBUG_EMPLOYEE) {
    console.log(
      `🟡 ${dateVal} | ` +
      `Absent but worked ` +
      `${Math.floor(workedMinutes / 60)}h ` +
      `${workedMinutes % 60}m | ` +
      `Counted as OT | ` +
      `Status="${statusStr}"`
    );
  }

  attendanceMap.set(
    currentEmpCode,
    summary
  );

  continue;
}



  if (
    isWeeklyOff ||
    (isAbsent && workedMinutes === 0) ||
    totDurStr === '00:00'
  ) {

    attendanceMap.set(
      currentEmpCode,
      summary
    );

    continue;
  }


  // ==========================================================
  // 10. NO WORKING TIME
  // ==========================================================

  if (workedMinutes <= 0) {

    attendanceMap.set(
      currentEmpCode,
      summary
    );

    continue;
  }


  // ==========================================================
  // 11. ADD ACTUAL WORKED HOURS
  // ==========================================================

  summary.total_worked_hours +=
    workedMinutes / 60;




  let targetMinutes = 8 * 60;


  if (
    isHalfDayStatus &&
    workedMinutes < 8 * 60
  ) {

    targetMinutes = 4 * 60;
  }


  // ==========================================================
  // 13. OVERTIME
  // ==========================================================

  if (workedMinutes > targetMinutes) {

    const overtimeMinutes =
      workedMinutes -
      targetMinutes;


    summary.overtime_hours +=
      overtimeMinutes / 60;


    // --------------------------------------------------------
    // Compact debug log
    // --------------------------------------------------------

    if (
      currentEmpCode === DEBUG_EMPLOYEE
    ) {

      console.log(
        `🟢 ${dateVal} | ` +
        `Worked ${Math.floor(workedMinutes / 60)}h ` +
        `${workedMinutes % 60}m | ` +
        `Target ${Math.floor(targetMinutes / 60)}h ` +
        `${targetMinutes % 60}m | ` +
        `OT ${Math.floor(overtimeMinutes / 60)}h ` +
        `${overtimeMinutes % 60}m | ` +
        `Status="${statusStr}"`
      );
    }

  }


  // ==========================================================
  // 14. SHORTAGE
  // ==========================================================

  else if (workedMinutes < targetMinutes) {

    const shortageMinutes =
      targetMinutes -
      workedMinutes;


    summary.shortage_hours +=
      shortageMinutes / 60;


    // --------------------------------------------------------
    // Compact debug log
    // --------------------------------------------------------

    if (
      currentEmpCode === DEBUG_EMPLOYEE
    ) {

      console.log(
        `🔴 ${dateVal} | ` +
        `Worked ${Math.floor(workedMinutes / 60)}h ` +
        `${workedMinutes % 60}m | ` +
        `Target ${Math.floor(targetMinutes / 60)}h ` +
        `${targetMinutes % 60}m | ` +
        `Short ${Math.floor(shortageMinutes / 60)}h ` +
        `${shortageMinutes % 60}m | ` +
        `Status="${statusStr}"`
      );
    }
  }


  // ==========================================================
  // 15. SAVE EMPLOYEE SUMMARY
  // ==========================================================

  attendanceMap.set(
    currentEmpCode,
    summary
  );
}


// // ============================================================
// // 16. FINAL DEBUG SUMMARY
// // ============================================================

// if (DEBUG_EMPLOYEE) {

//   const debugEmployee =
//     attendanceMap.get(DEBUG_EMPLOYEE);


//   if (debugEmployee) {

//     console.log(
//       '========== ' +
//       DEBUG_EMPLOYEE +
//       ' OT SUMMARY =========='
//     );

//     console.log({
//       employee:
//         debugEmployee.employee_code,

//       totalWorkedHours:
//         Number(
//           debugEmployee.total_worked_hours.toFixed(2)
//         ),

//       overtimeHours:
//         Number(
//           debugEmployee.overtime_hours.toFixed(2)
//         ),

//       shortageHours:
//         Number(
//           debugEmployee.shortage_hours.toFixed(2)
//         ),
//     });

//     console.log(
//       '========================================='
//     );
//   }
// }

















// // =====================================================
// // DEBUG ONLY: FINAL SUMMARY
// // =====================================================
// const debugEmployee = attendanceMap.get('EXR1011');

// if (debugEmployee) {
//   console.log('========== EXR1011 OT SUMMARY ==========');
//   console.log({
//     employee: debugEmployee.employee_code,
//     totalWorkedHours: Number(
//       debugEmployee.total_worked_hours.toFixed(2)
//     ),
//     overtimeHours: Number(
//       debugEmployee.overtime_hours.toFixed(2)
//     ),
//     shortageHours: Number(
//       debugEmployee.shortage_hours.toFixed(2)
//     ),
//   });
//   console.log('=========================================');
// }








        // 5. Separate calculations for Regular and Daily Wage Staff
        const regularStaff: any[] = [];
        const dailyWageStaff: any[] = [];

(dbEmployees || []).forEach((emp) => {
  const empCodeClean = cleanEmpCode(emp.employee_code);

  const attendance = attendanceMap.get(empCodeClean) || {
    employee_code: emp.employee_code,
    total_worked_hours: 0,
    overtime_hours: 0,
    shortage_hours: 0,
  };

  // Calculate active allowance sum from salary_structures using targetDateStr
  const totalAllowance = getActiveAllowanceTotal(emp.salary_structures, targetDateStr);

  let isDailyWage = false;
  if (emp.is_permanently_daily === true) {
    isDailyWage = true;
  } else if (emp.is_daily_wage_joining_month === true) {
    if (emp.daily_wage_until) {
      const untilDate = dayjs(emp.daily_wage_until, ['YYYY-MM-DD', 'DD/MM/YYYY']);
      isDailyWage = untilDate.isValid() ? untilDate.isSameOrAfter(payrollStartMonthDate, 'month') : true;
    } else {
      isDailyWage = true;
    }
  }

  if (isDailyWage) {
    const totalWorkedHours = Math.round((attendance.total_worked_hours || 0) * 100) / 100;
    const hourlyRate = emp.daily_wage_rate || 0;
    const baseWages = Math.round(totalWorkedHours * hourlyRate);
    const netPayable = baseWages + totalAllowance;

    dailyWageStaff.push({
      key: emp.id,
      employeeCode: emp.employee_code,
      full_name: emp.full_name,
      total_worked_hours: totalWorkedHours,
      daily_wage_rate: hourlyRate,
      totalAllowance: totalAllowance,
      netPayable: netPayable,
    });
  } else {
    const lopDaysFromDb = lopDaysMap.get(emp.id) || 0;

    const salaryResult = calculateSalary(emp, {
      targetDate: targetDateStr,
      lopDays: lopDaysFromDb,
      overtimeHours: attendance.overtime_hours || 0,
      shortageHours: attendance.shortage_hours || 0,
    });

    const baseNetPayable = salaryResult?.netPayable || 0;
    const finalNetPayable = baseNetPayable + totalAllowance;

    regularStaff.push({
      key: emp.id,
      ...attendance,
      ...salaryResult,
      employeeCode: emp.employee_code,
      full_name: emp.full_name,
      totalAllowance: totalAllowance,
      retainedAmount: salaryResult?.retainedAmount || 0,
      netPayable: finalNetPayable,
      total_worked_hours: Number((attendance.total_worked_hours || 0).toFixed(2)),
      overtime_hours: Number((attendance.overtime_hours || 0).toFixed(2)),
      shortage_hours: Number((attendance.shortage_hours || 0).toFixed(2)),
    });
  }
});

        setRegularStaffSummaries(regularStaff);
        setDailyWageStaffSummaries(dailyWageStaff);
        setFileUploaded(true);

        message.success(
          `Period Detected: ${dayjs().month(autoMonth - 1).format('MMMM')} ${autoYear}. Payroll calculated successfully!`
        );
      } catch (err: any) {
        console.error(err);
        message.error(err.message || 'An error occurred during calculation');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    return false;
  };




const regularColumns = [
  { 
    title: 'Code', 
    dataIndex: 'employeeCode', 
    key: 'employeeCode',
    width: 70,
  },
  { 
    title: 'Name', 
    dataIndex: 'full_name', 
    key: 'full_name',
    width: 130,
    ellipsis: true,
  },
  {
    title: 'Base',
    dataIndex: 'baseSalary',
    key: 'baseSalary',
    align: 'right' as const,
    width: 85,
    render: (amt: number) => `${(amt || 0).toLocaleString()}`,
  },
  {
    title: 'Allow.',
    dataIndex: 'totalAllowance',
    key: 'totalAllowance',
    align: 'right' as const,
    width: 75,
    render: (amt: number) => {
      const val = Number(amt || 0);
      return (
        <span style={{ color: val > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: val > 0 ? 'bold' : 'normal' }}>
          {val > 0 ? `${val.toLocaleString()}` : '₹0'}
        </span>
      );
    },
  },
  {
    title: 'Hours',
    dataIndex: 'total_worked_hours',
    key: 'total_worked_hours',
    align: 'center' as const,
    width: 65,
    render: (hrs: number) => <strong>{hrs || 0}</strong>,
  },
  {
    title: 'OT Hrs',
    dataIndex: 'overtime_hours',
    key: 'overtime_hours',
    align: 'center' as const,
    width: 65,
    render: (hrs: number) => (
      <span style={{ color: hrs > 0 ? '#2e7d32' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
        {hrs > 0 ? hrs : 0}
      </span>
    ),
  },
  {
    title: 'OT Pay',
    dataIndex: 'overtimePay',
    key: 'overtimePay',
    align: 'right' as const,
    width: 75,
    render: (amt: number) => (
      <span style={{ color: amt > 0 ? '#2e7d32' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
        {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
      </span>
    ),
  },
  {
    title: 'Short Hrs',
    dataIndex: 'shortage_hours',
    key: 'shortage_hours',
    align: 'center' as const,
    width: 75,
    render: (hrs: number) => (
      <span style={{ color: hrs > 0 ? '#ed6c02' : 'inherit', fontWeight: hrs > 0 ? 'bold' : 'normal' }}>
        {hrs > 0 ? hrs : 0}
      </span>
    ),
  },
  {
    title: 'Short Ded.',
    dataIndex: 'shortageDeduction',
    key: 'shortageDeduction',
    align: 'right' as const,
    width: 85,
    render: (amt: number) => (
      <span style={{ color: amt > 0 ? '#ed6c02' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
        {amt > 0 ? `${amt.toLocaleString()}` : '₹0'}
      </span>
    ),
  },
  {
    title: 'LOP',
    dataIndex: 'lopDays',
    key: 'lopDays',
    align: 'center' as const,
    width: 55,
    render: (days: number) => (
      <span style={{ color: days > 0 ? '#c62828' : 'inherit', fontWeight: days > 0 ? 'bold' : 'normal' }}>
        {days || 0}
      </span>
    ),
  },
  {
    title: 'LOP Ded.',
    dataIndex: 'lopDeduction',
    key: 'lopDeduction',
    align: 'right' as const,
    width: 80,
    render: (amt: number) => (
      <span style={{ color: amt > 0 ? '#c62828' : '#8c8c8c' }}>
        {amt > 0 ? `₹${amt.toLocaleString()}` : '₹0'}
      </span>
    ),
  },
  {
    title: 'Ret. Ded.',
    dataIndex: 'retainedAmount',
    key: 'retainedAmount',
    align: 'right' as const,
    width: 80,
    render: (amt: number) => (
      <span style={{ color: amt > 0 ? '#d32f2f' : '#8c8c8c', fontWeight: amt > 0 ? 'bold' : 'normal' }}>
        {amt > 0 ? `₹${amt.toLocaleString()}` : '₹0'}
      </span>
    ),
  },
  {
    title: 'Net Payable',
    dataIndex: 'netPayable',
    key: 'netPayable',
    align: 'right' as const,
    width: 100,
    render: (amt: number) => <strong>₹{(amt || 0).toLocaleString()}</strong>,
  },
];;








  const dailyWageColumns = [
    { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
    {
      title: 'Hourly Rate',
      dataIndex: 'daily_wage_rate',
      key: 'daily_wage_rate',
      render: (amt: number) => `₹${(amt || 0).toLocaleString()} / hr`,
    },
    {
      title: 'Total Worked Hours',
      dataIndex: 'total_worked_hours',
      key: 'total_worked_hours',
      render: (hrs: number) => <strong>{hrs || 0} hrs</strong>,
    },
    {
      title: 'Net Payable',
      dataIndex: 'netPayable',
      key: 'netPayable',
      render: (amt: number) => <strong style={{ color: '#2e7d32' }}>₹{(amt || 0).toLocaleString()}</strong>,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Upload Biometric Sheet & Calculate Payroll" style={{ marginBottom: '24px' }}>
        <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx, .xls">
          <Button icon={<UploadOutlined />} loading={loading} type="primary">
            Select & Parse Biometric Excel
          </Button>
        </Upload>
      </Card>

      {/* {fileUploaded && detectedPeriod && (
        <Card title={`Payroll Report (${dayjs().month(detectedPeriod.month - 1).format('MMMM')} ${detectedPeriod.year})`}>
          <Tabs
            defaultActiveKey="regular"
            items={[
              {
                key: 'regular',
                label: `Regular Staff (${regularStaffSummaries.length})`,
                children: (
                  <Table
                    dataSource={regularStaffSummaries}
                    columns={regularColumns}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: true }}
                  />
                ),
              },
              {
                key: 'dailyWage',
                label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
                children: (
                  <Table
                    dataSource={dailyWageStaffSummaries}
                    columns={dailyWageColumns}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: true }}
                  />
                ),
              },
            ]}
          />
        </Card>
      )} */}





      {fileUploaded && detectedPeriod && (
  <Card
    title={`Payroll Report (${dayjs().month(detectedPeriod.month - 1).format('MMMM')} ${detectedPeriod.year})`}
    extra={
      <Button type="primary" loading={saving} onClick={handleSavePayroll}>
        Save Payroll Records
      </Button>
    }
    styles={{
  body: {
    overflowX: 'hidden',
    padding: '12px',
  },
}}
  >
    <Tabs
      defaultActiveKey="regular"
      items={[
        {
          key: 'regular',
          label: `Regular Staff (${regularStaffSummaries.length})`,
          children: (
            <Table
              dataSource={regularStaffSummaries}
              columns={regularColumns}
              loading={loading}
              size="small"
              tableLayout="fixed"
              pagination={{ pageSize: 10 }}
            />
          ),
        },
        {
          key: 'dailyWage',
          label: `Daily Wage Staff (${dailyWageStaffSummaries.length})`,
          children: (
            <Table
              dataSource={dailyWageStaffSummaries}
              columns={dailyWageColumns}
              loading={loading}
              size="small"
              tableLayout="fixed"
              pagination={{ pageSize: 10 }}
            />
          ),
        },
      ]}
    />
  </Card>
)}
    </div>
  );
}

