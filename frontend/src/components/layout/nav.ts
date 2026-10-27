import {
  HiOutlineHome,
  HiOutlineMusicalNote,
  HiOutlineQueueList,
  HiOutlineRadio,
  HiOutlineUserGroup,
} from "react-icons/hi2";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: HiOutlineHome, end: true },
  { to: "/songs", label: "Songs", icon: HiOutlineMusicalNote, end: false },
  { to: "/friends", label: "Friends", icon: HiOutlineUserGroup, end: false },
  { to: "/playlists", label: "Playlists", icon: HiOutlineQueueList, end: false },
  { to: "/rooms", label: "Rooms", icon: HiOutlineRadio, end: false },
];
