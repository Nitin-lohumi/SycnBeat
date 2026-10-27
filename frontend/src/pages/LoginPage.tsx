import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { motion, MotionConfig, type Variants } from "framer-motion";
import { Navigate } from "react-router-dom";
import { FaHeadphones } from "react-icons/fa6";
import { useLoginWithGoogle, useMe } from "../hooks/useAuth";
import LoginShowcase from "../components/auth/LoginShowcase";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LoginPage() {
  const { data: user } = useMe();
  const login = useLoginWithGoogle();
  const [googleError, setGoogleError] = useState(false);

  const btnWrapRef = useRef<HTMLDivElement>(null);
  const [btnWidth, setBtnWidth] = useState(320);

  useEffect(() => {
    const el = btnWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width / 10) * 10;
      setBtnWidth(Math.min(400, Math.max(200, w)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (user) return <Navigate to="/" replace />;

  const errorMsg = googleError
    ? "Google sign-in was cancelled. Please try again."
    : login.isError
      ? "Something went wrong. Please try again."
      : null;

  const year = new Date().getFullYear();

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col bg-black text-white lg:grid lg:grid-cols-[minmax(400px,1fr)_3fr]">
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-md flex-col px-6 py-6 sm:px-8 sm:py-8 lg:min-h-dvh lg:max-w-none lg:px-7 lg:py-5"
        >
          <motion.div variants={item} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500">
              <FaHeadphones size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              SyncBeat
            </span>
          </motion.div>

          <div className="flex flex-col pt-10 pb-8 lg:flex-1 lg:justify-center lg:py-12">
            <motion.h1
              variants={item}
              className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[2.75rem]"
            >
              Listen together,
              <br />
              <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                in perfect sync.
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-4 text-[15px] leading-relaxed text-white/50"
            >
              Create a room, invite your friends and vibe to the same track at
              the exact same second.
            </motion.p>

            <motion.div variants={item} className="mt-10">
              <p className="mb-3 text-sm font-medium text-white/70">
                Sign in to continue
              </p>

              <div
                ref={btnWrapRef}
                className={`w-full max-w-[400px] transition-opacity ${login.isPending ? "pointer-events-none opacity-50" : ""}`}
              >
                <GoogleLogin
                  key={btnWidth}
                  width={String(btnWidth)}
                  onSuccess={(res) => {
                    setGoogleError(false);
                    if (res.credential) login.mutate(res.credential);
                  }}
                  onError={() => setGoogleError(true)}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                />
              </div>

              {login.isPending && (
                <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Signing you in…
                </p>
              )}

              {errorMsg && (
                <p className="mt-4 text-sm text-red-400">{errorMsg}</p>
              )}

              <p className="mt-6 max-w-[400px] text-xs leading-relaxed text-white/30">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </motion.div>
          </div>

          <motion.p
            variants={item}
            className="hidden text-xs text-white/30 lg:block"
          >
            © {year} SyncBeat
          </motion.p>
        </motion.section>

        <section className="px-4 pb-4 lg:p-4">
          <LoginShowcase />
        </section>

        <p className="py-6 text-center text-xs text-white/30 lg:hidden">
          © {year} SyncBeat
        </p>
      </main>
    </MotionConfig>
  );
}
