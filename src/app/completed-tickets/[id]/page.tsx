"use client";

import { useParams } from "next/navigation";
import { useTabs } from "@/context/TabContext";
import CompletedTicketDetail from "./CompletedTicketDetail";

export default function CompletedTicketDetailPage() {
  const params = useParams();
  const { closeTab } = useTabs();
  const id = params.id as string;

  return <CompletedTicketDetail ticketId={id} onClose={() => closeTab(`/completed-tickets/${id}`)} />;
}
