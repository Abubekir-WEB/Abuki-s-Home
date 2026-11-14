
import { Outlet } from "react-router-dom";
import TrendingTopics from "./TrendingTopics";
import WhoToFollow from "./WhoToFollow";
import "./AppLayout.css";

function AppLayout() {
    return (
        <div className="app-layout">

            <main className="app-main-content">
                <Outlet />
            </main>

            <aside className="app-sidebar">
                <TrendingTopics />
                <WhoToFollow />
            </aside>

        </div>
    );
}

export default AppLayout;
