"use client";

import { Row, Col, Card, Typography, Button } from "antd";
import LeaveModal from "./ui/LeaveModal";
import { useState } from "react";

const { Title } = Typography;

export default function DashboardPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Title level={3}>Dashboard Overview</Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="Total Leaves">12</Card>
        </Col>
        <Col span={6}>
          <Card title="Approved">8</Card>
        </Col>
        <Col span={6}>
          <Card title="Pending">3</Card>
        </Col>
        <Col span={6}>
          <Card title="Rejected">1</Card>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          Apply Leave
        </Button>
      </div>

      <LeaveModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}