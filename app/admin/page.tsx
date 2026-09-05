// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import dayjs from "dayjs";
// import {
//   User,
//   Calendar,
//   ShieldAlert,
//   CheckCircle2,
//   Clock,
//   RefreshCw,
//   PlusCircle,
//   AlertCircle,
//   FileSpreadsheet,
// } from "lucide-react";

// // --- Types ---
// interface Employee {
//   employee_code: string;
//   name: string;
//   department: string;
//   doj: string;
// }

// interface LeaveRecord {
//   id?: string;
//   employee_code: string;
//   leave_date: string;
//   leave_type: "Casual_Leave" | "Sick_Leave" | "Earned_Leave" | "LOP";
//   day_type: "Full" | "Half";
//   half_day_type?: "First_Half" | "Second_Half";
//   allocation_source_month?: number;
//   allocation_source_year?: number;
//   status: "Approved" | "Unauthorized" | "Pending";
//   notes?: string;
// }

// interface DynamicPoolSummary {
//   casualAvailable: number;
//   sickAvailable: number;
//   earnedAvailable: number;
// }

// export default function ManualLeaveAllocationAdmin() {
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [selectedEmpCode, setSelectedEmpCode] = useState<string>("");
//   const [selectedMonth, setSelectedMonth] = useState<string>(
//     dayjs().format("YYYY-MM")
//   );
//   const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRecord[]>([]);
//   const [poolSummary, setPoolSummary] = useState<DynamicPoolSummary>({
//     casualAvailable: 0,
//     sickAvailable: 0,
//     earnedAvailable: 0,
//   });

//   // New manual leave form state
//   const [newLeaveDate, setNewLeaveDate] = useState<string>("");
//   const [newLeaveType, setNewLeaveType] =
//     useState<LeaveRecord["leave_type"]>("Casual_Leave");
//   const [newDayType, setNewDayType] =
//     useState<LeaveRecord["day_type"]>("Full");
//   const [newHalfDayType, setNewHalfDayType] = useState<
//     "First_Half" | "Second_Half"
//   >("First_Half");
//   const [notes, setNotes] = useState<string>("");

//   const [loading, setLoading] = useState<boolean>(false);
//   const [syncing, setSyncing] = useState<boolean>(false);
//   const [message, setMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);

//   // Mock initial fetch for staff list
//   useEffect(() => {
//     // In production, fetch from your Supabase / API endpoint
//     const mockEmployees: Employee[] = [
//       {
//         employee_code: "EMP001",
//         name: "Alex Morgan",
//         department: "Engineering",
//         doj: "2023-01-15",
//       },
//       {
//         employee_code: "EMP002",
//         name: "Sarah Chen",
//         department: "Design",
//         doj: "2023-06-01",
//       },
//       {
//         employee_code: "EMP003",
//         name: "David Kumar",
//         department: "Operations",
//         doj: "2024-02-10",
//       },
//     ];
//     setEmployees(mockEmployees);
//     if (mockEmployees.length > 0) setSelectedEmpCode(mockEmployees[0].employee_code);
//   }, []);

//   // Fetch leaves & pool data when selected employee or month changes
//   useEffect(() => {
//     if (!selectedEmpCode) return;
//     fetchStaffLeaveDetails(selectedEmpCode, selectedMonth);
//   }, [selectedEmpCode, selectedMonth]);

//   const fetchStaffLeaveDetails = async (empCode: string, monthStr: string) => {
//     setLoading(true);
//     try {
//       // Replace with your API / Supabase client call:
//       // const { data: leaves } = await supabase.from('leaves').select('*').eq('employee_code', empCode)...

//       // Mocked response
//       const mockLeaves: LeaveRecord[] = [
//         {
//           id: "1",
//           employee_code: empCode,
//           leave_date: `${monthStr}-05`,
//           leave_type: "Casual_Leave",
//           day_type: "Full",
//           status: "Approved",
//         },
//         {
//           id: "2",
//           employee_code: empCode,
//           leave_date: `${monthStr}-12`,
//           leave_type: "Sick_Leave",
//           day_type: "Half",
//           half_day_type: "First_Half",
//           status: "Approved",
//         },
//       ];

//       setEmployeeLeaves(mockLeaves);
//       setPoolSummary({
//         casualAvailable: 1.5,
//         sickAvailable: 2.0,
//         earnedAvailable: 5.5,
//       });
//     } catch (err) {
//       setMessage({ type: "error", text: "Failed to load leave records." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedEmployee = useMemo(
//     () => employees.find((e) => e.employee_code === selectedEmpCode),
//     [employees, selectedEmpCode]
//   );

