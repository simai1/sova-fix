import React, { useEffect, useState } from "react";
import styles from "./Authorization.module.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { LoginFunc } from "../../../API/API";

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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.login)) {
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
      const resp = await LoginFunc(formData);
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
      // даже если pendingApproval=true — иначе разные статусы позволяют валидировать
      // существование email. Pending-flow ведётся в отдельной странице после
      // /auth/register-public (см. Pending.jsx), не через login-ошибку.
      const status = err?.response?.status ?? err?.status;
      const serverMessage = err?.response?.data?.message ?? err?.data?.message;
      if (status === 429) {
        setErrorAuth(serverMessage || "Слишком много попыток. Попробуйте позже");
      } else {
        setErrorAuth(serverMessage || "Неверный логин или пароль");
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
            <Link to={'/reset-password-request'} className={styles.resetPassword}>Забыли пароль?</Link>
            <button className={styles.button} onClick={handleLogin}>
              Войти
            </button>
            <Link to={'/Authorization/Register'} className={styles.resetPassword}>Регистрация</Link>
          </div>
        </div>
        <div
  className={`${styles.ErrorLogin} ${
    errorAuth || Object.values(errors).some((error) => error)
      ? styles.visible
      : ""
  }`}
  style={{ opacity: errorAuth || Object.values(errors).some((error) => error) ? 1 : 0 }}
>
  {errorAuth ? (
    <p>{errorAuth}</p>
  ) : Object.values(errors).some((error) => error) ? (
    <p>{Object.values(errors).find((error) => error)}</p>
  ) : null}
</div>

      </div>
    </div>
  );
}

export default Authorization;
