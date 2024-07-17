import React, { useContext, useEffect, useState } from "react";
import styles from "./Header.module.scss";
import DataContext from "../../context";
import { LogOut } from "../../API/API";
import { useNavigate } from "react-router-dom";

function Header() {
  const { context } = useContext(DataContext);
  const [shortName, setShortName] = useState("")
  const navigate = useNavigate();

useEffect(()=>{
  const userData = JSON.parse(localStorage.getItem("userData")).user.name;
  const parts = userData.split(' '); // Разбиваем полное имя на части по пробелу
  setShortName(parts[0] + ' ' + parts[1])
},[])


  const Exit =()=>{
    LogOut().then((resp)=>{
      if(resp){
      navigate("/");
      }
    })
  }

  const homeButton = () =>{
    context.setSelectPage("Main")
    context.UpdateTableReguest(1)
    context.setDataitinerary([])
    context.setSelectedTr(null);
    context.setnameClient("Заказы");
    context.setSelectedTable("Заказы");
  }
  return (
    <div className={styles.Header}>
      <div>
        <h3>{shortName}</h3>
      </div>
      <div className={styles.buttonBlock}> 
        <button onClick={()=>{homeButton()}} style={ context.selectPage === "Main" ? {backgroundColor: "#4693a4" } : {backgroundColor: "#afbbbd"}}>Главная</button>
        <button onClick={()=>{context.setSelectPage("Card")}} style={ context.selectPage !== "Main" ? {backgroundColor: "#4693a4"} : {backgroundColor: "#afbbbd"}}>Маршрутная карта</button>
      </div>
      <div>
        <button onClick={Exit}>Выйти</button>
      </div>
    </div>
  );
}

export default Header;
