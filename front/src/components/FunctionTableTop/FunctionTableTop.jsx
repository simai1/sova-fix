import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { DeleteRequest, DeleteUserFunc, RejectActiveAccount } from "../../API/API";
import { useDispatch } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import CountInfoBlock from "../../UI/CountInfoBlock/CountInfoBlock";
import EditColum from "../../UI/EditColum/EditColum";
import { generateAndDownloadExcel } from "../../function/function";
import { tableList } from "../Table/Data";



function FunctionTableTop(props) {
  const defaultValue = "Заявки";
  const { context } = React.useContext(DataContext);

  //!удаление заявки
  const deleteRequestFunc = () =>{
    if(context.moreSelect.length === 1){
      context.setPopUp("СonfirmDelete")
    }else{
      context.setPopupErrorText("Сначала выберите заявку!");
      context.setPopUp("PopUpError")
    }
  }

const editAppoint = ()=>{
  if(context.moreSelect.length === 1){
  context.setPopUp("PopUpEditAppoint")
  }else{
    context.setPopupErrorText("Сначала выберите заявку!");
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

const goBackCurd = () =>{
  context.setSelectPage("Card");
  context.setSelectContractor("");
  context.setextSearchTableData("");
  context.setSelectedTr(null)
  context.settableHeader(tableList);
  context.setSelectedTable("Card");
}
  return (
    <>
      <div className={styles.FunctionTableTop}>
        <div className={styles.container}>
        <div className={styles.topList}>
            <div className={styles.searchForTable}>
              { context.selectedTable === "Заявки" && 
              <>
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
            <EditColum/>
            <>
            <button onClick={(()=>editAppoint())} disabled={context.moreSelect.length > 1} style={{opacity:context.moreSelect.length > 1 ? "0.5" : "1", cursor:context.moreSelect.length > 1 ? "not-allowed" : "pointer"}}>
                <img src="./img/Edit.svg" alt="View" />
                Редактировать заявку
              </button>
              <button onClick={(()=>deleteRequestFunc())} disabled={context.moreSelect.length >1} style={{opacity:context.moreSelect.length > 1 ? "0.5" : "1", cursor:context.moreSelect.length > 1 ? "not-allowed" : "pointer"}}>
                <img src="./img/Trash.svg" alt="View" />
                Удалить заявку
              </button>
            </>
              <button onClick={() => generateAndDownloadExcel(context?.filteredTableData, "Заявки")}>Экспорт</button>
            </div>
          ) : sessionStorage.getItem("userData").user?.id === 1 ? 
          <div className={styles.ButtonBack}>
                  <div>
                    <button onClick={()=>goBackCurd()}>Назад</button>
                  </div>
                  <div>
                    <button onClick={() => generateAndDownloadExcel(context?.filteredTableData, "Маршрутный_лист")}>Экспорт</button>
                  </div>

                </div>
                :
          (
            <>              
            </>
          )}
      
        </div>
        { context.selectedTable === "Заявки" && context.selectPage === "Main" &&
          <div className={styles.countInfo}>
            <CountInfoBlock dataCount={context?.filteredTableData} keys="status" value="Новая заявка" color="#d69a81" name="Новых"/>
            <CountInfoBlock dataCount={context?.filteredTableData} keys="status" value="В работе" color="#ffe78f" name="В работе"/>
            <CountInfoBlock dataCount={context?.filteredTableData} keys="status" value="Выполнена" color="#C5E384" name="Выполнены"/>
          </div>
        }
      </div>
    </>
  );
}

export default FunctionTableTop;
