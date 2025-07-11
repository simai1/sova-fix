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
import { normalizeFileNames } from "../../Table/Data";
import PhotoAndVideoSlider from "../../../UI/PhotoAndVideoSlider/PhotoAndVideoSlider";
function PopUpEditAppoint(props) {
  const { context } = React.useContext(DataContext);
  const [dataApStart, setDataApStart] = useState(null);
  const [dataObject, setDataObject] = useState([]);
  const [idRequest, setIdRequest] = useState(null);
  const [dataApointment, setdataApointment] = useState({
    contractorId: "",
    builder: "",
    status: "",
    statusId: "",
    // unit:"",
    objectId: "",
    objectName: "",
    problemDescription: "",
    urgency: "",
    repairPrice: "",
    comment: "",
    // legalEntity:"",
    urgencyId: "",
    fileName: "",
  });
  const [selectId, setSelectId] = useState(null);
  const [parsedFiles, setParsedFiles] = useState(null)
  const [showSlider, setShowSlider] = useState(false)
  const [isAddFileAllow, setIsAddFileAllow] = useState(true)

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
    GetObjectsAll(`?userId=${JSON.parse(sessionStorage.getItem("userData"))?.user?.id}`).then((response) => {
      setDataObject(response.data);
    });

    setIdRequest(context.moreSelect[0] || context.selectedTr);
  }, []);

  const planCompleteDate = dataApStart?.planCompleteDateRaw;
  const DateplanCompleteDate = planCompleteDate ? new Date(dataApStart?.planCompleteDateRaw).toISOString().split("T")[0] : '';

  const getStatusValue = (statusNumber) => {
    const statusFromDb = context?.statusList.find(status => status.number === statusNumber)
    return statusFromDb;
  }

  useEffect(() => {
    if (dataApStart) {
      setdataApointment({
        contractorId: dataApStart?.contractor?.id,
        builder: dataApStart?.builder,
        status: getStatusValue(dataApStart?.status).number,
        statusId: dataApStart?.statusId,
        planCompleteDate:  DateplanCompleteDate,
        unit: dataApStart?.unit,
        objectId: dataApStart?.objectId,
        objectName: dataApStart?.object,
        problemDescription: dataApStart?.problemDescription,
        urgency: dataApStart?.urgency,
        repairPrice: dataApStart?.repairPrice,
        comment: dataApStart?.comment,
        legalEntity: dataApStart?.legalEntity,
        urgencyId: dataApStart?.urgencyId,
        fileName: dataApStart?.fileName
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
    if(name === "urgency") {
      const urgency = context?.urgencyList?.find(item => item.name === value)
      return setdataApointment((prevState) => ({ ...prevState, urgencyId: urgency?.id, urgency: urgency?.name }));
    }
    
    if(name === "status") {
      const status = context?.statusList?.find(item => item.id === value)
      return setdataApointment((prevState) => ({ ...prevState, statusId: status?.id, status: status.number }));
    }
    setdataApointment((prevState) => ({ ...prevState, [name]: value }));
  };
  const getObjectNameById = (id) => {
    const objectItem = dataObject.find((item) => item.id === id);
    return objectItem ? objectItem.name : id;
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
    const newplanCompleteDate = new Date(dataApointment.planCompleteDate);

    const updatedDataApointment = { ...dataApointment, planCompleteDate: newplanCompleteDate };
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
        alert("Заполните правильно все поля!");
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
    if (typeof fileName !== 'string') return false;
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
    return videoExtensions.some(ext => fileName.endsWith(ext));
  };
  const closeModal = () => {
    setModalImage(null);
  };

  const closeSlider = () => {
    setShowSlider(false);
  };

  useEffect(() => {
    const parsedFileNames = normalizeFileNames(dataApointment?.fileName)
    setParsedFiles(parsedFileNames)
    if(parsedFileNames.length === 5) {
      setIsAddFileAllow(false)
    } else {
      setIsAddFileAllow(true)
    }
  }, [dataApointment])

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
              dataList={context?.urgencyList}
              value={dataApointment.urgency}
              placeholder="Выберите срочность заявки"
              isActive={activeDropdown === "urgency"}
              toggleDropdown={() => toggleDropdown("urgency")}
            />
            <ListInput
              Textlabel={"Статус заявки"}
              handleListData={handleListData}
              name="status"
              dataList={context?.statusList}
              value={getStatusValue(dataApointment.status)?.name}
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
  {parsedFiles ? (
     isVideo(parsedFiles[parsedFiles?.length - 1]) ? (
      <div className={styles.soursBg}>
        <video
          onClick={(e) => {
            e.preventDefault(); // Prevent the modal from closing
            e.stopPropagation();
            if (parsedFiles?.length === 1 ) {
              return openModal(`${process.env.REACT_APP_API_URL}/uploads/${parsedFiles[parsedFiles?.length - 1]}`);
            }
            setShowSlider(true)
          }}
          style={{ cursor: "pointer" }}
          className={styles.videoTable}
        >
          <source src={`${process.env.REACT_APP_API_URL}/uploads/${parsedFiles[0]}`} />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : (
      <img
        src={`${process.env.REACT_APP_API_URL}/uploads/${parsedFiles[parsedFiles?.length - 1]}`}
        alt="Uploaded file"
        onClick={() => {
          if (parsedFiles?.length === 1 ) {
            return openModal(`${process.env.REACT_APP_API_URL}/uploads/${parsedFiles[parsedFiles?.length - 1]}`);
          }
          setShowSlider(true)
        }}
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
                {isAddFileAllow ? (<button onClick={handleButtonClick}>Добавить медиафайл</button>) : null}
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
      {showSlider && (
        <PhotoAndVideoSlider
          sliderPhotos={parsedFiles}
          closeSlider={closeSlider}
          initialIndex={parsedFiles.length - 1 }
        />
      )}
    </PopUpContainer>
  );
}

export default PopUpEditAppoint;
