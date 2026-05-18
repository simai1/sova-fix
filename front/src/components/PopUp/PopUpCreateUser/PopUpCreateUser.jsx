import React, { useState } from "react";
import styles from "./PopUpCreateUser.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register } from "../../../API/API";

function PopUpCreateUser() {
  const { context } = React.useContext(DataContext);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [dataApointment, setdataApointment] = useState({
    login: "",
    role: "",
  });

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
    if (name === "login") {
      const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      setIsEmailValid(isValid);
    }
  };

  const canSubmit = isEmailValid && Boolean(dataApointment.role);

  const CreateNewClient = () => {
   Register({ login: dataApointment.login, role: Number(dataApointment.role) }).then((resp)=>{
    if(resp?.status === 200){
      context.setPopUp("PopUpGoodMessage")
      context.setPopupGoodText("Пользователь успешно создан!")
      context.UpdateTableReguest(2);
    }
   })
  };

  return (
    <PopUpContainer width={true} title={"Добавление пользователя"} mT={200}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>
        <Input
            Textlabel={"E-mail"}
            handleInputChange={handleInputChange}
            name="login"
            regex={/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/}
            placeholder="aaa@gmail.com"
          />
          <select
            value={dataApointment.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
          >
            <option value="" disabled>Выберите роль...</option>
            <option value="2">Администратор</option>
            <option value="3">Заказчик</option>
            <option value="4">Исполнитель</option>
            <option value="5">Наблюдатель</option>
          </select>
        </div>
      </div>
      <div className={styles.button}>
        <button className={styles.buttonSave} onClick={CreateNewClient} disabled={!canSubmit} style={{ backgroundColor: canSubmit ? "#FFE20D" : "#B7AB9E", cursor: canSubmit ? "pointer" : "not-allowed" }}>
          Добавить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpCreateUser;
