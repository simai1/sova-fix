// PopUpNewClient.js
import React, { useEffect, useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { GetObjectsAll, GetOneRequests, Register, ReseachDataRequest, SetcontractorRequest } from "../../../API/API";
import List from "../../../UI/List/List";
import ListInput from "../../../UI/ListInput/ListInput";

function PopUpEditAppoint(props) {
  const { context } = React.useContext(DataContext);
  const [dataApStart, setDataApStart] = useState(null)
  const [dataObject, setDataObject] = useState([]);
  const [dataApointment, setdataApointment] = useState({
    contractorId:"",
    builder:"",
    status:"",
    // unit:"",
    objectId:"",
    problemDescription:"",
    urgency:"",
    repairPrice:"",
    comment:"",
    // legalEntity:"",
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
    {id:5, name:"Маршрут"},
    {id:6, name:"Выполнено"}
  ];

  useEffect(()=>{
    // context.dataApointment.map((el)=>{
    //     if(  el?.id === context?.selectedTr){
    //         setDataApStart(el)
            
    //     }
    // })

    GetOneRequests(context?.selectedTr).then((response) => {
      if(response?.status === 200) {
        setDataApStart(response.data)
      }
    })
    GetObjectsAll().then((response) => {
      setDataObject(response.data);
    })
  },[])

  useEffect(() => {
    if (dataApStart) {
      setdataApointment({
        contractorId: dataApStart?.contractor?.id,
        builder: dataApStart?.builder,
        status: dataApStart?.status,
        unit: dataApStart?.unit,
        objectId: dataApStart?.object,
        problemDescription: dataApStart?.problemDescription,
        urgency: dataApStart?.urgency,
        repairPrice: dataApStart?.repairPrice,
        comment: dataApStart?.comment,
        legalEntity: dataApStart?.legalEntity,
      });
    }
    console.log("dataApStart", dataApStart)
  }, [dataApStart]);
//   const {
//     objectId,
//     problemDescription,
//     urgency,
//     repairPrice,
//     comment,
//     itineraryOrder,
//     contractorId,
//     status,
//     builder,
// } = req.body;
  const handleInputChange = (name, value) => {
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };
   const handleListData = (name, value) => { 
        setdataApointment((prevState) => ({ ...prevState, [name]: value }));
    };

    const getUrgencyNameById = (id) => {
        const urgencyItem = DataUrgency.find((item) => item.id === id);
        return urgencyItem ? urgencyItem.name : id;
      };
    
      const EditAppoint = () => {
        const urgencyName = getUrgencyNameById(dataApointment.urgency);
        const updatedDataApointment = { ...dataApointment, urgency: urgencyName, };
      
        ReseachDataRequest(context.selectedTr, updatedDataApointment).then((resp) => {
          if (resp?.status === 200) {
            context.UpdateTableReguest(1);
            context.setPopUp(null)
          } else {
            alert("Заполните правльно все поля!");
          }
        });
      };
  
      const [activeDropdown, setActiveDropdown] = useState(null);
      const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
      };
  return (
    <PopUpContainer width={true} title={"Редактирование заказа"} mT={75}>
      <div className={styles.popBox}>
        <div className={styles.popLeft}>   
        <div className={styles.FirstBlock}>
        <ListInput
        Textlabel={"Исполнитель"}
        handleListData={handleListData}
        name="contractorId"
        dataList={context.dataContractors}
        value={dataApointment.contractorId}
        placeholder="Выберите исполнителя"
        isActive={activeDropdown === "contractorId"}
        toggleDropdown={() => toggleDropdown("contractorId")}
      />
      <ListInput
        Textlabel={"Срочность"}
        handleListData={handleListData}
        name="urgency"
        dataList={DataUrgency}
        value={dataApointment.urgency}
        placeholder="Выберите срочность заявки"
        isActive={activeDropdown === "urgency"}
        toggleDropdown={() => toggleDropdown("urgency")}
      />
      <ListInput
        Textlabel={"Статус заявки"}
        handleListData={handleListData}
        name="status"
        dataList={DataStatus}
        value={dataApointment.status}
        placeholder="Выберите статус"
        isActive={activeDropdown === "status"}
        toggleDropdown={() => toggleDropdown("status")}
      />
           {/* <Input
            Textlabel={"Подразделение"}
            handleInputChange={handleInputChange}
            name="unit"
            placeholder="КЕКС"
            value={dataApointment.unit}
          /> */}
            <Input
            Textlabel={"Описание проблемы"}
            handleInputChange={handleInputChange}
            name="problemDescription"
            placeholder="Не работает лампа от мухоловки"
            type = "textArea"
            value={dataApointment.problemDescription}
          />
        </div>     
          <div className={styles.SecondBlock}>
          {/* <Input
            Textlabel={"Объект"}
            handleInputChange={handleInputChange}
            name="object"
            placeholder="Ворошиловский 53"
            value={dataApointment.object}
          /> */}
          <ListInput
              Textlabel={"Объект"}
              handleListData={handleListData}
              name="objectId"
              dataList={dataObject}
              value={dataApointment.objectId}
              placeholder="Выберите исполнителя"
              isActive={activeDropdown === "objectId"}
              toggleDropdown={() => toggleDropdown("objectId")}
            />
             <Input
            Textlabel={"Подрядчик"}
            handleInputChange={handleInputChange}
            name="builder"
            placeholder="Укажите подрядчика"
            value={dataApointment.builder}
          />
            <Input
            Textlabel={"Бюджет ремонта (Рублей)"}
            handleInputChange={handleInputChange}
            name="repairPrice"
            type="number"
            placeholder="3000"
            value={dataApointment.repairPrice}
          />
            <Input
            Textlabel={"Комментарий"}
            handleInputChange={handleInputChange}
            name="comment"
            type = "textArea"
            placeholder="Комментарий"
            value={dataApointment.comment}
          />
            {/* <Input
            Textlabel={"Юр. Лицо"}
            handleInputChange={handleInputChange}
            name="legalEntity"
            placeholder="Пекарь ООО"
            value={dataApointment.legalEntity}
          /> */}
          </div>
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
