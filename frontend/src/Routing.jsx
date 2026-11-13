
import { Routes, Route } from 'react-router-dom';

import Login from './component/Login';
import HomeLayout from './component/HomeLayout';
import SignUp from './component/SignUp';
import Inbox from './component/Inbox';
import Messaging from './component/Messaging';
import Notification from './component/Notifications';
import UploadFile from './component/UploadFile';
import Follow from './component/Follow';
import Profile from './component/Profile';
import TrendingDetails from './component/TrendingDetail';

function Routing() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/posts" element={<HomeLayout />} />

            <Route path="/signup" element={<SignUp />} />

            <Route path="/notification" element={<Notification />} />

            <Route path="/chat/:userid" element={<Inbox />} />

            <Route path="/uploadfile" element={<UploadFile />} />

            <Route path="/messaging" element={<Messaging />} />

            <Route path="/follow" element={<Follow />} />

            {/* Trending topic details */}
            <Route
                path="/trending/:hashtag"
                element={<TrendingDetails />}
            />

            <Route path="/profile/:userid" element={<Profile />} />
        </Routes>
    );
}

export default Routing;
