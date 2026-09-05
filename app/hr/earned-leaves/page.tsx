// "use client";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   Form,
//   Select,
//   DatePicker,
//   Input,
//   InputNumber,
//   Button,
//   message,
// } from "antd";
// import { supabase } from "@/lib/supabase";
// import dayjs from "dayjs";

// export default function EarnedLeavePage() {
//   const [form] = Form.useForm();
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     loadEmployees();
//   }, []);

//   const loadEmployees = async () => {
//     const { data } = await supabase
//       .schema("leave_management")
//       .from("employees")
//       .select("id, full_name")
//       .eq("active", true)
//       .eq("role", "staff");

//     setEmployees(data || []);
//   };

//   const handleSubmit = async (values: any) => {
//     try {
//       setSaving(true);

//       const selectedEmployee = employees.find(
//         (e) => e.id === values.employee_id
//       );

//       const { error } = await supabase
//         .schema("leave_management")
//         .from("el_credits")
//         .insert([
//           {
//             employee_id: values.employee_id,
//             employee_name: selectedEmployee?.full_name,
//             credit_date: values.credit_date.format("YYYY-MM-DD"),
//             count: values.count,
//             reason: values.reason,
//           },
//         ]);

//       if (error) throw error;

//       message.success("Earned Leave credited successfully");

//       form.resetFields();
//     } catch (err: any) {
//       message.error(err.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Card title="Earned Leave Credit Management">
//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={handleSubmit}
//       >
//         <Form.Item
//           name="employee_id"
//           label="Employee"
//           rules={[{ required: true }]}
//         >
//           <Select
//             showSearch
//             placeholder="Select employee"
//             options={employees.map((e) => ({
//               value: e.id,
//               label: e.full_name,
//             }))}
//           />
//         </Form.Item>

//         <Form.Item
//           name="credit_date"
//           label="Credit Date"
//           rules={[{ required: true }]}
//         >
//           <DatePicker
//             style={{ width: "100%" }}
//           />
//         </Form.Item>

//         <Form.Item
//           name="count"
//           label="Earned Leave Days"
//           initialValue={1}
//           rules={[{ required: true }]}
//         >
//           <InputNumber
//             min={0.5}
//             step={0.5}
//             style={{ width: "100%" }}
//           />
//         </Form.Item>

//         <Form.Item
//           name="reason"
//           label="Reason"
//           rules={[{ required: true }]}
//         >
//           <Input.TextArea rows={4} />
//         </Form.Item>

//         <Button
//           type="primary"
//           htmlType="submit"
//           loading={saving}
//         >
//           Credit Earned Leave
//         </Button>
//       </Form>
//     </Card>
//   );
// }





















"use client";

import { useEffect, useState } from "react";
import {
    Card,
    Form,
    Radio,
    Select,
    DatePicker,
    Input,
    InputNumber,
    Button,
    Table,
    Space,
    Popconfirm,
    message,
    Tag,
} from "antd";

import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";

