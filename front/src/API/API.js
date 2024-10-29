import axios from "axios";
const http = axios.create({
  withCredentials: true,
});
const server = process.env.REACT_APP_API_URL;
// const server = "http://localhost:3000";

const REFRESH_INTERVAL = 500000; // 15 минут 900000
let refreshTokensTimeout;

//!Рефреш токенов
export const refreshTokens = async () => {
  try {
    const response = await http.get(`${server}/auth/refresh`);
    console.log("response", response);
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    const { accessToken, refreshToken } = response.data; // Destructure the required data from the response

    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);

    return response;
  } catch (error) {
    console.error("Tokens were not updated!");
  }
};

//!таймер рефреша
const refreshTokensTimer = () => {
  clearTimeout(refreshTokensTimeout);
  if (sessionStorage.getItem("accessToken") === "null") {
    return;
  }
  const lastRefreshTime = sessionStorage.getItem("lastRefreshTime");
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
    sessionStorage.setItem("lastRefreshTime", Date.now());
    refreshTokensTimer();
  }, timeRemaining);

  sessionStorage.setItem("refreshTokensInterval", refreshTokensTimeout);
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
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    sessionStorage.setItem("userData", JSON.stringify(userData));
    refreshTokensTimer();
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      return false;
    }
  }
};

//! регистрация аккаунта
export const Register = async (UserData) => {
  try {
    const response = await http.post(`${server}/auth/register`, UserData, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Такой пользователь уже существует!");
      return false;
    }
  }
};

//! активация аккаунта
export const ActivateFunc = async (UserData, idUser) => {
  try {
    const response = await http.post(
      `${server}/auth/activate/${idUser}`,
      UserData
    );
    const { accessToken, refreshToken, ...userData } = response.data;
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    sessionStorage.setItem("userData", JSON.stringify(userData));
    refreshTokensTimer();
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      return 0;
    }
  }
};

export const LogOut = async () => {
  console.log(sessionStorage.getItem("accessToken"));
  try {
    const response = await http.post(
      `${server}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Возникла ошибка при выходе!");
    }
  }
};

//!полуение всех заявок
export const GetAllRequests = async (param) => {
  try {
    const response = await http.get(`${server}/requests${param}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении списка заявок!");
    }
  }
};

export const GetOneRequests = async (id) => {
  try {
    const response = await http.get(`${server}/requests/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении списка заявок!");
    }
  }
};

//!полуение всех Пользователей
export const GetAllUsers = async () => {
  try {
    const response = await http.get(`${server}/users`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении списка пользователей!");
    }
  }
};

export const GetOneUsers = async (id) => {
  try {
    const response = await http.get(`${server}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении списка пользователей!");
    }
  }
};

export const GetAllСontractors = async () => {
  try {
    const response = await http.get(`${server}/contractors`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении списка исполнителей!");
    }
  }
};

//!изменение статуса заявки
export const SetStatusRequest = async (data) => {
  try {
    const response = await http.patch(`${server}/requests/set/status`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при изменении статуса заявки!");
    }
  }
};

//!изменение contractor заявки
export const SetcontractorRequest = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/set/contractor`,
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при изменении исполнителя заявки!");
    }
  }
};

//! удалить заявку
export const DeleteRequest = async (id) => {
  try {
    const response = await http.delete(`${server}/requests/${id}/delete`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявки!");
    }
  }
};

//! Получение карты пользователя
export const GetContractorsItenerarity = async (id) => {
  try {
    const response = await http.get(`${server}/contractors/${id}/itinerary`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

//! Изменение заявки
export const ReseachDataRequest = async (id, data) => {
  try {
    const response = await http.patch(`${server}/requests/${id}/update`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при изменении заявки!");
    }
  }
};

//! удаление поьзователя
export const DeleteUserFunc = async (id) => {
  try {
    const response = await http.delete(`${server}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении пользователя!");
    }
  }
};

