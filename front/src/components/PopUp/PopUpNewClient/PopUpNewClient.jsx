// PopUpNewClient.js
import React, { useState } from "react";
import styles from "./PopUpNewClient.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";

function PopUpNewClient() {
  const { context } = React.useContext(DataContext);
  const [dataNewClient, setdataNewClient] = useState({
    fio: "",
    login: "",
    phoneNumber: "",
    additionalPhoneNumber: "",
  });

  const handleInputChange = (name, value) => {
    setdataNewClient((prevState) => ({ ...prevState, [name]: value }));
  };

  const CreateNewClient = () => {
   console.log(dataNewClient)
  };

  return (
    <PopUpContainer width={true} title={"Новый клиент"} mT={200}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>
          <Input
            Textlabel={"Фио"}
            handleInputChange={handleInputChange}
            name="fio"
            placeholder="Иванов Иван Иванович"
          />
          <Input
            Textlabel={"Телефон"}
            handleInputChange={handleInputChange}
            name="phoneNumber"
            regex={/^(\+7|8)[0-9]{10}$/} 
            placeholder="+79508999999"
          />
          <Input
            Textlabel={"Доп.Телефон"}
            handleInputChange={handleInputChange}
            name="additionalPhoneNumber"
            regex={/^(\+7|8)[0-9]{10}$/} 
            placeholder="+79508999999"
          />
          <Input
            Textlabel={"E-mail"}
            handleInputChange={handleInputChange}
            name="login"
            regex={/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/} 
            placeholder="aaa@gmail.com"
          />
          <Input
            Textlabel={"Наименование организации"}
            handleInputChange={handleInputChange}
            name="nameCompany"
            value={dataNewClient.nameCompany}
            placeholder={"ООО 'Тагмет'"}
          />
        </div>
        <div className={styles.popRigth}>
          <Input
            Textlabel={"Адрес клиента"}
            handleInputChange={handleInputChange}
            name="address"
            value={dataNewClient.address}
            placeholder={"Россия, Г.Таганрог ул..."}

          />
          <Input
            Textlabel={"ИНН"}
            handleInputChange={handleInputChange}
            name="inn"
            value={dataNewClient.inn}
            regex={/^\d{12}$/}
            placeholder="111111111111"     
          />
          <Input
            Textlabel={"К/С"}
            handleInputChange={handleInputChange}
            name="kc"
            value={dataNewClient.kc}
            regex={/^\d{9}$/}
            placeholder="332258769"
          />
          <Input
            Textlabel={"БИК"}
            handleInputChange={handleInputChange}
            name="bik"
            value={dataNewClient.bik}
            regex={/^\d{9}$/}
            placeholder="044525974"
          />
          <Input
            Textlabel={"КПП"}
            handleInputChange={handleInputChange}
            name="kpp"
            value={dataNewClient.kpp}
            regex={/^\d{9}$/}
            placeholder="332258769"
          />
        </div>
      </div>
      <div className={styles.button}>
        <button className={styles.buttonSave} onClick={CreateNewClient}>
          Добавить
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpNewClient;
