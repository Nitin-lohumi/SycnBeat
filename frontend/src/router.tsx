import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ComingSoon from "./pages/ComingSoon";
import FriendsPage from "./pages/FriendsPage";
import SongsPage from "./pages/SongsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistPage, { LikedSongsPage } from "./pages/PlaylistPage";
import { EditPlaylistPage, NewPlaylistPage } from "./pages/PlaylistBuilderPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: "songs", element: <SongsPage /> },
              { path: "playlists", element: <PlaylistsPage /> },
              { path: "playlists/new", element: <NewPlaylistPage /> },
              { path: "playlists/liked", element: <LikedSongsPage /> },
              { path: "playlists/:id", element: <PlaylistPage /> },
              { path: "playlists/:id/edit", element: <EditPlaylistPage /> },
              { path: "rooms", element: <ComingSoon title="Rooms" /> },
              { path: "friends", element: <FriendsPage /> },
            ],
          },
        ],
      },
      { path: "login", element: <LoginPage /> },
      { path: "*", element: <div>404 Not Found</div> },
    ],
  },
]);
