import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { Link } from "react-router-dom";



function FunctionTableTop(props) {
  const defaultValue = "Заказы";
  const { context } = React.useContext(DataContext);
  const DataList = [
    {
      id: 1,
      name: "Заказы",
    },
    {
      id: 2,
      name: "Пользователи",
    },
    {
      id: 3,
      name: "Путеводная Карта",
    }
  ];
  return (
    <>
      <div className={styles.FunctionTableTop}>
        <div className={styles.container}>
        <div className={styles.topList}>
            <List
              data={props.DataList}
              defaultValue={defaultValue}
              dataList={DataList}
            />
            <div className={styles.searchForTable}>
              <Input
                placeholder={"Поиск..."}
                settextSearchTableData={context.setextSearchTableData}
              />
              <img src="./img/Search_light.png" />
            </div>
          </div>
          {context.selectedTable === "Заказы" ? (
            <div className={styles.HeadMenu}>
                  <button onClick={ () =>{context.setPopUp("PopUpEditAppoint")}}
                    > 
                    <img src="./img/Edit.png" alt="View" />
                    Редактировать
                  </button>
              <button >
                <img src="./img/Trash.png" alt="View" />
                Удалить заявку
              </button>
            </div>
          ):(
            <div className={styles.HeadMenu}>
              <button>
                    <img src="./img/Edit.png" alt="View" />
                    Редактировать
              </button>
            </div>
          )}
      
        </div>
      </div>
    </>
  );
}

export default FunctionTableTop;
