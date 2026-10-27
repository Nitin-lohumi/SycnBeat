import { Link } from "react-router-dom";
import { HiOutlineUserPlus } from "react-icons/hi2";
import HeaderPopover, { PanelHeader } from "../../../components/layout/HeaderPopover";
import { useCounts } from "../../notifications/hooks";
import { useFriendRequests } from "../hooks";
import FriendsFinder from "./FriendsFinder";

export default function FriendRequestsMenu() {
  const { data: counts } = useCounts();

  return (
    <HeaderPopover label="Friends" icon={HiOutlineUserPlus} badge={counts?.friendRequests ?? 0}>
      {(close) => <FriendsPanel onNavigate={close} />}
    </HeaderPopover>
  );
}

function FriendsPanel({ onNavigate }: { onNavigate: () => void }) {
  const requests = useFriendRequests();

  return (
    <>
      <PanelHeader
        title="Friends"
        loading={requests.isFetching && !requests.isPending}
        action={
          <Link
            to="/friends"
            onClick={onNavigate}
            className="text-xs text-violet-300 transition-colors hover:text-violet-200"
          >
            See all
          </Link>
        }
      />
      <div className="overflow-y-auto">
        <FriendsFinder />
      </div>
    </>
  );
}
