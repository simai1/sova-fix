import React, { useEffect, useState } from "react";
import styles from "./ContractorCard.module.scss";
import DataContext from "../../context";
import { GetContractorsItenerarity } from "../../API/API";
const ContractorCard = (props) => {
  const { context } = React.useContext(DataContext);
  const [count, setCount] = useState(0)
  const clickCard = () =>{
    const idInteger = context.dataContractors.find(el => el.name === props?.name)?.id;
    GetContractorsItenerarity(idInteger).then((resp)=>{
      if(resp.status == 200){
        console.log('resp', resp)
      }
    })
  }

  useEffect(()=>{
    setCount(whyColor)
  },[])

  const whyColor = () =>{
    let count =  0
    props?.namePodnoSorted.map((el) => el === props?.name && count++)
    console.log('count', count)
    return count
  }

  return (
    <div className={styles.ContractorCard} onClick={clickCard}  >
        <p>Подрядчик: {props?.name}</p>
        <p>Кол-во заказов в маршруте: {count}</p>
    </div>
  );
};

export default ContractorCard;
