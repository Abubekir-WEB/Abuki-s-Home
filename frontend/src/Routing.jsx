
import { Routes, Route } from "react-router-dom";

import Login from "./component/Login";
import SignUp from "./component/SignUp";
import AppLayout from "./component/AppLayout";

import Posts from "./component/Posts";
import Inbox from "./component/Inbox";
import Messaging from "./component/Messaging";
import Notification from "./component/Notifications";
import UploadFile from "./component/UploadFile";
import Follow from "./component/Follow";
import Profile from "./component/Profile";
import TrendingDetails from "./component/TrendingDetail";

function Routing() {
    return (
        <Routes>
            {/* Pages without the sidebar */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Pages with the persistent sidebar */}
            <Route element={<AppLayout />}>
                <Route path="/posts" element={<Posts />} />
                <Route path="/notification" element={<Notification />} />
                <Route path="/chat/:userid" element={<Inbox />} />
                <Route path="/uploadfile" element={<UploadFile />} />
                <Route path="/messaging" element={<Messaging />} />
                <Route path="/follow" element={<Follow />} />
                <Route path="/trending/:hashtag" element={<TrendingDetails />} />
                <Route path="/profile/:userid" element={<Profile />} />
            </Route>
        </Routes>
    );
}

export default Routing;
