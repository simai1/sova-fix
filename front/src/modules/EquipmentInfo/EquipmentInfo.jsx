import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { useContext, useEffect, useRef, useState} from "react";
import DataContext from "../../context";
import styles from "./EquipmentInfo.module.scss"
import { TestDataTable, tableHeaderEquipmentInfo } from "./dataEquipmentInfo";
import { use } from "echarts";
import { useLocation, useNavigate } from "react-router-dom";
import { GetOneEquipment, GetQrEquipment, UpdateEquipment, UpdatePhotoEquipment } from "../../API/API";
import { saveAs } from "file-saver";

function EquipmentInfo() {
    const { context } = useContext(DataContext);
    const location = useLocation();

     // Получаем query-параметры из строки запроса
    const [idEquipment, setIdEquipment] = useState(null);
    const getData = () =>{
        const queryParams = new URLSearchParams(location.search);
        setIdEquipment(queryParams.get("idEquipment"));
        context.setSelectEquipment(queryParams.get("idEquipment"))
    } 

    useEffect(() => {
        getData()
    },[])

    useEffect(() => {
        context.GetDataEquipment(idEquipment)   
    },[idEquipment])

    const getBgColorlastTOHuman = (lastTOHuman) => {   
        
        if(lastTOHuman){
            // Преобразуем дату из формата DD.MM.YY в объект Date
            const [day, month, year] = lastTOHuman?.split('.').map(Number); // Разбиваем строку на части
            const formattedDate = new Date(`20${year}`, month - 1, day); // Создаем объект Date (добавляем "20" для года)

            // Проверяем, что дата корректна
            if (isNaN(formattedDate.getTime())) {
            console.error("Некорректная дата:", lastTOHuman);
            return "Некорректная дата";
            }

            const currentDate = new Date(); // текущая дата

            // Вычисляем разницу в днях
            const diffInMs = formattedDate - currentDate;
            const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)); // округляем до ближайшего большего числа

            // Определяем статус в зависимости от разницы
            if (diffInDays === 0) {
            return "Провести ТО"; 
            } else if (diffInDays > 7) {
            return "ТО проведено"; 
            } else if (diffInDays >= 1 && diffInDays <= 7) {
            return "Запланируйте ТО"; 
            } else if (diffInDays < 0) {
            return "Необходимо ТО"; 
            }
        }
       
      };
        const fileInputRef = useRef(null); // Для управления выбором файла
       // Обработка загрузки файла
       
        const handleFileUpload = () => {
            if (fileInputRef.current) {
            fileInputRef.current.click(); // Открытие окна выбора файла
            }
        };

        const handleFileChange = (e) => {
            const file = e.target.files[0];
            if (file) {
            setSelectedFile(file); // Сохраняем выбранный файл
            }
        };
        const [selectedFile, setSelectedFile] = useState(null); // Хранение выбранного файла
        const [popUpPhoto, setPopUpPhoto] = useState(false)
        const submitPhoto = () =>{
            const formData = new FormData();
            formData.append("file", selectedFile);
            UpdatePhotoEquipment(idEquipment, formData).then((response) => {
                if(response?.status === 200){
                    setSelectedFile(null)
                    setPopUpPhoto(false)
                    context.GetDataEquipment(idEquipment);
                }
            })
        }

    const getQRCodeEquipment = () => {
        GetQrEquipment(idEquipment).then((response) => {
            if (response?.status === 200) {
              const imageUrl = `${process.env.REACT_APP_API_URL}/uploads/${response.data}`;
              const fileName = `QRCode_${context.dataEquipment?.name}.svg`;
        
              // Скачиваем файл
              fetch(imageUrl)
                .then((res) => res.blob())
                .then((blob) => {
                  saveAs(blob, fileName);
                })
                .catch((error) => console.error("Ошибка скачивания изображения:", error));
            }
          });
    }

    return ( 
        
        <main className={styles.EquipmentInfo}>
            <div className={styles.EquipmentInfoBlockTopButton}>
                <button>Экспорт</button>
                <button onClick={() => {getQRCodeEquipment()}}>Сгенерировать QR-код</button>
                <button onClick={() => {context.setPopUp("PopUpEditEquipment")}}>Редактировать</button>
            </div>     
            <div className={styles.EquipmentblockInfo}>
                <section className={styles.EquipmentSectionInfoFirst}>
                    <div className={styles.EquipmentblockInfoFirst}>
                        <div className={styles.EquipmentImg}>
                            <div className={styles.EquipmentImgInner}>
                                {!popUpPhoto ? <img className={styles.EquipmentImgInnerEdit} onClick={() => {setPopUpPhoto(!popUpPhoto)}} src="/img/edit.svg" /> : <img className={styles.EquipmentImgInnerEditClose}  onClick={() => {setPopUpPhoto(!popUpPhoto); setSelectedFile(null)}} src="/img/x.svg" />}
                                <img className={styles.EquipmentImgInnerPhotoOrig} src={context.dataEquipment?.photo ? `${process.env.REACT_APP_API_URL}/uploads/${context.dataEquipment?.photo}` : "/img/noimage.jpg"}/>
                            </div>
                            {popUpPhoto &&
                                <div className={styles.pupUpFirstContainerInfo}>
                                 {/* Загрузка файла */}
                                <div className={styles.pupUpFirstContainerInfoFile}>
                                        <div className={styles.pupContainerInfoTitleFile}>
                                        <p>Загрузить фото: {selectedFile?.name  || "Файл не выбран" }</p>
                                        </div>
                                        <button onClick={handleFileUpload} className={styles.uploadButton}>Выбрать файл</button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                        <div className={styles.savePhotoButton}>
                                            <button onClick={() => submitPhoto()}>Сохранить</button>
                                        </div>
                                </div>
                            </div>
                            }
                        </div>
                        <div className={styles.paramInfoContainer}>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Категория:</p>
                                <p className={styles.DataInfo}>{context.dataEquipment?.category}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Название:</p>
                                <p className={styles.DataInfo}>{context.dataEquipment?.name}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Статус:</p>
                                <p className={styles.DataInfo}>{getBgColorlastTOHuman(context.dataEquipment?.nextTOHuman)}</p>
                            </div>
                            <div className={styles.marginInfoAll}>
                                <p className={styles.paramInfoGray}>Объект: {context.dataEquipment?.object}</p>
                            </div>
                            <div className={styles.marginInfoAll}>
                                <p className={styles.paramInfoGray}>Подразделение: {context.dataEquipment?.unit}</p> 
                            </div>
                            <div >
                                <button className={styles.button} onClick={()=>   context.setPopUp("PopUpNewTO")}>Проведено ТО</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.EquipmentblockInfoSecond}>
                    <div className={styles.paramInfoContainer}>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Количество проведенных ТО:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.count}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Общая стоимость проведенного ТО:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.avgCost}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Средняя стоимость проведения ТО:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.cost}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Период обслуживания: каждые:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.supportFrequency}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Дата последнего ТО:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.lastTOHuman}</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Дата следующего ТО:</p>
                                <p className={styles.paramInfoSecond}>{context.dataEquipment?.nextTOHuman}</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className={styles.InfoSecodSection}>
                    <div className={styles.HistoryTo}>
                            <div className={styles.TitleSecondBlock}>
                                <p>История ТО</p>
                            </div>
                            <div>
                                <UniversalTable  
                                    tableName="table10"
                                    tableHeader={tableHeaderEquipmentInfo}
                                    tableBody={context?.dataEquipment?.history}
                                    selectFlag={false}
                                    FilterFlag={false}
                                    heightTable={365}
                                />
                            </div>
                    </div>
                    {/* <div className={styles.CommentTo}>
                        <div className={styles.TitleSecondBlock}>
                            <p>Комментарии</p>
                        </div>
                        <div className={styles.CommentToBlock}>

                        </div>
                    </div> */}
                </section>
            </div> 
        </main>  
     );
}

export default EquipmentInfo;