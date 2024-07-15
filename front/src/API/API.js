import axios from "axios";
const server = "http://localhost:3000";

//! Запрос на авторизацию
export const LoginFunc = async (UserData) => {
  try {
    const response = await axios.post(`${server}/auth/login`, UserData);
    console.log("response", response)
    const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
    return response;
  } catch (error) {
    alert("Пользователь не найден!");
  }
};

//! регистрация аккаунта
export const Register = async (UserData) => {
  try {
    const response = await axios.post(`${server}/auth/register`, UserData);
    // const { accessToken, refreshToken, ...userData } = response.data;
    //   localStorage.setItem("accessToken", accessToken);
    //   localStorage.setItem("refreshToken", refreshToken);
    //   localStorage.setItem("userData", JSON.stringify(userData));
    return response;
  } catch (error) {
    alert("Возникла ошибка при создании пользователя!");
  }
};

//! активация аккаунта
export const ActivateFunc = async (UserData, idUser) => {
  try {
    const response = await axios.post(`${server}/auth/activate/${idUser}`, UserData);
    const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
    return response;
  } catch (error) {
    alert("Возникла ошибка при создании пользователя!");
  }
};

//! выход из аккаунта
export const LogOut = async (accessToken) => {
  try {
    const response = await axios.post(`${server}/auth/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response;
  } catch (error) {
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

//!полуение всех Пользователей
export const GetAllUsers = async (accessToken) => {
  try {
    const response = await axios.get(`${server}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response;
  } catch (error) {
    alert("Ошибка при получении заявок!");
  }
};
export const GetAllСontractors = async () => {
  try {
    const response = await axios.get(`${server}/contractors`);
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

//!изменение contractor заявки
export const SetcontractorRequest = async (data) => {
  try {
    const response = await axios.patch(`${server}/requests/set/contractor`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении статуса заявки!");
  }
};

//! удалить заявку
export const DeleteRequest = async (id) => {
  try {
    const response = await axios.delete(`${server}/requests/${id}/delete`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении заявки!");
  }
};

//! Получение карты пользователя
export const GetContractorsItenerarity = async (id) => {
  try {
    const response = await axios.get(`${server}/contractors/${id}/itinerary`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении заявки!");
  }
};


//! Изменение заявки
export const ReseachDataRequest = async (id,data) => {
  try {
    const response = await axios.put(`${server}/requests/${id}/update`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении заявки!");
  }
};


//! удаление поьзователя
export const DeleteUserFunc = async (id) => {
  try {
    const response = await axios.delete(`${server}/users/${id}`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении пользователя!");
  }
};
