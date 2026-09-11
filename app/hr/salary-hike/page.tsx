// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     effective_from: string;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);

//     // 1. Fetch Staff Members on load
//     useEffect(() => {
//         fetchStaffList();
//     }, []);

//     // 2. Fetch salary history when a staff member is selected
//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };



//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema("leave_management")
//             .from("salary_structures")
//             .select("stage_name")
//             .not("stage_name", "is", null);

//         if (data) {
//             // Standard default stages merged with existing DB values
//             const defaultStages = ["Regular", "Probation", "Promotion", "Annual Hike", "Performance Increment"];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);

//             // Remove duplicates and sort
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     useEffect(() => {
//         fetchStageNames();
//     }, []);




//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

// const handleStaffChange = async (value: string) => {
//     setSelectedStaffId(value);

//     // 1. Reset all form fields (clears New Revised Base Salary)
//     form.resetFields();

//     // 2. Find selected employee from staffList
//     const selectedEmp = staffList.find((emp) => emp.id === value);

//     // 3. Set the form values for the newly selected employee
//     form.setFieldsValue({
//         employee_id: value,
//         // Set current reference salary if needed, but keep the new salary field empty:
//         current_salary: selectedEmp?.normal_salary || 0,
//         base_salary: undefined, // Ensures "New Revised Base Salary" is cleared/null
//     });

//     // 4. Fetch updated salary history for the newly selected employee
//     if (value) {
//         await fetchSalaryHistory(value); // Replace with your actual fetch function
//     }
// };
//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const { employee_id, stage_name, base_salary, effective_from } = values;
//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');

//             // Find the currently active salary stage (where effective_to IS NULL)
//             const currentActive = salaryHistory.find((s) => !s.effective_to);

//             // If a current active stage exists, close it on the day prior to the new hike
//             if (currentActive) {
//                 const previousEffectiveTo = dayjs(effective_from)
//                     .subtract(1, 'day')
//                     .format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }

//             // Insert the new Salary Hike / Revised Stage
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name,
//                         base_salary,
//                         effective_from: effectiveFromStr,
//                         effective_to: null, // Active stage
//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // Update normal_salary in employees table to reflect latest rate
//             await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update({ normal_salary: base_salary })
//                 .eq('id', employee_id);

//             message.success('Salary hike added successfully!');
//             form.resetFields(['stage_name', 'base_salary', 'effective_from']);

//             // Refresh list
//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to add salary hike');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             // render: (text: string, record: SalaryStructure) => (
//             //     <Space>
//             //         <Text strong>{text}</Text>
//             //         {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//             //     </Space>
//             // ),
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'base_salary',
//             key: 'base_salary',
//             render: (amt: number) => `₹${Number(amt).toLocaleString()}`,
//         },
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary Hike Management</Title>
//             <Text type="secondary">
//                 Add salary increments, probation updates, and view historical progressions for staff.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId} // Bind to a primitive ID (e.g. emp.id), not an object
//                     onChange={handleStaffChange}
//                     optionFilterProp="label" // Changed from "children" to "label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => ({
//                         value: emp.id,
//                         // label: `${emp.full_name} (${emp.employee_code}) - Current: ₹${emp.normal_salary?.toLocaleString() || 0}`,
//                         label: `${emp.full_name} (${emp.employee_code}) `,
//                     }))}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     {/* Add Hike Form */}
//                     <Card title={<Space><PlusOutlined /> Add New Salary Hike</Space>}>
//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Hike Reason / Stage Name"
//                                 rules={[{ required: true, message: "Please select stage name" }]}
//                             >
//                                 <Select
//                                     showSearch
//                                     placeholder="Select or search stage name..."
//                                     options={stageOptions}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="New Revised Base Salary (₹)"
//                                 name="base_salary"
//                                 rules={[{ required: true, message: 'Please enter new salary amount' }]}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder="e.g. 15000"
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             <Form.Item>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                                     Save Salary Hike
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     {/* History Display */}
//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History: {selectedStaff?.full_name}
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }


















// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//   Card,
//   Form,
//   Select,
//   InputNumber,
//   Input,
//   DatePicker,
//   Button,
//   Table,
//   Tag,
//   message,
//   Typography,
//   Space,
//   Divider,
//   Collapse,
//   Alert,
//   Checkbox,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined, GiftOutlined, UserSwitchOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//   id: string;
//   employee_code: string;
//   full_name: string;
//   normal_salary: number;
//   status?: string; // 'probation' | 'regular'
//   probation_end_date?: string | null;
// }

// interface SalaryStructure {
//   id: string;
//   employee_id: string;
//   stage_name: string;
//   base_salary: number;
//   hra_amount?: number;
//   mobile_recharge_amount?: number;
//   health_insurance_amount?: number;
//   effective_from: string;
//   allowance_effective_from?: string | null;
//   effective_to?: string | null;
//   created_at: string;
// }

// export default function SalaryHikePage() {
//   const [form] = Form.useForm();
//   const [staffList, setStaffList] = useState<StaffMember[]>([]);
//   const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//   const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//   const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//   const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//   const [submitting, setSubmitting] = useState<boolean>(false);
//   const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//   const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//   useEffect(() => {
//     fetchStaffList();
//     fetchStageNames();
//   }, []);

//   useEffect(() => {
//     if (selectedStaffId) {
//       fetchSalaryHistory(selectedStaffId);
//     } else {
//       setSalaryHistory([]);
//     }
//   }, [selectedStaffId]);

//   const fetchStaffList = async () => {
//     setLoadingStaff(true);
//     try {
//       const { data, error } = await supabase
//         .schema('leave_management')
//         .from('employees')
//         .select('id, employee_code, full_name, normal_salary, status, probation_end_date')
//         .eq('role', 'staff')
//         .order('full_name', { ascending: true });

//       if (error) throw error;
//       setStaffList(data || []);
//     } catch (err: any) {
//       message.error(err.message || 'Failed to fetch staff members');
//     } finally {
//       setLoadingStaff(false);
//     }
//   };

//   const fetchStageNames = async () => {
//     const { data } = await supabase
//       .schema('leave_management')
//       .from('salary_structures')
//       .select('stage_name')
//       .not('stage_name', 'is', null);

//     if (data) {
//       const defaultStages = ['Regular', 'Probation Completion', 'Promotion', 'Annual Hike', 'Performance Increment'];
//       const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//       const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//       setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//     }
//   };

//   const fetchSalaryHistory = async (employeeId: string) => {
//     setLoadingHistory(true);
//     try {
//       const { data, error } = await supabase
//         .schema('leave_management')
//         .from('salary_structures')
//         .select('*')
//         .eq('employee_id', employeeId)
//         .order('effective_from', { ascending: false });

//       if (error) throw error;
//       setSalaryHistory(data || []);
//     } catch (err: any) {
//       message.error(err.message || 'Failed to fetch salary history');
//     } finally {
//       setLoadingHistory(false);
//     }
//   };

//   const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//   const isProbationStaff = selectedStaff?.status === 'probation';

//   // Compute eligibility dates based on selected staff or newly assigned probation end date
//   const probationEnd = selectedStaff?.probation_end_date
//     ? dayjs(selectedStaff.probation_end_date)
//     : null;

//   const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
//   const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
//   const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

//   const isMobileEligible = mobileEligibleDate ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day') : false;
//   const isHealthEligible = healthEligibleDate ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day') : false;
//   const isHraEligible = hraEligibleDate ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day') : false;

//   const handleStaffChange = async (value: string) => {
//     setSelectedStaffId(value);
//     setIsConvertingToRegular(false);
//     form.resetFields();

//     const emp = staffList.find((item) => item.id === value);

//     form.setFieldsValue({
//       employee_id: value,
//       current_salary: emp?.normal_salary || 0,
//       base_salary: undefined,
//       hra_amount: 0,
//       mobile_recharge_amount: 0,
//       health_insurance_amount: 0,
//     });

//     if (value) {
//       await fetchSalaryHistory(value);
//     }
//   };

//   const handleSubmit = async (values: any) => {
//     setSubmitting(true);
//     try {
//       const {
//         employee_id,
//         stage_name,
//         base_salary,
//         hra_amount,
//         mobile_recharge_amount,
//         health_insurance_amount,
//         effective_from,
//         allowance_effective_from,
//         convert_to_regular,
//         probation_end_date,
//       } = values;

//       const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//       const allowanceEffectiveFromStr = allowance_effective_from
//         ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//         : effectiveFromStr;

//       // 1. Close current salary structure
//       const currentActive = salaryHistory.find((s) => !s.effective_to);
//       if (currentActive) {
//         const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//         const { error: updateError } = await supabase
//           .schema('leave_management')
//           .from('salary_structures')
//           .update({ effective_to: previousEffectiveTo })
//           .eq('id', currentActive.id);

//         if (updateError) throw updateError;
//       }

//       // 2. Insert new salary structure
//       const { error: insertError } = await supabase
//         .schema('leave_management')
//         .from('salary_structures')
//         .insert([
//           {
//             employee_id,
//             stage_name,
//             base_salary,
//             hra_amount: hra_amount || 0,
//             mobile_recharge_amount: mobile_recharge_amount || 0,
//             health_insurance_amount: health_insurance_amount || 0,
//             effective_from: effectiveFromStr,
//             allowance_effective_from: allowanceEffectiveFromStr,
//             effective_to: null,
//           },
//         ]);

//       if (insertError) throw insertError;

//       // 3. Update employee salary & probation details
//       const employeeUpdatePayload: Record<string, any> = {
//         normal_salary: base_salary,
//       };

//       if (convert_to_regular && probation_end_date) {
//         employeeUpdatePayload.status = 'regular';
//         employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//       }

//       const { error: empError } = await supabase
//         .schema('leave_management')
//         .from('employees')
//         .update(employeeUpdatePayload)
//         .eq('id', employee_id);

//       if (empError) throw empError;

//       message.success('Salary hike and status updated successfully!');
//       setIsConvertingToRegular(false);
//       form.resetFields([
//         'stage_name',
//         'base_salary',
//         'hra_amount',
//         'mobile_recharge_amount',
//         'health_insurance_amount',
//         'effective_from',
//         'allowance_effective_from',
//         'convert_to_regular',
//         'probation_end_date',
//       ]);

//       fetchSalaryHistory(employee_id);
//       fetchStaffList();
//     } catch (err: any) {
//       message.error(err.message || 'Failed to add salary hike');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const columns = [
//     {
//       title: 'Stage / Description',
//       dataIndex: 'stage_name',
//       key: 'stage_name',
//       render: (text: string, record: SalaryStructure) => (
//         <Space orientation="vertical" size={2}>
//           <Text strong>{text}</Text>
//           {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//         </Space>
//       ),
//     },
//     {
//       title: 'Base Salary',
//       dataIndex: 'base_salary',
//       key: 'base_salary',
//       render: (amt: number) => `₹${Number(amt).toLocaleString()}`,
//     },
//     {
//       title: 'Allowances',
//       key: 'benefits',
//       render: (_: any, record: SalaryStructure) => {
//         const hasAllowances =
//           (record.mobile_recharge_amount || 0) > 0 ||
//           (record.health_insurance_amount || 0) > 0 ||
//           (record.hra_amount || 0) > 0;

//         if (!hasAllowances) return <Text type="secondary">None</Text>;

//         return (
//           <div>
//             {(record.mobile_recharge_amount || 0) > 0 && (
//               <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//             )}
//             {(record.health_insurance_amount || 0) > 0 && (
//               <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//             )}
//             {(record.hra_amount || 0) > 0 && (
//               <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//             )}
//             <small style={{ color: '#8c8c8c' }}>
//               Starts:{' '}
//               {record.allowance_effective_from
//                 ? dayjs(record.allowance_effective_from).format('DD MMM YYYY')
//                 : 'N/A'}
//             </small>
//           </div>
//         );
//       },
//     },
//     {
//       title: 'Effective From',
//       dataIndex: 'effective_from',
//       key: 'effective_from',
//       render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//     },
//     {
//       title: 'Effective To',
//       dataIndex: 'effective_to',
//       key: 'effective_to',
//       render: (date: string | null) =>
//         date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//     },
//   ];

//   return (
//     <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//       <Title level={2}>Staff Salary & Allowance Management</Title>
//       <Text type="secondary">
//         Manage salary hikes, probation conversions, and tenure-based allowance eligibility.
//       </Text>

//       <Divider />

//       <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//         <Select
//           showSearch
//           placeholder="Select staff by name or employee code"
//           style={{ width: '100%' }}
//           loading={loadingStaff}
//           value={selectedStaffId}
//           onChange={handleStaffChange}
//           optionFilterProp="label"
//           filterOption={(input, option) =>
//             (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//           }
//           options={staffList.map((emp) => ({
//             value: emp.id,
//             label: `${emp.full_name} (${emp.employee_code}) - [${(emp.status || 'probation').toUpperCase()}]`,
//           }))}
//         />
//       </Card>

//       {selectedStaffId && (
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//           {/* Add Hike Form */}
//           <Card title={<Space><PlusOutlined /> Add New Salary Hike</Space>}>
//             <Form form={form} layout="vertical" onFinish={handleSubmit}>
//               <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                 <Input />
//               </Form.Item>

//               {/* Conditional Probation to Regular Options */}
//               {isProbationStaff && (
//                 <Card
//                   size="small"
//                   style={{
//                     backgroundColor: '#e6f7ff',
//                     borderColor: '#91d5ff',
//                     marginBottom: '20px',
//                   }}
//                 >
//                   <Form.Item
//                     name="convert_to_regular"
//                     valuePropName="checked"
//                     style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                   >
//                     <Checkbox
//                       onChange={(e) => setIsConvertingToRegular(e.target.checked)}
//                     >
//                       <Space>
//                         <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                         <Text strong>Convert Employee from Probation to Regular</Text>
//                       </Space>
//                     </Checkbox>
//                   </Form.Item>

//                   {isConvertingToRegular && (
//                     <Form.Item
//                       name="probation_end_date"
//                       label="Probation End Date"
//                       rules={[
//                         {
//                           required: true,
//                           message: 'Please select probation end date',
//                         },
//                       ]}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <DatePicker
//                         style={{ width: '100%' }}
//                         format="YYYY-MM-DD"
//                         placeholder="Select probation completion date"
//                       />
//                     </Form.Item>
//                   )}
//                 </Card>
//               )}

//               <Form.Item
//                 name="stage_name"
//                 label="Hike Reason / Stage Name"
//                 rules={[{ required: true, message: 'Please select stage name' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select or search stage name..."
//                   options={stageOptions}
//                   filterOption={(input, option) =>
//                     (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                   }
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="New Revised Base Salary (₹)"
//                 name="base_salary"
//                 rules={[{ required: true, message: 'Please enter new salary amount' }]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                   placeholder="e.g. 15000"
//                   min={0}
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Base Salary Effective From Date"
//                 name="effective_from"
//                 rules={[{ required: true, message: 'Please select salary effective date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//               </Form.Item>

//               {/* Hidden Collapsible Allowances Section */}
//               <Collapse
//                 style={{ marginTop: '16px', marginBottom: '16px' }}
//                 items={[
//                   {
//                     key: 'allowances',
//                     label: (
//                       <Space>
//                         <GiftOutlined style={{ color: '#1890ff' }} />
//                         <Text strong>Add Monthly Allowances (Optional)</Text>
//                       </Space>
//                     ),
//                     children: (
//                       <div>
//                         {probationEnd ? (
//                           <Alert
//                             type="info"
//                             showIcon
//                             style={{ marginBottom: '16px' }}
//                             title={`Probation Ended: ${probationEnd.format('DD MMM YYYY')}`}
//                             description="Default Rules: Mobile (1 Yr post-probation), Health Insurance (2 Yrs post-probation), HRA (3 Yrs post-probation)."
//                           />
//                         ) : (
//                           <Alert
//                             type="warning"
//                             showIcon
//                             style={{ marginBottom: '16px' }}
//                             title="Probation End Date Not Set"
//                             description="Tick 'Convert Employee from Probation to Regular' above to calculate eligibility dates."
//                           />
//                         )}

//                         {/* Mobile Recharge */}
//                         <Form.Item
//                           label={
//                             <Space>
//                               <span>Mobile Recharge Allowance (₹)</span>
//                               {mobileEligibleDate && (
//                                 <Tag color={isMobileEligible ? 'green' : 'orange'}>
//                                   {isMobileEligible
//                                     ? 'Eligible'
//                                     : `Eligible: ${mobileEligibleDate.format('DD MMM YYYY')} (1 Yr Post-Probation)`}
//                                 </Tag>
//                               )}
//                             </Space>
//                           }
//                           name="mobile_recharge_amount"
//                         >
//                           <InputNumber
//                             style={{ width: '100%' }}
//                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                             placeholder="e.g. 500"
//                             min={0}
//                           />
//                         </Form.Item>

//                         {/* Health Insurance */}
//                         <Form.Item
//                           label={
//                             <Space>
//                               <span>Health Insurance Allowance (₹)</span>
//                               {healthEligibleDate && (
//                                 <Tag color={isHealthEligible ? 'green' : 'orange'}>
//                                   {isHealthEligible
//                                     ? 'Eligible'
//                                     : `Eligible: ${healthEligibleDate.format('DD MMM YYYY')} (2 Yrs Post-Probation)`}
//                                 </Tag>
//                               )}
//                             </Space>
//                           }
//                           name="health_insurance_amount"
//                         >
//                           <InputNumber
//                             style={{ width: '100%' }}
//                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                             placeholder="e.g. 1500"
//                             min={0}
//                           />
//                         </Form.Item>

//                         {/* HRA */}
//                         <Form.Item
//                           label={
//                             <Space>
//                               <span>House Rent Allowance - HRA (₹)</span>
//                               {hraEligibleDate && (
//                                 <Tag color={isHraEligible ? 'green' : 'orange'}>
//                                   {isHraEligible
//                                     ? 'Eligible'
//                                     : `Eligible: ${hraEligibleDate.format('DD MMM YYYY')} (3 Yrs Post-Probation)`}
//                                 </Tag>
//                               )}
//                             </Space>
//                           }
//                           name="hra_amount"
//                         >
//                           <InputNumber
//                             style={{ width: '100%' }}
//                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                             placeholder="e.g. 3000"
//                             min={0}
//                           />
//                         </Form.Item>

//                         {/* Allowance Start Date */}
//                         <Form.Item
//                           label="Allowance Effective From Date"
//                           name="allowance_effective_from"
//                           tooltip="Date when allowances start applying. Defaults to Base Salary Effective From date if empty."
//                         >
//                           <DatePicker
//                             style={{ width: '100%' }}
//                             format="YYYY-MM-DD"
//                             placeholder="Defaults to Base Salary Effective Date"
//                           />
//                         </Form.Item>
//                       </div>
//                     ),
//                   },
//                 ]}
//               />

//               <Form.Item style={{ marginTop: '24px' }}>
//                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                   Save Salary Hike
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>

//           {/* Salary History */}
//           <Card
//             title={
//               <Space>
//                 <HistoryOutlined />
//                 Salary History: {selectedStaff?.full_name}
//               </Space>
//             }
//           >
//             <Table
//               dataSource={salaryHistory}
//               columns={columns}
//               rowKey="id"
//               loading={loadingHistory}
//               pagination={false}
//               size="small"
//             />
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }











// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
//     Collapse,
//     Alert,
//     Checkbox,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined, GiftOutlined, UserSwitchOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
//     status?: string; // 'probation' | 'regular'
//     probation_end_date?: string | null;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     hra_amount?: number;
//     mobile_recharge_amount?: number;
//     health_insurance_amount?: number;
//     effective_from: string;
//     allowance_effective_from?: string | null;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//     useEffect(() => {
//         fetchStaffList();
//         fetchStageNames();
//     }, []);

//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary, status, probation_end_date')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema('leave_management')
//             .from('salary_structures')
//             .select('stage_name')
//             .not('stage_name', 'is', null);

//         if (data) {
//             const defaultStages = [
//                 'Regular Allowance',
//                 'Allowance Update',
//                 'Annual Hike',
//                 'Probation Completion',
//                 'Promotion',
//                 'Performance Increment',
//             ];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//     const isProbationStaff = selectedStaff?.status === 'probation';

//     const probationEnd = selectedStaff?.probation_end_date
//         ? dayjs(selectedStaff.probation_end_date)
//         : null;

//     const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
//     const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
//     const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

//     const isMobileEligible = mobileEligibleDate ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day') : false;
//     const isHealthEligible = healthEligibleDate ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day') : false;
//     const isHraEligible = hraEligibleDate ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day') : false;

//     const handleStaffChange = async (value: string) => {
//         setSelectedStaffId(value);
//         setIsConvertingToRegular(false);
//         form.resetFields();

//         const emp = staffList.find((item) => item.id === value);

//         form.setFieldsValue({
//             employee_id: value,
//             current_salary: emp?.normal_salary || 0,
//             hra_amount: 0,
//             mobile_recharge_amount: 0,
//             health_insurance_amount: 0,
//         });

//         if (value) {
//             await fetchSalaryHistory(value);
//         }
//     };

//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const {
//                 employee_id,
//                 stage_name,
//                 base_salary,
//                 hra_amount,
//                 mobile_recharge_amount,
//                 health_insurance_amount,
//                 effective_from,
//                 allowance_effective_from,
//                 convert_to_regular,
//                 probation_end_date,
//             } = values;

//             // Check if at least base salary OR one allowance is provided
//             const finalHra = hra_amount || 0;
//             const finalMobile = mobile_recharge_amount || 0;
//             const finalInsurance = health_insurance_amount || 0;
//             const hasAllowanceUpdate = finalHra > 0 || finalMobile > 0 || finalInsurance > 0;

//             if (!base_salary && !hasAllowanceUpdate) {
//                 message.error('Please enter either a new Base Salary or at least one Allowance amount.');
//                 setSubmitting(false);
//                 return;
//             }

//             // Use current base salary if no new base salary is entered
//             const finalBaseSalary = base_salary !== undefined && base_salary !== null
//                 ? base_salary
//                 : selectedStaff?.normal_salary || 0;

//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//             const allowanceEffectiveFromStr = allowance_effective_from
//                 ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//                 : effectiveFromStr;

//             // 1. Close current salary structure entry
//             const currentActive = salaryHistory.find((s) => !s.effective_to);
//             if (currentActive) {
//                 const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }



// // Ensure stage_name string value is sanitized if coming from multi/tag inputs
//             const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;



//             // 2. Insert new structure entry
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name: parsedStageName,
//                         base_salary: finalBaseSalary,
//                         hra_amount: finalHra,
//                         mobile_recharge_amount: finalMobile,
//                         health_insurance_amount: finalInsurance,
//                         effective_from: effectiveFromStr,
//                         allowance_effective_from: allowanceEffectiveFromStr,
//                         effective_to: null,

//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // 3. Update employee base salary and probation status
//             const employeeUpdatePayload: Record<string, any> = {
//                 normal_salary: finalBaseSalary,
//             };

//             if (convert_to_regular && probation_end_date) {
//                 employeeUpdatePayload.status = 'regular';
//                 employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//             }

//             const { error: empError } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update(employeeUpdatePayload)
//                 .eq('id', employee_id);

//             if (empError) throw empError;

//             message.success('Salary structure / allowances saved successfully!');
//             setIsConvertingToRegular(false);
//             form.resetFields([
//                 'stage_name',
//                 'base_salary',
//                 'hra_amount',
//                 'mobile_recharge_amount',
//                 'health_insurance_amount',
//                 'effective_from',
//                 'allowance_effective_from',
//                 'convert_to_regular',
//                 'probation_end_date',
//             ]);

//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to save salary details');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             render: (text: string, record: SalaryStructure) => (
//                 <Space orientation="vertical" size={2}>
//                     <Text strong>{text}</Text>
//                     {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//                 </Space>
//             ),
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'base_salary',
//             key: 'base_salary',
//             render: (amt: number) => `₹${Number(amt).toLocaleString()}`,
//         },
//         {
//             title: 'Allowances',
//             key: 'benefits',
//             render: (_: any, record: SalaryStructure) => {
//                 const hasAllowances =
//                     (record.mobile_recharge_amount || 0) > 0 ||
//                     (record.health_insurance_amount || 0) > 0 ||
//                     (record.hra_amount || 0) > 0;

//                 if (!hasAllowances) return <Text type="secondary">None</Text>;

//                 return (
//                     <div>
//                         {(record.mobile_recharge_amount || 0) > 0 && (
//                             <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//                         )}
//                         {(record.health_insurance_amount || 0) > 0 && (
//                             <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//                         )}
//                         {(record.hra_amount || 0) > 0 && (
//                             <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//                         )}
//                         <small style={{ color: '#8c8c8c' }}>
//                             Starts:{' '}
//                             {record.allowance_effective_from
//                                 ? dayjs(record.allowance_effective_from).format('DD MMM YYYY')
//                                 : 'N/A'}
//                         </small>
//                     </div>
//                 );
//             },
//         },
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary & Allowance Management</Title>
//             <Text type="secondary">
//                 Manage salary hikes, standalone allowances, probation conversions, and tenure-based eligibility.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId}
//                     onChange={handleStaffChange}
//                     optionFilterProp="label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => ({
//                         value: emp.id,
//                         label: `${emp.full_name} (${emp.employee_code}) - [${(emp.status || 'probation').toUpperCase()}]`,
//                     }))}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     {/* Add Form */}
//                     <Card title={<Space><PlusOutlined /> Add Salary Hike or Allowance Update</Space>}>
//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             {/* Conditional Probation Conversion */}
//                             {isProbationStaff && (
//                                 <Card
//                                     size="small"
//                                     style={{
//                                         backgroundColor: '#e6f7ff',
//                                         borderColor: '#91d5ff',
//                                         marginBottom: '20px',
//                                     }}
//                                 >
//                                     <Form.Item
//                                         name="convert_to_regular"
//                                         valuePropName="checked"
//                                         style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                                     >
//                                         <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
//                                             <Space>
//                                                 <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Convert Employee from Probation to Regular</Text>
//                                             </Space>
//                                         </Checkbox>
//                                     </Form.Item>

//                                     {isConvertingToRegular && (
//                                         <Form.Item
//                                             name="probation_end_date"
//                                             label="Probation End Date"
//                                             rules={[{ required: true, message: 'Please select probation end date' }]}
//                                             style={{ marginBottom: 0 }}
//                                         >
//                                             <DatePicker
//                                                 style={{ width: '100%' }}
//                                                 format="YYYY-MM-DD"
//                                                 placeholder="Select probation completion date"
//                                             />
//                                         </Form.Item>
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Reason / Stage Name"
//                                 rules={[{ required: true, message: 'Please select reason' }]}
//                             >
//                                 {/* <Select
//                                     showSearch
//                                     placeholder="Type custom reason or select from list..."
//                                     options={stageOptions}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 /> */}
// <Select
//     mode="tags"
//     maxCount={1}
//     placeholder="Type custom reason or select from list..."
//     options={stageOptions}
//     filterOption={(input, option) =>
//       (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//     }
//   />

//                             </Form.Item>

//                             {/* Optional New Base Salary */}
//                             <Form.Item
//                                 label="New Revised Base Salary (₹)"
//                                 name="base_salary"
//                                 extra={`Current Base Salary: ₹${Number(selectedStaff?.normal_salary || 0).toLocaleString()} (Leave blank if adding allowance only)`}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder={`Current: ₹${selectedStaff?.normal_salary || 0}`}
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             {/* Collapsible Allowance Section */}
//                             <Collapse
//                                 defaultActiveKey={['allowances']}
//                                 style={{ marginTop: '16px', marginBottom: '16px' }}
//                                 items={[
//                                     {
//                                         key: 'allowances',
//                                         label: (
//                                             <Space>
//                                                 <GiftOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Fixed Monthly Allowances</Text>
//                                             </Space>
//                                         ),
//                                         children: (
//                                             <div>
//                                                 {probationEnd ? (
//                                                     <Alert
//                                                         type="info"
//                                                         showIcon
//                                                         style={{ marginBottom: '16px' }}
//                                                         title={`Probation Ended: ${probationEnd.format('DD MMM YYYY')}`}
//                                                         description="Default Rules: Mobile (1 Yr post-probation), Health Insurance (2 Yrs post-probation), HRA (3 Yrs post-probation)."
//                                                     />
//                                                 ) : (
//                                                     <Alert
//                                                         type="warning"
//                                                         showIcon
//                                                         style={{ marginBottom: '16px' }}
//                                                         title="Probation End Date Not Set"
//                                                         description="Tick 'Convert Employee from Probation to Regular' above to calculate eligibility dates."
//                                                     />
//                                                 )}

