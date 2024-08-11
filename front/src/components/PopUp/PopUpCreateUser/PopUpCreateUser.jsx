// PopUpNewClient.js
import React, { useState } from "react";
import styles from "./PopUpCreateUser.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register } from "../../../API/API";

function PopUpCreateUser() {
  const { context } = React.useContext(DataContext);
  const [isInputValid, setIsInputValid] = useState(false);
  const [dataApointment, setdataApointment] = useState({
    login: "",
  });

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
    const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setIsInputValid(isValid);
  };

  const CreateNewClient = () => {
   Register(dataApointment).then((resp)=>{
    if(resp?.status === 200){
      context.setPopUp("PopUpGoodMessage")
      context.setPopupGoodText("Заявка успешно принята!")
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
        </div>
      </div>
      <div className={styles.button}>
        <button className={styles.buttonSave} onClick={CreateNewClient} disabled={!isInputValid} style={{ backgroundColor: isInputValid ? "#FFE20D" : "#B7AB9E", cursor: isInputValid ? "pointer" : "not-allowed" }}>
          Добавить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpCreateUser;
