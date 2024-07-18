import React, { useEffect, useState } from "react";
import styles from "./Activate.module.scss";
import { useNavigate } from "react-router-dom";
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { ActivateFunc, LoginFunc } from "../../../API/API";

function Activate() {
  const { context } = React.useContext(DataContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    FIO: "",
    password: "",
    resetpassword: "",
  });
  const [errors, setErrors] = useState({
    FIO: "",
    password: "",
    resetpassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "", // Reset the error message when the user starts typing
    }));
  };

  const handleLogin = () => {
    let formIsValid = true;

    if (formData.FIO.length < 3) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        FIO: "FIO must be at least 3 characters",
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

    if (formData.password !== formData.resetpassword) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        resetpassword: "Passwords do not match",
      }));
      formIsValid = false;
    }

    if (formIsValid) {
      const data = {
        name: formData.FIO,
        password: formData.password,
      };

      ActivateFunc(data, context?.activateId).then((resp) => {
        if (resp?.status === 200) {
          context.setDataUsers(resp);
          navigate("/AdminPage");
        }
      });
    }
  };

  useEffect(() => {
    context.setTableData([]);
    context.settableHeader(tableHeadAppoint);
    context.setSelectedTable("Заказы");
  }, []);

  return (
    <div className={styles.AuthorRegistrar}>
      <div className={styles.box}>
        <div className={styles.container}>
          <h2>Активация аккаунта</h2>
          <label>ФИО </label>
            <input
              type="text"
              placeholder="ФИО"
              name="FIO"
              value={formData.FIO}
              onChange={handleInputChange}
              style={{ borderColor: errors.FIO ? "red" : "" }}
            />
          {/* {errors.FIO && <div style={{ color: "red" }}>{errors.FIO}</div>} */}
          <label>Пароль </label>
          <input
            type="password"
            placeholder="Пароль"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            style={{ borderColor: errors.password ? "red" : "" }}
          />
          {/* {errors.password && <div style={{ color: "red" }}>{errors.password}</div>} */}
          <label>Повторите пароль </label>
          <input
            type="password"
            placeholder="Повторите пароль"
            name="resetpassword"
            value={formData.resetpassword}
            onChange={handleInputChange}
            style={{ borderColor: errors.resetpassword ? "red" : "" }}
          />
          {/* {errors.resetpassword && <div style={{ color: "red" }}>{errors.resetpassword}</div>} */}
          <button className={styles.button} onClick={handleLogin}>
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}

export default Activate;