//                                                 {/* Mobile Recharge */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>Mobile Recharge Allowance (₹)</span>
//                                                             {mobileEligibleDate && (
//                                                                 <Tag color={isMobileEligible ? 'green' : 'orange'}>
//                                                                     {isMobileEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${mobileEligibleDate.format('DD MMM YYYY')} (1 Yr Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="mobile_recharge_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 500"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* Health Insurance */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>Health Insurance Allowance (₹)</span>
//                                                             {healthEligibleDate && (
//                                                                 <Tag color={isHealthEligible ? 'green' : 'orange'}>
//                                                                     {isHealthEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${healthEligibleDate.format('DD MMM YYYY')} (2 Yrs Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="health_insurance_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 1500"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* HRA */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>House Rent Allowance - HRA (₹)</span>
//                                                             {hraEligibleDate && (
//                                                                 <Tag color={isHraEligible ? 'green' : 'orange'}>
//                                                                     {isHraEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${hraEligibleDate.format('DD MMM YYYY')} (3 Yrs Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="hra_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 3000"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* Allowance Start Date */}
//                                                 <Form.Item
//                                                     label="Allowance Effective From Date"
//                                                     name="allowance_effective_from"
//                                                     tooltip="Date when allowances start applying. Defaults to Base Effective From date if empty."
//                                                 >
//                                                     <DatePicker
//                                                         style={{ width: '100%' }}
//                                                         format="YYYY-MM-DD"
//                                                         placeholder="Defaults to Effective From Date"
//                                                     />
//                                                 </Form.Item>
//                                             </div>
//                                         ),
//                                     },
//                                 ]}
//                             />

//                             <Form.Item style={{ marginTop: '24px' }}>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                                     Save Structure / Allowances
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     {/* Salary History */}
//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History: {selectedStaff?.full_name}
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }






















// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
//     Collapse,
//     Alert,
//     Checkbox,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined, GiftOutlined, UserSwitchOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
//     status?: string; // 'probation' | 'regular'
//     probation_end_date?: string | null;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     hra_amount?: number;
//     mobile_recharge_amount?: number;
//     health_insurance_amount?: number;
//     effective_from: string;
//     allowance_effective_from?: string | null;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//     useEffect(() => {
//         fetchStaffList();
//         fetchStageNames();
//     }, []);

//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary, status, probation_end_date')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema('leave_management')
//             .from('salary_structures')
//             .select('stage_name')
//             .not('stage_name', 'is', null);

//         if (data) {
//             const defaultStages = [
//                 'Regular Allowance',
//                 'Allowance Update',
//                 'Annual Hike',
//                 'Probation Completion',
//                 'Promotion',
//                 'Performance Increment',
//             ];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//     const isProbationStaff = selectedStaff?.status === 'probation';

//     const probationEnd = selectedStaff?.probation_end_date
//         ? dayjs(selectedStaff.probation_end_date)
//         : null;

//     const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
//     const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
//     const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

//     const isMobileEligible = mobileEligibleDate ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day') : false;
//     const isHealthEligible = healthEligibleDate ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day') : false;
//     const isHraEligible = hraEligibleDate ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day') : false;

//     const handleStaffChange = async (value: string) => {
//         setSelectedStaffId(value);
//         setIsConvertingToRegular(false);
//         form.resetFields();

//         const emp = staffList.find((item) => item.id === value);

//         form.setFieldsValue({
//             employee_id: value,
//             current_salary: emp?.normal_salary || 0,
//             hra_amount: 0,
//             mobile_recharge_amount: 0,
//             health_insurance_amount: 0,
//         });

//         if (value) {
//             await fetchSalaryHistory(value);
//         }
//     };

//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const {
//                 employee_id,
//                 stage_name,
//                 base_salary,
//                 hra_amount,
//                 mobile_recharge_amount,
//                 health_insurance_amount,
//                 effective_from,
//                 allowance_effective_from,
//                 convert_to_regular,
//                 probation_end_date,
//             } = values;

//             // Check if at least base salary OR one allowance is provided
//             const finalHra = hra_amount || 0;
//             const finalMobile = mobile_recharge_amount || 0;
//             const finalInsurance = health_insurance_amount || 0;
//             const hasAllowanceUpdate = finalHra > 0 || finalMobile > 0 || finalInsurance > 0;

//             if (!base_salary && !hasAllowanceUpdate) {
//                 message.error('Please enter either a new Base Salary or at least one Allowance amount.');
//                 setSubmitting(false);
//                 return;
//             }

//             // Use current base salary if no new base salary is entered
//             const finalBaseSalary = base_salary !== undefined && base_salary !== null
//                 ? base_salary
//                 : selectedStaff?.normal_salary || 0;

//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//             const allowanceEffectiveFromStr = allowance_effective_from
//                 ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//                 : effectiveFromStr;

//             // 1. Close current salary structure entry
//             const currentActive = salaryHistory.find((s) => !s.effective_to);
//             if (currentActive) {
//                 const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }



// // Ensure stage_name string value is sanitized if coming from multi/tag inputs
//             const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;
//             const [dailyWageRate, setDailyWageRate] = useState<number | null>(null);


//             // 2. Insert new structure entry
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name: parsedStageName,
//                         base_salary: finalBaseSalary,
//                         hra_amount: finalHra,
//                         mobile_recharge_amount: finalMobile,
//                         health_insurance_amount: finalInsurance,
//                         effective_from: effectiveFromStr,
//                         allowance_effective_from: allowanceEffectiveFromStr,
//                         effective_to: null,
//                         daily_wage_rate: dailyWageRate || null,
//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // 3. Update employee base salary and probation status
//             const employeeUpdatePayload: Record<string, any> = {
//                 normal_salary: finalBaseSalary,
//             };

//             if (convert_to_regular && probation_end_date) {
//                 employeeUpdatePayload.status = 'regular';
//                 employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//             }

//             const { error: empError } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update(employeeUpdatePayload)
//                 .eq('id', employee_id);

//             if (empError) throw empError;

//             message.success('Salary structure / allowances saved successfully!');
//             setIsConvertingToRegular(false);
//             form.resetFields([
//                 'stage_name',
//                 'base_salary',
//                 'hra_amount',
//                 'mobile_recharge_amount',
//                 'health_insurance_amount',
//                 'effective_from',
//                 'allowance_effective_from',
//                 'convert_to_regular',
//                 'probation_end_date',
//             ]);

//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to save salary details');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             render: (text: string, record: SalaryStructure) => (
//                 <Space orientation="vertical" size={2}>
//                     <Text strong>{text}</Text>
//                     {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//                 </Space>
//             ),
//         },
//         {
//             title: 'Base Salary',
//             dataIndex: 'base_salary',
//             key: 'base_salary',
//             render: (amt: number) => `₹${Number(amt).toLocaleString()}`,
//         },
//         {
//             title: 'Allowances',
//             key: 'benefits',
//             render: (_: any, record: SalaryStructure) => {
//                 const hasAllowances =
//                     (record.mobile_recharge_amount || 0) > 0 ||
//                     (record.health_insurance_amount || 0) > 0 ||
//                     (record.hra_amount || 0) > 0;

//                 if (!hasAllowances) return <Text type="secondary">None</Text>;

//                 return (
//                     <div>
//                         {(record.mobile_recharge_amount || 0) > 0 && (
//                             <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//                         )}
//                         {(record.health_insurance_amount || 0) > 0 && (
//                             <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//                         )}
//                         {(record.hra_amount || 0) > 0 && (
//                             <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//                         )}
//                         <small style={{ color: '#8c8c8c' }}>
//                             Starts:{' '}
//                             {record.allowance_effective_from
//                                 ? dayjs(record.allowance_effective_from).format('DD MMM YYYY')
//                                 : 'N/A'}
//                         </small>
//                     </div>
//                 );
//             },
//         },
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary & Allowance Management</Title>
//             <Text type="secondary">
//                 Manage salary hikes, standalone allowances, probation conversions, and tenure-based eligibility.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId}
//                     onChange={handleStaffChange}
//                     optionFilterProp="label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => ({
//                         value: emp.id,
//                         label: `${emp.full_name} (${emp.employee_code}) - [${(emp.status || 'probation').toUpperCase()}]`,
//                     }))}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     {/* Add Form */}
//                     <Card title={<Space><PlusOutlined /> Add Salary Hike or Allowance Update</Space>}>
//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             {/* Conditional Probation Conversion */}
//                             {isProbationStaff && (
//                                 <Card
//                                     size="small"
//                                     style={{
//                                         backgroundColor: '#e6f7ff',
//                                         borderColor: '#91d5ff',
//                                         marginBottom: '20px',
//                                     }}
//                                 >
//                                     <Form.Item
//                                         name="convert_to_regular"
//                                         valuePropName="checked"
//                                         style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                                     >
//                                         <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
//                                             <Space>
//                                                 <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Convert Employee from Probation to Regular</Text>
//                                             </Space>
//                                         </Checkbox>
//                                     </Form.Item>

//                                     {isConvertingToRegular && (
//                                         <Form.Item
//                                             name="probation_end_date"
//                                             label="Probation End Date"
//                                             rules={[{ required: true, message: 'Please select probation end date' }]}
//                                             style={{ marginBottom: 0 }}
//                                         >
//                                             <DatePicker
//                                                 style={{ width: '100%' }}
//                                                 format="YYYY-MM-DD"
//                                                 placeholder="Select probation completion date"
//                                             />
//                                         </Form.Item>
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Reason / Stage Name"
//                                 rules={[{ required: true, message: 'Please select reason' }]}
//                             >
//                                 {/* <Select
//                                     showSearch
//                                     placeholder="Type custom reason or select from list..."
//                                     options={stageOptions}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 /> */}
// <Select
//     mode="tags"
//     maxCount={1}
//     placeholder="Type custom reason or select from list..."
//     options={stageOptions}
//     filterOption={(input, option) =>
//       (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//     }
//   />

//                             </Form.Item>

//                             {/* Optional New Base Salary */}
//                             <Form.Item
//                                 label="New Revised Base Salary (₹)"
//                                 name="base_salary"
//                                 extra={`Current Base Salary: ₹${Number(selectedStaff?.normal_salary || 0).toLocaleString()} (Leave blank if adding allowance only)`}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder={`Current: ₹${selectedStaff?.normal_salary || 0}`}
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             {/* Collapsible Allowance Section */}
//                             <Collapse
//                                 defaultActiveKey={['allowances']}
//                                 style={{ marginTop: '16px', marginBottom: '16px' }}
//                                 items={[
//                                     {
//                                         key: 'allowances',
//                                         label: (
//                                             <Space>
//                                                 <GiftOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Fixed Monthly Allowances</Text>
//                                             </Space>
//                                         ),
//                                         children: (
//                                             <div>
//                                                 {probationEnd ? (
//                                                     <Alert
//                                                         type="info"
//                                                         showIcon
//                                                         style={{ marginBottom: '16px' }}
//                                                         title={`Probation Ended: ${probationEnd.format('DD MMM YYYY')}`}
//                                                         description="Default Rules: Mobile (1 Yr post-probation), Health Insurance (2 Yrs post-probation), HRA (3 Yrs post-probation)."
//                                                     />
//                                                 ) : (
//                                                     <Alert
//                                                         type="warning"
//                                                         showIcon
//                                                         style={{ marginBottom: '16px' }}
//                                                         title="Probation End Date Not Set"
//                                                         description="Tick 'Convert Employee from Probation to Regular' above to calculate eligibility dates."
//                                                     />
//                                                 )}

//                                                 {/* Mobile Recharge */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>Mobile Recharge Allowance (₹)</span>
//                                                             {mobileEligibleDate && (
//                                                                 <Tag color={isMobileEligible ? 'green' : 'orange'}>
//                                                                     {isMobileEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${mobileEligibleDate.format('DD MMM YYYY')} (1 Yr Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="mobile_recharge_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 500"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* Health Insurance */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>Health Insurance Allowance (₹)</span>
//                                                             {healthEligibleDate && (
//                                                                 <Tag color={isHealthEligible ? 'green' : 'orange'}>
//                                                                     {isHealthEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${healthEligibleDate.format('DD MMM YYYY')} (2 Yrs Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="health_insurance_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 1500"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* HRA */}
//                                                 <Form.Item
//                                                     label={
//                                                         <Space>
//                                                             <span>House Rent Allowance - HRA (₹)</span>
//                                                             {hraEligibleDate && (
//                                                                 <Tag color={isHraEligible ? 'green' : 'orange'}>
//                                                                     {isHraEligible
//                                                                         ? 'Eligible'
//                                                                         : `Eligible: ${hraEligibleDate.format('DD MMM YYYY')} (3 Yrs Post-Probation)`}
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                     }
//                                                     name="hra_amount"
//                                                 >
//                                                     <InputNumber
//                                                         style={{ width: '100%' }}
//                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                         placeholder="e.g. 3000"
//                                                         min={0}
//                                                     />
//                                                 </Form.Item>

//                                                 {/* Allowance Start Date */}
//                                                 <Form.Item
//                                                     label="Allowance Effective From Date"
//                                                     name="allowance_effective_from"
//                                                     tooltip="Date when allowances start applying. Defaults to Base Effective From date if empty."
//                                                 >
//                                                     <DatePicker
//                                                         style={{ width: '100%' }}
//                                                         format="YYYY-MM-DD"
//                                                         placeholder="Defaults to Effective From Date"
//                                                     />
//                                                 </Form.Item>
//                                             </div>
//                                         ),
//                                     },
//                                 ]}
//                             />

//                             <Form.Item style={{ marginTop: '24px' }}>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                                     Save Structure / Allowances
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     {/* Salary History */}
//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History: {selectedStaff?.full_name}
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }




















// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
//     Collapse,
//     Alert,
//     Checkbox,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined, GiftOutlined, UserSwitchOutlined, FieldTimeOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
//     status?: string; // 'probation' | 'regular'
//     probation_end_date?: string | null;
//     is_permanently_daily?: boolean;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     daily_wage_rate?: number | null;
//     hra_amount?: number;
//     mobile_recharge_amount?: number;
//     health_insurance_amount?: number;
//     effective_from: string;
//     allowance_effective_from?: string | null;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//     useEffect(() => {
//         fetchStaffList();
//         fetchStageNames();
//     }, []);

//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary, status, probation_end_date, is_permanently_daily')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema('leave_management')
//             .from('salary_structures')
//             .select('stage_name')
//             .not('stage_name', 'is', null);

//         if (data) {
//             const defaultStages = [
//                 'Regular Allowance',
//                 'Allowance Update',
//                 'Annual Hike',
//                 'Daily Rate Revision',
//                 'Probation Completion',
//                 'Promotion',
//                 'Performance Increment',
//             ];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//     const isDailyStaff = Boolean(selectedStaff?.is_permanently_daily);
//     const isProbationStaff = selectedStaff?.status === 'probation' && !isDailyStaff;

//     const probationEnd = selectedStaff?.probation_end_date
//         ? dayjs(selectedStaff.probation_end_date)
//         : null;

//     const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
//     const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
//     const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

//     const isMobileEligible = mobileEligibleDate ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day') : false;
//     const isHealthEligible = healthEligibleDate ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day') : false;
//     const isHraEligible = hraEligibleDate ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day') : false;

//     const handleStaffChange = async (value: string) => {
//         setSelectedStaffId(value);
//         setIsConvertingToRegular(false);
//         form.resetFields();

//         const emp = staffList.find((item) => item.id === value);

//         form.setFieldsValue({
//             employee_id: value,
//             current_salary: emp?.normal_salary || 0,
//             hra_amount: 0,
//             mobile_recharge_amount: 0,
//             health_insurance_amount: 0,
//         });

//         if (value) {
//             await fetchSalaryHistory(value);
//         }
//     };

//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const {
//                 employee_id,
//                 stage_name,
//                 base_salary,
//                 hra_amount,
//                 mobile_recharge_amount,
//                 health_insurance_amount,
//                 effective_from,
//                 allowance_effective_from,
//                 convert_to_regular,
//                 probation_end_date,
//             } = values;

//             const finalHra = hra_amount || 0;
//             const finalMobile = mobile_recharge_amount || 0;
//             const finalInsurance = health_insurance_amount || 0;
//             const hasAllowanceUpdate = finalHra > 0 || finalMobile > 0 || finalInsurance > 0;

//             if (!base_salary && !hasAllowanceUpdate) {
//                 message.error(
//                     isDailyStaff
//                         ? 'Please enter a new Daily Wage Rate.'
//                         : 'Please enter either a new Base Salary or at least one Allowance amount.'
//                 );
//                 setSubmitting(false);
//                 return;
//             }

//             const enteredSalary = base_salary !== undefined && base_salary !== null
//                 ? base_salary
//                 : selectedStaff?.normal_salary || 0;

//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//             const allowanceEffectiveFromStr = allowance_effective_from
//                 ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//                 : effectiveFromStr;

//             // 1. Close current salary structure entry
//             const currentActive = salaryHistory.find((s) => !s.effective_to);
//             if (currentActive) {
//                 const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }

//             const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;

//             // 2. Insert new structure entry
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name: parsedStageName || (isDailyStaff ? 'Daily Rate Revision' : ''),
//                         base_salary: isDailyStaff ? 0 : enteredSalary,
//                         daily_wage_rate: isDailyStaff ? enteredSalary : null,
//                         hra_amount: isDailyStaff ? 0 : finalHra,
//                         mobile_recharge_amount: isDailyStaff ? 0 : finalMobile,
//                         health_insurance_amount: isDailyStaff ? 0 : finalInsurance,
//                         effective_from: effectiveFromStr,
//                         allowance_effective_from: isDailyStaff ? null : allowanceEffectiveFromStr,
//                         effective_to: null,
//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // 3. Update employee salary and status
//             const employeeUpdatePayload: Record<string, any> = {
//                 normal_salary: enteredSalary,
//             };

//             if (convert_to_regular && probation_end_date && !isDailyStaff) {
//                 employeeUpdatePayload.status = 'regular';
//                 employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//             }

//             const { error: empError } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update(employeeUpdatePayload)
//                 .eq('id', employee_id);

//             if (empError) throw empError;

//             message.success('Salary structure updated successfully!');
//             setIsConvertingToRegular(false);
//             form.resetFields([
//                 'stage_name',
//                 'base_salary',
//                 'hra_amount',
//                 'mobile_recharge_amount',
//                 'health_insurance_amount',
//                 'effective_from',
//                 'allowance_effective_from',
//                 'convert_to_regular',
//                 'probation_end_date',
//             ]);

//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to save salary details');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             render: (text: string, record: SalaryStructure) => (
//                 <Space orientation="vertical" size={2}>
//                     <Text strong>{text}</Text>
//                     {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//                 </Space>
//             ),
//         },
//         {
//             title: isDailyStaff ? 'Daily Wage Rate' : 'Base Salary',
//             key: 'salary_rate',
//             render: (_: any, record: SalaryStructure) => {
//                 if (isDailyStaff || record.daily_wage_rate) {
//                     const rate = record.daily_wage_rate || record.base_salary;
//                     return <Tag color="cyan">₹{Number(rate).toLocaleString()} / day</Tag>;
//                 }
//                 return `₹${Number(record.base_salary).toLocaleString()}`;
//             },
//         },
//         ...(!isDailyStaff
//             ? [
//                   {
//                       title: 'Allowances',
//                       key: 'benefits',
//                       render: (_: any, record: SalaryStructure) => {
//                           const hasAllowances =
//                               (record.mobile_recharge_amount || 0) > 0 ||
//                               (record.health_insurance_amount || 0) > 0 ||
//                               (record.hra_amount || 0) > 0;

//                           if (!hasAllowances) return <Text type="secondary">None</Text>;

//                           return (
//                               <div>
//                                   {(record.mobile_recharge_amount || 0) > 0 && (
//                                       <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//                                   )}
//                                   {(record.health_insurance_amount || 0) > 0 && (
//                                       <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//                                   )}
//                                   {(record.hra_amount || 0) > 0 && (
//                                       <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//                                   )}
//                                   <small style={{ color: '#8c8c8c' }}>
//                                       Starts:{' '}
//                                       {record.allowance_effective_from
//                                           ? dayjs(record.allowance_effective_from).format('DD MMM YYYY')
//                                           : 'N/A'}
//                                   </small>
//                               </div>
//                           );
//                       },
//                   },
//               ]
//             : []),
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary & Allowance Management</Title>
//             <Text type="secondary">
//                 Manage salary hikes, daily wage revisions, standalone allowances, probation conversions, and tenure-based eligibility.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId}
//                     onChange={handleStaffChange}
//                     optionFilterProp="label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => {
//                         const typeLabel = emp.is_permanently_daily
//                             ? 'DAILY WAGE'
//                             : (emp.status || 'probation').toUpperCase();
//                         return {
//                             value: emp.id,
//                             label: `${emp.full_name} (${emp.employee_code}) - [${typeLabel}]`,
//                         };
//                     })}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     {/* Add Form */}
//                     <Card
//                         title={
//                             <Space>
//                                 <PlusOutlined />
//                                 {isDailyStaff ? 'Update Daily Wage Rate' : 'Add Salary Hike or Allowance Update'}
//                             </Space>
//                         }
//                     >
//                         {isDailyStaff && (
//                             <Alert
//                                 type="info"
//                                 showIcon
//                                 icon={<FieldTimeOutlined />}
//                                 style={{ marginBottom: '16px' }}
//                                 title="Daily Wage Staff Selected"
//                                 description="This staff member is registered on a daily basis. Revisions apply to the daily rate only."
//                             />
//                         )}

//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             {/* Conditional Probation Conversion for Non-Daily Staff */}
//                             {isProbationStaff && (
//                                 <Card
//                                     size="small"
//                                     style={{
//                                         backgroundColor: '#e6f7ff',
//                                         borderColor: '#91d5ff',
//                                         marginBottom: '20px',
//                                     }}
//                                 >
//                                     <Form.Item
//                                         name="convert_to_regular"
//                                         valuePropName="checked"
//                                         style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                                     >
//                                         <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
//                                             <Space>
//                                                 <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Convert Employee from Probation to Regular</Text>
//                                             </Space>
//                                         </Checkbox>
//                                     </Form.Item>

//                                     {isConvertingToRegular && (
//                                         <Form.Item
//                                             name="probation_end_date"
//                                             label="Probation End Date"
//                                             rules={[{ required: true, message: 'Please select probation end date' }]}
//                                             style={{ marginBottom: 0 }}
//                                         >
//                                             <DatePicker
//                                                 style={{ width: '100%' }}
//                                                 format="YYYY-MM-DD"
//                                                 placeholder="Select probation completion date"
//                                             />
//                                         </Form.Item>
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Reason / Stage Name"
//                                 rules={[{ required: true, message: 'Please select or enter reason' }]}
//                             >
//                                 <Select
//                                     mode="tags"
//                                     maxCount={1}
//                                     placeholder="Type custom reason or select from list..."
//                                     options={stageOptions}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             {/* Salary Input: Toggles label between Daily Wage and Monthly Base Salary */}
//                             <Form.Item
//                                 label={isDailyStaff ? 'New Daily Wage Rate (₹ / Day)' : 'New Revised Base Salary (₹)'}
//                                 name="base_salary"
//                                 rules={[{ required: isDailyStaff, message: 'Please enter daily rate' }]}
//                                 extra={`Current ${isDailyStaff ? 'Daily Rate' : 'Base Salary'}: ₹${Number(selectedStaff?.normal_salary || 0).toLocaleString()}${isDailyStaff ? ' / day' : ''}`}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder={`Current: ₹${selectedStaff?.normal_salary || 0}`}
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             {/* Fixed Monthly Allowances Section (Hidden for Daily Workers) */}
//                             {!isDailyStaff && (
//                                 <Collapse
//                                     defaultActiveKey={['allowances']}
//                                     style={{ marginTop: '16px', marginBottom: '16px' }}
//                                     items={[
//                                         {
//                                             key: 'allowances',
//                                             label: (
//                                                 <Space>
//                                                     <GiftOutlined style={{ color: '#1890ff' }} />
//                                                     <Text strong>Fixed Monthly Allowances</Text>
//                                                 </Space>
//                                             ),
//                                             children: (
//                                                 <div>
//                                                     {probationEnd ? (
//                                                         <Alert
//                                                             type="info"
//                                                             showIcon
//                                                             style={{ marginBottom: '16px' }}
//                                                             title={`Probation Ended: ${probationEnd.format('DD MMM YYYY')}`}
//                                                             description="Default Rules: Mobile (1 Yr post-probation), Health Insurance (2 Yrs post-probation), HRA (3 Yrs post-probation)."
//                                                         />
//                                                     ) : (
//                                                         <Alert
//                                                             type="warning"
//                                                             showIcon
//                                                             style={{ marginBottom: '16px' }}
//                                                             title="Probation End Date Not Set"
//                                                             description="Tick 'Convert Employee from Probation to Regular' above to calculate eligibility dates."
//                                                         />
//                                                     )}

//                                                     {/* Mobile Recharge */}
//                                                     <Form.Item
//                                                         label={
//                                                             <Space>
//                                                                 <span>Mobile Recharge Allowance (₹)</span>
//                                                                 {mobileEligibleDate && (
//                                                                     <Tag color={isMobileEligible ? 'green' : 'orange'}>
//                                                                         {isMobileEligible
//                                                                             ? 'Eligible'
//                                                                             : `Eligible: ${mobileEligibleDate.format('DD MMM YYYY')} (1 Yr Post-Probation)`}
//                                                                     </Tag>
//                                                                 )}
//                                                             </Space>
//                                                         }
//                                                         name="mobile_recharge_amount"
//                                                     >
//                                                         <InputNumber
//                                                             style={{ width: '100%' }}
//                                                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                             placeholder="e.g. 500"
//                                                             min={0}
//                                                         />
//                                                     </Form.Item>

//                                                     {/* Health Insurance */}
//                                                     <Form.Item
//                                                         label={
//                                                             <Space>
//                                                                 <span>Health Insurance Allowance (₹)</span>
//                                                                 {healthEligibleDate && (
//                                                                     <Tag color={isHealthEligible ? 'green' : 'orange'}>
//                                                                         {isHealthEligible
//                                                                             ? 'Eligible'
//                                                                             : `Eligible: ${healthEligibleDate.format('DD MMM YYYY')} (2 Yrs Post-Probation)`}
//                                                                     </Tag>
//                                                                 )}
//                                                             </Space>
//                                                         }
//                                                         name="health_insurance_amount"
//                                                     >
//                                                         <InputNumber
//                                                             style={{ width: '100%' }}
//                                                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                             placeholder="e.g. 1500"
//                                                             min={0}
//                                                         />
//                                                     </Form.Item>

//                                                     {/* HRA */}
//                                                     <Form.Item
//                                                         label={
//                                                             <Space>
//                                                                 <span>House Rent Allowance - HRA (₹)</span>
//                                                                 {hraEligibleDate && (
//                                                                     <Tag color={isHraEligible ? 'green' : 'orange'}>
//                                                                         {isHraEligible
//                                                                             ? 'Eligible'
//                                                                             : `Eligible: ${hraEligibleDate.format('DD MMM YYYY')} (3 Yrs Post-Probation)`}
//                                                                     </Tag>
//                                                                 )}
//                                                             </Space>
//                                                         }
//                                                         name="hra_amount"
//                                                     >
//                                                         <InputNumber
//                                                             style={{ width: '100%' }}
//                                                             formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                             parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                             placeholder="e.g. 3000"
//                                                             min={0}
//                                                         />
//                                                     </Form.Item>

