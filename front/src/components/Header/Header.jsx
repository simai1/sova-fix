import React, { useState } from "react";
import styles from "./Header.module.scss";
import {useNavigate } from "react-router-dom";

import DataContext from "../../context";
function Header() {
  const navigate = useNavigate();
  const { context } = React.useContext(DataContext);
  const NameUser = localStorage.getItem("userData").name
  const Exit =()=>{
    console.log("exit")
  }
  return (
    <div className={styles.Header}>
      <h3>{`Капылов Никита`}</h3>
        <button onClick={Exit}>Выйти</button>
    </div>
  );
}

export default Header;