//   // Add a manual leave record to local state prior to reconciliation engine run
//   const handleAddManualLeave = () => {
//     if (!newLeaveDate) {
//       setMessage({ type: "error", text: "Please select a valid date." });
//       return;
//     }

//     const existing = employeeLeaves.find((l) => l.leave_date === newLeaveDate);
//     if (existing) {
//       setMessage({
//         type: "error",
//         text: "A leave record already exists for this date. Modify or delete it below.",
//       });
//       return;
//     }

//     const manualRecord: LeaveRecord = {
//       employee_code: selectedEmpCode,
//       leave_date: newLeaveDate,
//       leave_type: newLeaveType,
//       day_type: newDayType,
//       half_day_type: newDayType === "Half" ? newHalfDayType : undefined,
//       status: "Approved",
//       notes: notes || "Manual allocation by Admin",
//     };

//     setEmployeeLeaves((prev) =>
//       [...prev, manualRecord].sort(
//         (a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf()
//       )
//     );

//     // Reset inputs
//     setNewLeaveDate("");
//     setNotes("");
//     setMessage({ type: "success", text: "Manual leave staged for allocation." });
//   };

//   // Trigger reconciliation pipeline with modified dataset
//   const handleExecuteReallocation = async () => {
//     setSyncing(true);
//     setMessage(null);

//     try {
//       // Map current UI list to reconciliation engine input payload
//       const mappedInputList = employeeLeaves
//         .sort((a, b) => dayjs(a.leave_date).valueOf() - dayjs(b.leave_date).valueOf())
//         .map((rec) => ({
//           employee_code: rec.employee_code,
//           leave_date: rec.leave_date,
//           leave_type: rec.leave_type,
//           day_type: rec.day_type,
//           half_day_type: rec.half_day_type,
//           status: rec.status,
//           notes: rec.notes,
//         }));

//       // Call your backend execution engine
//       // await runReconciliationEngine(mappedInputList);

//       setMessage({
//         type: "success",
//         text: "Leave allocation reconciled and database updated successfully!",
//       });

//       // Refresh state
//       await fetchStaffLeaveDetails(selectedEmpCode, selectedMonth);
//     } catch (err: any) {
//       setMessage({
//         type: "error",
//         text: err?.message || "Reconciliation failed. Check console logs.",
//       });
//     } finally {
//       setSyncing(false);
//     }
//   };

//   const handleDeleteRecord = (date: string) => {
//     setEmployeeLeaves((prev) => prev.filter((l) => l.leave_date !== date));
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
//               <Calendar className="w-6 h-6 text-indigo-600" />
//               Manual Staff Leave Allocation
//             </h1>
//             <p className="text-sm text-slate-500 mt-1">
//               Manually assign leave types, adjust historical tags, and trigger the automated pool reconciliation engine.
//             </p>
//           </div>

//           <button
//             onClick={handleExecuteReallocation}
//             disabled={syncing || employeeLeaves.length === 0}
//             className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-lg shadow-sm transition-all"
//           >
//             <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
//             {syncing ? "Reconciling Pools..." : "Run Reallocation Engine"}
//           </button>
//         </div>

//         {/* Global Feedback Banner */}
//         {message && (
//           <div
//             className={`p-4 rounded-lg border flex items-center gap-3 ${
//               message.type === "success"
//                 ? "bg-emerald-50 border-emerald-200 text-emerald-800"
//                 : "bg-rose-50 border-rose-200 text-rose-800"
//             }`}
//           >
//             {message.type === "success" ? (
//               <CheckCircle2 className="w-5 h-5 shrink-0" />
//             ) : (
//               <AlertCircle className="w-5 h-5 shrink-0" />
//             )}
//             <span className="text-sm font-medium">{message.text}</span>
//           </div>
//         )}

//         {/* Selection & Pool Balances Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Employee & Month Picker */}
//           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
//             <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
//               <User className="w-4 h-4 text-indigo-600" /> Target Employee
//             </h2>

//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">
//                 Select Staff
//               </label>
//               <select
//                 value={selectedEmpCode}
//                 onChange={(e) => setSelectedEmpCode(e.target.value)}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               >
//                 {employees.map((emp) => (
//                   <option key={emp.employee_code} value={emp.employee_code}>
//                     {emp.name} ({emp.employee_code})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">
//                 Target Period
//               </label>
//               <input
//                 type="month"
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(e.target.value)}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               />
//             </div>