//                                                     {/* Allowance Start Date */}
//                                                     <Form.Item
//                                                         label="Allowance Effective From Date"
//                                                         name="allowance_effective_from"
//                                                         tooltip="Date when allowances start applying. Defaults to Base Effective From date if empty."
//                                                     >
//                                                         <DatePicker
//                                                             style={{ width: '100%' }}
//                                                             format="YYYY-MM-DD"
//                                                             placeholder="Defaults to Effective From Date"
//                                                         />
//                                                     </Form.Item>
//                                                 </div>
//                                             ),
//                                         },
//                                     ]}
//                                 />
//                             )}

//                             <Form.Item style={{ marginTop: '24px' }}>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                                     {isDailyStaff ? 'Save Daily Rate' : 'Save Structure / Allowances'}
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     {/* Salary History */}
//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History: {selectedStaff?.full_name}
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }











// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
//     Collapse,
//     Alert,
//     Checkbox,
// } from 'antd';
// import { PlusOutlined, HistoryOutlined, GiftOutlined, UserSwitchOutlined, FieldTimeOutlined, CheckCircleOutlined } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
//     status?: string; // 'probation' | 'regular'
//     probation_end_date?: string | null;
//     is_permanently_daily?: boolean;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     daily_wage_rate?: number | null;
//     hra_amount?: number;
//     mobile_recharge_amount?: number;
//     health_insurance_amount?: number;
//     effective_from: string;
//     allowance_effective_from?: string | null;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//     useEffect(() => {
//         fetchStaffList();
//         fetchStageNames();
//     }, []);

//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary, status, probation_end_date, is_permanently_daily')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema('leave_management')
//             .from('salary_structures')
//             .select('stage_name')
//             .not('stage_name', 'is', null);

//         if (data) {
//             const defaultStages = [
//                 'Regular Allowance',
//                 'Allowance Update',
//                 'Annual Hike',
//                 'Daily Rate Revision',
//                 'Probation Completion',
//                 'Promotion',
//                 'Performance Increment',
//             ];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//     const isDailyStaff = Boolean(selectedStaff?.is_permanently_daily);
//     const isProbationStaff = selectedStaff?.status === 'probation' && !isDailyStaff;

//     const probationEnd = selectedStaff?.probation_end_date
//         ? dayjs(selectedStaff.probation_end_date)
//         : null;

//     const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
//     const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
//     const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

//     const isMobileEligible = mobileEligibleDate ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day') : false;
//     const isHealthEligible = healthEligibleDate ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day') : false;
//     const isHraEligible = hraEligibleDate ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day') : false;

//     // Check existing allowances across salary history
//     const existingMobileAllowance = salaryHistory.find((s) => (s.mobile_recharge_amount || 0) > 0)?.mobile_recharge_amount || 0;
//     const existingHealthAllowance = salaryHistory.find((s) => (s.health_insurance_amount || 0) > 0)?.health_insurance_amount || 0;
//     const existingHraAllowance = salaryHistory.find((s) => (s.hra_amount || 0) > 0)?.hra_amount || 0;

//     const hasMobileAlready = existingMobileAllowance > 0;
//     const hasHealthAlready = existingHealthAllowance > 0;
//     const hasHraAlready = existingHraAllowance > 0;

//     const allAllowancesGranted = hasMobileAlready && hasHealthAlready && hasHraAlready;

//     const handleStaffChange = async (value: string) => {
//         setSelectedStaffId(value);
//         setIsConvertingToRegular(false);
//         form.resetFields();

//         const emp = staffList.find((item) => item.id === value);

//         form.setFieldsValue({
//             employee_id: value,
//             current_salary: emp?.normal_salary || 0,
//             hra_amount: 0,
//             mobile_recharge_amount: 0,
//             health_insurance_amount: 0,
//         });

//         if (value) {
//             await fetchSalaryHistory(value);
//         }
//     };

//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const {
//                 employee_id,
//                 stage_name,
//                 base_salary,
//                 hra_amount,
//                 mobile_recharge_amount,
//                 health_insurance_amount,
//                 effective_from,
//                 allowance_effective_from,
//                 convert_to_regular,
//                 probation_end_date,
//             } = values;

//             // Retain already granted allowances if input column is hidden
//             const finalMobile = hasMobileAlready ? existingMobileAllowance : (mobile_recharge_amount || 0);
//             const finalInsurance = hasHealthAlready ? existingHealthAllowance : (health_insurance_amount || 0);
//             const finalHra = hasHraAlready ? existingHraAllowance : (hra_amount || 0);

//             const hasNewAllowanceUpdate = (!hasMobileAlready && finalMobile > 0) ||
//                 (!hasHealthAlready && finalInsurance > 0) ||
//                 (!hasHraAlready && finalHra > 0);

//             if (!base_salary && !hasNewAllowanceUpdate && !isDailyStaff) {
//                 message.error('Please enter either a new Base Salary or at least one new Allowance amount.');
//                 setSubmitting(false);
//                 return;
//             }

//             if (isDailyStaff && !base_salary) {
//                 message.error('Please enter a new Daily Wage Rate.');
//                 setSubmitting(false);
//                 return;
//             }

//             const enteredSalary = base_salary !== undefined && base_salary !== null
//                 ? base_salary
//                 : selectedStaff?.normal_salary || 0;

//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//             const allowanceEffectiveFromStr = allowance_effective_from
//                 ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//                 : effectiveFromStr;

//             // 1. Close current salary structure entry
//             const currentActive = salaryHistory.find((s) => !s.effective_to);
//             if (currentActive) {
//                 const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }

//             const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;

//             // 2. Insert new structure entry
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name: parsedStageName || (isDailyStaff ? 'Daily Rate Revision' : ''),
//                         base_salary: isDailyStaff ? 0 : enteredSalary,
//                         daily_wage_rate: isDailyStaff ? enteredSalary : null,
//                         hra_amount: isDailyStaff ? 0 : finalHra,
//                         mobile_recharge_amount: isDailyStaff ? 0 : finalMobile,
//                         health_insurance_amount: isDailyStaff ? 0 : finalInsurance,
//                         effective_from: effectiveFromStr,
//                         allowance_effective_from: isDailyStaff ? null : allowanceEffectiveFromStr,
//                         effective_to: null,
//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // 3. Update employee salary and status
//             const employeeUpdatePayload: Record<string, any> = {
//                 normal_salary: enteredSalary,
//             };

//             if (convert_to_regular && probation_end_date && !isDailyStaff) {
//                 employeeUpdatePayload.status = 'regular';
//                 employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//             }

//             const { error: empError } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update(employeeUpdatePayload)
//                 .eq('id', employee_id);

//             if (empError) throw empError;

//             message.success('Salary structure updated successfully!');
//             setIsConvertingToRegular(false);
//             form.resetFields([
//                 'stage_name',
//                 'base_salary',
//                 'hra_amount',
//                 'mobile_recharge_amount',
//                 'health_insurance_amount',
//                 'effective_from',
//                 'allowance_effective_from',
//                 'convert_to_regular',
//                 'probation_end_date',
//             ]);

//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to save salary details');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             render: (text: string, record: SalaryStructure) => (
//                 <Space orientation="vertical" size={2}>
//                     <Text strong>{text}</Text>
//                     {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//                 </Space>
//             ),
//         },
//         {
//             title: isDailyStaff ? 'Daily Wage Rate' : 'Base Salary',
//             key: 'salary_rate',
//             render: (_: any, record: SalaryStructure) => {
//                 if (isDailyStaff || record.daily_wage_rate) {
//                     const rate = record.daily_wage_rate || record.base_salary;
//                     return <Tag color="cyan">₹{Number(rate).toLocaleString()} / day</Tag>;
//                 }
//                 return `₹${Number(record.base_salary).toLocaleString()}`;
//             },
//         },
//         ...(!isDailyStaff
//             ? [
//                 {
//                     title: 'Allowances',
//                     key: 'benefits',
//                     render: (_: any, record: SalaryStructure) => {
//                         const hasAllowances =
//                             (record.mobile_recharge_amount || 0) > 0 ||
//                             (record.health_insurance_amount || 0) > 0 ||
//                             (record.hra_amount || 0) > 0;

//                         if (!hasAllowances) return <Text type="secondary">None</Text>;

//                         return (
//                             <div>
//                                 {(record.mobile_recharge_amount || 0) > 0 && (
//                                     <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//                                 )}
//                                 {(record.health_insurance_amount || 0) > 0 && (
//                                     <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//                                 )}
//                                 {(record.hra_amount || 0) > 0 && (
//                                     <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//                                 )}
//                                 <small style={{ color: '#8c8c8c' }}>
//                                     Starts:{' '}
//                                     {record.allowance_effective_from
//                                         ? dayjs(record.allowance_effective_from).format('DD MMM YYYY')
//                                         : 'N/A'}
//                                 </small>
//                             </div>
//                         );
//                     },
//                 },
//             ]
//             : []),
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary & Allowance Management</Title>
//             <Text type="secondary">
//                 Manage salary hikes, daily wage revisions, standalone allowances, probation conversions, and tenure-based eligibility.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId}
//                     onChange={handleStaffChange}
//                     optionFilterProp="label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => {
//                         const typeLabel = emp.is_permanently_daily
//                             ? 'DAILY WAGE'
//                             : (emp.status || 'probation').toUpperCase();
//                         return {
//                             value: emp.id,
//                             label: `${emp.full_name} (${emp.employee_code}) - [${typeLabel}]`,
//                         };
//                     })}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     {/* Add Form */}
//                     <Card
//                         title={
//                             <Space>
//                                 <PlusOutlined />
//                                 {isDailyStaff ? 'Update Daily Wage Rate' : 'Add Salary Hike or Allowance Update'}
//                             </Space>
//                         }
//                     >
//                         {isDailyStaff && (
//                             <Alert
//                                 type="info"
//                                 showIcon
//                                 icon={<FieldTimeOutlined />}
//                                 style={{ marginBottom: '16px' }}
//                                 title="Daily Wage Staff Selected"
//                                 description="This staff member is registered on a daily basis (is_permanently_daily). Revisions apply to the daily rate only."
//                             />
//                         )}

//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             {/* Conditional Probation Conversion for Non-Daily Staff */}
//                             {isProbationStaff && (
//                                 <Card
//                                     size="small"
//                                     style={{
//                                         backgroundColor: '#e6f7ff',
//                                         borderColor: '#91d5ff',
//                                         marginBottom: '20px',
//                                     }}
//                                 >
//                                     <Form.Item
//                                         name="convert_to_regular"
//                                         valuePropName="checked"
//                                         style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                                     >
//                                         <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
//                                             <Space>
//                                                 <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Convert Employee from Probation to Regular</Text>
//                                             </Space>
//                                         </Checkbox>
//                                     </Form.Item>

//                                     {isConvertingToRegular && (
//                                         <Form.Item
//                                             name="probation_end_date"
//                                             label="Probation End Date"
//                                             rules={[{ required: true, message: 'Please select probation end date' }]}
//                                             style={{ marginBottom: 0 }}
//                                         >
//                                             <DatePicker
//                                                 style={{ width: '100%' }}
//                                                 format="YYYY-MM-DD"
//                                                 placeholder="Select probation completion date"
//                                             />
//                                         </Form.Item>
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Reason / Stage Name"
//                                 rules={[{ required: true, message: 'Please select or enter reason' }]}
//                             >
//                                 <Select
//                                     mode="tags"
//                                     maxCount={1}
//                                     placeholder="Type custom reason or select from list..."
//                                     options={stageOptions}
//                                     filterOption={(input, option) =>
//                                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                                     }
//                                 />
//                             </Form.Item>

//                             {/* Salary Input: Toggles label between Daily Wage and Monthly Base Salary */}
//                             <Form.Item
//                                 label={isDailyStaff ? 'New Daily Wage Rate (₹ / Day)' : 'New Revised Base Salary (₹)'}
//                                 name="base_salary"
//                                 rules={[{ required: isDailyStaff, message: 'Please enter daily rate' }]}
//                                 extra={`Current ${isDailyStaff ? 'Daily Rate' : 'Base Salary'}: ₹${Number(selectedStaff?.normal_salary || 0).toLocaleString()}${isDailyStaff ? ' / day' : ''}`}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder={`Current: ₹${selectedStaff?.normal_salary || 0}`}
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             {/* Fixed Monthly Allowances Section (Hidden for Daily Workers) */}
//                             {!isDailyStaff && (
//                                 <Collapse
//                                     defaultActiveKey={['allowances']}
//                                     style={{ marginTop: '16px', marginBottom: '16px' }}
//                                     items={[
//                                         {
//                                             key: 'allowances',
//                                             label: (
//                                                 <Space>
//                                                     <GiftOutlined style={{ color: '#1890ff' }} />
//                                                     <Text strong>Fixed Monthly Allowances</Text>
//                                                 </Space>
//                                             ),
//                                             children: (
//                                                 <div>
//                                                     {allAllowancesGranted ? (
//                                                         <Alert
//                                                             type="info"
//                                                             showIcon
//                                                             icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
//                                                             style={{ marginBottom: '8px' }}
//                                                             title="All Fixed Monthly Allowances Granted"
//                                                             description="This employee has already received Mobile Recharge, Health Insurance, and HRA allowances."
//                                                         />
//                                                     ) : (
//                                                         <>
//                                                             {probationEnd ? (
//                                                                 <Alert
//                                                                     type="info"
//                                                                     showIcon
//                                                                     style={{ marginBottom: '16px' }}
//                                                                     title={`Probation Ended: ${probationEnd.format('DD MMM YYYY')}`}
//                                                                     description="Default Rules: Mobile (1 Yr post-probation), Health Insurance (2 Yrs post-probation), HRA (3 Yrs post-probation)."
//                                                                 />
//                                                             ) : (
//                                                                 <Alert
//                                                                     type="warning"
//                                                                     showIcon
//                                                                     style={{ marginBottom: '16px' }}
//                                                                     title="Probation End Date Not Set"
//                                                                     description="Tick 'Convert Employee from Probation to Regular' above to calculate eligibility dates."
//                                                                 />
//                                                             )}

