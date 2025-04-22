import React from "react";
import styles from "./PopUpError.module.scss";
import DataContext from "../../context";
import PopUpContainer from "../PopUpContainer/PopUpContainer";

export function PopUpError() {
  const { context } = React.useContext(DataContext);

  return (
    <div className={styles.mainPopBg}>
    <div className={styles.mainPop}>
      <div className={styles.mainPop__inner}>
        <p>
          {context.popupErrorText !== ""
            ? context.popupErrorText
            : "Извините, данную операцию невозможно выполнить"}
        </p>
        <div className={styles.buttonBlock}>
          <button
            onClick={() => {
              context.setPopUp("");
              context.setPopupErrorText("");
            }}
          
          >Закрыть</button>
        </div>
      </div>
    </div>
  </div>

  );
}
