import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useRoom } from "../../../store/room";
import { useDeleteRoom, useUpdateRoom } from "../hooks";
import RoomFormDialog from "./RoomFormDialog";

export default function RoomSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const room = useRoom((s) => s.room);
  const update = useUpdateRoom();
  const del = useDeleteRoom();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  if (!room) return null;

  return (
    <>
      <RoomFormDialog
        open={open && !confirm}
        title="Room settings"
        submitLabel="Save changes"
        initial={{ name: room.name, description: room.description ?? "" }}
        saving={update.isPending}
        onClose={onClose}
        onSubmit={(values) => update.mutate({ id: room.id, ...values }, { onSuccess: onClose })}
        footer={
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="h-10 rounded-xl text-sm text-red-300 transition-colors hover:bg-red-500/10"
          >
            Delete room
          </button>
        }
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this room?"
        description="Everyone is sent out and the queue is deleted. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          onClose();
          navigate("/rooms");
          del.mutate(room.id);
        }}
      />
    </>
  );
}
