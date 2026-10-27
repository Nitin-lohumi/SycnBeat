import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "../../lib/queryKeys";
import { syncSocial } from "../friends/hooks";
import { syncLibrary } from "../music/hooks";
import type { FriendRequests } from "../friends/types";
import { socket } from "./socket";
import { requestToastId, showFriendRequestToast, showNotificationToast } from "./toasts";

// Socket events are only signals; the server stays the source of truth via refetch.
export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const refresh = (...keys: QueryKey[]) =>
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey, refetchType: "all" }));

    let connectedBefore = false;
    const onConnect = () => {
      if (connectedBefore) {
        syncSocial(qc);
        syncLibrary(qc);
        refresh(qk.notifications);
      }
      connectedBefore = true;
    };

    socket.on("connect", onConnect);
    socket.on("friend:request:new", (request) => {
      syncSocial(qc);
      showFriendRequestToast(request);
    });
    socket.on("friend:request:removed", ({ requestId }) => {
      qc.setQueryData<FriendRequests>(qk.friendRequests, (r) =>
        r && {
          incoming: r.incoming.filter((x) => x.id !== requestId),
          outgoing: r.outgoing.filter((x) => x.id !== requestId),
        },
      );
      toast.dismiss(requestToastId(requestId));
      syncSocial(qc);
    });
    socket.on("friends:changed", () => syncSocial(qc));
    socket.on("notification:new", (n) => {
      refresh(qk.counts, qk.notifications);
      if (n.type === "FRIEND_ACCEPTED") showNotificationToast(n);
    });
    socket.on("library:changed", () => syncLibrary(qc));

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [qc]);
}
