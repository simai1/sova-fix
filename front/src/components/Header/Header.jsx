import styles from "./Header.module.scss";
import React, { useState, useEffect, useRef, useContext } from 'react';
import './Menu.css'; // Импортируем стили
import { useNavigate } from "react-router-dom";
import DataContext from "../../context";
import { LogOut } from "../../API/API";
import { addTableHeader } from "../../store/editColumTable/editColumTable.slice";
import { tableHeadAppoint, tableList, tableUser } from "../Table/Data";
import { useDispatch } from "react-redux";
import imgClose from "./../../assets/images/x.svg";
import arrowBottom from "./../../assets/images/arrow_bottom.svg";

function Header() {
    const { context } = useContext(DataContext);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const [shortName, setShortName] = useState("")
    const navigate = useNavigate();
    const [isOpenSprav, setIsOpenSprav] = useState(false);
    const [isOpenFinans, setIsOpenFinans] = useState(false);
    const spravRef = useRef(null);
    const finansRef = useRef(null);

  useEffect(()=>{
    if(!sessionStorage.getItem("userData")){navigate("/Authorization")}else{
      const userData = JSON.parse(sessionStorage.getItem("userData"))?.user?.name;
      if(userData){
        setShortName(userData)
      }
    }
  },[]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          closeMenu();
        }
    };

    const closeMenu = () => {
        setIsOpen(false);
        setIsOpenSprav(false);
        setIsOpenFinans(false);
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

  const Exit =()=>{
    LogOut().then((resp)=>{
      if(resp?.status === 200){
      navigate("/Authorization");
      }
    })
  }

  const dispatch = useDispatch();

  const LinkPage = (Link) => {
    if(Link !== undefined && Link !==  "Card" && Link !==  "Polzovateli"){
      setIsOpen(false)
      navigate(`/${Link}`);
    }else if(Link ===  "Card"){
      setIsOpen(false)
      navigate("/")
      context.setSelectPage("Card");
      context.setSelectContractor("");
      context.setextSearchTableData("");
      context.setSelectedTr(null)
      console.log('tableUser', tableList)
      context.settableHeader(tableList);
      context.setSelectedTable("Card");
    }else if(Link ===  "Polzovateli"){
      setIsOpen(false)
      navigate("/")
      context.setSelectPage("Main");
      context.settableHeader(tableUser);
      context.UpdateTableReguest(2)
      context.setSelectedTr(null);
      context.setnameClient("Пользователи");
      context.setSelectedTable("Пользователи");
    }
    else{
      setIsOpen(false)
      navigate("/")
      context.setSelectPage("Main")
      context.UpdateTableReguest(1)
      context.setDataitinerary([])
      context.setSelectedTr(null);
      context.setnameClient("Заявки");
      context.setSelectedTable("Заявки");
      context.setextSearchTableData("")
    }
  };


return (
  <div className={styles.Header}>
      <button className={styles.buttonMenu} onClick={toggleMenu}>Меню</button>
      <div className={`menu ${isOpen ? 'open' : ''}`} ref={menuRef}>
          {/* <h3>{shortName}</h3> */}
          <div className={styles.close}>
            <img onClick={() =>  closeMenu()} src={imgClose}/>
          </div>
          <ul className={styles.menuUl}>
              <li onClick={() => LinkPage()} className={styles.menuLi}>Главная</li>
              <li onClick={() => LinkPage("Card")} className={styles.menuLi}>Маршрутный лист</li>
              <li onClick={() => setIsOpenSprav(!isOpenSprav)} className={styles.menuLi} style={isOpenSprav ? { backgroundColor: "#FFE20D" } : { backgroundColor: "#fff" }}>
                  Справочники
                  <img style={isOpenSprav ? { transform: "rotate(0deg)" } : { transform: "rotate(-90deg)" }} src={arrowBottom} />
              </li>
              <ul
                  ref={spravRef}
                  className={styles.menuUlSecond}
                  style={{
                      maxHeight: isOpenSprav ? `${spravRef.current.scrollHeight}px` : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease'
                  }}
              >
                  <li className={styles.menuLi} onClick={() => LinkPage("Directory/DirectoryLegalEntities")}>Юридические лица</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Directory/BusinessUnitReference")}>Подразделения</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Directory/ReferenceObjects")}>Объекты</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Directory/ThePerformersDirectory")}>Внешние подрядчики</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Directory/ExternalContractors")}>Исполнители</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Polzovateli")}>Пользователи</li>
              </ul>
              <li onClick={() => setIsOpenFinans(!isOpenFinans)} className={styles.menuLi} style={isOpenFinans ? { backgroundColor: "#FFE20D" } : { backgroundColor: "#fff" }}>
                  Отчеты
                  <img style={isOpenFinans ? { transform: "rotate(0deg)" } : { transform: "rotate(-90deg)" }} src={arrowBottom} />
              </li>
              <ul
                  ref={finansRef}
                  className={styles.menuUlSecond}
                  style={{
                      maxHeight: isOpenFinans ? `${finansRef.current.scrollHeight}px` : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease'
                  }}
              >
                  <li className={styles.menuLi} onClick={() => LinkPage("RepotYour")}>Показатели</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("ReportFinansing")}>Финансы</li>
              </ul>
              <a href="https://sova-tech.com/" target="_blank"><li className={styles.menuLi}>SOVA-tech – системы управления</li></a>
          </ul>
        <div className={styles.ButonFunc}>
          <div className={styles.ButonFuncInner}>
            <a href="https://t.me/SOVA_tech_notification_bot" target="_blank"><button>Тех поддержка</button></a>
            <button onClick={()=>Exit()}>Выход</button>
          </div>
        </div>
      </div>
      <div className={styles.TitleSitte}>
        <div className={styles.TitleSitteInner}>
        {/* <img src="./img/logo.png"/> */}
          <h1>Система комплексного управления техническим обслуживанием и оборудованием</h1>
        </div>
      </div>
      {
        isOpen
          ? <div className={styles.Opacity}></div>
          : null
      }
    
  </div>
);
};
export default Header;


