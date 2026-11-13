import Posts from "./Posts";
import TrendingTopics from "./TrendingTopics";
import "./HomeLayout.css";

function HomeLayout() {
  return (
    <div className="home-layout">
      <main className="home-feed">
        <Posts />
      </main>

      <aside className="home-sidebar">
        <TrendingTopics />
      </aside>
    </div>
  );
}

export default HomeLayout;
