// PopUpNewClient.js
import React, { useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register } from "../../../API/API";

function PopUpEditAppoint(props) {
  const { context } = React.useContext(DataContext);
  const [dataApointment, setdataApointment] = useState({
    contractor:"",
    builder:"",
    status:"",
    unit:"",
    object:"",
    problemDescription:"",
    urgency:"",
    repairPrice:"",
    comment:"",
    legalEntity:"",
  });

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };

  const EditAppoint = () => {
   console.log(dataApointment)
   }
  

  return (
    <PopUpContainer width={true} title={"Редактирование заказа"} mT={200}>
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
        <button className={styles.buttonSave} onClick={EditAppoint}>
          Сохранить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpEditAppoint;
