import { HiOutlineHandRaised } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import { useRoom } from "../../../store/room";
import type { RequestMessage } from "../types";
import RequestCard from "./RequestCard";

export function usePendingRequests() {
  const chat = useRoom((s) => s.chat);
  return chat.filter((m): m is RequestMessage => m.kind === "request" && m.status === "pending");
}

export default function RequestsPanel() {
  const chat = useRoom((s) => s.chat);
  const requests = chat.filter((m): m is RequestMessage => m.kind === "request").reverse();

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineHandRaised}
        title="No requests"
        text="Song and permission requests show up here and in the chat."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {requests.map((m) => (
        <RequestCard key={m.id} msg={m} />
      ))}
    </div>
  );
}
