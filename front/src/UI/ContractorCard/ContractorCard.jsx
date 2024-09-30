import React, { useEffect, useState } from "react";
import styles from "./ContractorCard.module.scss";
import DataContext from "../../context";
const ContractorCard = (props) => {
  const { context } = React.useContext(DataContext);
  const [count, setCount] = useState(0)
  const clickCard = () =>{
    const idInteger = context?.dataContractors.find(el => el.name === props?.name)?.id;
    context.setSelectContractor(idInteger)
    // context.UpdateTableReguest(3)
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
    let SqrCounut = 0;
    context?.dataApointment.forEach((el) => {
      if (el.status === 2 && el.urgency === "Маршрут") {
        SqrCounut++;
      }
    })
    const znach = SqrCounut/context.dataContractors.length
    if (count < znach * 0.7) {
      return "#C5E384";
    } else if (count >= znach * 0.7 && count <= znach) {
      return "#ffe78f";
    } else{
      return "#d69a81";
    }
  };

  return (
    <div className={styles.ContractorCard} onClick={clickCard}  >
        <p className={styles.name}>{props?.name.split(" ")[0]}</p>
        <p className={styles.name}>{props?.name.split(" ")[1]}</p>
        <p className={styles.name}>{props?.name.split(" ")[2]}</p>
        <div className={styles.buttonInner}>
          <button className={styles.button} style={{backgroundColor: getColor(count)}}>{count}</button>
        </div>
    </div>
  );
};

export default ContractorCard;
