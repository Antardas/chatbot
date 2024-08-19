import express, { Router } from 'express';
import chatController from '../controllers/chat';
import multer from 'multer';
const files = multer();

const router: Router = express.Router();

// router.route('/').post(chatController.initialize);
router.route('/chat/image').post(chatController.image);
router.route('/chat/text').post(chatController.text);
export default router;
