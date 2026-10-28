import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RoomsPage from "./pages/RoomsPage";
import RoomPage from "./pages/RoomPage";
import MessagesPage from "./pages/MessagesPage";
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
              { path: "rooms", element: <RoomsPage /> },
              { path: "rooms/:id", element: <RoomPage /> },
              { path: "friends", element: <FriendsPage /> },
              { path: "messages/:id?", element: <MessagesPage /> },
            ],
          },
        ],
      },
      { path: "login", element: <LoginPage /> },
      { path: "*", element: <div>404 Not Found</div> },
    ],
  },
]);