export default function EarnedLeaveManagement() {
    const [form] = Form.useForm();

    const [employees, setEmployees] =
        useState<any[]>([]);

    const [history, setHistory] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [allocationType, setAllocationType] =
        useState("all");

    // =========================
    // LOAD STAFF
    // =========================
    const fetchEmployees =
        async () => {
            const { data, error } =
                await supabase
                    .schema("leave_management")
                    .from("employees")
                    .select(
                        "id, full_name, employee_code, joining_date,daily_wage_until"
                    )
                    .eq("role", "staff")
                    .eq("active", true);

            if (!error) {
                setEmployees(
                    data || []
                );
            }
        };

    // =========================
    // LOAD HISTORY
    // =========================
    const fetchHistory =
        async () => {
            const { data, error } =
                await supabase
                    .schema("leave_management")
                    .from("el_credits")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending:
                                false,
                        }
                    );

            if (!error) {
                setHistory(
                    data || []
                );
            }
        };

    useEffect(() => {
        fetchEmployees();
        fetchHistory();
    }, []);

    // =========================
    // SUBMIT
    // =========================
   const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            let selectedEmployees: any[] = [];
            const targetedCreditDate = values.credit_date.startOf("month");

            // Filter out base staff pool array depending on type selection
            if (values.allocation_type === "all") {
                selectedEmployees = [...employees];
            } else if (values.allocation_type === "selected") {
                selectedEmployees = employees.filter((emp) =>
                    values.employee_ids?.includes(emp.id)
                );
            }

            // 🌟 CHANGED: Guard validation against employee joining date boundaries
            // const validEmployees = selectedEmployees.filter((emp) => {
            //     if (!emp.joining_date) return true; // Fallback if no date is recorded
                
            //     const joinMonthStart = dayjs(emp.joining_date).startOf("month");
            //     // Returns false if credit date is strictly before the joining month
            //     return !targetedCreditDate.isBefore(joinMonthStart);
            // });




            const validEmployees = selectedEmployees.filter((emp) => {

    if (emp.joining_date) {

        const joinMonth = dayjs(emp.joining_date).startOf("month");

        if (targetedCreditDate.isBefore(joinMonth)) {
            return false;
        }
    }

    if (emp.daily_wage_until) {

        const dailyWageMonth = dayjs(emp.daily_wage_until).startOf("month");

        if (targetedCreditDate.isSame(dailyWageMonth, "month") ||
            targetedCreditDate.isBefore(dailyWageMonth, "month")) {
            return false;
        }
    }

    return true;
});





            if (validEmployees.length === 0) {
                message.error("Selected employees haven't joined yet on this credit date.");
                return;
            }

            // Alert administrator if any employees were omitted due to joining date constraints
            const skippedCount = selectedEmployees.length - validEmployees.length;
            if (skippedCount > 0) {
                message.warning(`${skippedCount} employee(s) skipped (Credit date is prior to joining date).`);
            }

            const rows = validEmployees.map((emp) => ({
                employee_id: emp.id,
                employee_name: emp.full_name,
                credit_date: values.credit_date.format("YYYY-MM-DD"),
                count: Number(values.count),
                reason: values.reason,
            }));

            const { error } = await supabase
                .schema("leave_management")
                .from("el_credits")
                .insert(rows);

            if (error) throw error;

            message.success(`Earned Leave allocated to ${rows.length} employee(s)`);
            form.resetFields();
            fetchHistory();
        } catch (err: any) {
            console.error(err);
            message.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // DELETE CREDIT
    // =========================
    const deleteCredit =
        async (
            id: string
        ) => {
            const {
                error,
            } =
                await supabase
                    .schema(
                        "leave_management"
                    )
                    .from(
                        "el_credits"
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    );

            if (
                error
            ) {
                message.error(
                    error.message
                );

                return;
            }

            message.success(
                "Deleted successfully"
            );

            fetchHistory();
        };

    // =========================
    // HISTORY TABLE
    // =========================
    const columns =
        [
            {
                title:
                    "Employee",
                dataIndex:
                    "employee_name",
            },

            {
                title:
                    "Credit Date",
                dataIndex:
                    "credit_date",

                render:
                    (
                        d: string
                    ) =>
                        dayjs(
                            d
                        ).format(
                            "DD-MM-YYYY"
                        ),
            },

            {
                title:
                    "Days",

                dataIndex:
                    "count",

                render:
                    (
                        v: number
                    ) => (
                        <Tag color="green">
                            {
                                v
                            }
                        </Tag>
                    ),
            },

            {
                title:
                    "Reason",

                dataIndex:
                    "reason",
            },

            {
                title:
                    "Action",

                render:
                    (
                        _: any,
                        record: any
                    ) => (
                        <Popconfirm
                            title="Delete this allocation?"
                            onConfirm={() =>
                                deleteCredit(
                                    record.id
                                )
                            }
                        >
                            <Button danger>
                                Delete
                            </Button>
                        </Popconfirm>
                    ),
            },
        ];

    return (
        <div
            style={{
                padding:
                    20,
            }}
        >
            <Card
                title="Earned Leave Allocation"
            >
                <Form
                    form={
                        form
                    }
                    layout="vertical"
                    onFinish={
                        handleSubmit
                    }
                    initialValues={{
                        allocation_type:
                            "all",

                        count: 1,
                    }}
                >
                    <Form.Item
                        name="allocation_type"
                        label="Allocation Type"
                        rules={[
                            {
                                required:
                                    true,
                            },
                        ]}
                    >
                        <Radio.Group
                            onChange={(
                                e
                            ) =>
                                setAllocationType(
                                    e
                                        .target
                                        .value
                                )
                            }
                        >
                            <Radio value="all">
                                All Staff
                            </Radio>

                            <Radio value="selected">
                                Selected Staff
                            </Radio>
                        </Radio.Group>
                    </Form.Item>

                    {allocationType ===
                        "selected" && (
                        <Form.Item
                            name="employee_ids"
                            label="Select Staff"
                            rules={[
                                {
                                    required:
                                        true,
                                },
                            ]}
                        >
                            <Select
                                mode="multiple"
                                showSearch
                                placeholder="Choose one or more staff"
                                options={employees.map(
                                    (
                                        emp
                                    ) => ({
                                        value:
                                            emp.id,

                                        label:
                                            `${emp.full_name} (${emp.employee_code})`,
                                    })
                                )}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="credit_date"
                        label="Credit Date"
                        rules={[
                            {
                                required:
                                    true,
                            },
                        ]}
                    >
                        <DatePicker
                            style={{
                                width:
                                    "100%",
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="count"
                        label="Earned Leave Days"
                        rules={[
                            {
                                required:
                                    true,
                            },
                        ]}
                    >
                        <InputNumber
                            min={
                                0.5
                            }
                            step={
                                0.5
                            }
                            style={{
                                width:
                                    "100%",
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[
                            {
                                required:
                                    true,
                            },
                        ]}
                    >
                        <Input.TextArea
                            rows={
                                4
                            }
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={
                            loading
                        }
                    >
                        Allocate Earned Leave
                    </Button>
                </Form>
            </Card>

            <Card
                title="Allocation History"
                style={{
                    marginTop:
                        20,
                }}
            >
                <Table
                    rowKey="id"
                    dataSource={
                        history
                    }
                    columns={
                        columns
                    }
                    pagination={{
                        pageSize:
                            10,
                    }}
                />
            </Card>
        </div>
    );
}