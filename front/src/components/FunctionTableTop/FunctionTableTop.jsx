import React, { useEffect, useState } from "react";
import styles from "./FunctionTableTop.module.scss";
import List from "../../UI/List/List";
import Input from "../../UI/Input/Input";
import DataContext from "../../context";
import { DeleteRequest, DeleteUserFunc, RejectActiveAccount } from "../../API/API";
import { useDispatch, useSelector } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import CountInfoBlock from "../../UI/CountInfoBlock/CountInfoBlock";
import EditColum from "../../UI/EditColum/EditColum";
import { filterRequestsWithoutCopiedId, generateAndDownloadExcel } from "../../function/function";
import { tableList } from "../Table/Data";
import { useNavigate } from "react-router-dom";
import { dropFilters, resetFilters } from "../../store/samplePoints/samplePoits";



function FunctionTableTop(props) {
  const defaultValue = "Заявки";
  const { context } = React.useContext(DataContext);
  const [dataTable, setDataTable] = useState([]);
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
const store = useSelector(
  (state) => state.isSamplePoints["table9"].isChecked
);
useEffect(() => {
  if(context?.textSearchTableData || store.length !== 0){
    setDataTable(context?.dataTableHomePage);
  }else{
    setDataTable(filterBasickData(context?.dataApointment, store));
  }
}, [store, context?.dataApointment, context?.textSearchTableData, context?.dataTableHomePage]);

  const dispatch = useDispatch();

const goBackCurd = () =>{
  context.setSelectPage("Card");
  context.setSelectContractor("");
  context.setextSearchTableData("");
  context.setSelectedTr(null)
  context.settableHeader(tableList);
  context.setSelectedTable("Card");
}


//! функция фильтрации
function filterBasickData(data, chekeds) {
  let tb = [...data];
  let mass = [];
  tb.filter((el) => {
    if (chekeds.find((it) => el[it.itemKey] === it.value)) {
      return;
    } else {
      mass.push(el);
    }
  });
  return mass;
}
const DropFilter = () =>{
  context.setTotalCount(0);
  context.setOfset(0);
  context.setLoader(false);
  context.setDataTableHomePage([]);
  context.UpdateForse();
  dispatch(resetFilters({tableName: "table9"}))
  dispatch(dropFilters({tableName: "table9"}))
}

// //!При обновлении обновляет только 1 запись 
// const UpdateRequest = (updatedRequest) => {
//   const updatedDataTable = context.dataTableHomePage.map((item) =>
//     item.id === updatedRequest.id ? updatedRequest : item
//   );
//   context.setDataTableHomePage(funFixEducator(updatedDataTable));
// };

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
              { (context.selectedTable === "Заявки" && context.selectPage === "Main") && <div className={styles.dropFilter}  onClick={() => DropFilter()} title="нажмите для сброса фильтров"><img src="./img/ClearFilter.svg"/></div>}

              </>
              }
              
            </div>
          </div>
          {context.selectedTable === "Заявки" && context.selectPage === "Main" ? (
            <div className={styles.HeadMenuMain}>
            <EditColum/>
            {JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" &&
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
            }
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
            <CountInfoBlock dataCount={filterRequestsWithoutCopiedId(dataTable)} keys="status" value="Новая заявка" color="#d69a81" name="Новых"/>
            <CountInfoBlock dataCount={filterRequestsWithoutCopiedId(dataTable)} keys="status" value="В работе" color="#ffe78f" name="В работе"/>
            <CountInfoBlock dataCount={filterRequestsWithoutCopiedId(dataTable)} keys="status" value="Выполнена" color="#C5E384" name="Выполнены"/>
          </div>
        }
      </div>
    </>
  );
}

{/* <div className={styles.countInfo}>
<div>
  <div className={styles.CountInfoBlock} style={{backgroundColor: "#d69a81"}}>
      <div className={styles.contNew}><p>Новых: {12}</p></div>
  </div>    
</div> 
<div>
    <div className={styles.CountInfoBlock} style={{backgroundColor:  "#ffe78f"}}>
        <div className={styles.contNew}><p>В работе: {12}</p></div>
    </div>    
</div> 
<div>
    <div className={styles.CountInfoBlock} style={{backgroundColor:  "#C5E384"}}>
        <div className={styles.contNew}><p>Выполнены: {12}</p></div>
    </div>    
</div> 

</div> */}
export default FunctionTableTop;
