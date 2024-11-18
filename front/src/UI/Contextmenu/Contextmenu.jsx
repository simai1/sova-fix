import React, { useContext, useEffect, useState } from 'react';
import styles from './Contextmenu.module.scss';
import arrowBottom from "./../../assets/images/arrow_bottom.svg";
import {CreateCopyRequest, DeleteMoreRequest, EditMoreContractorRequest, EditMoreStatusRequest, EditMoreUrgencyRequest, GetAllСontractors} from "./../../API/API";
import DataContext from '../../context';
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

    const setStatus = (value) => {  
        const data = {
            ids: [],
            status: Number(value),
       }
       context.moreSelect.map((el) => data.ids.push(el));
        EditMoreStatusRequest(data).then((resp) => {
                if(resp?.status === 200){
                  context.UpdateTableReguest(1);
                  closeContextMenu();
                }
        })
    }

    const setUrgensy = (value) => {
        const data = {
            ids: [],
            urgency: value.name,
       }
       context.moreSelect.map((el) => data.ids.push(el));
       EditMoreUrgencyRequest(data).then((resp) => {
                if(resp?.status === 200){
                  context.UpdateTableReguest(1);
                  closeContextMenu();
                }
       })
    }

    const setExecutor = (value) => {
        const data = {
            ids: [],
            contractorId: value.id,
       }
       context.moreSelect.map((el) => data.ids.push(el));
       EditMoreContractorRequest(data).then((resp) => {
                if(resp?.status === 200){
                  context.UpdateTableReguest(1);
                  closeContextMenu();
                }
       })
    }

    const deletetRequest = () => {
        const data = {
            ids: []
       }
       context.moreSelect.map((el) => data.ids.push(el));
       DeleteMoreRequest(data).then((resp) => {
                if(resp?.status === 200){
                  context.UpdateTableReguest(1);
                  context.setMoreSelect([]);
                  closeContextMenu();
                  context.checkedAllFunc();
                }
            }
        );
    }
    const closeContextMenu = () => {
        props.setOpenConextMenu(false);
    }
    const copyRequest = () => {     
        console.log("copy",  context.moreSelect[0])
        CreateCopyRequest(context.moreSelect[0]).then((resp) => {
            if(resp?.status === 200){
              setConfirmCopy(false);
              context.UpdateTableReguest(1);
              closeContextMenu();
            }
        })
    }

    const checkCloneRequest = () => {
        let rowData = null
        context.dataTableFix.map((el) => {
            if(el.id === context.moreSelect[0]){
                rowData = el
            }
        })
        if(rowData.copiedRequestId !== null){
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
