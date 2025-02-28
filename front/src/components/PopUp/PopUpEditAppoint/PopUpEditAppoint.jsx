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
import { funFixEducator } from "../../../UI/SamplePoints/Function";
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
    { id: 5, name: "Выезд без выполнения" },
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

  const planCompleteDate = dataApStart?.planCompleteDateRaw;
  const DateplanCompleteDate = planCompleteDate ? new Date(dataApStart?.planCompleteDateRaw).toISOString().split("T")[0] : '';

  useEffect(() => {
    if (dataApStart) {
      setdataApointment({
        contractorId: dataApStart?.contractor?.id,
        builder: dataApStart?.builder,
        status: dataApStart?.status,
        planCompleteDate:  DateplanCompleteDate,
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

   //!При обновлении обновляет только 1 запись 
   const UpdateRequest = (updatedRequest) => {
    const editAppoint = funFixEducator(updatedRequest)
    const updatedDataTable = context.dataTableHomePage.map((item) =>
      item.id === editAppoint.id ? editAppoint : item
    );
    context.setDataTableHomePage(updatedDataTable);
  };

  const EditAppoint = () => {
    const urgencyName = getUrgencyNameById(dataApointment.urgency);
    const newplanCompleteDate = new Date(dataApointment.planCompleteDate);

    const updatedDataApointment = { ...dataApointment, urgency: urgencyName, planCompleteDate: newplanCompleteDate };
    ReseachDataRequest(selectId, updatedDataApointment).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(selectId).then((resp) => {
          if(resp?.status === 200){
              UpdateRequest(resp?.data)
              context.setPopUp(null);
            }
          })
        }
      else {
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
    fileInputRef.current.click();
  };

 
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const maxSizeInMB = 50;
        const fileSizeInMB = file.size / (1024 * 1024); // Конвертация в МБ
        if (fileSizeInMB > maxSizeInMB) {
            event.target.value = null; // Очистка инпута
            alert("Ошибка: размер файла превышает 50 МБ.");
            return; // Прерываем выполнение функции
        }

        const formData = new FormData();
        formData.append("requestId", idRequest); // Добавляем requestId
        formData.append("file", file); // Добавляем файл
        setCommentPhotoApi(formData)
            .then((resp) => {
                if (resp?.status === 200) {
                    updGetData(idRequest);
                    context.UpdateTableReguest(1);
                    event.target.value = null; // Очистка инпута
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
  const isVideo = (fileName) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
    return videoExtensions.some(ext => fileName.endsWith(ext));
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
              idRequest={idRequest}
              handleListData={handleListData}
              name="contractorId"
              updGetData={updGetData}
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
            <Input
              Textlabel={"Плановая дата выполнения"}
              handleInputChange={handleInputChange}
              name="planCompleteDate"
              type="date"
              value={dataApointment.planCompleteDate}
            />
          </div>
          <div className={styles.SecondBlock}>
          <div className={styles.commentBlock}>
  {dataApStart?.commentAttachment ? (
    isVideo(dataApStart.commentAttachment) ? (
      <div className={styles.soursBg}>
        <video
          onClick={(e) => {
            e.preventDefault(); // Prevent the modal from closing
            e.stopPropagation();
            openModal(`${process.env.REACT_APP_API_URL}/uploads/${dataApStart.commentAttachment}`);
          }}
          style={{ cursor: "pointer" }}
          className={styles.videoTable}
        >
          <source src={`${process.env.REACT_APP_API_URL}/uploads/${dataApStart.commentAttachment}`} />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : (
      <img
        src={`${process.env.REACT_APP_API_URL}/uploads/${dataApStart.commentAttachment}`}
        alt="Uploaded file"
        onClick={() => openModal(`${process.env.REACT_APP_API_URL}/uploads/${dataApStart.commentAttachment}`)}
        style={{ cursor: "pointer" }}
        className={styles.imgTable}
      />
    )
  ) : (
    <img
      src={notPhoto}
      alt="Uploaded file"
      onClick={() => openModal(notPhoto)}
      style={{ cursor: "pointer" }}
      className={styles.imgTable}
    />
  )}
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
                <button onClick={handleButtonClick}>Добавить медиафайл</button>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }} // Hide the input
                  accept=".jpg, .jpeg, .png, .mp4" // Only allow image files
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
        <div className={styles.modal}>
      <span className={styles.close} onClick={closeModal}>&times;</span>
      {isVideo(modalImage) ? (
        <video
          controls
          className={styles.modalContent}
          src={modalImage}
          alt="Full size video"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div onClick={closeModal}>

        <img
          className={styles.modalContent}
          src={modalImage}
          alt="Full size"
        />
        </div>
      )}
    </div>
      )}
    </PopUpContainer>
  );
}

export default PopUpEditAppoint;
