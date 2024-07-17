// PopUpNewClient.js
import React, { useEffect, useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { Register, SetcontractorRequest } from "../../../API/API";
import List from "../../../UI/List/List";
import ListInput from "../../../UI/ListInput/ListInput";

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

  const DataStatus = [
    {id:1, name:"Новая заявка"},
    {id:2, name:"В работе"},
    {id:3, name:"Выполнена"},
    {id:4, name:"Неактуальна"},
    {id:5, name:"Принята"},
  ];

  const DataUrgency = [
    {id:1, name:"В течении часа"},
    {id:2, name:"В течении текущего дня"},
    {id:3, name:"В течении 3-х дней"},
    {id:4, name:"В течении недели"},
    {id:5, name:"ВЫПОЛНИТЬ СЕГОДНЯ"},
    {id:6, name:"Маршрут"},
    {id:7, name:"Выполнено"}
  ];

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
   const handleListData = (name, value) => { 
        setdataApointment((prevState) => ({ ...prevState, [name]: value }));
    };

  const EditAppoint = () => {
   console.log(dataApointment)
   SetcontractorRequest(dataApointment).then((resp) => {
    if (resp.status === 200) {
      context.UpdateTableReguest(1);
    }else{
        alert("Заполните правльно все поля!")
    }
  });
   }
  
   
  return (
    <PopUpContainer width={true} title={"Редактирование заказа"} mT={75}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>        
          <ListInput
            Textlabel={"Исполнитель"}
            handleListData={handleListData}
            name="contractor"
            dataList={context.dataContractors}
            value={dataApointment.contractor}
          />
           <Input
            Textlabel={"Подрядчик"}
            handleInputChange={handleInputChange}
            name="builder"
            placeholder="ООО стройдвор"
            value={dataApointment.builder}
          />
          <ListInput
            Textlabel={"Статус заявки"}
            handleListData={handleListData}
            name="status"
            dataList={DataStatus}
            value={dataApointment.status}
          />
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
            <Input
            Textlabel={"Описание проблемы"}
            handleInputChange={handleInputChange}
            name="problemDescription"
            placeholder=""
            type = "textArea"
            value={dataApointment.problemDescription}
          />
            <ListInput
            Textlabel={"Порядок маршрута"}
            handleListData={handleListData}
            name="urgency"
            dataList={DataUrgency}
            value={dataApointment.urgency}
          />
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