//             {selectedEmployee && (
//               <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
//                 <p>
//                   <span className="font-medium text-slate-600">Department:</span>{" "}
//                   {selectedEmployee.department}
//                 </p>
//                 <p>
//                   <span className="font-medium text-slate-600">Date of Joining:</span>{" "}
//                   {selectedEmployee.doj}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Dynamic Pool Balance Summary */}
//           <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
//             <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
//               <Clock className="w-4 h-4 text-indigo-600" />
//               Dynamic Pool Availability ({selectedMonth})
//             </h2>

//             <div className="grid grid-cols-3 gap-4">
//               <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
//                 <span className="block text-xs font-semibold text-amber-700 uppercase tracking-wider">
//                   Casual Leave
//                 </span>
//                 <span className="text-2xl font-bold text-amber-900 mt-1 block">
//                   {poolSummary.casualAvailable} <span className="text-sm font-normal">days</span>
//                 </span>
//               </div>

//               <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
//                 <span className="block text-xs font-semibold text-blue-700 uppercase tracking-wider">
//                   Sick Leave
//                 </span>
//                 <span className="text-2xl font-bold text-blue-900 mt-1 block">
//                   {poolSummary.sickAvailable} <span className="text-sm font-normal">days</span>
//                 </span>
//               </div>

//               <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
//                 <span className="block text-xs font-semibold text-emerald-700 uppercase tracking-wider">
//                   Earned Leave
//                 </span>
//                 <span className="text-2xl font-bold text-emerald-900 mt-1 block">
//                   {poolSummary.earnedAvailable} <span className="text-sm font-normal">days</span>
//                 </span>
//               </div>
//             </div>

//             <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
//               <ShieldAlert className="w-3.5 h-3.5" />
//               Unused Casual and Sick pools reset annually. Earned Leave carries over per policy limits.
//             </p>
//           </div>
//         </div>

//         {/* Manual Allocation Form & Leave Table */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Form to manual assign a leave slot */}
//           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
//             <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
//               <PlusCircle className="w-4 h-4 text-indigo-600" /> Manual Entry / Override
//             </h2>

//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">
//                 Leave Date
//               </label>
//               <input
//                 type="date"
//                 value={newLeaveDate}
//                 onChange={(e) => setNewLeaveDate(e.target.value)}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">
//                 Assign Category
//               </label>
//               <select
//                 value={newLeaveType}
//                 onChange={(e) =>
//                   setNewLeaveType(e.target.value as LeaveRecord["leave_type"])
//                 }
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//               >
//                 <option value="Casual_Leave">Casual Leave (CL)</option>
//                 <option value="Sick_Leave">Sick Leave (SL)</option>
//                 <option value="Earned_Leave">Earned Leave (EL)</option>
//                 <option value="LOP">Loss of Pay (LOP)</option>
//               </select>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1">
//                   Duration
//                 </label>
//                 <select
//                   value={newDayType}
//                   onChange={(e) =>
//                     setNewDayType(e.target.value as LeaveRecord["day_type"])
//                   }
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                 >
//                   <option value="Full">Full Day</option>
//                   <option value="Half">Half Day</option>
//                 </select>
//               </div>

//               {newDayType === "Half" && (
//                 <div>
//                   <label className="block text-xs font-medium text-slate-500 mb-1">
//                     Half Slot
//                   </label>
//                   <select
//                     value={newHalfDayType}
//                     onChange={(e) =>
//                       setNewHalfDayType(
//                         e.target.value as "First_Half" | "Second_Half"
//                       )
//                     }
//                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                   >
//                     <option value="First_Half">1st Half</option>
//                     <option value="Second_Half">2nd Half</option>
//                   </select>
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">
//                 Override Reason / Notes
//               </label>
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 placeholder="Reason for manual entry..."
//                 rows={2}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
//               />
//             </div>

//             <button
//               onClick={handleAddManualLeave}
//               className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
//             >
//               Add Leave to Allocation List
//             </button>
//           </div>

//           {/* Staged & Existing Leaves Table */}
//           <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
//                 <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
//                 Allocated Leaves Table
//               </h2>
//               <span className="text-xs text-slate-400">
//                 Total: {employeeLeaves.length} record(s)
//               </span>
//             </div>

