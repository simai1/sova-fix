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
  if(!sessionStorage.getItem("userData")){navigate("/Authorization")}else{
    const userData = JSON.parse(sessionStorage.getItem("userData")).user?.name;
    const parts = userData?.split(' '); // Разбиваем полное имя на части по пробелу
    if(parts){
      setShortName(parts[0] + ' ' + parts[1])
    }
  }
},[])


  const Exit =()=>{
    LogOut().then((resp)=>{
      if(resp?.status === 200){
      navigate("/Authorization");
      }
    })
  }

  const homeButton = () =>{
    context.setSelectPage("Main")
    context.UpdateTableReguest(1)
    context.setDataitinerary([])
    context.setSelectedTr(null);
    context.setnameClient("Заявки");
    context.setSelectedTable("Заявки");
    context.setextSearchTableData("")
  }
  return (
    <div className={styles.Header}>
      <div>
        <h3>{shortName}</h3>
      </div>
      <div className={styles.buttonBlock}> 
        <button onClick={()=>{homeButton()}} style={ context.selectPage === "Main" ? {backgroundColor: "#FFE20D" } : {backgroundColor: "#B7AB9E"}}>Главная</button>
        <button onClick={()=>{context.setSelectPage("Card");  context.setextSearchTableData("");  context.setSelectedTr(null)}} style={ context.selectPage !== "Main" ? {backgroundColor: "#FFE20D"} : {backgroundColor: "#B7AB9E"}}>Маршрутный лист</button>
      </div>
      <div>
        <button onClick={Exit}>Выйти</button>
      </div>
    </div>
  );
}

export default Header;
