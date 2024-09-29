import React, { useContext, useEffect, useState } from 'react';
import styles from './Contextmenu.module.scss';
import arrowBottom from "./../../assets/images/arrow_bottom.svg";
import {DeleteMoreRequest, EditMoreContractorRequest, EditMoreStatusRequest, EditMoreUrgencyRequest, GetAllСontractors} from "./../../API/API";
import DataContext from '../../context';
function Contextmenu(props) {
    const [cordX, setCordX] = useState(props?.X);
    const [cordY, setCordY] = useState(props?.Y);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showStatusUrgensy, setShovStatusUrgensy] = useState(false);
    const [showStatusContractor, setShovStatusContractor] = useState(false);
    const [dataConractor, setDataConractor] = useState([]);
    const { context } = useContext(DataContext);
    useEffect(() => {
        convertCoord(props?.X, props?.Y);
        GetAllСontractors().then((resp) => setDataConractor(resp.data));
    }, [props.X, props.Y]); // Update coordinates when props change

    const convertCoord = (X, Y) => {
        const menuWidth = 320;
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
        {id:1, name:"В течении часа"},
        {id:2, name:"В течении текущего дня"},
        {id:3, name:"В течении 3-х дней"},
        {id:4, name:"В течении недели"},
        {id:5, name:"Маршрут"},
        {id:6, name:"Выполнено"}
      ];

    const toggleStatusMenu = (action) => {
        setShovStatusUrgensy(false);
        setShovStatusContractor(false);
        setShowStatusMenu(false);
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
                  context.context.UpdateTableReguest(1);
                  closeContextMenu();
                }
            }
        );
    }
    const closeContextMenu = () => {
        props.setOpenConextMenu(false);
    }
    return (
        <div className={styles.SampleMenu} style={{ top: cordY, left: cordX }} id='SampleMenu'>
            <div className={styles.SampleMenuInner}>
                <ul className={styles.SampleMenuInnerList}>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("status")}><li>Редактировать статус</li><img style={{ transform: showStatusMenu ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("urgency")}><li>Изменить срочность</li><img style={{ transform: showStatusUrgensy ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    <div className={styles.SampleMenuInnerList} onClick={()=>toggleStatusMenu("executor")}><li>Назначить исполнителя</li><img style={{ transform: showStatusContractor ? "rotate(-90deg)" : "" }} src={arrowBottom}/></div>
                    <li onClick={deletetRequest}>Удалить</li>
                </ul>
               
            </div>
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
        </div>
    );
}

export default Contextmenu;
