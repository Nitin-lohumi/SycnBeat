import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/layout/Logo";

const UPDATED = "October 28, 2026";
const CONTACT = "nitinlohumi@gmail.com";

function Layout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-white/40">Last updated: {UPDATED}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/70 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
        <div className="mt-12 flex gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/login" className="hover:text-white">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Layout title="Privacy Policy">
      <p>SyncBeat lets you listen to music with friends in real time. This page explains what we collect and why.</p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>From your Google account: your name, email address and profile picture, used to create your account and show you to friends.</li>
          <li>What you create in the app: friends, playlists, liked songs, rooms, and messages you send.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To sign you in and keep you signed in (secure, http-only cookies).</li>
          <li>To show your profile to your friends and run features like rooms and chat.</li>
        </ul>
        <p className="mt-2">We do not sell your data, show ads, or share it with third parties for marketing.</p>
      </section>
      <section>
        <h2>Third-party services</h2>
        <ul>
          <li>Google Sign-In for login.</li>
          <li>Jamendo for music search and streaming.</li>
          <li>Our hosting and database providers, which store data only to run the app.</li>
        </ul>
      </section>
      <section>
        <h2>Room chat</h2>
        <p>Messages inside a room are kept only while the room is live and are not saved. Direct messages between friends are saved so you can read them later.</p>
      </section>
      <section>
        <h2>Deleting your data</h2>
        <p>Email us at <a href={`mailto:${CONTACT}`} className="text-violet-300 hover:underline">{CONTACT}</a> and we will delete your account and its data.</p>
      </section>
    </Layout>
  );
}

export function TermsPage() {
  return (
    <Layout title="Terms of Service">
      <p>By using SyncBeat you agree to these terms.</p>
      <section>
        <h2>Using the app</h2>
        <ul>
          <li>Be respectful in rooms and chats. No harassment, spam or illegal content.</li>
          <li>You are responsible for what you post and share.</li>
          <li>We may remove content or accounts that break these rules.</li>
        </ul>
      </section>
      <section>
        <h2>Music</h2>
        <p>Music is provided by Jamendo under their licenses. SyncBeat does not own the music it plays.</p>
      </section>
      <section>
        <h2>No warranty</h2>
        <p>SyncBeat is a personal project provided "as is". Features may change or stop working at any time.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p><a href={`mailto:${CONTACT}`} className="text-violet-300 hover:underline">{CONTACT}</a></p>
      </section>
    </Layout>
  );
}
