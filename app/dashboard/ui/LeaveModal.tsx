"use client";

import { Modal, Form, Input, DatePicker, Select, message } from "antd";

export default function LeaveModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();

  const submit = async (values: any) => {
    console.log("Leave Request:", values);

    message.success("Leave request submitted");
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Apply Leave"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Submit"
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="type" label="Leave Type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "sick", label: "Sick Leave" },
              { value: "casual", label: "Casual Leave" },
              { value: "annual", label: "Annual Leave" },
            ]}
          />
        </Form.Item>

        <Form.Item name="range" label="Date Range" rules={[{ required: true }]}>
          <DatePicker.RangePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="reason" label="Reason">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}