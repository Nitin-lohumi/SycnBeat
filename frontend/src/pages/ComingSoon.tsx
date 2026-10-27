import { motion } from "framer-motion";
import Container from "../components/layout/Container";
import { ease } from "../lib/motion";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <Container className="py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-white/50">Coming soon.</p>
      </motion.div>
    </Container>
  );
}
