import catchAsync from '../utils/catchAsync';
import apiKeyService from '../services/apiKey.service';

const registerApiKey = catchAsync(async (req, res) => {
    const key = await apiKeyService.registerApiKey();
    res.json({ key: key });
});

export default {
    registerApiKey,
};