//                                                             {/* Mobile Recharge */}
//                                                             {!hasMobileAlready ? (
//                                                                 <Form.Item
//                                                                     label={
//                                                                         <Space>
//                                                                             <span>Mobile Recharge Allowance (₹)</span>
//                                                                             {mobileEligibleDate && (
//                                                                                 <Tag color={isMobileEligible ? 'green' : 'orange'}>
//                                                                                     {isMobileEligible
//                                                                                         ? 'Eligible'
//                                                                                         : `Eligible: ${mobileEligibleDate.format('DD MMM YYYY')} (1 Yr Post-Probation)`}
//                                                                                 </Tag>
//                                                                             )}
//                                                                         </Space>
//                                                                     }
//                                                                     name="mobile_recharge_amount"
//                                                                 >
//                                                                     <InputNumber
//                                                                         style={{ width: '100%' }}
//                                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                         placeholder="e.g. 500"
//                                                                         min={0}
//                                                                     />
//                                                                 </Form.Item>
//                                                             ) : (
//                                                                 <Alert
//                                                                     type="success"
//                                                                     showIcon
//                                                                     style={{ marginBottom: '12px' }}
//                                                                     title={`Mobile Recharge Allowance Already Granted: ₹${Number(existingMobileAllowance).toLocaleString()}`}
//                                                                 />
//                                                             )}

//                                                             {/* Health Insurance */}
//                                                             {!hasHealthAlready ? (
//                                                                 <Form.Item
//                                                                     label={
//                                                                         <Space>
//                                                                             <span>Health Insurance Allowance (₹)</span>
//                                                                             {healthEligibleDate && (
//                                                                                 <Tag color={isHealthEligible ? 'green' : 'orange'}>
//                                                                                     {isHealthEligible
//                                                                                         ? 'Eligible'
//                                                                                         : `Eligible: ${healthEligibleDate.format('DD MMM YYYY')} (2 Yrs Post-Probation)`}
//                                                                                 </Tag>
//                                                                             )}
//                                                                         </Space>
//                                                                     }
//                                                                     name="health_insurance_amount"
//                                                                 >
//                                                                     <InputNumber
//                                                                         style={{ width: '100%' }}
//                                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                         placeholder="e.g. 1500"
//                                                                         min={0}
//                                                                     />
//                                                                 </Form.Item>
//                                                             ) : (
//                                                                 <Alert
//                                                                     type="success"
//                                                                     showIcon
//                                                                     style={{ marginBottom: '12px' }}
//                                                                     title={`Health Insurance Allowance Already Granted: ₹${Number(existingHealthAllowance).toLocaleString()}`}
//                                                                 />
//                                                             )}

//                                                             {/* HRA */}
//                                                             {!hasHraAlready ? (
//                                                                 <Form.Item
//                                                                     label={
//                                                                         <Space>
//                                                                             <span>House Rent Allowance - HRA (₹)</span>
//                                                                             {hraEligibleDate && (
//                                                                                 <Tag color={isHraEligible ? 'green' : 'orange'}>
//                                                                                     {isHraEligible
//                                                                                         ? 'Eligible'
//                                                                                         : `Eligible: ${hraEligibleDate.format('DD MMM YYYY')} (3 Yrs Post-Probation)`}
//                                                                                 </Tag>
//                                                                             )}
//                                                                         </Space>
//                                                                     }
//                                                                     name="hra_amount"
//                                                                 >
//                                                                     <InputNumber
//                                                                         style={{ width: '100%' }}
//                                                                         formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                         parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                         placeholder="e.g. 3000"
//                                                                         min={0}
//                                                                     />
//                                                                 </Form.Item>
//                                                             ) : (
//                                                                 <Alert
//                                                                     type="success"
//                                                                     showIcon
//                                                                     style={{ marginBottom: '12px' }}
//                                                                     title={`HRA Allowance Already Granted: ₹${Number(existingHraAllowance).toLocaleString()}`}
//                                                                 />
//                                                             )}

//                                                             {/* Allowance Start Date */}
//                                                             <Form.Item
//                                                                 label="Allowance Effective From Date"
//                                                                 name="allowance_effective_from"
//                                                                 tooltip="Date when allowances start applying. Defaults to Base Effective From date if empty."
//                                                             >
//                                                                 <DatePicker
//                                                                     style={{ width: '100%' }}
//                                                                     format="YYYY-MM-DD"
//                                                                     placeholder="Defaults to Effective From Date"
//                                                                 />
//                                                             </Form.Item>
//                                                         </>
//                                                     )}
//                                                 </div>
//                                             ),
//                                         },
//                                     ]}
//                                 />
//                             )}

//                             <Form.Item style={{ marginTop: '24px' }}>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block icon={<PlusOutlined />}>
//                                     {isDailyStaff ? 'Save Daily Rate' : 'Save Structure / Allowances'}
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     {/* Salary History */}
//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History: {selectedStaff?.full_name}
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }

























// 'use client';

// import { useState, useEffect } from 'react';
// import dayjs from 'dayjs';
// import {
//     Card,
//     Form,
//     Select,
//     InputNumber,
//     Input,
//     DatePicker,
//     Button,
//     Table,
//     Tag,
//     message,
//     Typography,
//     Space,
//     Divider,
//     Collapse,
//     Alert,
//     Checkbox,
// } from 'antd';
// import {
//     PlusOutlined,
//     HistoryOutlined,
//     GiftOutlined,
//     UserSwitchOutlined,
//     FieldTimeOutlined,
//     CheckCircleOutlined,
// } from '@ant-design/icons';
// import { supabase } from '@/lib/supabase';

// const { Title, Text } = Typography;

// interface StaffMember {
//     id: string;
//     employee_code: string;
//     full_name: string;
//     normal_salary: number;
//     status?: string;
//     probation_end_date?: string | null;
//     is_permanently_daily?: boolean;
// }

// interface SalaryStructure {
//     id: string;
//     employee_id: string;
//     stage_name: string;
//     base_salary: number;
//     daily_wage_rate?: number | null;
//     hra_amount?: number;
//     mobile_recharge_amount?: number;
//     health_insurance_amount?: number;
//     effective_from: string;
//     allowance_effective_from?: string | null;
//     effective_to?: string | null;
//     created_at: string;
// }

// export default function SalaryHikePage() {
//     const [form] = Form.useForm();
//     const [staffList, setStaffList] = useState<StaffMember[]>([]);
//     const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
//     const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
//     const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
//     const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//     const [submitting, setSubmitting] = useState<boolean>(false);
//     const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
//     const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

//     useEffect(() => {
//         fetchStaffList();
//         fetchStageNames();
//     }, []);

//     useEffect(() => {
//         if (selectedStaffId) {
//             fetchSalaryHistory(selectedStaffId);
//         } else {
//             setSalaryHistory([]);
//         }
//     }, [selectedStaffId]);

//     const fetchStaffList = async () => {
//         setLoadingStaff(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .select('id, employee_code, full_name, normal_salary, status, probation_end_date, is_permanently_daily')
//                 .eq('role', 'staff')
//                 .order('full_name', { ascending: true });

//             if (error) throw error;
//             setStaffList(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch staff members');
//         } finally {
//             setLoadingStaff(false);
//         }
//     };

//     const fetchStageNames = async () => {
//         const { data } = await supabase
//             .schema('leave_management')
//             .from('salary_structures')
//             .select('stage_name')
//             .not('stage_name', 'is', null);

//         if (data) {
//             const defaultStages = [
//                 'Regular Allowance',
//                 'Allowance Update',
//                 'Annual Hike',
//                 'Daily Rate Revision',
//                 'Probation Completion',
//                 'Promotion',
//                 'Performance Increment',
//             ];
//             const dbStages = data.map((item) => item.stage_name).filter(Boolean);
//             const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

//             setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
//         }
//     };

//     const fetchSalaryHistory = async (employeeId: string) => {
//         setLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .select('*')
//                 .eq('employee_id', employeeId)
//                 .order('effective_from', { ascending: false });

//             if (error) throw error;
//             setSalaryHistory(data || []);
//         } catch (err: any) {
//             message.error(err.message || 'Failed to fetch salary history');
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
//     const isDailyStaff = Boolean(selectedStaff?.is_permanently_daily);
//     const isProbationStaff = selectedStaff?.status === 'probation' && !isDailyStaff;

//     const currentActive = salaryHistory.find((s) => !s.effective_to) || salaryHistory[0];

//     // Identify active allowances directly from current records
//     const activeMobile = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.mobile_recharge_amount || 0), 0);
//     const activeHealth = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.health_insurance_amount || 0), 0);
//     const activeHra = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.hra_amount || 0), 0);

//     const handleStaffChange = async (value: string) => {
//         setSelectedStaffId(value);
//         setIsConvertingToRegular(false);
//         form.resetFields();

//         const emp = staffList.find((item) => item.id === value);

//         form.setFieldsValue({
//             employee_id: value,
//             current_salary: emp?.normal_salary || 0,
//         });

//         if (value) {
//             await fetchSalaryHistory(value);
//         }
//     };

//     const handleSubmit = async (values: any) => {
//         setSubmitting(true);
//         try {
//             const {
//                 employee_id,
//                 stage_name,
//                 base_salary,
//                 hra_amount,
//                 mobile_recharge_amount,
//                 health_insurance_amount,
//                 effective_from,
//                 allowance_effective_from,
//                 convert_to_regular,
//                 probation_end_date,
//             } = values;

//             // Carry over existing allowed values if hidden, otherwise use new input
//             const finalMobile = activeMobile > 0 ? activeMobile : (mobile_recharge_amount || 0);
//             const finalInsurance = activeHealth > 0 ? activeHealth : (health_insurance_amount || 0);
//             const finalHra = activeHra > 0 ? activeHra : (hra_amount || 0);

//             const enteredSalary = base_salary !== undefined && base_salary !== null
//                 ? base_salary
//                 : selectedStaff?.normal_salary || 0;

//             const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
//             const allowanceEffectiveFromStr = allowance_effective_from
//                 ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
//                 : (currentActive?.allowance_effective_from || effectiveFromStr);

//             // 1. Terminate previous active row
//             if (currentActive && !currentActive.effective_to) {
//                 const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

//                 const { error: updateError } = await supabase
//                     .schema('leave_management')
//                     .from('salary_structures')
//                     .update({ effective_to: previousEffectiveTo })
//                     .eq('id', currentActive.id);

//                 if (updateError) throw updateError;
//             }

//             const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;

//             // 2. Add new salary structure row preserving all active allowances
//             const { error: insertError } = await supabase
//                 .schema('leave_management')
//                 .from('salary_structures')
//                 .insert([
//                     {
//                         employee_id,
//                         stage_name: parsedStageName || (isDailyStaff ? 'Daily Rate Revision' : 'Salary Hike'),
//                         base_salary: isDailyStaff ? 0 : enteredSalary,
//                         daily_wage_rate: isDailyStaff ? enteredSalary : null,
//                         hra_amount: isDailyStaff ? 0 : finalHra,
//                         mobile_recharge_amount: isDailyStaff ? 0 : finalMobile,
//                         health_insurance_amount: isDailyStaff ? 0 : finalInsurance,
//                         effective_from: effectiveFromStr,
//                         allowance_effective_from: isDailyStaff ? null : allowanceEffectiveFromStr,
//                         effective_to: null,
//                     },
//                 ]);

//             if (insertError) throw insertError;

//             // 3. Update employee base salary and status
//             const employeeUpdatePayload: Record<string, any> = {
//                 normal_salary: enteredSalary,
//             };

//             if (convert_to_regular && probation_end_date && !isDailyStaff) {
//                 employeeUpdatePayload.status = 'regular';
//                 employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
//             }

//             const { error: empError } = await supabase
//                 .schema('leave_management')
//                 .from('employees')
//                 .update(employeeUpdatePayload)
//                 .eq('id', employee_id);

//             if (empError) throw empError;

//             message.success('Salary revision saved! Active allowances preserved automatically.');
//             setIsConvertingToRegular(false);
//             form.resetFields([
//                 'stage_name',
//                 'base_salary',
//                 'hra_amount',
//                 'mobile_recharge_amount',
//                 'health_insurance_amount',
//                 'effective_from',
//                 'allowance_effective_from',
//                 'convert_to_regular',
//                 'probation_end_date',
//             ]);

//             fetchSalaryHistory(employee_id);
//             fetchStaffList();
//         } catch (err: any) {
//             message.error(err.message || 'Failed to save salary details');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const columns = [
//         {
//             title: 'Stage / Description',
//             dataIndex: 'stage_name',
//             key: 'stage_name',
//             render: (text: string, record: SalaryStructure) => (
//                 <Space orientation="vertical" size={2}>
//                     <Text strong>{text}</Text>
//                     {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
//                 </Space>
//             ),
//         },
//         {
//             title: isDailyStaff ? 'Daily Wage Rate' : 'Base Salary',
//             key: 'salary_rate',
//             render: (_: any, record: SalaryStructure) => {
//                 if (isDailyStaff || record.daily_wage_rate) {
//                     const rate = record.daily_wage_rate || record.base_salary;
//                     return <Tag color="cyan">₹{Number(rate).toLocaleString()} / day</Tag>;
//                 }
//                 return `₹${Number(record.base_salary).toLocaleString()}`;
//             },
//         },
//         ...(!isDailyStaff
//             ? [
//                 {
//                     title: 'Active Allowances',
//                     key: 'benefits',
//                     render: (_: any, record: SalaryStructure) => {
//                         const hasAllowances =
//                             (record.mobile_recharge_amount || 0) > 0 ||
//                             (record.health_insurance_amount || 0) > 0 ||
//                             (record.hra_amount || 0) > 0;

//                         if (!hasAllowances) return <Text type="secondary">None</Text>;

//                         return (
//                             <div>
//                                 {(record.mobile_recharge_amount || 0) > 0 && (
//                                     <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
//                                 )}
//                                 {(record.health_insurance_amount || 0) > 0 && (
//                                     <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
//                                 )}
//                                 {(record.hra_amount || 0) > 0 && (
//                                     <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
//                                 )}
//                             </div>
//                         );
//                     },
//                 },
//             ]
//             : []),
//         {
//             title: 'Effective From',
//             dataIndex: 'effective_from',
//             key: 'effective_from',
//             render: (date: string) => dayjs(date).format('DD MMM YYYY'),
//         },
//         {
//             title: 'Effective To',
//             dataIndex: 'effective_to',
//             key: 'effective_to',
//             render: (date: string | null) =>
//                 date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
//         },
//     ];

