// PopUpNewClient.js
import React, { useEffect, useRef, useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import { GetObjectsAll, GetOneRequests, Register, ReseachDataRequest, SetcontractorRequest } from "../../../API/API";
import List from "../../../UI/List/List";
import ListInput from "../../../UI/ListInput/ListInput";
import notPhoto from "./../../../assets/images/notPhoto.png"
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
    objectName:"",
    problemDescription:"",
    urgency:"",
    repairPrice:"",
    comment:"",
    // legalEntity:"",
  });
const [selectId, setSelectId] = useState(null);
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
    
    setSelectId(context.moreSelect[0] || context.selectedTr)
    GetOneRequests(context.moreSelect[0] || context.selectedTr).then((response) => {
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
        objectId: dataApStart?.objectId,
        objectName: dataApStart?.object,
        problemDescription: dataApStart?.problemDescription,
        urgency: dataApStart?.urgency,
        repairPrice: dataApStart?.repairPrice,
        comment: dataApStart?.comment,
        legalEntity: dataApStart?.legalEntity,
      });
    }
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
    const getObjectNameById = (id) => {
        const objectItem = dataObject.find((item) => item.id === id);
        return objectItem ? objectItem.name : id;
    }
    const getUrgencyNameById = (id) => {
        const urgencyItem = DataUrgency.find((item) => item.id === id);
        return urgencyItem ? urgencyItem.name : id;
      };
    
      const EditAppoint = () => {
        const urgencyName = getUrgencyNameById(dataApointment.urgency);
        const updatedDataApointment = { ...dataApointment, urgency: urgencyName, };
      
        ReseachDataRequest(selectId, updatedDataApointment).then((resp) => {
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

        const fileInputRef = useRef(null);
      
      
        const handleButtonClick = () => {
          // Trigger the file input click
          fileInputRef.current.click();
        };
      
        const handleFileChange = (event) => {
          const file = event.target.files[0];
          if (file && file.type.startsWith('image/')) {
            // Here you can handle the file upload to the server
            console.log('Uploading file:', file);
            // Example: uploadFileToServer(file);
          } else {
            alert('Please select an image file.');
          }
        };

        const [modalImage, setModalImage] = useState(null);
        const openModal = (src) => {
          setModalImage(src);
        };
      
        const closeModal = () => {
          setModalImage(null);
        };
      

  return (
    <PopUpContainer width={true} title={"Редактирование заявки"} mT={75}>
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
       <ListInput
              Textlabel={"Объект"}
              handleListData={handleListData}
              name="objectId"
              dataList={dataObject}
              value={getObjectNameById(dataApointment.objectId)}
              placeholder="Выберите объект"
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
        </div>     
          <div className={styles.SecondBlock}>
          
          <div className={styles.commentBlock}>
          <div className={styles.PhotoImg}  onClick={() =>
                                openModal(
                                  // `${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`
                                  "https://i.pinimg.com/originals/f2/12/5b/f2125b2d520a66d8a28bccbcb8343324.jpg"
                                )
                              }>
            <img src={notPhoto} alt="Preview" />
          </div>

         
            <div>
              <Input
                  Textlabel={"Комментарий"}
                  handleInputChange={handleInputChange}
                  name="comment"
                  type = "textArea"
                  placeholder="Комментарий"
                  value={dataApointment.comment}
                />
            </div>
          </div>
          <div className={styles.addPhoto}>
            <div>
              <button onClick={handleButtonClick}>Добавить фотографию</button>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }} // Hide the input
                accept="image/*" // Only allow image files
              />
            </div>
          </div>
           <Input
            Textlabel={"Описание проблемы"}
            handleInputChange={handleInputChange}
            name="problemDescription"
            placeholder="Не работает лампа от мухоловки"
            type = "textArea"
            value={dataApointment.problemDescription}
          />
            <Input
            Textlabel={"Бюджет ремонта (Рублей)"}
            handleInputChange={handleInputChange}
            name="repairPrice"
            type="number"
            placeholder="3000"
            value={dataApointment.repairPrice}
          />
            
          </div>
        </div>
      </div>
      <div className={styles.button}>
        <button className={styles.buttonSave} onClick={EditAppoint}>
          Сохранить
        </button>
      </div>
      {modalImage && (
            <div className={styles.modal} onClick={closeModal}>
              <span className={styles.close}>&times;</span>
              <img
                className={styles.modalContent}
                src={modalImage}
                alt="Full size"
              />
            </div>
          )}
    </PopUpContainer>
  );
}

export default PopUpEditAppoint;