//             {loading ? (
//               <div className="py-12 text-center text-slate-400 text-sm">
//                 Loading leave records...
//               </div>
//             ) : employeeLeaves.length === 0 ? (
//               <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
//                 No leave records staged or recorded for this period.
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left text-xs text-slate-600">
//                   <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
//                     <tr>
//                       <th className="p-3">Date</th>
//                       <th className="p-3">Type</th>
//                       <th className="p-3">Duration</th>
//                       <th className="p-3">Notes</th>
//                       <th className="p-3 text-right">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {employeeLeaves.map((record) => (
//                       <tr key={record.leave_date} className="hover:bg-slate-50/50">
//                         <td className="p-3 font-medium text-slate-800">
//                           {record.leave_date}
//                         </td>
//                         <td className="p-3">
//                           <span
//                             className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
//                               record.leave_type === "Casual_Leave"
//                                 ? "bg-amber-100 text-amber-800"
//                                 : record.leave_type === "Sick_Leave"
//                                 ? "bg-blue-100 text-blue-800"
//                                 : record.leave_type === "Earned_Leave"
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : "bg-rose-100 text-rose-800"
//                             }`}
//                           >
//                             {record.leave_type.replace("_", " ")}
//                           </span>
//                         </td>
//                         <td className="p-3">
//                           {record.day_type}
//                           {record.half_day_type ? ` (${record.half_day_type})` : ""}
//                         </td>
//                         <td className="p-3 text-slate-400 max-w-xs truncate">
//                           {record.notes || "—"}
//                         </td>
//                         <td className="p-3 text-right">
//                           <button
//                             onClick={() => handleDeleteRecord(record.leave_date)}
//                             className="text-rose-600 hover:text-rose-800 font-medium text-xs"
//                           >
//                             Remove
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






// 'use client';

// import React, { useState, useEffect } from 'react';
// import { createClient } from '@supabase/supabase-js';

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// interface LeaveRecord {
//   id: string;
//   employee_id: string;
//   allocated_type: string;
//   leave_date: string;
//   half: string;
//   status: string;
// }

// export default function StaffAllocationManager() {
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [staffLeaves, setStaffLeaves] = useState<LeaveRecord[]>([]);
//   const [selectedEmpId, setSelectedEmpId] = useState<string>('');
//   const [selectedAllocCode, setSelectedAllocCode] = useState<string>('');

//   const [leaveDate, setLeaveDate] = useState<string>('');
//   const [halfType, setHalfType] = useState<string>('1H');
//   const [submitting, setSubmitting] = useState<boolean>(false);
//   const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

//   // Load staff list
//   useEffect(() => {
//     async function loadData() {
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("employees")
//         .select("id, employee_code, full_name, department");
//       if (data) setEmployees(data);
//     }
//     loadData();
//   }, []);

//   // Fetch staff leave records
//   useEffect(() => {
//     if (!selectedEmpId) {
//       setStaffLeaves([]);
//       return;
//     }

//     async function loadStaffLeaves() {
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .eq("employee_id", selectedEmpId);

//       if (data) setStaffLeaves(data);
//     }

//     loadStaffLeaves();
//   }, [selectedEmpId]);

//   // 🎯 FIXED LOGIC: Generate EXACT single month (June = 6) batches
//   const getPendingAllocations = (): string[] => {
//     if (!selectedEmpId) return [];

//     const year = 2026;
//     const currentMonth = 6; // June

//     // Collect all consumed keys from DB
//     const consumedKeys = new Set(
//       staffLeaves
//         .filter((l) => l.status !== 'LOP' && l.allocated_type)
//         .map((l) => l.allocated_type.trim())
//     );

//     // EXACT 1 Casual (1H & 2H) + 1 Sick (1H & 2H) allowed for the current month
//     const currentMonthBatches = [
//       `casual_1H_${year}_${currentMonth}`, // 0.5 Casual First Half
//       `casual_2H_${year}_${currentMonth}`, // 0.5 Casual Second Half
//       `sick_1H_${year}_${currentMonth}`,   // 0.5 Sick First Half
//       `sick_2H_${year}_${currentMonth}`,   // 0.5 Sick Second Half
//     ];

//     // Filter out keys already present in Shasna's database history
//     return currentMonthBatches.filter((code) => !consumedKeys.has(code));
//   };

//   const pendingAllocations = getPendingAllocations();

//   // Auto-select pending item or default to LOP
//   useEffect(() => {
//     if (pendingAllocations.length > 0) {
//       setSelectedAllocCode(pendingAllocations[0]);
//     } else {
//       setSelectedAllocCode('LOP');
//     }
//   }, [selectedEmpId, staffLeaves]);

//   // Handle Form Submit
//   const handleAllocationSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedEmpId || !leaveDate) {
//       setMessage({ type: 'error', text: 'Please select staff and leave date.' });
//       return;
//     }

//     setSubmitting(true);
//     setMessage(null);

//     const isLop = selectedAllocCode === 'LOP' || pendingAllocations.length === 0;
//     const selectedStaffObj = employees.find((e) => String(e.id) === String(selectedEmpId));

