// PopUpNewClient.js
import React, { useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";

function PopUpEditAppoint() {
  const { context } = React.useContext(DataContext);
  const [dataApointment, setdataApointment] = useState({
    fio: "",
    login: "",
    phoneNumber: "",
    additionalPhoneNumber: "",
  });

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };

  const CreateNewClient = () => {
   console.log(dataApointment)
  };

  return (
    <PopUpContainer width={true} title={"Редактирование Заказа"} mT={200}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>
          asdasd
        </div>
      </div>
      <div className={styles.button}>
        <button className={styles.buttonSave} onClick={CreateNewClient}>
          Сохранить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpEditAppoint;
