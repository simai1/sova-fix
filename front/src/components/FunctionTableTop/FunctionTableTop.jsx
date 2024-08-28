import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { DeleteRequest, DeleteUserFunc } from "../../API/API";



function FunctionTableTop(props) {
  const defaultValue = "Заявки";
  const { context } = React.useContext(DataContext);
  const DataList = [
    {
      id: 1,
      name: "Заявки",
    },
    {
      id: 2,
      name: "Пользователи",
    },
  ];

  //!удаление заявки
  const deleteRequestFunc = () =>{
    if(context.selectedTr != null){
      context.setPopUp("СonfirmDelete")
    }else{
      context.setPopupErrorText("Сначала выберите заявку!");
      context.setPopUp("PopUpError")
    }
  }

const editAppoint = ()=>{
  if(context.selectedTr != null){
  context.setPopUp("PopUpEditAppoint")
  }else{
    context.setPopupErrorText("Сначала выберите заявку!");
      context.setPopUp("PopUpError")
  }
}

  const deletedUser = ()=>{
    if(context.selectedTr != null &&  context.selectedTr !== JSON.parse(sessionStorage.getItem("userData")).user?.id){
      DeleteUserFunc(context.selectedTr).then((resp)=>{
        if(resp?.status === 200){
          context.UpdateTableReguest(2);
        }
      })
    }else if(context.selectedTr === null){
      context.setPopupErrorText("Сначала выберите пользователя!");
      context.setPopUp("PopUpError")
    }else{
      context.setPopupErrorText("Вы не можете удалить себя!");
      context.setPopUp("PopUpError")
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
                context.setSelectContractor("");
            }}> Назад</button>
            }
            <div className={styles.searchForTable}>
              { context.selectedTable === "Заявки" && <Input
                placeholder={"Поиск..."}
                settextSearchTableData={context.setextSearchTableData}
              />}
              <img src="./img/Search_light.png" />
            </div>
          </div>
          {context.selectedTable === "Заявки" && context.selectPage === "Main" ? (
            <div className={styles.HeadMenu}>
             <button onClick={(()=>editAppoint())}>
                <img src="./img/Edit.svg" alt="View" />
                Редактировать заявку
              </button>
              <button onClick={(()=>deleteRequestFunc())}>
                <img src="./img/Trash.svg" alt="View" />
                Удалить заявку
              </button>
            </div>
          ) : context.selectedTable === "Пользователи" && context.selectPage === "Main" &&  JSON.parse(sessionStorage.getItem("userData")).user.role === "ADMIN" ? (
            <div className={styles.HeadMenu}>
              <button onClick={()=>{context.setPopUp("PopUpCreateUser")}}>
                  <img src="./img/plus.svg" alt="View" />
                    Добавить пользователя
              </button>
              <button onClick={()=>{deletedUser()}}>
                  <img src="./img/Trash.svg" alt="View" />
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
