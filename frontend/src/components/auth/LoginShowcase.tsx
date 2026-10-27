import { motion } from "framer-motion";
import {
  HiBackward,
  HiForward,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineQueueList,
  HiOutlineUserGroup,
  HiPause,
} from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineBolt,
    title: "Perfect sync",
    desc: "Everyone hears the exact same second of the song, wherever they are.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Rooms with friends",
    desc: "Create a room, invite friends and decide who controls the music.",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Live chat",
    desc: "Talk about the track in real time while it plays.",
  },
  {
    icon: HiOutlineQueueList,
    title: "Shared queue",
    desc: "Add songs together and build the perfect playlist.",
  },
];

const BARS = [0.6, 1, 0.4, 0.8, 0.5, 0.9];
const ease = [0.22, 1, 0.36, 1] as const;

function Equalizer() {
  return (
    <div className="flex h-8 shrink-0 items-end gap-1">
      {BARS.map((h, i) => (
        <motion.span
          key={i}
          className="h-full w-1 origin-bottom rounded-full bg-violet-400"
          animate={{ scaleY: [h * 0.3, h, h * 0.5, h * 0.9, h * 0.3] }}
          transition={{
            duration: 1.2 + (i % 3) * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

function Vinyl() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="relative h-14 w-14 shrink-0 rounded-full ring-1 ring-white/10 sm:h-16 sm:w-16"
      style={{
        background:
          "repeating-radial-gradient(circle, #0d0d0d 0 2px, #1b1b1b 2px 4px)",
      }}
    >
      <div className="absolute inset-[32%] grid place-items-center rounded-full bg-linear-to-br from-violet-400 to-fuchsia-500">
        <div className="h-1.5 w-1.5 rounded-full bg-black" />
      </div>
    </motion.div>
  );
}

function NowPlayingCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <Vinyl />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">Midnight Drive</p>
          <p className="mt-0.5 truncate text-xs text-white/50">
            Neon Skyline · 4 listening
          </p>
        </div>
        <Equalizer />
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-violet-400"
          initial={{ width: "15%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/40">
        <span>1:12</span>
        <span>3:48</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-8 text-white/60">
        <HiBackward size={20} />
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-black">
          <HiPause size={18} />
        </div>
        <HiForward size={20} />
      </div>
    </div>
  );
}

export default function LoginShowcase() {
  return (
    <div className="relative flex h-full min-h-[560px] flex-col justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 px-5 py-12 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex justify-center"
        >
          <NowPlayingCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-14 text-center"
        >
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Everything you need to listen together
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Built for friends who share the same playlist.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.6, ease }}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-medium text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/50">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}