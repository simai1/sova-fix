import { Router } from "express";
import passwordResetTokens from "../controllers/passwordResetTokens";


const router = Router()

router.route('/').post(passwordResetTokens.sendRequestToResetPassword)
router.post('/:tokenId', passwordResetTokens.resetPassword);

export default router;