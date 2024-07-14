import React, { useContext } from "react";
import styles from "./Header.module.scss";
import DataContext from "../../context";

function Header() {
  const { context } = useContext(DataContext);
  // const NameUser = localStorage.getItem("userData").name
  const Exit =()=>{
    console.log("exit")
  }

  const homeButton = () =>{
    context.setSelectPage("Main")
    context.UpdateTableReguest(1)
    context.setDataitinerary([])
    context.setSelectedTr(null);
  }
  return (
    <div className={styles.Header}>
      <div>
        <h3>{`Капылов Никита`}</h3>
      </div>
      <div className={styles.buttonBlock}> 
        <button onClick={()=>{homeButton()}} style={ context.selectPage === "Main" ? {backgroundColor: "#4693a4" } : {backgroundColor: "#afbbbd"}}>Главная</button>
        <button onClick={()=>{context.setSelectPage("Card")}} style={ context.selectPage !== "Main" ? {backgroundColor: "#4693a4"} : {backgroundColor: "#afbbbd"}}>Путеводная карта</button>
      </div>
      <div>
        <button onClick={Exit}>Выйти</button>
      </div>
    </div>
  );
}

export default Header;
