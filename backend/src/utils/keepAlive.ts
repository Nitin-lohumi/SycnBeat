// Render's free plan sleeps after 15 min without traffic; a ping every 10 min keeps it awake.
export function keepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return;
  setInterval(() => {
    fetch(`${url}/health`).catch((e) => console.warn("[keep-alive] ping failed", e));
  }, 13 * 60_000);
}
