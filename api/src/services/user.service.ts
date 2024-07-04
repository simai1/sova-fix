import User from "../models/user";

const getUserById = async (userId: string): Promise<User | null>  => {
    return User.findByPk(userId);
};

const getUserByEmail = async (login: string): Promise<User | null> => {
    return User.findOne({ where: { login } });
};

export default {
    getUserById,
    getUserByEmail,
};
