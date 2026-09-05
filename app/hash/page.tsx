"use client";

import bcrypt from "bcryptjs";

export default function HashPage() {

  const createHash =
    async () => {

      const hash =
        await bcrypt.hash(
          "admin123",
          10
        );

      console.log(
        "HASH:",
        hash
      );
    };

  return (
    <div
      style={{
        padding: 40,
      }}
    >
      <button
        onClick={
          createHash
        }
      >
        Generate Hash
      </button>
    </div>
  );
}