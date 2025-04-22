import React from "react";
import styles from "./PopUpGoodMessage.module.scss";
import DataContext from "../../context";
import imX from "./../../assets/images/x.svg";
import imGood from "./../../assets/images/good.svg";

const PopUpGoodMessage = (props) => {
  const { context } = React.useContext(DataContext);

  return (
    <div className={styles.mainPopGood}>
      <div className={styles.mainPop__inner}>
        <div className={styles.x}>
          <img
            src={imX}
            alt="x"
            onClick={() => {
              context.setPopUp("");
              context.setPopupGoodText("")
              }}
          />
        </div>

        <div className={styles.mainPop__inner__inner}>
          <img src={imGood} />
        </div>
        <div className={styles.text}><p>{context.popupGoodText != "" ?  context.popupGoodText : "Готово!"}</p></div>
      </div>
    </div>
  );
};

export default PopUpGoodMessage;
