import React, { useEffect, useState } from "react";
import styles from "./Activate.module.scss";
import { useNavigate } from "react-router-dom"
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { LoginFunc } from "../../../API/API";
function Activate() {
  const { context } = React.useContext(DataContext);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
  };

  const handleLogin = () => {
   console.log(formData)
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
          <input
            type="text"
            placeholder="ФИО"
            name="login"
            value={formData.FIO}
            onChange={handleInputChange}
          />
          <input
            type="password"
            placeholder="Пароль"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
          />
            <input
            type="password"
            placeholder="Повторите пароль"
            name="password"
            value={formData.resetpassword}
            onChange={handleInputChange}
          />
            <button className={styles.button} onClick={handleLogin}>
              Войти
            </button>
        </div>
      </div>
    </div>
  );
}

export default Activate;
