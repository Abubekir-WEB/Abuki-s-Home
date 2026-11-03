import express from "express";
import signUp from '../controller/signUp.js';
import Profile from '../controller/Profile.js'
import Login from "../controller/Login.js";
import uploadfile,{getFile} from '../controller/posts.js'
import multer from 'multer'
import middleware from '../middleware/authmidlleware.js'
import Follow from "../controller/Follow.js";
import Follower from "../controller/Follower.js";
import { likePost, unlikePost } from "../controller/Likes.js";
import { viewPost } from "../controller/Views.js";
import { addComment, getComments } from "../controller/Comments.js";
import  getFollowingFeed  from "../controller/FollowingFeed.js";
const router=express.Router();



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });
router.post('/signup',signUp)
router.post('/login',Login)
router.post('/upload',upload.single('file'),middleware,uploadfile)
router.get('/getFile',middleware,getFile)
router.get('/profile/:userid',Profile)
router.post('/follow',middleware,Follow)
router.get('/follower',Follower);
router.post('/posts/:postId/like',middleware,likePost);
router.delete('/posts/:postId/like',middleware,unlikePost);
router.post("/posts/:postId/view", middleware, viewPost);
router.post("/posts/:postId/comments", middleware, addComment);
router.get("/posts/:postId/comments", getComments);

router.get(
    "/following-feed",
    middleware,
   getFollowingFeed
);

// router.get('/chat',Chat)
export default router