//     const allAllowancesGranted = activeMobile > 0 && activeHealth > 0 && activeHra > 0;

//     return (
//         <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
//             <Title level={2}>Staff Salary & Allowance Management</Title>
//             <Text type="secondary">
//                 Manage salary hikes, daily wage revisions, and permanent allowances.
//             </Text>

//             <Divider />

//             <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
//                 <Select
//                     showSearch
//                     placeholder="Select staff by name or employee code"
//                     style={{ width: '100%' }}
//                     loading={loadingStaff}
//                     value={selectedStaffId}
//                     onChange={handleStaffChange}
//                     optionFilterProp="label"
//                     filterOption={(input, option) =>
//                         (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                     }
//                     options={staffList.map((emp) => {
//                         const typeLabel = emp.is_permanently_daily
//                             ? 'DAILY WAGE'
//                             : (emp.status || 'probation').toUpperCase();
//                         return {
//                             value: emp.id,
//                             // label: `${emp.full_name} (${emp.employee_code}) - [${typeLabel}]`,
//                             label: `${emp.full_name} (${emp.employee_code})`,

//                         };
//                     })}
//                 />
//             </Card>

//             {selectedStaffId && (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
//                     <Card
//                         title={
//                             <Space>
//                                 <PlusOutlined />
//                                 {isDailyStaff ? 'Update Daily Wage Rate' : 'Add Salary Hike or Update'}
//                             </Space>
//                         }
//                     >
//                         {isDailyStaff && (
//                             <Alert
//                                 type="info"
//                                 showIcon
//                                 icon={<FieldTimeOutlined />}
//                                 style={{ marginBottom: '16px' }}
//                                 title="Daily Wage Staff Selected"
//                                 description="Revisions apply to the daily rate only."
//                             />
//                         )}

//                         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//                             <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
//                                 <Input />
//                             </Form.Item>

//                             {isProbationStaff && (
//                                 <Card
//                                     size="small"
//                                     style={{
//                                         backgroundColor: '#e6f7ff',
//                                         borderColor: '#91d5ff',
//                                         marginBottom: '20px',
//                                     }}
//                                 >
//                                     <Form.Item
//                                         name="convert_to_regular"
//                                         valuePropName="checked"
//                                         style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
//                                     >
//                                         <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
//                                             <Space>
//                                                 <UserSwitchOutlined style={{ color: '#1890ff' }} />
//                                                 <Text strong>Convert Employee from Probation to Regular</Text>
//                                             </Space>
//                                         </Checkbox>
//                                     </Form.Item>

//                                     {isConvertingToRegular && (
//                                         <Form.Item
//                                             name="probation_end_date"
//                                             label="Probation End Date"
//                                             rules={[{ required: true, message: 'Please select probation end date' }]}
//                                             style={{ marginBottom: 0 }}
//                                         >
//                                             <DatePicker
//                                                 style={{ width: '100%' }}
//                                                 format="YYYY-MM-DD"
//                                                 placeholder="Select probation completion date"
//                                             />
//                                         </Form.Item>
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="stage_name"
//                                 label="Reason / Stage Name"
//                                 rules={[{ required: true, message: 'Please select or enter reason' }]}
//                             >
//                                 <Select
//                                     mode="tags"
//                                     maxCount={1}
//                                     placeholder="Type custom reason or select from list..."
//                                     options={stageOptions}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label={isDailyStaff ? 'New Daily Wage Rate (₹ / Day)' : 'New Revised Base Salary (₹)'}
//                                 name="base_salary"
//                                 rules={[{ required: isDailyStaff, message: 'Please enter daily rate' }]}
//                                 extra={`Current Base: ₹${Number(selectedStaff?.normal_salary || 0).toLocaleString()}`}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                     placeholder={`Current: ₹${selectedStaff?.normal_salary || 0}`}
//                                     min={0}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Hike Effective From Date"
//                                 name="effective_from"
//                                 rules={[{ required: true, message: 'Please select effective date' }]}
//                             >
//                                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
//                             </Form.Item>

//                             {!isDailyStaff && (
//                                 <Collapse
//                                     defaultActiveKey={['allowances']}
//                                     style={{ marginTop: '16px', marginBottom: '16px' }}
//                                     items={[
//                                         {
//                                             key: 'allowances',
//                                             label: (
//                                                 <Space>
//                                                     <GiftOutlined style={{ color: '#1890ff' }} />
//                                                     <Text strong>Allowances</Text>
//                                                 </Space>
//                                             ),
//                                             children: (
//                                                 <div>
//                                                     {/* Active Allowances Badges */}
//                                                     {(activeMobile > 0 || activeHealth > 0 || activeHra > 0) && (
//                                                         <Alert
//                                                             type="success"
//                                                             showIcon
//                                                             icon={<CheckCircleOutlined />}
//                                                             style={{ marginBottom: '16px' }}
//                                                             description={
//                                                                 <div>
//                                                                     <div style={{ marginTop: '8px' }}>
//                                                                     <Text strong>Active Allowances :</Text>
//                                                                         {activeMobile > 0 && <Tag color="green">Mobile: ₹{activeMobile}/mo</Tag>}
//                                                                         {activeHealth > 0 && <Tag color="green">Insurance: ₹{activeHealth}/mo</Tag>}
//                                                                         {activeHra > 0 && <Tag color="green">HRA: ₹{activeHra}/mo</Tag>}
//                                                                     </div>

//                                                                 </div>
//                                                             }
//                                                         />
//                                                     )}

//                                                     {/* Mobile Recharge: Hide if already active */}
//                                                     {activeMobile === 0 && (
//                                                         <Form.Item
//                                                             label="Mobile Recharge Allowance (₹)"
//                                                             name="mobile_recharge_amount"
//                                                         >
//                                                             <InputNumber
//                                                                 style={{ width: '100%' }}
//                                                                 formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                 parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                 placeholder="e.g. 500"
//                                                                 min={0}
//                                                             />
//                                                         </Form.Item>
//                                                     )}

//                                                     {/* Health Insurance: Hide if already active */}
//                                                     {activeHealth === 0 && (
//                                                         <Form.Item
//                                                             label="Health Insurance Allowance (₹)"
//                                                             name="health_insurance_amount"
//                                                         >
//                                                             <InputNumber
//                                                                 style={{ width: '100%' }}
//                                                                 formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                 parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                 placeholder="e.g. 1500"
//                                                                 min={0}
//                                                             />
//                                                         </Form.Item>
//                                                     )}

//                                                     {/* HRA: Hide if already active */}
//                                                     {activeHra === 0 && (
//                                                         <Form.Item
//                                                             label="House Rent Allowance (HRA) (₹)"
//                                                             name="hra_amount"
//                                                         >
//                                                             <InputNumber
//                                                                 style={{ width: '100%' }}
//                                                                 formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                                                 parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
//                                                                 placeholder="e.g. 3000"
//                                                                 min={0}
//                                                             />
//                                                         </Form.Item>
//                                                     )}

//                                                     {allAllowancesGranted && (
//                                                         <Text type="secondary">
//                                                             All standard allowances have already been granted to this employee.
//                                                         </Text>
//                                                     )}
//                                                 </div>
//                                             ),
//                                         },
//                                     ]}
//                                 />
//                             )}

//                             <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
//                                 <Button type="primary" htmlType="submit" loading={submitting} block>
//                                     Save Salary Revision
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     </Card>

//                     <Card
//                         title={
//                             <Space>
//                                 <HistoryOutlined />
//                                 Salary History
//                             </Space>
//                         }
//                     >
//                         <Table
//                             dataSource={salaryHistory}
//                             columns={columns}
//                             rowKey="id"
//                             loading={loadingHistory}
//                             pagination={false}
//                             size="small"
//                         />
//                     </Card>
//                 </div>
//             )}
//         </div>
//     );
// }














'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
    Card,
    Form,
    Select,
    InputNumber,
    Input,
    DatePicker,
    Button,
    Table,
    Tag,
    message,
    Typography,
    Space,
    Divider,
    Collapse,
    Alert,
    Checkbox,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    HistoryOutlined,
    GiftOutlined,
    UserSwitchOutlined,
    FieldTimeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

interface StaffMember {
    id: string;
    employee_code: string;
    full_name: string;
    normal_salary: number;
    status?: string;
    probation_end_date?: string | null;
    is_permanently_daily?: boolean;
}

interface SalaryStructure {
    id: string;
    employee_id: string;
    stage_name: string;
    base_salary: number;
    daily_wage_rate?: number | null;
    hra_amount?: number;
    mobile_recharge_amount?: number;
    health_insurance_amount?: number;
    effective_from: string;
    allowance_effective_from?: string | null;
    effective_to?: string | null;
    created_at: string;
}

