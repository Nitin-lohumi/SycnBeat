import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth_routes";
import userRoutes from "./routes/user_routes";
import friendRoutes from "./routes/friend_routes";
import notificationRoutes from "./routes/notification_routes";
import musicRoutes from "./routes/music_routes";
import playlistRoutes from "./routes/playlist_routes";
import likeRoutes from "./routes/like_routes";
import { requireAuth } from "./middlewares/auth.middleware";
import { me } from "./controllers/auth_controller";
import { initSocket } from "./socket";
import { stream } from "./controllers/music_controller";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
// Public on purpose: <audio> requests may not carry cookies cross-site, and it only redirects.
app.get("/api/music/stream/:source/:sourceId", stream);

app.use(requireAuth);

app.get("/api/auth/me", me);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/likes", likeRoutes);

app.use(errorHandler);

// Express aur Socket.io ek hi HTTP server (same port) share karte hain
const server = createServer(app);
initSocket(server);

server.listen(env.PORT, () => console.log(`Server running on ${env.PORT} 🚀`));
