import React, { useEffect, useState } from "react";
import styles from "./Authorization.module.scss";
import { useNavigate } from "react-router-dom"
import DataContext from "../../../context";
import { tableHeadAppoint } from "../../../components/Table/Data";
import { LoginFunc } from "../../../API/API";
function Authorization() {
  const { context } = React.useContext(DataContext);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = () => {
    LoginFunc(formData).then((resp) => {
      if (resp.status === 200) {
        if(resp.data.userId != null || resp.data.userId != undefined){
          context.setActivateId(resp.data.userId)
          navigate("/Activate");
        }else{
          context.setDataUsers(resp);
          navigate("/AdminPage");
        }
      }    
    });
    console.log(formData);
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
          <h2>Вход в аккаунт</h2>
          <input
            type="text"
            placeholder="Логин"
            name="login"
            value={formData.login}
            onChange={handleInputChange}
          />
          <input
            type="password"
            placeholder="Пароль"
            name="password"
            value={formData.password}
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

export default Authorization;
