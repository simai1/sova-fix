import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';

const setRole = catchAsync(async (req, res) => {
    const { role, userId } = req.body;
    await userService.setRole(role, userId);
    res.json({ status: 'OK' });
});

export default {
    setRole,
};
