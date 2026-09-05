"use client";

import { Table, Button, Tag, Space } from "antd";
import { useState } from "react";

type Leave = {
  id: number;
  name: string;
  type: string;
  status: string;
};

export default function ApprovalsPage() {
  const [data, setData] = useState<Leave[]>([
    { id: 1, name: "John", type: "Sick", status: "Pending" },
    { id: 2, name: "Sara", type: "Casual", status: "Pending" },
  ]);

  const updateStatus = (id: number, status: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  const columns = [
    { title: "Employee", dataIndex: "name" },
    { title: "Leave Type", dataIndex: "type" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "Approved"
              ? "green"
              : status === "Rejected"
              ? "red"
              : "orange"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (_: any, record: Leave) => (
        <Space>
          <Button
            type="primary"
            onClick={() => updateStatus(record.id, "Approved")}
          >
            Approve
          </Button>

          <Button danger onClick={() => updateStatus(record.id, "Rejected")}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} />;
}