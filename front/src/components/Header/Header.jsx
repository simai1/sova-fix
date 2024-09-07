// import React, { useContext, useEffect, useState } from "react";
// import styles from "./Header.module.scss";
// import DataContext from "../../context";
// import { LogOut } from "../../API/API";
// import { useNavigate } from "react-router-dom";

// function Header() {
//   const { context } = useContext(DataContext);
//   const [shortName, setShortName] = useState("")
//   const navigate = useNavigate();

// useEffect(()=>{
//   if(!sessionStorage.getItem("userData")){navigate("/Authorization")}else{
//     const userData = JSON.parse(sessionStorage.getItem("userData"))?.user?.name;
//     const parts = userData?.split(' '); // Разбиваем полное имя на части по пробелу
//     if(parts){
//       if(parts[1] === undefined){
//         setShortName(parts[0])
//       }else{
//         setShortName(parts[0] + ' ' + parts[1])
//       }
//     }
//     else{
//       setShortName("")
//     }
//   }
// },[])


//   const Exit =()=>{
//     LogOut().then((resp)=>{
//       if(resp?.status === 200){
//       navigate("/Authorization");
//       }
//     })
//   }

//   const homeButton = () =>{
//     context.setSelectPage("Main")
//     context.UpdateTableReguest(1)
//     context.setDataitinerary([])
//     context.setSelectedTr(null);
//     context.setnameClient("Заявки");
//     context.setSelectedTable("Заявки");
//     context.setextSearchTableData("")
//   }

//   const [activeList, setactiveList] = useState(false);

//   return (
//     // <div className={styles.Header}>
//     //   <div>
//     //     <h3>{shortName}</h3>
//     //   </div>
//     //   <div className={styles.buttonBlock}> 
//     //     <button onClick={()=>{homeButton()}} style={ context.selectPage === "Main" ? {backgroundColor: "#FFE20D" } : {backgroundColor: "#B7AB9E"}}>Главная</button>
//     //     <button onClick={()=>{context.setSelectPage("Card"); context.setSelectContractor("");  context.setextSearchTableData("");  context.setSelectedTr(null)}} style={ context.selectPage !== "Main" ? {backgroundColor: "#FFE20D"} : {backgroundColor: "#B7AB9E"}}>Маршрутный лист</button>
//     //   </div>
//     //   <div>
//     //     <button onClick={Exit}>Выйти</button>
//     //   </div>
//     // </div>
//     <header>
//       <div className={styles.Header}>
//         <button onClick={()=>setactiveList(!activeList)}>Меню</button>
//       </div>
//     {activeList && 
//     <div className={activeList ? styles.boorgerMenuActive : styles.boorgerMenu } id="containerHeader"  >
//       <div className={styles.boorgerMenu}>  
//         <ul>
//           <li>Главная</li>
//           <li>Маршрутный лист</li>
//         </ul>
//       </div>
//     </div>
//     }
//     </header>
    
//   );
// }

// export default Header;

import styles from "./Header.module.scss";
import React, { useState, useEffect, useRef, useContext } from 'react';
import './Menu.css'; // Импортируем стили
import { useNavigate } from "react-router-dom";
import DataContext from "../../context";
import { LogOut } from "../../API/API";

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
            setIsOpen(false);
        }
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
    }else if(Link ===  "Polzovateli"){
      setIsOpen(false)
      navigate("/")
      context.setSelectPage("Main");
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
      <button className={styles.button} onClick={toggleMenu}>Меню</button>
      <div className={`menu ${isOpen ? 'open' : ''}`} ref={menuRef}>
          <h3>{shortName}</h3>
          <ul className={styles.menuUl}>
              <li onClick={() => LinkPage()} className={styles.menuLi}>Главная</li>
              <li onClick={() => LinkPage("Card")} className={styles.menuLi}>Маршрутный лист</li>
              <li onClick={() => setIsOpenSprav(!isOpenSprav)} className={styles.menuLi} style={isOpenSprav ? { backgroundColor: "#FFE20D" } : { backgroundColor: "#fff" }}>
                  Справочники
                  <img style={isOpenSprav ? { transform: "rotate(0deg)" } : { transform: "rotate(-90deg)" }} src="./img/arrow_bottom.svg" />
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
                  <li className={styles.menuLi}>Юридические лица</li>
                  <li className={styles.menuLi}>Подразделения</li>
                  <li className={styles.menuLi}>Объекты</li>
                  <li className={styles.menuLi}>Внешние подрядчики</li>
                  <li className={styles.menuLi}>Исполнители</li>
                  <li className={styles.menuLi} onClick={() => LinkPage("Polzovateli")}>Пользователи</li>
              </ul>
              <li onClick={() => setIsOpenFinans(!isOpenFinans)} className={styles.menuLi} style={isOpenFinans ? { backgroundColor: "#FFE20D" } : { backgroundColor: "#fff" }}>
                  Отчеты
                  <img style={isOpenFinans ? { transform: "rotate(0deg)" } : { transform: "rotate(-90deg)" }} src="./img/arrow_bottom.svg" />
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
                  <li className={styles.menuLi}>Показатели</li>
                  <li className={styles.menuLi}>Финансы</li>
              </ul>
              <li className={styles.menuLi}>SOVA-tech – системы управления</li>
          </ul>
        <div className={styles.ButonFunc}>
          <div className={styles.ButonFuncInner}>
            <button>Задать вопрос</button>
            <button onClick={()=>Exit()}>Выход</button>
          </div>
        </div>
      </div>
      <div className={styles.TitleSitte}>
        <div className={styles.TitleSitteInner}>
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


