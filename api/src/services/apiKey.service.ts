import ApiKey from '../models/apiKey';

const registerApiKey = async (): Promise<string> => {
    const apiKey = await ApiKey.create();
    return apiKey.key;
};

export default {
    registerApiKey,
};
