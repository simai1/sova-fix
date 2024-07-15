import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { Link } from "react-router-dom";
import { DeleteRequest, DeleteUserFunc } from "../../API/API";



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
  ];

  //!удаление заявки
  const deleteRequestFunc = () =>{
    if(context.selectedTr != null){
      console.log('id', context.selectedTr)
      DeleteRequest(context.selectedTr).then((resp)=>{
        if(resp.status === 200){
          context.UpdateTableReguest(1);
        }
      })
    }else{
      alert("Сначала выберите заявку!")
    }
  }

  const deletedUser = ()=>{
    if(context.selectedTr != null){
      DeleteUserFunc(context.selectedTr).then((resp)=>{
        if(resp.status === 200){
          context.UpdateTableReguest(2);
        }
      })
    }else{
      alert("Сначала выберите пользователя!")
    }
  }

  return (
    <>
      <div className={styles.FunctionTableTop}>
        <div className={styles.container}>
        <div className={styles.topList}>
            {context.selectPage === "Main" ?
            <div className={styles.ListMainPage}>
              <List
                data={props.DataList}
                defaultValue={defaultValue}
                dataList={DataList}
              />
            </div> :
            <button className={styles.buttonBack} onClick={()=>{
                context.setDataitinerary([]);
                context.setSelectedTr(null);
            }}> Назад</button>
            }
            <div className={styles.searchForTable}>
              <Input
                placeholder={"Поиск..."}
                settextSearchTableData={context.setextSearchTableData}
              />
              <img src="./img/Search_light.png" />
            </div>
          </div>
          {context.selectedTable === "Заказы" && context.selectPage === "Main" ? (
            <div className={styles.HeadMenu}>
              <button onClick={(()=>deleteRequestFunc())}>
                <img src="./img/Trash.png" alt="View" />
                Удалить заказ
              </button>
            </div>
          ) : context.selectedTable === "Пользователи" && context.selectPage === "Main" ? (
            <div className={styles.HeadMenu}>
            <button onClick={()=>{context.setPopUp("PopUpCreateUser")}}>
                  <img src="./img/plus.svg" alt="View" />
                    Добавить пользователя
              </button>
              <button onClick={()=>{deletedUser()}}>
                  <img src="./img/Trash.png" alt="View" />
                    Удалить пользователя
              </button>
            </div>
          ) : (
            <></>
          )}
      
        </div>
      </div>
    </>
  );
}

export default FunctionTableTop;
