import React from "react";
import styles from "./ContractorCard.module.scss";
import DataContext from "../../context";
const ContractorCard = (props) => {
  const { context } = React.useContext(DataContext);
  const clickCard = () =>{
    console.log(props.el.id)
  }

  return (
    <div className={styles.ContractorCard} onClick={clickCard}>
        <p>Подрядчик: {props?.name}</p>
        <p>Кол-во заказов: 1</p>
    </div>
  );
};

export default ContractorCard;
