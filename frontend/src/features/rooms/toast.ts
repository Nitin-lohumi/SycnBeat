import { toast, type ExternalToast } from "sonner";

// Room toasts show top-right so they don't sit on the player and chat at the bottom.
const opts = (o?: ExternalToast): ExternalToast => ({ position: "top-right", duration: 1000, ...o });

export const roomToast = {
  message: (text: string, o?: ExternalToast) => toast(text, opts(o)),
  success: (text: string, o?: ExternalToast) => toast.success(text, opts(o)),
  error: (text: string, o?: ExternalToast) => toast.error(text, opts(o)),
};
