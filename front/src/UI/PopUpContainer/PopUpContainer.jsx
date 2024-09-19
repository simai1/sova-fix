import React from "react";
import styles from "./PopUpContainer.module.scss";
import DataContext from "../../context";

function PopUpContainer(props) {
  const { context } = React.useContext(DataContext);
  const closePopUp = () => {
    if(props?.closePopUpFunc){
      props?.closePopUpFunc();
    }
      context.setPopUp("");   
  }
  return (
    <div style={{ paddingTop: `${props?.mT}px` }} className={styles.PopUpContainer}>
      <div className={styles.PopUpContainerflex}>
        <div
          style={props?.width ? { width: "auto" } : null}
          className={styles.PopUpContainerInner}
        >
          <div className={styles.HeaderPopUp}>
            <div className={styles.HeaderPopUpTitle}>
              <h2>{props?.title}</h2>
            </div>
            <div>
              <button
                onClick={() => {
                  closePopUp();
                }}
              >
                X
              </button>
            </div>
          </div>

          <div>{props?.children}</div>
        </div>
      </div>
    </div>
  );
}

export default PopUpContainer;
