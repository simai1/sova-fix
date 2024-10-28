// PopUpNewClient.js
import React, { useEffect, useRef, useState } from "react";
import styles from "./PopUpEditAppoint.module.scss";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import Input from "../../../UI/Input/Input";
import DataContext from "../../../context";
import {
  GetObjectsAll,
  GetOneRequests,
  Register,
  ReseachDataRequest,
  SetcontractorRequest,
  setCommentPhotoApi,
} from "../../../API/API";
import List from "../../../UI/List/List";
import ListInput from "../../../UI/ListInput/ListInput";
import notPhoto from "./../../../assets/images/notPhoto.png";
function PopUpEditAppoint(props) {
  const { context } = React.useContext(DataContext);
  const [dataApStart, setDataApStart] = useState(null);
  const [dataObject, setDataObject] = useState([]);
  const [idRequest, setIdRequest] = useState(null);
  const [dataApointment, setdataApointment] = useState({
    contractorId: "",
    builder: "",
    status: "",
    // unit:"",
    objectId: "",
    objectName: "",
    problemDescription: "",
    urgency: "",
    repairPrice: "",
    comment: "",
    // legalEntity:"",
  });
  const [selectId, setSelectId] = useState(null);
  const DataStatus = [
    { id: 1, name: "Новая заявка" },
    { id: 2, name: "В работе" },
    { id: 3, name: "Выполнена" },
    { id: 4, name: "Неактуальна" },
    { id: 5, name: "Принята" },
  ];

  const DataUrgency = [
    { id: 1, name: "В течении часа" },
    { id: 2, name: "В течении текущего дня" },
    { id: 3, name: "В течении 3-х дней" },
    { id: 4, name: "В течении недели" },
    { id: 5, name: "Маршрут" },
    { id: 6, name: "Выполнено" },
  ];

  const updGetData = (id) => {
    GetOneRequests(id).then((response) => {
      if (response?.status === 200) {
        setDataApStart(response.data);
      }
    });
  };

  useEffect(() => {
    setSelectId(context.moreSelect[0] || context.selectedTr);
    // GetOneRequests(context.moreSelect[0] || context.selectedTr).then(
    //   (response) => {
    //     if (response?.status === 200) {
    //       setDataApStart(response.data);
    //     }
    //   }
    // );
    updGetData(context.moreSelect[0] || context.selectedTr);
    GetObjectsAll().then((response) => {
      setDataObject(response.data);
    });

    setIdRequest(context.moreSelect[0] || context.selectedTr);
  }, []);

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
  };
  const getUrgencyNameById = (id) => {
    const urgencyItem = DataUrgency.find((item) => item.id === id);
    return urgencyItem ? urgencyItem.name : id;
  };

  const EditAppoint = () => {
    const urgencyName = getUrgencyNameById(dataApointment.urgency);
    const updatedDataApointment = { ...dataApointment, urgency: urgencyName };

    ReseachDataRequest(selectId, updatedDataApointment).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
        context.setPopUp(null);
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

  // const handleFileChange = (event) => {
  //   const file = event.target.files[0];
  //   if (file && file.type.startsWith('image/')) {
  //     // Here you can handle the file upload to the server
  //     console.log("file", file)
  //       const dataFile = [
  //         {
  //           requestId: idRequest,
  //           file: file
  //         }
  //       ]

  //       console.log('dataFile:', dataFile);
  //       setCommentPhotoApi(dataFile).then((resp)=>{
  //         console.log(resp)
  //       })

  //   } else {
  //     alert('Please select an image file.');
  //   }
  // };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      // Создаем объект FormData
      const formData = new FormData();
      formData.append("requestId", idRequest); // Добавляем requestId
      formData.append("file", file); // Добавляем файл
      console.log("formData", formData);
      console.log("file", file);

      // Отправка данных на сервер
      setCommentPhotoApi(formData)
        .then((resp) => {
          console.log("Response from server:", resp);
          if (resp?.status === 200) {
            updGetData(idRequest);
          }
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });
    } else {
      alert("Please select an image file.");
    }
  };

  const [modalImage, setModalImage] = useState(null);
  const openModal = (src) => {
    setModalImage(src);
  };

  const closeModal = () => {
    setModalImage(null);
  };
  console.log("dataApointment", dataApointment);
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
              <div
                className={styles.PhotoImg}
                onClick={() =>
                  openModal(
                    dataApStart?.commentAttachment
                      ? `${process.env.REACT_APP_API_URL}/uploads/${dataApStart?.commentAttachment}`
                      : notPhoto
                  )
                }
              >
                <img
                  src={
                    dataApStart?.commentAttachment
                      ? `${process.env.REACT_APP_API_URL}/uploads/${dataApStart?.commentAttachment}`
                      : notPhoto
                  }
                  alt="Preview"
                />
              </div>

              <div>
                <Input
                  Textlabel={"Комментарий"}
                  handleInputChange={handleInputChange}
                  name="comment"
                  type="textArea"
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
                  style={{ display: "none" }} // Hide the input
                  accept="image/*" // Only allow image files
                />
              </div>
            </div>
            <Input
              Textlabel={"Описание проблемы"}
              handleInputChange={handleInputChange}
              name="problemDescription"
              placeholder="Не работает лампа от мухоловки"
              type="textArea"
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