//     const payload = {
//       employee_id: selectedEmpId,
//       employee_name: selectedStaffObj?.full_name || 'Staff Member',
//       type: 'Leave',
//       reason: 'Manual Admin Allocation',
//       status: isLop ? 'LOP' : 'approved',
//       leave_date: leaveDate,
//       half: halfType,
//       allocated_type: isLop ? 'LOP' : selectedAllocCode,
//       allocation_source_year: 2026,
//       allocation_source_month: 6,
//       allocation_source_type: isLop ? 'LOP' : selectedAllocCode.split('_')[0],
//       frozen: false,
//     };

//     const { error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .insert([payload]);

//     setSubmitting(false);

//     if (error) {
//       setMessage({ type: 'error', text: `Error: ${error.message}` });
//     } else {
//       setMessage({
//         type: 'success',
//         text: isLop
//           ? 'No remaining quota! Allocated as LOP (Loss of Pay).'
//           : `Successfully allocated [${selectedAllocCode}]!`,
//       });

//       setLeaveDate('');
//       // Refresh DB data so consumed item disappears immediately
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .eq("employee_id", selectedEmpId);
//       if (data) setStaffLeaves(data);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
//       <h2 className="text-xl font-bold text-slate-800">Staff Allocation & LOP Manager</h2>

//       {/* Staff Selection */}
//       <div>
//         <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">Select Staff</label>
//         <select
//           value={selectedEmpId}
//           onChange={(e) => setSelectedEmpId(e.target.value)}
//           className="w-full p-3 border rounded-lg bg-slate-50 text-slate-800 text-sm font-medium"
//         >
//           <option value="">-- Select Staff --</option>
//           {employees.map((emp) => (
//             <option key={emp.id} value={emp.id}>
//               {emp.full_name} ({emp.employee_code ?? 'No Code'})
//             </option>
//           ))}
//         </select>
//       </div>

//       {selectedEmpId && (
//         <>
//           {/* Pending Allocation Dropdown */}
//           <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
//             <label className="block text-xs font-bold text-slate-700 uppercase">
//               Pending Allocation Dropdown (June 2026)
//             </label>

//             <select
//               value={selectedAllocCode}
//               onChange={(e) => setSelectedAllocCode(e.target.value)}
//               className="w-full p-3 border rounded-lg text-sm font-semibold bg-white text-slate-800"
//             >
//               {pendingAllocations.length > 0 ? (
//                 pendingAllocations.map((code) => (
//                   <option key={code} value={code}>
//                     {code} — Available
//                   </option>
//                 ))
//               ) : (
//                 <option value="LOP">No Pending Allocations Remaining — LOP (Loss of Pay)</option>
//               )}
//               <option value="LOP">-- Force LOP (Loss of Pay) --</option>
//             </select>

//             <div className="text-xs font-medium text-slate-500">
//               Pending Items Remaining for June: <span className="font-bold text-slate-800">{pendingAllocations.length}</span>
//             </div>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleAllocationSubmit} className="bg-slate-50 p-4 rounded-lg border space-y-4">
//             {message && (
//               <div
//                 className={`p-3 rounded-md text-xs font-medium ${
//                   message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
//                 }`}
//               >
//                 {message.text}
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Date</label>
//                 <input
//                   type="date"
//                   value={leaveDate}
//                   onChange={(e) => setLeaveDate(e.target.value)}
//                   className="w-full p-2.5 border rounded-md text-sm bg-white"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-slate-600 mb-1">Half Day</label>
//                 <select
//                   value={halfType}
//                   onChange={(e) => setHalfType(e.target.value)}
//                   className="w-full p-2.5 border rounded-md text-sm bg-white"
//                 >
//                   <option value="1H">1H (First Half)</option>
//                   <option value="2H">2H (Second Half)</option>
//                 </select>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={submitting}
//               className={`w-full py-2.5 font-semibold text-xs text-white rounded-md transition ${
//                 selectedAllocCode === 'LOP' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//             >
//               {submitting
//                 ? 'Submitting...'
//                 : selectedAllocCode === 'LOP'
//                 ? 'Submit as LOP (Loss of Pay)'
//                 : `Allocate [${selectedAllocCode}]`}
//             </button>
//           </form>
//         </>
//       )}
//     </div>
//   );
// }
















// 'use client';

// import React, { useState, useEffect } from 'react';
// import { createClient } from '@supabase/supabase-js';

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// interface LeaveRecord {
//   id: string;
//   employee_id: string;
//   allocated_type: string;
//   leave_date: string;
//   half: string;
//   status: string;
// }

// export default function StaffAllocationManager() {
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [staffLeaves, setStaffLeaves] = useState<LeaveRecord[]>([]);
//   const [selectedEmpId, setSelectedEmpId] = useState<string>('');
//   const [selectedAllocCode, setSelectedAllocCode] = useState<string>('');

