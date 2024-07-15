import React, { useEffect, useState } from "react";
import styles from "./List.module.scss";
import DataContext from "../../context";

function List({ dataList, Textlabel, defaultValue, funSetData, itemKey, placeholder, nameList }) {
  const { context } = React.useContext(DataContext);

  const [activeList, setactiveList] = useState(false);
  const addClient = (el) => {
    if(el.name === "Заказы") {
      context.UpdateTableReguest(1)
    }else if(el.name === "Пользователи") {
      context.UpdateTableReguest(2)
    }
    context.setSelectedTr(null);
    context.setnameClient(el.name);
    console.log(el)
    setactiveList(!activeList);
    context.setSelectedTable(el.name);
  };

  useEffect(() => {
    context.setnameClient(defaultValue);
  }, []);

  return (
    <div className={styles.List}>
      <div>
        {Textlabel && (
          <div>
            <label>{Textlabel}</label>
          </div>
        )}
        <div className={styles.ListCont}>
          <input
            readOnly
            onClick={() => setactiveList(!activeList)}
            value={context.nameClient}
            placeholder={placeholder}
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
            {dataList.length === 0 ? (
              <p>Сначала создайте {nameList}!</p>
            ) : (
              dataList.map((item) => (
                <p
                  className={styles.NameForList}
                  onClick={() => addClient(item)}
                  key={item.id}
                >
                  {item.name}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default List;
