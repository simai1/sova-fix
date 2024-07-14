import React from "react";
import styles from "./ContractorCard.module.scss";
import DataContext from "../../context";
import { GetContractorsItenerarity } from "../../API/API";
const ContractorCard = (props) => {
  const { context } = React.useContext(DataContext);
  const clickCard = () =>{
    console.log(props?.el.id)
    GetContractorsItenerarity(props.el.id).then((resp)=>{
      if(resp.status == 200){
        console.log('resp', resp)
      }
    })
  }

  return (
    <div className={styles.ContractorCard} onClick={clickCard}>
        <p>Подрядчик: {props?.el.name}</p>
        <p>Кол-во заказов: 1</p>
    </div>
  );
};

export default ContractorCard;
