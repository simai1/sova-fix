import axios from "axios";
const http = axios.create({
  withCredentials: true,
});
const server = "http://localhost:3000";

const REFRESH_INTERVAL = 1500000; // 25 минут 1500000
let refreshTokensTimeout;


//! ЭТА ШЛЯПА НЕ РАБОТАЕТ РЕФРЕШ
export const refreshTokens = async () => {
  try {
    const response = await http.get(`${server}/auth/refresh`,);
    const { NewaccessToken, NewrefreshToken, ...userData } = response.data;
    localStorage.setItem("accessToken", NewaccessToken);
    localStorage.setItem("refreshToken", NewrefreshToken);
    localStorage.setItem("userData", JSON.stringify(userData));

    return response
  } catch (error) {
    console.error("Тоекны не обновлены!");
  }
};

const refreshTokensTimer = () => {
  clearTimeout(refreshTokensTimeout);
  if (localStorage.getItem("accessToken") === "null") {
    return;
  }
  const lastRefreshTime = localStorage.getItem("lastRefreshTime");
  const currentTime = Date.now();
  let timeRemaining;
  if (lastRefreshTime) {
    const nextRefreshTime = parseInt(lastRefreshTime) + REFRESH_INTERVAL;
    timeRemaining = Math.max(0, nextRefreshTime - currentTime);
  } else {
    timeRemaining = 0;
  }
  refreshTokensTimeout = setTimeout(() => {
    refreshTokens();
    localStorage.setItem("lastRefreshTime", Date.now());
    refreshTokensTimer();
  }, timeRemaining);

  localStorage.setItem("refreshTokensInterval", refreshTokensTimeout);
};

window.addEventListener("load", () => {
  refreshTokensTimer();
});

window.addEventListener("unload", () => {
  clearTimeout(refreshTokensTimeout);
});


//! Запрос на авторизацию
export const LoginFunc = async (UserData) => {
  try {
    const response = await http.post(`${server}/auth/login`, UserData);
    const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      refreshTokensTimer();
    return response;
  } catch (error) {
    alert("Пользователь не найден!");
  }
};

//! регистрация аккаунта
export const Register = async (UserData) => {
  try {
    const response = await http.post(`${server}/auth/register`, UserData);
    return response;
  } catch (error) {
    alert("Возникла ошибка при создании пользователя!");
  }
};

//! активация аккаунта
export const ActivateFunc = async (UserData, idUser) => {
  try {
    const response = await http.post(`${server}/auth/activate/${idUser}`, UserData);
    const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      refreshTokensTimer();
    return response;
  } catch (error) {
    alert("Возникла ошибка при создании пользователя!");
  }
};


export const LogOut = async () => {
  try {
    const response = await http.post(
      `${server}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        withCredentials: true
      }
    );
    return response;
  } catch (error) {
    // Handle the error here
  }
};



//!полуение всех заявок
export const GetAllRequests = async () => {
  try {
    const response = await http.get(`${server}/requests`);
    return response;
  } catch (error) {
    alert("Ошибка при получении заявок!");
  }
};

//!полуение всех Пользователей
export const GetAllUsers = async () => {
  try {
    const response = await http.get(`${server}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    alert("Ошибка при получении заявок!");
  }
};
export const GetAllСontractors = async () => {
  try {
    const response = await http.get(`${server}/contractors`);
    return response;
  } catch (error) {
    alert("Ошибка при получении заявок!");
  }
};

//!изменение статуса заявки
export const SetStatusRequest = async (data) => {
  try {
    const response = await http.patch(`${server}/requests/set/status`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении статуса заявки!");
  }
};

//!изменение contractor заявки
export const SetcontractorRequest = async (data) => {
  try {
    const response = await http.patch(`${server}/requests/set/contractor`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении статуса заявки!");
  }
};

//! удалить заявку
export const DeleteRequest = async (id) => {
  try {
    const response = await http.delete(`${server}/requests/${id}/delete`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении заявки!");
  }
};

//! Получение карты пользователя
export const GetContractorsItenerarity = async (id) => {
  try {
    const response = await http.get(`${server}/contractors/${id}/itinerary`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении заявки!");
  }
};


//! Изменение заявки
export const ReseachDataRequest = async (id,data) => {
  try {
    const response = await http.put(`${server}/requests/${id}/update`, data);
    return response;
  } catch (error) {
    alert("Ошибка при изменении заявки!");
  }
};


//! удаление поьзователя
export const DeleteUserFunc = async (id) => {
  try {
    const response = await http.delete(`${server}/users/${id}`);
    return response;
  } catch (error) {
    alert("Ошибка при удалении пользователя!");
  }
};