//   const [leaveDate, setLeaveDate] = useState<string>('');
//   const [halfType, setHalfType] = useState<string>('1H');
//   const [submitting, setSubmitting] = useState<boolean>(false);
//   const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

//   // Load staff list
//   useEffect(() => {
//     async function loadData() {
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("employees")
//         .select("id, employee_code, full_name, department");
//       if (data) setEmployees(data);
//     }
//     loadData();
//   }, []);

//   // Fetch staff leave records
//   useEffect(() => {
//     if (!selectedEmpId) {
//       setStaffLeaves([]);
//       return;
//     }

//     async function loadStaffLeaves() {
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .eq("employee_id", selectedEmpId);

//       if (data) setStaffLeaves(data);
//     }

//     loadStaffLeaves();
//   }, [selectedEmpId]);

//   // 🎯 INCLUDES EARNED LEAVE CHECK
//   const getPendingAllocations = (): string[] => {
//     if (!selectedEmpId) return [];

//     const year = 2026;
//     const currentMonth = 6; // June

//     // Set of all consumed keys for this staff member
//     const consumedKeys = new Set(
//       staffLeaves
//         .filter((l) => l.status !== 'LOP' && l.allocated_type)
//         .map((l) => l.allocated_type.trim())
//     );

//     // All active allocations for the current month: Casual, Sick, and Earned
//     const currentMonthBatches = [
//       `casual_1H_${year}_${currentMonth}`,
//       `casual_2H_${year}_${currentMonth}`,
//       `sick_1H_${year}_${currentMonth}`,
//       `sick_2H_${year}_${currentMonth}`,
//       `earned_1H_${year}_${currentMonth}`, // Earned Leave 1H
//       `earned_2H_${year}_${currentMonth}`, // Earned Leave 2H
//     ];

//     // Return only those keys that are NOT yet consumed
//     return currentMonthBatches.filter((code) => !consumedKeys.has(code));
//   };

//   const pendingAllocations = getPendingAllocations();

//   // Auto-select pending item or fallback to LOP
//   useEffect(() => {
//     if (pendingAllocations.length > 0) {
//       setSelectedAllocCode(pendingAllocations[0]);
//     } else {
//       setSelectedAllocCode('LOP');
//     }
//   }, [selectedEmpId, staffLeaves]);

//   // Submit Handler
//   const handleAllocationSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedEmpId || !leaveDate) {
//       setMessage({ type: 'error', text: 'Please select staff and leave date.' });
//       return;
//     }

//     setSubmitting(true);
//     setMessage(null);

//     const isLop = selectedAllocCode === 'LOP' || pendingAllocations.length === 0;
//     const selectedStaffObj = employees.find((e) => String(e.id) === String(selectedEmpId));

//     const payload = {
//       employee_id: selectedEmpId,
//       employee_name: selectedStaffObj?.full_name || 'Staff Member',
//       type: 'Leave',
//       reason: 'Manual Admin Allocation',
//       status: isLop ? 'LOP' : 'approved',
//       leave_date: leaveDate,
//       half: halfType,
//       allocated_type: isLop ? 'LOP' : selectedAllocCode,
//       allocation_source_year: 2026,
//       allocation_source_month: 6,
//       allocation_source_type: isLop ? 'LOP' : selectedAllocCode.split('_')[0],
//       frozen: false,
//     };

//     const { error } = await supabase
//       .schema("leave_management")
//       .from("leaves")
//       .insert([payload]);

//     setSubmitting(false);

//     if (error) {
//       setMessage({ type: 'error', text: `Error: ${error.message}` });
//     } else {
//       setMessage({
//         type: 'success',
//         text: isLop
//           ? 'No quota left! Allocated as LOP (Loss of Pay).'
//           : `Successfully allocated [${selectedAllocCode}]!`,
//       });

//       setLeaveDate('');
//       // Refetch leaves so allocated Earned Leave immediately vanishes from dropdown
//       const { data } = await supabase
//         .schema("leave_management")
//         .from("leaves")
//         .select("*")
//         .eq("employee_id", selectedEmpId);
//       if (data) setStaffLeaves(data);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
//       <h2 className="text-xl font-bold text-slate-800">Staff Allocation & LOP Manager</h2>

//       {/* Staff Select */}
//       <div>
//         <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">Select Staff</label>
//         <select
//           value={selectedEmpId}
//           onChange={(e) => setSelectedEmpId(e.target.value)}
//           className="w-full p-3 border rounded-lg bg-slate-50 text-slate-800 text-sm font-medium"
//         >
//           <option value="">-- Select Staff --</option>
//           {employees.map((emp) => (
//             <option key={emp.id} value={emp.id}>
//               {emp.full_name} ({emp.employee_code ?? 'No Code'})
//             </option>
//           ))}
//         </select>
//       </div>

