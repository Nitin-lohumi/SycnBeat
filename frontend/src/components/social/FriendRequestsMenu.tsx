import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiCheck,
  HiOutlineInbox,
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineUsers,
  HiXMark,
} from "react-icons/hi2";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/time";
import { MOCK_REQUESTS, MOCK_SUGGESTIONS } from "../../mocks/social";
import HeaderPopover, { PanelEmpty, PanelHeader, PanelSection } from "../layout/HeaderPopover";
import UserRow from "./UserRow";

// List se item hatate waqt height 0 tak collapse -> neeche wale smoothly upar aate hain
const rowMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0, x: 40 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

export default function FriendRequestsMenu() {
  // TODO: React Query + API se aayega (useFriendRequests, useSendRequest...)
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const removeRequest = (id: string) => setRequests((rs) => rs.filter((r) => r.id !== id));

  const toggleSent = (userId: string) =>
    setSent((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const q = query.trim().toLowerCase();
  const people = MOCK_SUGGESTIONS.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.username.includes(q),
  );

  return (
    <HeaderPopover label="Friends" icon={HiOutlineUserPlus} badge={requests.length}>
      {(close) => (
        <>
          <PanelHeader
            title="Friends"
            action={
              <Link
                to="/friends"
                onClick={close}
                className="text-xs text-violet-300 transition-colors hover:text-violet-200"
              >
                See all
              </Link>
            }
          />

          <div className="overflow-y-auto">
            <PanelSection title="Requests" count={requests.length}>
              <AnimatePresence initial={false}>
                {requests.map((r) => (
                  <motion.div key={r.id} {...rowMotion} className="overflow-hidden">
                    <UserRow
                      user={r.from}
                      meta={timeAgo(r.createdAt)}
                      actions={
                        <>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeRequest(r.id)}
                            aria-label={`Accept ${r.from.name}`}
                            className="grid size-8 place-items-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20"
                          >
                            <HiCheck className="size-4" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeRequest(r.id)}
                            aria-label={`Reject ${r.from.name}`}
                            className="grid size-8 place-items-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <HiXMark className="size-4" />
                          </motion.button>
                        </>
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {requests.length === 0 && <PanelEmpty icon={HiOutlineInbox} text="No pending requests" />}
            </PanelSection>

            <div className="mx-4 h-px bg-white/10" />

            <PanelSection title="Add friends">
              <label className="mx-2 mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 transition-colors focus-within:border-violet-500/50">
                <HiOutlineMagnifyingGlass className="size-4 shrink-0 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or username"
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                />
              </label>

              {people.map((u) => {
                const isSent = sent.has(u.id);
                return (
                  <UserRow
                    key={u.id}
                    user={u}
                    actions={
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleSent(u.id)}
                        className={cn(
                          "flex h-8 w-24 items-center justify-center gap-1 overflow-hidden rounded-full text-xs font-medium transition-colors",
                          isSent
                            ? "bg-white/5 text-white/50 hover:bg-white/10"
                            : "bg-white text-black hover:bg-white/90",
                        )}
                      >
                        {/* mode="wait": purana label pehle niklega, phir naya aayega */}
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={isSent ? "sent" : "add"}
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -12, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            {isSent ? (
                              <>
                                <HiCheck className="size-3.5" /> Requested
                              </>
                            ) : (
                              <>
                                <HiOutlineUserPlus className="size-3.5" /> Add
                              </>
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    }
                  />
                );
              })}
              {people.length === 0 && <PanelEmpty icon={HiOutlineUsers} text="No one found" />}
            </PanelSection>
          </div>
        </>
      )}
    </HeaderPopover>
  );
}
