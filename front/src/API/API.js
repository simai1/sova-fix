import axios from "axios";
const server = "http://localhost:3000";

// const REFRESH_INTERVAL = 1500000; // 25 минут
// let refreshTokensTimeout;

// export const refreshTokens = async (accessToken, refreshToken) => {
//   try {
//     const response = await axios.post(
//       `${server}/auth/refresh`,
//       { refreshToken },
//       {
//         headers: {
//           Authorization: accessToken,
//         },
//       }
//     );
//     const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
//       response.data;
//     localStorage.setItem("accessToken", newAccessToken);
//     localStorage.setItem("refreshToken", newRefreshToken);
//   } catch (error) {
//     console.error("Тоекны не обновлены!");
//   }
// };

// const refreshTokensTimer = () => {
//   clearTimeout(refreshTokensTimeout);
//   if (localStorage.getItem("accessToken") === "null") {
//     return;
//   }
//   const lastRefreshTime = localStorage.getItem("lastRefreshTime");
//   const currentTime = Date.now();
//   let timeRemaining;
//   if (lastRefreshTime) {
//     const nextRefreshTime = parseInt(lastRefreshTime) + REFRESH_INTERVAL;
//     timeRemaining = Math.max(0, nextRefreshTime - currentTime);
//   } else {
//     timeRemaining = 0;
//   }
//   refreshTokensTimeout = setTimeout(() => {
//     refreshTokens(
//       localStorage.getItem("accessToken"),
//       localStorage.getItem("refreshToken")
//     );
//     localStorage.setItem("lastRefreshTime", Date.now());
//     refreshTokensTimer();
//   }, timeRemaining);

//   localStorage.setItem("refreshTokensInterval", refreshTokensTimeout);
// };

// window.addEventListener("load", () => {
//   refreshTokensTimer();
// });

// window.addEventListener("unload", () => {
//   clearTimeout(refreshTokensTimeout);
// });

//! Запрос на Выход
export const logout = async () => {
  const data = {refreshToken:localStorage.getItem("refreshToken")}
  console.log(data)
  try {
    const response = await axios.post(`${server}/auth/logout`, data);
   
    return response;
  } catch (error) {
    alert("Ошибка при выходе из системы !");
  }
};

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