export default function SalaryHikePage() {
    const [form] = Form.useForm();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [salaryHistory, setSalaryHistory] = useState<SalaryStructure[]>([]);
    const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [stageOptions, setStageOptions] = useState<{ value: string; label: string }[]>([]);
    const [isConvertingToRegular, setIsConvertingToRegular] = useState<boolean>(false);

    useEffect(() => {
        fetchStaffList();
        fetchStageNames();
    }, []);

    useEffect(() => {
        if (selectedStaffId) {
            fetchSalaryHistory(selectedStaffId);
        } else {
            setSalaryHistory([]);
        }
    }, [selectedStaffId]);

    const fetchStaffList = async () => {
        setLoadingStaff(true);
        try {
            const { data, error } = await supabase
                .schema('leave_management')
                .from('employees')
                .select('id, employee_code, full_name, normal_salary, probation_salary, status, probation_end_date, is_permanently_daily')
                .eq('role', 'staff')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setStaffList(data || []);
        } catch (err: any) {
            message.error(err.message || 'Failed to fetch staff members');
        } finally {
            setLoadingStaff(false);
        }
    };

    const fetchStageNames = async () => {
        const { data } = await supabase
            .schema('leave_management')
            .from('salary_structures')
            .select('stage_name')
            .not('stage_name', 'is', null);

        if (data) {
            const defaultStages = [
                'Regular Allowance',
                'Allowance Update',
                'Annual Hike',
                'Daily Rate Revision',
                'Probation Completion',
                'Promotion',
                'Performance Increment',
            ];
            const dbStages = data.map((item) => item.stage_name).filter(Boolean);
            const uniqueStages = Array.from(new Set([...defaultStages, ...dbStages])).sort();

            setStageOptions(uniqueStages.map((stage) => ({ value: stage, label: stage })));
        }
    };

    const fetchSalaryHistory = async (employeeId: string) => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .schema('leave_management')
                .from('salary_structures')
                .select('*')
                .eq('employee_id', employeeId)
                .order('effective_from', { ascending: false });

            if (error) throw error;
            setSalaryHistory(data || []);
        } catch (err: any) {
            message.error(err.message || 'Failed to fetch salary history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
    const isDailyStaff = Boolean(selectedStaff?.is_permanently_daily);
    const isProbationStaff = selectedStaff?.status === 'probation' && !isDailyStaff;

    const currentActive = salaryHistory.find((s) => !s.effective_to) || salaryHistory[0];

    // Identify active granted allowances
    const activeMobile = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.mobile_recharge_amount || 0), 0);
    const activeHealth = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.health_insurance_amount || 0), 0);
    const activeHra = salaryHistory.reduce((acc, curr) => Math.max(acc, curr.hra_amount || 0), 0);

    // Dynamic Eligibility Calculations based on Probation End Date
    const probationEnd = selectedStaff?.probation_end_date ? dayjs(selectedStaff.probation_end_date) : null;

    const mobileEligibleDate = probationEnd ? probationEnd.add(1, 'year') : null;
    const healthEligibleDate = probationEnd ? probationEnd.add(2, 'years') : null;
    const hraEligibleDate = probationEnd ? probationEnd.add(3, 'years') : null;

    const isMobileEligible = probationEnd && mobileEligibleDate
        ? dayjs().isAfter(mobileEligibleDate) || dayjs().isSame(mobileEligibleDate, 'day')
        : false;

    const isHealthEligible = probationEnd && healthEligibleDate
        ? dayjs().isAfter(healthEligibleDate) || dayjs().isSame(healthEligibleDate, 'day')
        : false;

    const isHraEligible = probationEnd && hraEligibleDate
        ? dayjs().isAfter(hraEligibleDate) || dayjs().isSame(hraEligibleDate, 'day')
        : false;

    const handleStaffChange = async (value: string) => {
        setSelectedStaffId(value);
        setIsConvertingToRegular(false);
        form.resetFields();

        const emp = staffList.find((item) => item.id === value);

        form.setFieldsValue({
            employee_id: value,
            current_salary: emp?.normal_salary || 0,
        });

        if (value) {
            await fetchSalaryHistory(value);
        }
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            const {
                employee_id,
                stage_name,
                base_salary,
                hra_amount,
                mobile_recharge_amount,
                health_insurance_amount,
                effective_from,
                allowance_effective_from,
                convert_to_regular,
                probation_end_date,
            } = values;

            // Carry over active values if hidden, otherwise use form inputs
            const finalMobile = activeMobile > 0 ? activeMobile : (mobile_recharge_amount || 0);
            const finalInsurance = activeHealth > 0 ? activeHealth : (health_insurance_amount || 0);
            const finalHra = activeHra > 0 ? activeHra : (hra_amount || 0);

            const enteredSalary = base_salary !== undefined && base_salary !== null
                ? base_salary
                : selectedStaff?.normal_salary || 0;

            const effectiveFromStr = dayjs(effective_from).format('YYYY-MM-DD');
            const allowanceEffectiveFromStr = allowance_effective_from
                ? dayjs(allowance_effective_from).format('YYYY-MM-DD')
                : (currentActive?.allowance_effective_from || effectiveFromStr);

            // 1. Close current structure row
            if (currentActive && !currentActive.effective_to) {
                const previousEffectiveTo = dayjs(effective_from).subtract(1, 'day').format('YYYY-MM-DD');

                const { error: updateError } = await supabase
                    .schema('leave_management')
                    .from('salary_structures')
                    .update({ effective_to: previousEffectiveTo })
                    .eq('id', currentActive.id);

                if (updateError) throw updateError;
            }

            const parsedStageName = Array.isArray(stage_name) ? stage_name[0] : stage_name;

            // 2. Insert new structure carrying over existing active allowances
            const { error: insertError } = await supabase
                .schema('leave_management')
                .from('salary_structures')
                .insert([
                    {
                        employee_id,
                        stage_name: parsedStageName || (isDailyStaff ? 'Daily Rate Revision' : 'Salary Hike'),
                        base_salary: isDailyStaff ? 0 : enteredSalary,
                        daily_wage_rate: isDailyStaff ? enteredSalary : null,
                        hra_amount: isDailyStaff ? 0 : finalHra,
                        mobile_recharge_amount: isDailyStaff ? 0 : finalMobile,
                        health_insurance_amount: isDailyStaff ? 0 : finalInsurance,
                        effective_from: effectiveFromStr,
                        allowance_effective_from: isDailyStaff ? null : allowanceEffectiveFromStr,
                        effective_to: null,
                    },
                ]);

            if (insertError) throw insertError;

            // 3. Update employee base salary and probation details if converted
            const employeeUpdatePayload: Record<string, any> = {
                normal_salary: enteredSalary,
            };

            if (convert_to_regular && probation_end_date && !isDailyStaff) {
                employeeUpdatePayload.status = 'regular';
                employeeUpdatePayload.probation_end_date = dayjs(probation_end_date).format('YYYY-MM-DD');
            }

            const { error: empError } = await supabase
                .schema('leave_management')
                .from('employees')
                .update(employeeUpdatePayload)
                .eq('id', employee_id);

            if (empError) throw empError;

            message.success('Salary structure updated successfully!');
            setIsConvertingToRegular(false);
            form.resetFields([
                'stage_name',
                'base_salary',
                'hra_amount',
                'mobile_recharge_amount',
                'health_insurance_amount',
                'effective_from',
                'allowance_effective_from',
                'convert_to_regular',
                'probation_end_date',
            ]);

            fetchSalaryHistory(employee_id);
            fetchStaffList();
        } catch (err: any) {
            message.error(err.message || 'Failed to save salary details');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Stage / Description',
            dataIndex: 'stage_name',
            key: 'stage_name',
            render: (text: string, record: SalaryStructure) => (
                <Space orientation="vertical" size={2}>
                    <Text strong>{text}</Text>
                    {!record.effective_to && <Tag color="green">CURRENT ACTIVE</Tag>}
                </Space>
            ),
        },
        {
            title: isDailyStaff ? 'Daily Wage Rate' : 'Base Salary',
            key: 'salary_rate',
            render: (_: any, record: SalaryStructure) => {
                if (isDailyStaff || record.daily_wage_rate) {
                    const rate = record.daily_wage_rate || record.base_salary;
                    return <Tag color="cyan">₹{Number(rate).toLocaleString()} / day</Tag>;
                }
                return `₹${Number(record.base_salary).toLocaleString()}`;
            },
        },
        ...(!isDailyStaff
            ? [
                {
                    title: 'Active Allowances',
                    key: 'benefits',
                    render: (_: any, record: SalaryStructure) => {
                        const hasAllowances =
                            (record.mobile_recharge_amount || 0) > 0 ||
                            (record.health_insurance_amount || 0) > 0 ||
                            (record.hra_amount || 0) > 0;

                        if (!hasAllowances) return <Text type="secondary">None</Text>;

                        return (
                            <div>
                                {(record.mobile_recharge_amount || 0) > 0 && (
                                    <div>Mobile: ₹{Number(record.mobile_recharge_amount).toLocaleString()}</div>
                                )}
                                {(record.health_insurance_amount || 0) > 0 && (
                                    <div>Insurance: ₹{Number(record.health_insurance_amount).toLocaleString()}</div>
                                )}
                                {(record.hra_amount || 0) > 0 && (
                                    <div>HRA: ₹{Number(record.hra_amount).toLocaleString()}</div>
                                )}
                            </div>
                        );
                    },
                },
            ]
            : []),
        {
            title: 'Effective From',
            dataIndex: 'effective_from',
            key: 'effective_from',
            render: (date: string) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Effective To',
            dataIndex: 'effective_to',
            key: 'effective_to',
            render: (date: string | null) =>
                date ? dayjs(date).format('DD MMM YYYY') : <Tag color="blue">Ongoing</Tag>,
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2}>Staff Salary & Allowance Management</Title>
            <Text type="secondary">
                Manage salary hikes, daily wage revisions, and permanent allowances.
            </Text>

            <Divider />

            <Card title="1. Select Staff Member" style={{ marginBottom: '24px' }}>
                <Select
                    showSearch
                    placeholder="Select staff by name or employee code"
                    style={{ width: '100%' }}
                    loading={loadingStaff}
                    value={selectedStaffId}
                    onChange={handleStaffChange}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={staffList.map((emp) => {
                        const typeLabel = emp.is_permanently_daily
                            ? 'DAILY WAGE'
                            : (emp.status || 'probation').toUpperCase();
                        return {
                            value: emp.id,
                            label: `${emp.full_name} (${emp.employee_code})`,
                        };
                    })}
                />
            </Card>

            {selectedStaffId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <Card
                        title={
                            <Space>
                                <PlusOutlined />
                                {isDailyStaff ? 'Update Daily Wage Rate' : 'Add Salary Hike or Update'}
                            </Space>
                        }
                    >
                        {isDailyStaff && (
                            <Alert
                                type="info"
                                showIcon
                                icon={<FieldTimeOutlined />}
                                style={{ marginBottom: '16px' }}
                                title="Daily Wage Staff Selected"
                                description="Revisions apply to the daily rate only."
                            />
                        )}

                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item name="employee_id" hidden rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>

                            {isProbationStaff && (
                                <Card
                                    size="small"
                                    style={{
                                        backgroundColor: '#e6f7ff',
                                        borderColor: '#91d5ff',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <Form.Item
                                        name="convert_to_regular"
                                        valuePropName="checked"
                                        style={{ marginBottom: isConvertingToRegular ? 12 : 0 }}
                                    >
                                        <Checkbox onChange={(e) => setIsConvertingToRegular(e.target.checked)}>
                                            <Space>
                                                <UserSwitchOutlined style={{ color: '#1890ff' }} />
                                                <Text strong>Convert Employee from Probation to Regular</Text>
                                            </Space>
                                        </Checkbox>
                                    </Form.Item>

                                    {isConvertingToRegular && (
                                        <Form.Item
                                            name="probation_end_date"
                                            label="Probation End Date"
                                            rules={[{ required: true, message: 'Please select probation end date' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                placeholder="Select probation completion date"
                                            />
                                        </Form.Item>
                                    )}
                                </Card>
                            )}

                            <Form.Item
                                name="stage_name"
                                label="Reason / Stage Name"
                                rules={[{ required: true, message: 'Please select or enter reason' }]}
                            >
                                <Select
                                    mode="tags"
                                    maxCount={1}
                                    placeholder="Type custom reason or select from list..."
                                    options={stageOptions}
                                />
                            </Form.Item>

                          {(() => {
    const staff = selectedStaff as any;
    
    // Explicitly check status column (case-insensitive) for probation
    const isProbation = staff?.status?.toString().toLowerCase() === 'probation';

    const probationSalary = staff?.probation_salary ? Number(staff.probation_salary) : 0;
    const normalSalary = staff?.normal_salary ? Number(staff.normal_salary) : 0;

    const currentSalary = isProbation ? probationSalary : normalSalary;

    return (
        <>
            <Form.Item
                label={
                    isDailyStaff 
                        ? 'New Daily Wage Rate (₹ / Day)' 
                        : isProbation 
                            ? 'New Revised Base Salary (Probation Rate) (₹)' 
                            : 'New Revised Base Salary (₹)'
                }
                name="base_salary"
                rules={[{ required: true, message: isDailyStaff ? 'Please enter daily rate' : 'Please enter base salary' }]}
                extra={`Current Base (${isProbation ? 'Probation' : 'Regular'}): ₹${currentSalary.toLocaleString()}`}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
                    placeholder={`Current: ₹${currentSalary.toLocaleString()}`}
                    min={0}
                />
            </Form.Item>

            {/* Helper Alert - Shows ONLY for staff whose status is 'probation' */}
            {isProbation && (
                <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: -12, marginBottom: 16, padding: '6px 12px' }}
                    message={
                        <span>
                            Staff is currently on probation (₹{probationSalary.toLocaleString()}). Standard post-probation target: <strong>₹{normalSalary.toLocaleString()}</strong>
                        </span>
                    }
                />
            )}
        </>
    );
})()}

                            <Form.Item
                                label="Hike Effective From Date"
                                name="effective_from"
                                rules={[{ required: true, message: 'Please select effective date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>

                            {!isDailyStaff && (
                                <Collapse
                                    defaultActiveKey={['allowances']}
                                    style={{ marginTop: '16px', marginBottom: '16px' }}
                                    items={[
                                        {
                                            key: 'allowances',
                                            label: (
                                                <Space>
                                                    <GiftOutlined style={{ color: '#1890ff' }} />
                                                    <Text strong>Allowances & Eligibility Status</Text>
                                                </Space>
                                            ),
                                            children: (
                                                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                                                    {!probationEnd && (
                                                        <Alert
                                                            type="warning"
                                                            showIcon
                                                            message="Probation End Date Not Set"
                                                            description="Complete probation or specify a probation end date to verify allowance eligibility."
                                                        />
                                                    )}

                                                    {/* Active Allowances Banner */}
                                                    {(activeMobile > 0 || activeHealth > 0 || activeHra > 0) && (
                                                        <Alert
                                                            type="success"
                                                            showIcon
                                                            icon={<CheckCircleOutlined />}
                                                            description={
                                                                <div>
                                                                    <Text strong>Active Allowances (Permanently Active):</Text>
                                                                    <div style={{ marginTop: '6px' }}>
                                                                        {activeMobile > 0 && <Tag color="green">Mobile: ₹{activeMobile}/mo</Tag>}
                                                                        {activeHealth > 0 && <Tag color="green">Insurance: ₹{activeHealth}/mo</Tag>}
                                                                        {activeHra > 0 && <Tag color="green">HRA: ₹{activeHra}/mo</Tag>}
                                                                    </div>
                                                                </div>
                                                            }
                                                        />
                                                    )}

                                                    {/* 1. Mobile Recharge Allowance */}
                                                    {activeMobile === 0 && (
                                                        <div>
                                                            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Text strong>Mobile Recharge Allowance (1 yr after probation)</Text>
                                                                {isMobileEligible ? (
                                                                    <Tag color="green"><CheckCircleOutlined /> Eligible</Tag>
                                                                ) : (
                                                                    <Tag color="orange">
                                                                        <ClockCircleOutlined /> Eligible On: {mobileEligibleDate ? mobileEligibleDate.format('DD MMM YYYY') : 'N/A'}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                            {isMobileEligible ? (
                                                                <Form.Item name="mobile_recharge_amount" style={{ marginBottom: 0 }}>
                                                                    <InputNumber
                                                                        style={{ width: '100%' }}
                                                                        formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                        parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
                                                                        placeholder="Enter Mobile Allowance Amount (e.g. 500)"
                                                                        min={0}
                                                                    />
                                                                </Form.Item>
                                                            ) : (
                                                                <Alert
                                                                    type="info"
                                                                    showIcon
                                                                    style={{ padding: '4px 12px' }}
                                                                    message={`Staff becomes eligible on ${mobileEligibleDate ? mobileEligibleDate.format('DD MMM YYYY') : 'N/A'}`}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* 2. Health Insurance Allowance */}
                                                    {activeHealth === 0 && (
                                                        <div>
                                                            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Text strong>Health Insurance Allowance (2 yrs after probation)</Text>
                                                                {isHealthEligible ? (
                                                                    <Tag color="green"><CheckCircleOutlined /> Eligible</Tag>
                                                                ) : (
                                                                    <Tag color="orange">
                                                                        <ClockCircleOutlined /> Eligible On: {healthEligibleDate ? healthEligibleDate.format('DD MMM YYYY') : 'N/A'}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                            {isHealthEligible ? (
                                                                <Form.Item name="health_insurance_amount" style={{ marginBottom: 0 }}>
                                                                    <InputNumber
                                                                        style={{ width: '100%' }}
                                                                        formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                        parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
                                                                        placeholder="Enter Health Insurance Amount (e.g. 1500)"
                                                                        min={0}
                                                                    />
                                                                </Form.Item>
                                                            ) : (
                                                                <Alert
                                                                    type="info"
                                                                    showIcon
                                                                    style={{ padding: '4px 12px' }}
                                                                    message={`Staff becomes eligible on ${healthEligibleDate ? healthEligibleDate.format('DD MMM YYYY') : 'N/A'}`}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* 3. House Rent Allowance (HRA) */}
                                                    {activeHra === 0 && (
                                                        <div>
                                                            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Text strong>House Rent Allowance (3 yrs after probation)</Text>
                                                                {isHraEligible ? (
                                                                    <Tag color="green"><CheckCircleOutlined /> Eligible</Tag>
                                                                ) : (
                                                                    <Tag color="orange">
                                                                        <ClockCircleOutlined /> Eligible On: {hraEligibleDate ? hraEligibleDate.format('DD MMM YYYY') : 'N/A'}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                            {isHraEligible ? (
                                                                <Form.Item name="hra_amount" style={{ marginBottom: 0 }}>
                                                                    <InputNumber
                                                                        style={{ width: '100%' }}
                                                                        formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                        parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as any}
                                                                        placeholder="Enter HRA Amount (e.g. 3000)"
                                                                        min={0}
                                                                    />
                                                                </Form.Item>
                                                            ) : (
                                                                <Alert
                                                                    type="info"
                                                                    showIcon
                                                                    style={{ padding: '4px 12px' }}
                                                                    message={`Staff becomes eligible on ${hraEligibleDate ? hraEligibleDate.format('DD MMM YYYY') : 'N/A'}`}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </Space>
                                            ),
                                        },
                                    ]}
                                />
                            )}

                            <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                                <Button type="primary" htmlType="submit" loading={submitting} block>
                                    Save Salary Revision
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card
                        title={
                            <Space>
                                <HistoryOutlined />
                                Salary History
                            </Space>
                        }
                    >
                        <Table
                            dataSource={salaryHistory}
                            columns={columns}
                            rowKey="id"
                            loading={loadingHistory}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}