import axios from "axios";
const server = "http://localhost:3000";

//! Запрос на авторизацию
export const LoginFunc = async (UserData) => {
  try {
    const response = await axios.post(`${server}/auth/login`, UserData);
    const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
    return userData;
  } catch (error) {
    alert("Пользователь не найден!");
  }
};

//!полуение всех заявок
export const GetAllRequests = async () => {
  try {
    const response = await axios.get(`${server}/requests`);
    return response;
  } catch (error) {
    alert("Ошибка при получении заявок!");
  }
};

//!изменение статуса заявки
export const SetStatusRequest = async (data) => {
  try {
    const response = await axios.patch(`${server}/requests/set/status`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении статуса заявки!");
  }
};

