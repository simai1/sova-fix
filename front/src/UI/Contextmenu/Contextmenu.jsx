import React, { useContext, useEffect, useState } from 'react';
import styles from './Contextmenu.module.scss';
import arrowBottom from "./../../assets/images/arrow_bottom.svg";
import {CreateCopyRequest, DeleteMoreRequest, EditMoreContractorRequest, EditMoreStatusRequest, EditMoreUrgencyRequest, GetAllСontractors, GetOneRequests} from "./../../API/API";
import DataContext from '../../context';
import { funFixEducator } from '../SamplePoints/Function';
function Contextmenu(props) {
    const [cordX, setCordX] = useState(props?.X);
    const [cordY, setCordY] = useState(props?.Y);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showStatusUrgensy, setShovStatusUrgensy] = useState(false);
    const [showStatusContractor, setShovStatusContractor] = useState(false);
    const [dataConractor, setDataConractor] = useState([]);
    const { context } = useContext(DataContext);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCopy, setConfirmCopy] = useState(false);

    useEffect(() => {
        convertCoord(props?.X, props?.Y);
        GetAllСontractors().then((resp) => setDataConractor(resp.data));
    }, [props.X, props.Y]); // Update coordinates when props change

    const convertCoord = (X, Y) => {
        const menuWidth = 380;
        const menuHeight = 160;
        const SizeX = window.innerWidth;
        const SizeY = window.innerHeight;

        let newX = X;
        let newY = Y;

        // Adjust X coordinate if the menu would overflow the right edge
        if (SizeX - X < menuWidth) {
            newX = X - menuWidth;
        }

        // Adjust Y coordinate if the menu would overflow the bottom edge
        if (SizeY - Y < menuHeight) {
            newY = Y - menuHeight;
        }

        setCordX(newX);
        setCordY(newY);
    };

    const status = {
        1: "Новая заявка",
        2: "В работе",
        3: "Выполнена",
        4: "Неактуальна",
        5: "Выезд без выполнения",
    };

    const DataUrgency = [
        {id:1, name:"В течение часа"},
        {id:2, name:"В течение текущего дня"},
        {id:3, name:"В течение 3-х дней"},
        {id:4, name:"В течение недели"},
        {id:5, name:"Маршрут"},
        {id:6, name:"Выполнено"}
      ];

    const toggleStatusMenu = (action) => {
        setShovStatusUrgensy(false);
        setShovStatusContractor(false);
        setShowStatusMenu(false);
        setConfirmDelete(false);
        setConfirmCopy(false)
        switch (action) {
            case "status":
                setShowStatusMenu(!showStatusMenu);
                break;
            case "urgency":
                setShovStatusUrgensy(!showStatusUrgensy);
                break;
            case "executor":
                setShovStatusContractor(!showStatusContractor);
                break;
            case "delete":
                setConfirmDelete(!confirmDelete);
                break;
            case "copy":
                setConfirmCopy(!confirmCopy);
                break;
            default:
                break;
        }    
    };

    const UpdateRequests = (updatedRequests) => {
        // Обновляем каждую заявку в массиве
        const fixedRequests = funFixEducator(updatedRequests);
        const updatedDataTable = context.dataTableHomePage.map((item) => {
          const updatedRequest = fixedRequests.find((req) => req.id === item.id); // Ищем заявку по id
          return updatedRequest ? updatedRequest : item; // Заменяем, если есть обновление
        });
      
        // Обновляем состояние таблицы
        context.setDataTableHomePage(updatedDataTable);
      };

    const setStatus = (value) => {  
        const data = {
            ids: [],
            status: Number(value),
       }
       context.moreSelect.map((el) => data.ids.push(el));
        EditMoreStatusRequest(data).then((resp) => {
            if (resp?.status === 200) {
                // Запрашиваем обновлённые данные для всех указанных ID
                Promise.all(data.ids.map((id) => GetOneRequests(id))).then((responses) => {
                  const updatedRequests = responses
                    .filter((resp) => resp?.status === 200) // Оставляем только успешные ответы
                    .map((resp) => resp.data); // Получаем данные заявок
          
                  // Обновляем записи в массиве локально
                  UpdateRequests(updatedRequests);
          
                  // Закрываем контекстное меню
                  closeContextMenu();
                });
              }
        })
    }

      
      const setUrgensy = (value) => {
        const data = {
          ids: [...context.moreSelect], // Передаём массив ID
          urgency: value.name,
        };
      
        EditMoreUrgencyRequest(data).then((resp) => {
          if (resp?.status === 200) {
            // Запрашиваем обновлённые данные для всех указанных ID
            Promise.all(data.ids.map((id) => GetOneRequests(id))).then((responses) => {
              const updatedRequests = responses
                .filter((resp) => resp?.status === 200) // Оставляем только успешные ответы
                .map((resp) => resp.data); // Получаем данные заявок
      
              // Обновляем записи в массиве локально
              UpdateRequests(updatedRequests);
      
              // Закрываем контекстное меню
              closeContextMenu();
            });
          }
        });
      };
      

    const setExecutor = (value) => {
        const data = {
            ids: [],
            contractorId: value.id,
       }
       context.moreSelect.map((el) => data.ids.push(el));
       EditMoreContractorRequest(data).then((resp) => {
        if (resp?.status === 200) {
            // Запрашиваем обновлённые данные для всех указанных ID
            Promise.all(data.ids.map((id) => GetOneRequests(id))).then((responses) => {
              const updatedRequests = responses
                .filter((resp) => resp?.status === 200) // Оставляем только успешные ответы
                .map((resp) => resp.data); // Получаем данные заявок
      
              // Обновляем записи в массиве локально
              UpdateRequests(updatedRequests);
      
              // Закрываем контекстное меню
              closeContextMenu();
            });
          }
       })
    }

    const deletetRequest = () => {
        const data = {
          ids: []
        };
      
        // Собираем ids, которые нужно удалить
        context.moreSelect.forEach((el) => data.ids.push(el));
      
        // Отправляем запрос на удаление
        DeleteMoreRequest(data).then((resp) => {
          if (resp?.status === 200) {
            // Обновляем локальные данные в таблице, удаляя записи с указанными ID
            context.setDataTableHomePage((prevData) => {
              const updatedData = prevData.filter(
                (item) => !data.ids.includes(item.id) // Убираем все записи, чьи id в массиве ids
              );
              return updatedData;
            });
      
            // Очищаем выбранные записи, закрываем контекстное меню и выполняем дополнительные действия
            context.setMoreSelect([]);
            closeContextMenu();
            context.checkedAllFunc();
            context.setPopUp("PopUpGoodMessage");
            context.setPopupGoodText("Выбранные заявки успешно удалены!");
          }
        }).catch((error) => {
          console.error("Ошибка при удалении записей:", error);
        });
      };
      
    const closeContextMenu = () => {
        props.setOpenConextMenu(false);
    }
    const copyRequest = () => {     
        CreateCopyRequest(context.moreSelect[0]).then((resp) => {
            if(resp?.status === 200){
              setConfirmCopy(false);
              closeContextMenu();
              context.setLoader(false);
              context.UpdateForse();
              context.setSelectedTr(null);
              context.setMoreSelect([]);
            }
        })
    }

    const checkCloneRequest = () => {
        let rowData = null
        context.dataTableHomePage.map((el) => {
            if(el?.id === context.moreSelect[0]){
                rowData = el
            }
        })
        if(rowData?.copiedRequestId !== null){
            return false
        }else{
            return true
        }
    }

    return (
        <div className={styles.SampleMenu} style={{ top: cordY, left: cordX }} id='SampleMenu'>
            <div className={styles.SampleMenuInner}>
                <ul className={styles.SampleMenuInnerList}>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("status")}><li>Редактировать статус</li><img style={{ transform: showStatusMenu ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("urgency")}><li>Изменить срочность</li><img style={{ transform: showStatusUrgensy ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("executor")}><li>Назначить исполнителя</li><img style={{ transform: showStatusContractor ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    { context.moreSelect.length === 1 && checkCloneRequest() &&<li onClick={ () => toggleStatusMenu("copy")}>Создать копию</li>}
                    <li onClick={ () => toggleStatusMenu("delete")}>Удалить</li>
                </ul>
            </div>
            {confirmCopy && (
                <div className={styles.StatusMenu}>
                    <div className={styles.ConfirmDelete}>
                        <div>
                            <p>Вы точно хотите создать копию заявки?</p>
                        </div>
                        <div className={styles.ConfirmDeleteButtons}>
                            <button onClick={() => copyRequest()}>Да</button>
                            <button onClick={() => setConfirmCopy(!confirmCopy)}>Нет</button>
                        </div>
                    </div>
                </div>
            )}
            {showStatusMenu && (
                    <div className={styles.StatusMenu}>
                        <ul>
                            {Object.entries(status).map(([key, value]) => (
                                <li key={key} onClick={() => setStatus(key)}>{value}</li>
                            ))}
                        </ul>
                    </div>
            )}
            {showStatusUrgensy && (
                    <div className={styles.StatusMenu}>
                        <ul>
                          {DataUrgency.map((item) => (
                            <li key={item.id} onClick={() => setUrgensy(item)}>{item.name}</li>
                          ))}
                        </ul>
                    </div>
            )}
            {showStatusContractor && (
                    <div className={styles.StatusMenu}>
                        <ul>
                            {dataConractor.map((item) => (
                                <li key={item.id} onClick={() => setExecutor(item)}>{item.name}</li>
                            ))}
                        </ul>
                    </div>
            )}
            {   confirmDelete && 
                <div className={styles.StatusMenu}>
                    <div className={styles.ConfirmDelete}>
                        <div>
                            <p>Вы действительно хотите удалить выбранные заявки?</p>
                        </div>
                        <div className={styles.ConfirmDeleteButtons}>
                            <button onClick={deletetRequest}>Да</button>
                            <button onClick={() => setConfirmDelete(!confirmDelete)}>Нет</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

export default Contextmenu;
