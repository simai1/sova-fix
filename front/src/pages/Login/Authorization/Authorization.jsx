import React, { useEffect, useState } from "react";
import styles from "./Authorization.module.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { LoginFunc } from "../../../API/API";

// Хоистим из handleLogin: регэксп без флага /g, пересоздавать его
// на каждую попытку входа незачем.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function Authorization() {
  const { context } = React.useContext(DataContext);
  const [errorAuth, setErrorAuth] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [approvedMessage, setApprovedMessage] = useState("");

  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    login: "",
    password: "",
  });
  // rememberMe — UX-маркер «помнить выбор» восстанавливается из localStorage,
  // чтобы при возврате на форму чекбокс был выставлен. Никаких токенов
  // в localStorage не лежит — только этот булев флажок (см. API.js).
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("rememberMe") === "true"
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleLogin = async () => {
    setErrorAuth("");
    let formIsValid = true;
    if (!EMAIL_REGEX.test(formData.login)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        login: "Введите корректный email",
      }));
      formIsValid = false;
    }
    if (formData.password.length < 5 || formData.password.length > 20) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: "Пароль должен быть от 5 до 20 символов",
      }));
      formIsValid = false;
    }

    if (!formIsValid) return;

    try {
      const resp = await LoginFunc(formData, rememberMe);
      if (resp?.status !== 200) {
        setErrorAuth("Неверный логин или пароль");
        return;
      }
      if (resp?.data?.userId != null) {
        context.setActivateId(resp?.data?.userId);
        navigate("/Activate");
        return;
      }
      context.setDataUsers(resp);
      // userData пишется в sessionStorage внутри LoginFunc — здесь не дублируем.
      const role = resp?.data?.user?.role;
      context?.setDataTableHomePage([]);
      if (role === "CONTRACTOR") {
        navigate("/contractor/requests");
      } else if (role === "CUSTOMER") {
        navigate("/customer/requests");
      } else {
        navigate("/");
      }
    } catch (err) {
      // F-H2: backend для login возвращает единый 401 «Неверный логин или пароль»
      // даже для web-self-reg pending-юзера (!isActivated && pendingVerifyToken) —
      // иначе разные статусы позволяют валидировать существование email.
      // Pending-flow ведётся в отдельной странице после /auth/register-public
      // (см. Pending.jsx), не через login-ошибку.
      const status = err?.response?.status ?? err?.status;
      const serverMessage = err?.response?.data?.message ?? err?.data?.message;
      if (!err?.response) {
        // Запрос не дошёл до сервера (нет сети, CORS, сервер недоступен) —
        // это не повод обвинять логин/пароль пользователя.
        setErrorAuth("Сервер недоступен. Проверьте подключение к интернету.");
      } else if (status === 429) {
        setErrorAuth(serverMessage || "Слишком много попыток. Попробуйте позже");
      } else if (status >= 500) {
        setErrorAuth("Ошибка на стороне сервера. Попробуйте позже.");
      } else if (status === 401) {
        setErrorAuth("Неверный логин или пароль");
      } else {
        setErrorAuth(serverMessage || "Не удалось войти. Попробуйте ещё раз.");
      }
    }
  };

  useEffect(() => {
    context.setTableData([]);
    context.settableHeader(tableHeadAppoint);
    context.setSelectedTable("Заявки");
    context.setDataAppointment([])
  }, []);

  useEffect(() => {
    if (location.state?.approvedLogin) {
      setFormData((prev) => ({ ...prev, login: location.state.approvedLogin }));
      setApprovedMessage("Регистрация одобрена. Войдите в аккаунт.");
    }
  }, [location.state]);

  // Считаем сообщение баннера один раз вместо четырёх Object.values(errors)
  // в разметке ниже. Приоритет — ошибка входа, затем первая ошибка поля.
  const fieldError = Object.values(errors).find((error) => error);
  const bannerMessage = errorAuth || fieldError;

  return (
    <div className={styles.AuthorRegistrar}>
      <div>
        <div className={styles.box}>
          <div className={styles.text_Logo}>
            <img src="./img/SOVA.jpg" className={styles.LogoAuth} />
          </div>

          <div className={styles.container}>
            <h2>Вход в аккаунт</h2>
            {approvedMessage && (
              <p style={{ color: "green", textAlign: "center", margin: 0 }}>
                {approvedMessage}
              </p>
            )}
            <input
              type="text"
              placeholder="Логин"
              name="login"
              value={formData.login}
              onChange={handleInputChange}
              style={{ borderColor: errors.login ? "red" : "" }}
            />
            <input
              type="password"
              placeholder="Пароль"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{ borderColor: errors.password ? "red" : "" }}
            />
            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkbox} aria-hidden="true" />
              Запомнить меня
            </label>
            <button className={styles.button} onClick={handleLogin}>
              Войти
            </button>
            <Link to={'/Authorization/Register'} className={styles.resetPassword}>Регистрация</Link>
            <Link to={'/reset-password-request'} className={styles.resetPassword}>Забыли пароль?</Link>
          </div>
        </div>
        <div
          className={`${styles.ErrorLogin} ${bannerMessage ? styles.visible : ""}`}
          style={{ opacity: bannerMessage ? 1 : 0 }}
        >
          {bannerMessage ? <p>{bannerMessage}</p> : null}
        </div>

      </div>
    </div>
  );
}

export default Authorization;
