"use server";

import { getRequestLogs, type LogFilter } from "@/lib/queries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function fetchLogs(
  projectId: string,
  page = 1,
  pageSize = 50,
  filters: LogFilter = {},
  sortBy: "createdAt" | "latencyMs" | "costUsd" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return getRequestLogs(projectId, page, pageSize, filters, sortBy, sortOrder);
}
