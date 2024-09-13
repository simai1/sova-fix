import React, { useState } from "react";
import styles from "./UneversalList.module.scss";
import DataContext from "../../context";

function UneversalList(props) {
  const { context } = React.useContext(DataContext);
  const [isActive, setIsActive] = useState(false);
  const addItem = (el) => {
    // handleListData(props?.name, el.id);
    props.setValueName(el.name);
    setIsActive(!isActive);
  };

  return (
    <div className={styles.UneversalList}>
      <div>
        {props?.Textlabel && (
          <div>
            <label>{props?.Textlabel}</label>
          </div>
        )}
        <div className={styles.ListCont}>
          <input
            readOnly
            onClick={() => setIsActive(!isActive)} // Toggle dropdown on click
            value={props?.valueName}
            placeholder={props?.placeholder}
            style={{borderBottom: !isActive ? "1px solid #ADADAD" : "none", borderRadius: isActive ? "8px 8px 0 0" : "8px"}}
          />
          <span
            onClick={() => setIsActive(!isActive)}
            className={styles.arrowBot}
          >
            <img
              style={{
                transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
              }}
              src="./img/arrow_bottom.svg"
            />
          </span>
        </div>
        {isActive && (
          <div className={styles.ListData}>
            {props?.dataList.map((item) => (
              <p
                className={styles.NameForList}
                onClick={() => addItem(item)}
                key={item.id}
              >
                {item.name}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UneversalList;
