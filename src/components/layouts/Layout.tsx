// components/layouts/Layout.tsx
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <div style={{ padding: "20px" }}>{children}</div>;
}
