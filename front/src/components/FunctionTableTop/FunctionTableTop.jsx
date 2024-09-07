import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { DeleteRequest, DeleteUserFunc } from "../../API/API";
import { useDispatch } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import CountInfoBlock from "../../UI/CountInfoBlock/CountInfoBlock";



function FunctionTableTop(props) {
  const defaultValue = "Заявки";
  const { context } = React.useContext(DataContext);

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

  const dispatch = useDispatch();
 //!функция сброса фильтров
 const refreshFilters = () => {
  context.setIsChecked([]);
  context.setAllChecked([]);
  dispatch(removeTableCheckeds());
  const fdfix = FilteredSample(funFixEducator(context.tableData));
  context.setFilteredTableData(fdfix, []);
  context.setSortState("");
  context.setSortStateParam("");
  context.UpdateTableReguest(1, "");
};

  return (
    <>
      <div className={styles.FunctionTableTop}>
        <div className={styles.container}>
        <div className={styles.topList}>
            {/* {context.selectedTable === "Пользователи" && 
            <button className={styles.buttonBack} onClick={()=>{
                context.setDataitinerary([]);
                context.setSelectedTr(null);
                context.setSelectContractor("");
            }}> Назад</button>
            } */}
            <div className={styles.searchForTable}>
              { context.selectedTable === "Заявки" && <>
              <Input
                placeholder={"Поиск..."}
                settextSearchTableData={context.setextSearchTableData}
              />
              <img src="./img/Search_light.png" />
              { (context.selectedTable === "Заявки" && context.selectPage === "Main") && <div className={styles.dropFilter} onClick={refreshFilters} title="нажмите для сброса фильтров"><img src="./img/ClearFilter.svg"/></div>}

              </>
              }
              
            </div>
          </div>
          {context.selectedTable === "Заявки" && context.selectPage === "Main" ? (
            <div className={styles.HeadMenuMain}>
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
        { context.selectedTable === "Заявки" && context.selectPage === "Main" &&
          <div>
            <CountInfoBlock/>
          </div>
        }
      </div>
    </>
  );
}

export default FunctionTableTop;
