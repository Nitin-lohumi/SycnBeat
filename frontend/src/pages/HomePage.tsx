import { motion } from "framer-motion";
import { HiOutlinePlus, HiOutlineUserGroup } from "react-icons/hi2";
import Container from "../components/layout/Container";
import { useMe } from "../hooks/useAuth";
import { ease } from "../lib/motion";

const cards = [
  {
    icon: HiOutlinePlus,
    title: "Create a room",
    desc: "Start a listening session and invite your friends.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Your friends",
    desc: "See who is online and what they are listening to.",
  },
];

export default function HomePage() {
  const { data: user } = useMe();
  const firstName = user?.name.split(" ")[0];

  return (
    <Container className="py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-2 text-white/50">What are we listening to today?</p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-white/10 bg-white/3 p-6 transition-colors hover:border-white/20"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
              <Icon size={20} />
            </div>
            <p className="mt-4 font-medium">{title}</p>
            <p className="mt-1 text-sm text-white/50">{desc}</p>
            <p className="mt-4 text-xs text-white/30">Coming soon</p>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