//       {selectedEmpId && (
//         <>
//           {/* Dropdown */}
//           <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
//             <label className="block text-xs font-bold text-slate-700 uppercase">
//               Pending Allocations Dropdown (Casual / Sick / Earned)
//             </label>

//             <select
//               value={selectedAllocCode}
//               onChange={(e) => setSelectedAllocCode(e.target.value)}
//               className="w-full p-3 border rounded-lg text-sm font-semibold bg-white text-slate-800"
//             >
//               {pendingAllocations.length > 0 ? (
//                 pendingAllocations.map((code) => (
//                   <option key={code} value={code}>
//                     {code} 
//                   </option>
//                 ))
//               ) : (
//                 <option value="LOP">No Pending Allocations Remaining — LOP (Loss of Pay)</option>
//               )}
//               <option value="LOP">-- Direct LOP (Loss of Pay) --</option>
//             </select>

//             <div className="text-xs font-medium text-slate-500">
//               Pending Allocations Count: <span className="font-bold text-slate-800">{pendingAllocations.length}</span>
//             </div>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleAllocationSubmit} className="bg-slate-50 p-4 rounded-lg border space-y-4">
//             {message && (
//               <div
//                 className={`p-3 rounded-md text-xs font-medium ${
//                   message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
//                 }`}
//               >
//                 {message.text}
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Date</label>
//                 <input
//                   type="date"
//                   value={leaveDate}
//                   onChange={(e) => setLeaveDate(e.target.value)}
//                   className="w-full p-2.5 border rounded-md text-sm bg-white"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-slate-600 mb-1">Half Day</label>
//                 <select
//                   value={halfType}
//                   onChange={(e) => setHalfType(e.target.value)}
//                   className="w-full p-2.5 border rounded-md text-sm bg-white"
//                 >
//                   <option value="1H">1H (First Half)</option>
//                   <option value="2H">2H (Second Half)</option>
//                 </select>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={submitting}
//               className={`w-full py-2.5 font-semibold text-xs text-white rounded-md transition ${
//                 selectedAllocCode === 'LOP' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//             >
//               {submitting
//                 ? 'Submitting...'
//                 : selectedAllocCode === 'LOP'
//                 ? 'Submit as LOP (Loss of Pay)'
//                 : `Allocate [${selectedAllocCode}]`}
//             </button>
//           </form>
//         </>
//       )}
//     </div>
//   );
// }














// 'use client';

// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { createClient } from '@supabase/supabase-js';

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// export default function AdminDashboard() {
//   const [stats, setStats] = useState({
//     totalEmployees: 0,
//     totalLeaves: 0,
//     totalLopCount: 0,
//   });

//   useEffect(() => {
//     async function fetchStats() {
//       // 1. Fetch Employee Count
//       const { count: empCount } = await supabase
//         .schema('leave_management')
//         .from('employees')
//         .select('*', { count: 'exact', head: true });

//       // 2. Fetch Total Leaves
//       const { count: leaveCount } = await supabase
//         .schema('leave_management')
//         .from('leaves')
//         .select('*', { count: 'exact', head: true });

//       // 3. Fetch LOP Leaves
//       const { count: lopCount } = await supabase
//         .schema('leave_management')
//         .from('leaves')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'LOP');

//       setStats({
//         totalEmployees: empCount || 0,
//         totalLeaves: leaveCount || 0,
//         totalLopCount: lopCount || 0,
//       });
//     }

//     fetchStats();
//   }, []);

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-8">
//       {/* Page Header */}
//       <div className="flex justify-between items-center border-b pb-4">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
//           <p className="text-xs text-slate-500">Manage leave allocations, employees, and system metrics.</p>
//         </div>
//         <Link
//           href="/admin/manual-allocation"
//           className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-sm"
//         >
//           + Manual Allocation
//         </Link>
//       </div>

//       {/* Metric Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
//           <p className="text-xs font-semibold text-slate-500 uppercase">Total Employees</p>
//           <p className="text-3xl font-bold text-slate-800">{stats.totalEmployees}</p>
//         </div>

//         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
//           <p className="text-xs font-semibold text-slate-500 uppercase">Total Leave Records</p>
//           <p className="text-3xl font-bold text-blue-600">{stats.totalLeaves}</p>
//         </div>

//         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
//           <p className="text-xs font-semibold text-slate-500 uppercase">LOP Records</p>
//           <p className="text-3xl font-bold text-rose-600">{stats.totalLopCount}</p>
//         </div>
//       </div>

