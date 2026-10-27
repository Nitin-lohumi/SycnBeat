export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Pick<User, "id" | "name" | "username" | "avatarUrl">;
