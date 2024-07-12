import React from "react";
import styles from "./PopUpContainer.module.scss";
import DataContext from "../../context";

function PopUpContainer({ children, title, mT, width }) {
  const { context } = React.useContext(DataContext);

  return (
    <div style={{ paddingTop: `${mT}px` }} className={styles.PopUpContainer}>
      <div className={styles.PopUpContainerflex}>
        <div
          style={width ? { width: "auto" } : null}
          className={styles.PopUpContainerInner}
        >
          <div className={styles.HeaderPopUp}>
            <div className={styles.HeaderPopUpTitle}>
              <h2>{title}</h2>
            </div>
            <div>
              <button
                onClick={() => {
                  context.setEditCarData(false);
                  context.setpopUp("");
                }}
              >
                X
              </button>
            </div>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default PopUpContainer;
