import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ComingSoon from "./pages/ComingSoon";
import FriendsPage from "./pages/FriendsPage";
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
              { path: "rooms", element: <ComingSoon title="Rooms" /> },
              { path: "friends", element: <FriendsPage /> },
              { path: "playlists", element: <ComingSoon title="Playlists" /> },
            ],
          },
        ],
      },
      { path: "login", element: <LoginPage /> },
      { path: "*", element: <div>404 Not Found</div> },
    ],
  },
]);
