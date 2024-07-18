import React, { useEffect, useState } from "react";
import styles from "./ListInput.module.scss";
import DataContext from "../../context";

function ListInput(props) {
  const { context } = React.useContext(DataContext);
  const [valueName, setValueName] = useState(props.value);
  const [activeList, setactiveList] = useState(false);
  const addClient = (el) => {
    console.log(el) 
    props.handleListData(props.name, el.id)  
    setValueName(el.name)
    setactiveList(false)
  };

  return (
    <div className={styles.List}>
      <div>
        {props.Textlabel && (
          <div>
            <label>{props.Textlabel}</label>
          </div>
        )}
        <div className={styles.ListCont}>

          <input
            readOnly
            onClick={() => setactiveList(!activeList)}
            value={props.dataList.find((el)=> el.id === props.value)?.name || props.value }
            placeholder={props?.placeholder}
          />
          <span
            onClick={() => setactiveList(!activeList)}
            className={styles.arrowBot}
          > 
            <img
              style={{
                transform: activeList ? "rotate(0deg)" : "rotate(-90deg)",
              }}
              src="./img/arrow_bottom.svg"
            />
          </span>
        </div>
        {activeList && (
          <div className={styles.ListData}>
                {props.dataList.map((item) => (
                <p
                  className={styles.NameForList}
                  onClick={() => addClient(item)}
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

export default ListInput;
