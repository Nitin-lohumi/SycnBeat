import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "../../lib/queryKeys";
import { socket } from "./socket";
import { requestToastId, showFriendRequestToast, showNotificationToast } from "./toasts";

// Socket events are only signals; the server stays the source of truth via refetch.
export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const refresh = (...keys: readonly (readonly string[])[]) =>
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));

    let connectedBefore = false;
    const onConnect = () => {
      if (connectedBefore) refresh(qk.counts, qk.friendRequests, qk.notifications, qk.friends);
      connectedBefore = true;
    };

    socket.on("connect", onConnect);
    socket.on("friend:request:new", (request) => {
      refresh(qk.counts, qk.friendRequests, qk.userSearchAll);
      showFriendRequestToast(request);
    });
    socket.on("friend:request:removed", ({ requestId }) => {
      refresh(qk.counts, qk.friendRequests, qk.userSearchAll);
      toast.dismiss(requestToastId(requestId));
    });
    socket.on("friends:changed", () => refresh(qk.friends, qk.userSearchAll));
    socket.on("notification:new", (n) => {
      refresh(qk.counts, qk.notifications);
      if (n.type === "FRIEND_ACCEPTED") showNotificationToast(n);
    });

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [qc]);
}