export const RemoveContractor = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/remove/contractor`,
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении исполнителя!");
    }
  }
};

export const SetRole = async (data) => {
  try {
    const response = await http.post(`${server}/users/setRole`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при смены роли!");
    }
  }
};

export const GetPhotoServer = async (id) => {
  try {
    const response = await http.get(`${server}/uploads/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const RejectActiveAccount = async (id) => {
  try {
    const response = await http.patch(`${server}/users/confirm/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

// legalEntities -------------------------------------------------------------------------------

export const GetlegalEntitiesAll = async () => {
  try {
    const response = await http.get(`${server}/legalEntities`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const GetlegalEntitiesOne = async (id) => {
  try {
    const response = await http.get(`${server}/legalEntities/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const DeletelegalEntities = async (id) => {
  try {
    const response = await http.delete(`${server}/legalEntities/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const CreateLegalEntities = async (data) => {
  try {
    const response = await http.post(`${server}/legalEntities`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const EditLegalEntities = async (data, id) => {
  try {
    const response = await http.patch(`${server}/legalEntities/${id}`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

// UNITS -------------------------------------------------------------------------------

export const GetUnitsAll = async () => {
  try {
    const response = await http.get(`${server}/units`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const GetUnitsOne = async (id) => {
  try {
    const response = await http.get(`${server}/units/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const DeleteUnit = async (id) => {
  try {
    const response = await http.delete(`${server}/units/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const CreateUnit = async (data) => {
  try {
    const response = await http.post(`${server}/units`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const EditUnit = async (data, id) => {
  try {
    const response = await http.patch(`${server}/units/${id}`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

// objects -------------------------------------------------------------------------------

export const GetObjectsAll = async () => {
  try {
    const response = await http.get(`${server}/objects`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const GetObjectsOne = async (id) => {
  try {
    const response = await http.get(`${server}/objects/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const DeleteObjects = async (id) => {
  try {
    const response = await http.delete(`${server}/objects/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const CreateObjects = async (data) => {
  try {
    const response = await http.post(`${server}/objects`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};
export const EditObjects = async (data, id) => {
  try {
    const response = await http.patch(`${server}/objects/${id}`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

// extContractors -------------------------------------------------------------------------------

export const GetextContractorsAll = async () => {
  try {
    const response = await http.get(`${server}/extContractors`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const GetextContractorsOne = async (id) => {
  try {
    const response = await http.get(`${server}/extContractors/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const DeleteextContractors = async (id) => {
  try {
    const response = await http.delete(`${server}/extContractors/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const CreateextContractors = async (data) => {
  try {
    const response = await http.post(`${server}/extContractors`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const EditExitContractors = async (data, id) => {
  try {
    const response = await http.patch(`${server}/extContractors/${id}`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const SetExtContractorsRequest = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/set/extContractor`,
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

export const DeleteExtContractorsRequest = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/remove/extContractor/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при получении карты пользователя!");
    }
  }
};

// Функции Массовых действий

//!удаление заявок

export const DeleteMoreRequest = async (data) => {
  try {
    const response = await http.post(`${server}/requests/delete/bulk`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявок!");
    }
  }
};

//!массовый статус
export const EditMoreStatusRequest = async (data) => {
  try {
    const response = await http.patch(`${server}/requests/status/bulk`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявок!");
    }
  }
};

//!массовый срочность
export const EditMoreUrgencyRequest = async (data) => {
  try {
    const response = await http.patch(`${server}/requests/urgency/bulk`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявок!");
    }
  }
};

//!массовый contractor
export const EditMoreContractorRequest = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/contractor/bulk`,
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявок!");
    }
  }
};

export const setCommentPhotoApi = async (data) => {
  try {
    const response = await http.patch(
      `${server}/requests/set/commentAttachment`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Обязательно указывайте тип содержимого
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error?.response?.status === 403) {
      window.location.href = `${process.env.REACT_APP_WEB_URL}/Authorization`;
    } else {
      console.log("Ошибка при удалении заявок!");
    }
  }
};
