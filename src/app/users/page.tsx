"use client";

import { useEffect } from "react";
import { useTabs } from "@/context/TabContext";

export default function UsersRedirect() {
  const { openTab } = useTabs();

  useEffect(() => {
    openTab("Settings", "/settings");
  }, [openTab]);

  return null;
}
