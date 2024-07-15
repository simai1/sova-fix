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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = () => {
    if (formData.password === formData.resetpassword) {
      const data = {
        name:formData.FIO,
        password: formData.password
      }

      ActivateFunc(data, context?.activateId ).then((resp)=>{
        if(resp.status === 200){
          context.setDataUsers(resp);
          navigate("/AdminPage");
        }
      })


    } else {
      alert("Пароли не совпадают!");
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
          <input
            type="text"
            placeholder="ФИО"
            name="FIO" // Corrected the name attribute
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
            name="resetpassword"
            value={formData.resetpassword}
            onChange={handleInputChange}
          />
          <button className={styles.button} onClick={handleLogin}>
            Зарегистрировать
          </button>
        </div>
      </div>
    </div>
  );
}

export default Activate;
