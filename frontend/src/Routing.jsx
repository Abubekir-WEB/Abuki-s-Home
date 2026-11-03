import {Routes,Route} from 'react-router-dom'
import Login from './component/Login';
import Posts from './component/Posts';
import SignUp from './component/SignUp';
import Inbox from './component/Inbox'
import Messaging from './component/Messaging'
import Notification from './component/Notifications';
import UploadFile from './component/UploadFile';
import Follow from './component/Follow';
import Profile from './component/Profile'
function Routing(){
    return (
    <>
    <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/posts' element={<Posts/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/notification' element={<Notification/>}/>
        <Route path='/chat/:userid' element={<Inbox/>}/>
        <Route path='/uploadfile' element={<UploadFile/>}/>
         <Route path='/messaging' element={<Messaging/>}/>
         <Route path='/follow' element={<Follow/>}/>

         <Route path='/profile/:userid' element={<Profile/>}/>
    </Routes>
    </>
    )
}
export default Routing;