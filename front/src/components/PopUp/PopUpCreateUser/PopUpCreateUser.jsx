import React, { useState } from "react";
import styles from "./PopUpCreateUser.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register } from "../../../API/API";

function PopUpCreateUser() {
  const { context } = React.useContext(DataContext);
  const [dataApointment, setdataApointment] = useState({
    login: "",
  });
  const [inputValidity, setInputValidity] = useState({
    login: true,
  });

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };

  const setInputValidityState = (name, isValid) => {
    setInputValidity((prevState) => ({ ...prevState, [name]: isValid }));
  };

  const CreateNewClient = () => {
    Register(dataApointment).then((resp) => {
      if (resp) {
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Заявка успешно принята!");
        context.UpdateTableReguest(2);
      }
    });
  };

  const isFormValid = Object.values(inputValidity).every(Boolean);

  return (
    <PopUpContainer width={true} title={"Добавление пользователя"} mT={200}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>
          <Input
            Textlabel={"E-mail"}
            handleInputChange={handleInputChange}
            name="login"
            regex={/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/}
            placeholder="aaa@gmail.com"
            setInputValidity={setInputValidityState} // pass the function to update validity
          />
        </div>
      </div>
      <div className={styles.button}>
        <button
          className={styles.buttonSave}
          onClick={CreateNewClient}
          disabled={!isFormValid} // disable button if form is not valid
        >
          Сохранить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpCreateUser;
