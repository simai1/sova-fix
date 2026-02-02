import React, { useEffect, useState } from "react";
import styles from "./Authorization.module.scss";
import { Link, useNavigate } from "react-router-dom";
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { LoginFunc } from "../../../API/API";

function Authorization() {
  const { context } = React.useContext(DataContext);
  const [errorAuth, setErrorAuth] = useState(false);
  const navigate = useNavigate();

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

  const handleLogin = () => {
    let formIsValid = true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.login)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        login: "Please enter a valid email address",
      }));
      formIsValid = false;
    }
    if (formData.password.length < 5 || formData.password.length > 20) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: "Password must be between 5 and 20 characters",
      }));
      formIsValid = false;
    }

    if (formIsValid) {
      LoginFunc(formData).then((resp) => {
        if (resp?.status === 200) {
          if (resp?.data?.userId != null || resp?.data?.userId != undefined) {
            context.setActivateId(resp?.data?.userId);
            navigate("/Activate");
          } else {
            context.setDataUsers(resp);
            localStorage.setItem("userData", JSON.stringify(resp.data));
            navigate("/");
            context?.setDataTableHomePage([])
          }
        } else {
          setErrorAuth(true);
        }
      });
    }
  };

  useEffect(() => {
    context.setTableData([]);
    context.settableHeader(tableHeadAppoint);
    context.setSelectedTable("Заявки");
    context.setDataAppointment([])
  }, []);

  return (
    <div className={styles.AuthorRegistrar}>
      <div>
        <div className={styles.box}>
          <div className={styles.text_Logo}>
            <img src="./img/SOVA.jpg" className={styles.LogoAuth} />
          </div>

          <div className={styles.container}>
            <h2>Вход в аккаунт</h2>
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
  {(errorAuth || Object.values(errors).some((error) => error)) && (
    <p>Неверный логин или пароль!</p>
  )}
</div>

      </div>
    </div>
  );
}

export default Authorization;
