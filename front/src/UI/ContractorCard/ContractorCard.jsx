import React, { useEffect, useState } from "react";
import styles from "./ContractorCard.module.scss";
import DataContext from "../../context";
import { useNavigate } from "react-router-dom";
const ContractorCard = (props) => {
  const { context } = React.useContext(DataContext);
  const [count, setCount] = useState(0)
  const navigate = useNavigate();
  const clickCard = () =>{
    const idInteger = context?.dataContractors.find(el => el.name === props?.name)?.id;
    context.setSelectContractor(idInteger)
    navigate(`/CardPage/CardPageModule`)
  }

  useEffect(()=>{
    setCount(whyColor)
  },[])

  const whyColor = () =>{
    let count =  0
    props?.namePodnoSorted.map((el) => el === props?.name && count++)
    return count
  }

  const getColor = (count) => {
    const znach = context?.dataApointment.filter(el => el.status === "В работе" && el.urgency === "Маршрут").length / context.dataContractors.length;
    return count < znach * 0.7 ? "#C5E384" : count <= znach ? "#ffe78f" : "#d69a81";
  };

  return (
    <div className={styles.ContractorCard} onClick={clickCard}>
        <p className={styles.name}>{props?.name?.split(" ")[0]}</p>
        <p className={styles.name}>{props?.name?.split(" ")[1]}</p>
        <p className={styles.name}>{props?.name?.split(" ")[2]}</p>
        <div className={styles.buttonInner}>
          <button className={styles.button} style={{backgroundColor: getColor(count)}}>{count}</button>
        </div>
    </div>
  );
};

export default ContractorCard;