//       {/* Quick Action Navigation Grid */}
//       <div>
//         <h2 className="text-sm font-bold text-slate-700 uppercase mb-4">Quick Management Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Link
//             href="/admin/manual-allocation"
//             className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition space-y-2 group"
//           >
//             <div className="flex items-center justify-between">
//               <span className="font-bold text-slate-800 group-hover:text-blue-600">
//                 📌 Manual Leave Allocation
//               </span>
//               <span className="text-xs text-blue-600 font-semibold">Open →</span>
//             </div>
//             <p className="text-xs text-slate-500">
//               Allocate half-day or full-day leaves to staff members manually with LOP auto-fallback.
//             </p>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }












"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Spin, Button, Typography, Space } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  FileSyncOutlined,
  WarningOutlined,
  FormOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingHrLeaves: 0,
    pendingManagementLeaves: 0,
    unauthorizedLeaves: 0,
  });

const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Total Employees Count
      const { count: empCount } = await supabase
        .schema("leave_management")
        .from("employees")
        .select("*", { count: "exact", head: true });

      // 2. Fetch Pending HR Leaves (Deduplicated by employee_id + leave_date)
      const { data: hrData } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("employee_id, leave_date")
        .eq("status", "pending");

      const uniquePendingHrDays = new Set(
        (hrData || []).map((row) => `${row.employee_id}_${row.leave_date}`)
      ).size;

      // 3. Fetch Pending Management Leaves (Deduplicated by employee_id + leave_date)
      const { data: mgmtData } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("employee_id, leave_date")
        .eq("status", "forwarded");

      const uniquePendingMgmtDays = new Set(
        (mgmtData || []).map((row) => `${row.employee_id}_${row.leave_date}`)
      ).size;

      // 4. Fetch Unauthorized Leaves (Deduplicated by employee_id + leave_date)
      const { data: unauthData } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("employee_id, leave_date")
        .eq("status", "Unauthorized_Leave");

      const uniqueUnauthorizedDays = new Set(
        (unauthData || []).map((row) => `${row.employee_id}_${row.leave_date}`)
      ).size;

      setStats({
        totalEmployees: empCount || 0,
        pendingHrLeaves: uniquePendingHrDays,
        pendingManagementLeaves: uniquePendingMgmtDays,
        unauthorizedLeaves: uniqueUnauthorizedDays,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Admin Dashboard
            </Title>
            <Text type="secondary">
              Real-time overview of employee leave counts and approval queues.
            </Text>
          </div>
          <Link href="/admin/manual-allocation">
            <Button type="primary" icon={<FormOutlined />} size="large">
              Manual Leave Allocation
            </Button>
          </Link>
        </div>

        {/* Metric Cards Row */}
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            {/* Total Employees */}
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable variant="borderless" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Statistic
                  title="Total Employees"
                  value={stats.totalEmployees}
                  prefix={<UserOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>

            {/* Pending HR Approval */}
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable variant="borderless" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Statistic
                  title="Pending HR Approval"
                  value={stats.pendingHrLeaves}
                  styles={{ content: { color: "#fa8c16" } }}
                  prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
                />
              </Card>
            </Col>

            {/* Pending Management Approval */}
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable variant="borderless" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Statistic
                  title="Awaiting Admin Approval"
                  value={stats.pendingManagementLeaves}
                  styles={{ content: { color: "#2f54eb" } }}
                  prefix={<FileSyncOutlined style={{ color: "#2f54eb" }} />}
                />
              </Card>
            </Col>

            {/* Unauthorized Leaves */}
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable variant="borderless" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Statistic
                  title="Unauthorized Leaves"
                  value={stats.unauthorizedLeaves}
                  styles={{ content: { color: "#eb2f96" } }}
                  prefix={<WarningOutlined style={{ color: "#eb2f96" }} />}
                />
              </Card>
            </Col>
          </Row>
        </Spin>

        {/* Quick Action Navigation */}
        <Card title="Quick Actions" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                type="inner"
                title="Management Approvals"
                extra={<Link href="/admin/approvals">Open <ArrowRightOutlined /></Link>}
              >
                <Text type="secondary">
                  Review leaves forwarded by HR ({stats.pendingManagementLeaves}) or flags marked as unauthorized leaves ({stats.unauthorizedLeaves}).
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                type="inner"
                title="Manual Leave Allocation"
                extra={<Link href="/admin/manual-allocation">Open <ArrowRightOutlined /></Link>}
              >
                <Text type="secondary">
                  Manually record half-day or full-day leaves for staff members with automated LOP checks.
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}