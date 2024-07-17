// PopUpNewClient.js
import React, { useEffect, useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register } from "../../../API/API";

function PopUpEditAppoint(props) {
  const { context } = React.useContext(DataContext);
  const [dataApStart, setDataApStart] = useState(null)
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


  useEffect(()=>{
    context.dataApointment.map((el)=>{
        if(  el?.id === context?.selectedTr){
            setDataApStart(el)
        }
    })
  },[])

  useEffect(() => {
    if (dataApStart) {
      setdataApointment({
        contractor: dataApStart.contractor.name,
        builder: dataApStart.builder,
        status: dataApStart.status,
        unit: dataApStart.unit,
        object: dataApStart.object,
        problemDescription: dataApStart.problemDescription,
        urgency: dataApStart.urgency,
        repairPrice: dataApStart.repairPrice,
        comment: dataApStart.comment,
        legalEntity: dataApStart.legalEntity,
      });
    }
  }, [dataApStart]);

  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };

  const EditAppoint = () => {
   console.log(dataApointment)
   }
  

  return (
    <PopUpContainer width={true} title={"Редактирование заказа"} mT={75}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>
        {/* //!сделать список */}
        {/* <Input
            Textlabel={"Исполнитель"}
            handleInputChange={handleInputChange}
            name="contractor"
            placeholder="Иванов Иван Иванович"
            value={dataApointment.contractor}
          /> */}
           <Input
            Textlabel={"Подрядчик"}
            handleInputChange={handleInputChange}
            name="builder"
            placeholder="ООО стройдвор"
            value={dataApointment.builder}
          />
            {/* //!сделать список */}
           {/* <Input
            Textlabel={"Статус заявки"}
            handleInputChange={handleInputChange}
            name="status"
            placeholder="Выполнена"
            value={dataApointment.status}
          /> */}
           <Input
            Textlabel={"Подразделение"}
            handleInputChange={handleInputChange}
            name="unit"
            placeholder=""
            value={dataApointment.unit}
          />
           <Input
            Textlabel={"Объект"}
            handleInputChange={handleInputChange}
            name="object"
            placeholder=""
            value={dataApointment.object}
          />
          {/* //!сделать textaera */}
            <Input
            Textlabel={"Описание проблемы"}
            handleInputChange={handleInputChange}
            name="problemDescription"
            placeholder=""
            type = "textArea"
            value={dataApointment.problemDescription}
          />
          {/* //!сделать список */}
            {/* <Input
            Textlabel={"Срочность"}
            handleInputChange={handleInputChange}
            name="urgency"
            placeholder=""
            value={dataApointment.urgency}
          /> */}
          {/* ////!сделать маленький инпут и список */}
            {/* <Input
            Textlabel={"Порядок маршрута"}
            handleInputChange={handleInputChange}
            name="itineraryOrder"
            placeholder=""
            value={dataApointment.itineraryOrder}
          /> */}
            <Input
            Textlabel={"Бюджет ремонта (Рублей)"}
            handleInputChange={handleInputChange}
            name="repairPrice"
            type="number"
            placeholder=""
            value={dataApointment.repairPrice}
          />
            <Input
            Textlabel={"Комментарий"}
            handleInputChange={handleInputChange}
            name="comment"
            placeholder=""
            value={dataApointment.comment}
          />
            <Input
            Textlabel={"Юр. Лицо"}
            handleInputChange={handleInputChange}
            name="legalEntity"
            placeholder=""
            value={dataApointment.legalEntity}
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
