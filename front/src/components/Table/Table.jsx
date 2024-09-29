import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import { DeleteExtContractorsRequest, GetAllRequests, GetAllUsers, GetextContractorsAll, RemoveContractor, ReseachDataRequest, SetExtContractorsRequest, SetRole, SetStatusRequest, SetcontractorRequest } from "../../API/API";
import App from "../../App";
import { tableList, tableUser } from "./Data";
import { SamplePoints } from "../../UI/SamplePoints/SamplePoints";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import { useDispatch, useSelector } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";
import СonfirmDelete from "./../СonfirmDelete/СonfirmDelete";
import СonfirmDeleteUser from "./../СonfirmDeleteUser/СonfirmDeleteUser";
import { use } from "echarts";
import Contextmenu from "../../UI/Contextmenu/Contextmenu";
function Table() {
  const { context } = useContext(DataContext);
  const [actiwFilter, setActiwFilter] = useState(null);
  const [coordinatesX, setCoordinatesX] = useState(0);
  const [openConextMenu, setOpenConextMenu] = useState(false);
  const [coordinatesY, setCoordinatesY] = useState(0);
  const trClick = (row, target) => {
    console.log("target",target.tagName)
    context.setSelectedTr(row.id);
    if(target.className !== "Table_statusClick__QSptV" && target.tagName !== "LI"){
      if(context.moreSelect.includes(row.id)){
        context.setMoreSelect(context.moreSelect.filter(item => item !== row.id))
      }else{
        context.setMoreSelect([...context.moreSelect, row.id])
      }    
    }
  
  };

  const trClickRight = (row, target) => {
    if(target.className !== "Table_statusClick__QSptV" && target.tagName !== "LI" && !context.moreSelect.includes(row.id)){
        context.setMoreSelect([...context.moreSelect, row.id])
    }
    setOpenConextMenu(true)
  
  };



  const contextmenuClick = (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing
    const x = event.clientX; // Get the X coordinate
    const y = event.clientY; // Get the Y coordinate
    setCoordinatesX(x);
    setCoordinatesY(y);
  
    if (event.target.className !== "Table_statusClick__QSptV" && event.target.tagName !== "LI") {
      console.log("target", event.target);
    }
  };

  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
  };

  const DataUrgency = [
    {id:1, name:"В течении часа"},
    {id:2, name:"В течении текущего дня"},
    {id:3, name:"В течении 3-х дней"},
    {id:4, name:"В течении недели"},
    {id:5, name:"Маршрут"},
    {id:6, name:"Выполнено"}
  ];

  const roleUser =[
    {id:1, name:"USER"},
    {id:2, name:"ADMIN"},
  ]

  const [shovStatusPop, setshovStatusPop] = useState("");
  const [shovBulderPop, setshovBulderPop] = useState("");
  const [shovUrgencyPop, setshovUrgencyPop] = useState("");
  const [shovExtPop, setshovExtPop] = useState("");
  const [itineraryOrderPop,setItineraryOrderPop] = useState("");
  const [modalImage, setModalImage] = useState(null);
  const statusPopRef = useRef(null);
  const builderPopRef = useRef(null);
  const urgencyPopRef = useRef(null);
  const extPopRef = useRef(null);
  const ItineraryOrderPopRef = useRef(null)
  const [arrCount, setArrCount] = useState([])
  const [dataBuilder, setDataBuilder] = useState({});
  const contextmenuRef = useRef(null);
  const editStatus = (status, id) => {
    const data = {
      requestId: id,
      status: status,
    };
    SetStatusRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const funSetStatus = (data) => {
    if (shovStatusPop === "") {
      setshovStatusPop(data);
      setshovUrgencyPop("");
      setshovBulderPop("");
      setItineraryOrderPop("")
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("")
    }
  };

  const funSetBulder = (data) => {
    if (shovBulderPop === "") {
      setshovBulderPop(data);
      setshovStatusPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("")
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("")
    }
  };

  const funSetUrgency = (data) => {
    if (shovUrgencyPop === "") {
      setshovUrgencyPop(data);
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("")
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("")
    }
  };

  const funSetItineraryOrder = (data) =>{
    if (itineraryOrderPop === "") {
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop(data)
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("")
    }
  }

  const funSetExp = (data) => {
    if (shovExtPop === "") {
      setshovExtPop(data);
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("")
    } else {
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("")
    }
  };

  const openModal = (src) => {
    setModalImage(src);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const SetBilder = (contractorId, idAppoint) =>{
    const data = {
      requestId: idAppoint,
      contractorId: contractorId,
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  }

  const SetCountCard = (el, idAppoint) =>{
    const idInteger = context.dataContractors.find(el => el.name === context?.tableData[0].contractor.name)?.id;
    const data = {
      itineraryOrder: el,
    };
    ReseachDataRequest(idAppoint, data).then((resp)=>{
      if(resp?.status === 200){
        context.UpdateTableReguest(3, idInteger);
      }
    })
  }

  const SetUrgency = (name, idAppoint) =>{
    const data = {
      urgency: name,
    };
    ReseachDataRequest(idAppoint, data).then((resp)=>{
      context.UpdateTableReguest(1);
    })
  }

  const handleClickOutside = (event) => {
    if (contextmenuRef.current && !contextmenuRef.current.contains(event.target)) {
      setOpenConextMenu(false)
    }
    if (
      statusPopRef.current && !statusPopRef.current.contains(event.target) && event.target.tagName !== "LI" && event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovStatusPop("");
    }
    if (
      builderPopRef.current && !builderPopRef.current.contains(event.target) && event.target.tagName !== "LI" && event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovBulderPop("");
    }
    if (
      urgencyPopRef.current && !urgencyPopRef.current.contains(event.target) && event.target.tagName !== "LI" && event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovUrgencyPop("");
    }
    if (
      ItineraryOrderPopRef.current && !ItineraryOrderPopRef.current.contains(event.target) && event.target.tagName !== "LI" && event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setItineraryOrderPop("");
    }if(
      extPopRef.current && !extPopRef.current.contains(event.target) && event.target.tagName !== "LI" && event.target.className !== "Table_shovStatusPop__LcpzL"){
        setshovExtPop("");
      }
  };

  useEffect(() => {
    GetextContractorsAll().then((response) => {
      setDataBuilder(response.data);
     });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   setFilteredTableData(context.tableData)
  // },[context.tableData, context.selectedTable])

  const checkHeights = (arr,index) =>{
    if(arr?.length-1 === index && index === arr?.length-1  && arr?.length !== 1){
      return true
    }else{
      return false
    }
  }

  const getItem = (item, key) =>{
   
    if(key === "repairPrice" && key !== "isConfirmed"){
      return    item?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") 
    }if(key === "isConfirmed") {
   
      if(item === true){
        return "Активирован"
      }else{
        return "Не активирован"
      }
    }else{
    if(item === null || item === undefined || item === "null" || item === "undefined" || item === "" || item === " "){
      return "___"
    }else{
      return item
    }
  }
  };


  const getContractorItem = (row, ) =>{
  if(row?.isExternal){
    return "Внешний подрядчик"
  }else{
    if(row?.contractor){
      return row?.contractor
    }else{
      return "___"
    }
  }
  }

  const getCountList = () => {
    let count = context.tableData?.length;
    let countList = [];
    for (let i = 0; i < count; i++) {
      countList.push(i + 1);
    }
    setArrCount(countList);
  }

  useEffect(()=>{
    getCountList()
  },[context.Dataitinerary])


  const deleteBilder = (id) =>{
    const data = {
      requestId: id
    }
    RemoveContractor(data).then((resp)=>{
      if(resp?.status === 200){
        context.UpdateTableReguest(1);
      }
    })
  }
 const ClickRole = (id, role) =>{
  let data = {};
  if(role === 1){
    data = {
      role: 2,
      userId: id
    };
  }else{
    data = {
      role: 1,
      userId: id
    };
  }
 if(id !== JSON.parse(sessionStorage.getItem("userData")).user?.id){
  SetRole(data).then((resp)=>{
    if(resp?.status === 200){
      context.UpdateTableReguest(2);
    }
  })
 }else{
  context.setPopUp("PopUpError");
  context.setPopupErrorText("Вы не можете изменить свою роль!");
 }

 }
 //! открытие модального окна фильтрации столбца
 const clickTh = (key,index, el) => {
  if(el?.target?.tagName !== "IMG"){
  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Принята",
  };
  let modalData = [];
  if(key !== "photo" && key !== "checkPhoto"){
    if(key === "status"){
      modalData = context?.tableData.map(
        (item) => status[item[key]]);
    }else{
      modalData = context?.tableData.map(
        (item) => item[key]?.name || item[key] 
      );
    }
      context.setSamplePointsData([...modalData]);
      setActiwFilter(key);
  }}
};



const getRole = (value) =>
 {
  if(value !== null){
    if(value === 2){
      return "Администратор"
    }else if(value === 1){
      return "Пользователь"
    }else if(value === 3){
      return "Заказчик"
    }else{
      return "Исполнитель"
    }
  }else{
    return "___"
  }
}

// Initialize sort state as an object
const [sortImg, setSortImg] = useState(0);

// Function to handle sorting
const funSortByColumn = (key) => {
  let par = "";
  const newSortState = { ...context.sortState }; // Копируем текущее состояние сортировки

  // Проверяем, есть ли уже сортировка по этому столбцу
  if (!newSortState[key]) {
      par = `col=${key}&type=${"asc"}`;
      newSortState[key] = { type: "asc" }; // Устанавливаем сортировку по возрастанию
  } else if (newSortState[key].type === "asc") {
      par = `col=${key}&type=${"desc"}`;
      newSortState[key] = { type: "desc" }; // Устанавливаем сортировку по убыванию
  } else {
      par = ""; // Сбрасываем сортировку
      newSortState[key] = null; // Убираем сортировку для этого столбца
  }

  // Сбрасываем сортировку для остальных столбцов
  for (const col in newSortState) {
      if (col !== key) {
          newSortState[col] = null; // Сбрасываем состояние для остальных столбцов
      }
  }

  context.setSortState(newSortState); // Обновляем состояние сортировки
  context.setSortStateParam(par);
  context.UpdateTableReguest(1, par);
};

const storeTableHeader = useSelector(state => state.editColumTableSlice.ActiveColumTable);


useEffect(() => {
  const handleClickOutside = (event) => {
      if (!event.target.closest('tr') && !event.target.closest('button')) {
          context.setSelectedTr(null);
      }
  };
  WhatNanItem()
  document.addEventListener('click', handleClickOutside);
  return () => {
      document.removeEventListener('click', handleClickOutside);
  };

}, [context]);

const setPerformersDirectory = (el) => {
  const data = {
    requestId : el,
    contractorId: "Внешний подрядчик"
  }

  SetcontractorRequest(data).then((resp) => {
    if (resp?.status === 200) {
      context.UpdateTableReguest(1);
    }
  });
};

const SetExp = (requestId, ExpId) =>{
 const data = {
  requestId : requestId,
  extContractorId: ExpId
 }
 SetExtContractorsRequest(data).then((resp) => {
  if (resp?.status === 200) {
    context.UpdateTableReguest(1);
    setshovExtPop("");
  }
 })
}

const getItemBuilder = (row) => {
  if(row?.extContractor && row?.isExternal){
    return row?.extContractor?.name
  }else{
    return "___"
  }

}

const deleteExp = (id) => {
  const data = {
    requestId : id
  }
  DeleteExtContractorsRequest(data).then((resp) => {
    if (resp?.status === 200) {
      context.UpdateTableReguest(1);
    }
  });
};

const textAlign = (keys,item) => {
  if(keys === "number" || keys === "itineraryOrder" || keys === "id" || keys === "createdAt" || keys === "daysAtWork" || keys === "completeDate" || keys === "createdAt" || keys === "repairPrice" ){
    return "center"
  }
  else if(item === null){
    return "center"
  }
  else{
    return "left"
  }
}
const WhatNanItem = () => {
  const tds = document.querySelectorAll("td[name='name']")
  tds?.forEach((el)=>{
    if(el.innerText === "___"){
      el.style.textAlign = "center"
    }
  })
}

const whatPageBgTd = (row) => {
  if(context?.selectedTable === "Заявки"){
    if(context.moreSelect.some((el) => el === row)){
      return "#D8CDC1FF"
    }
  }else{
    if(context.selectedTr === row){
      return "#D8CDC1FF"
    }
  }
}

const checkedAllFunc = () => {
  if(context.moreSelect.length > 0){
    return true
  }else{
    return false
  }
}

const clickAllTh = () => {
  if(context?.moreSelect?.length > 0){
    context.setMoreSelect([])
  }else{
    context.filteredTableData.map((el) => context.setMoreSelect((prevState) => [...prevState, el.id]))
  }
}

return (
    <div className={styles.TableWrapper}>
      
        <div className={styles.Table} style={{overflow: context?.filteredTableData.length === 0 ? 'hidden' : 'auto'}}>
          <table className={styles.TableInner}>
          {(context.selectedTable === "Заявки" && context.selectPage === "Main") ?(
            <thead>
              <tr>
              <th name="checkAll" className={styles.MainTh}>
                <input type="checkbox" name="checkAll" className={styles.checkbox} checked={checkedAllFunc()} onClick={clickAllTh}></input>
              </th>
              {storeTableHeader?.filter((el)=>(el.isActive === true)).map((item, index) => (
                                <th onClick={(el) => { clickTh(item.key, index, el) }} name={item.key} key={item.key} className={styles.MainTh}>
                                    <div className={styles.thTable}>
                                        {item.value}
                                        
                                        { item.key !== "number" && item.key !== "photo" && item.key !== "checkPhoto" &&
                                          <img
                                            onClick={() => funSortByColumn(item.key)}
                                            className={styles.thSort}
                                            src={
                                                context?.sortState[item.key]?.type === "desc"
                                                    ? "./img/sort.svg"
                                                    : context?.sortState[item.key]?.type === "asc"
                                                    ? "./img/sort.svg"
                                                    : "./img/=.svg" // Нейтральное состояние
                                            }
                                            title="Сортировать колонку"
                                            alt=">"
                                            style={{
                                                transition: "all 0.2s ease",
                                                transform: context?.sortState[item.key]?.type === "asc" ? "rotate(-180deg)" : "none"
                                            }}  
                                          />
                                        }


                                        {actiwFilter === item.key && <SamplePoints
                                            index={index + 1}
                                            actiwFilter={actiwFilter}
                                            itemKey={item.key}
                                            isSamplePointsData={context.isSamplePointsData}
                                            isAllChecked={context.isAllChecked}
                                            isChecked={context.isChecked}
                                            setIsChecked={context.setIsChecked}
                                            workloadData={context.dataTableFix}
                                            setWorkloadDataFix={context.setFilteredTableData}
                                            setSpShow={setActiwFilter}
                                            sesionName={`isCheckedFilter`}
                                        />}
                                        {context.isChecked.find(el => el.itemKey === item.key) && <img src="./img/filterColumn.svg" />}
                                    </div>
                                </th>
                            ))}
              </tr>
            </thead>
            )
            :(
              <thead>
                <tr>
                {context?.tableHeader.map((item,index) => (
                  <th onClick={() => {clickTh(item.key, index)}} name={item.key} key={item.key} className={styles.headerNotMain}>
                      {item.value} 
                  </th>
                ))}
              </tr>
            </thead>
            )
          }
            <tbody >
              {context?.filteredTableData.length > 0 ? (
           <>
              {context?.filteredTableData.map((row, index) => (  
                <tr
                  key={index}
                  onClick={(e) => {
                    const target = e.target;
                    (context.selectedTable === "Заявки" || context.selectedTable === "Пользователи") && trClick(row, target ); 
                  }}
                  
                  onContextMenu={(e) => {
                    const target = e.target;
                    context.selectedTable === "Заявки" && trClickRight(row, target ); 
                    context.selectedTable === "Заявки" && contextmenuClick(e); // Use onContextMenu instead of contextmenu
                  }}
                  className={
                    context.selectedTable === "Заявки" ? context.moreSelect.some((el) => el === row.id) && styles.setectedTr : context.selectedTr === row.id && styles.setectedTr
                  }
                 
                >
                {context.selectedTable === "Заявки" &&
                  <td name="checkAll" style={{textAlign: "center", backgroundColor: whatPageBgTd(row.id)}} className={styles.MainTd}>
                    <input type="checkbox" checked={context.moreSelect.some((el) => el === row.id) } key={index} name="checkAll" className={styles.checkbox}></input>
                  </td>
                }
                  { (context.selectedTable === "Заявки" ? storeTableHeader?.filter((el)=>(el.isActive === true)) :  context.tableHeader ).map((headerItem) => (
                    <td key={headerItem.key} name={headerItem.key} className={context.selectedTable === "Заявки" && styles.MainTd}  style={{textAlign: textAlign(headerItem.key, row[headerItem.key]), backgroundColor: whatPageBgTd(row.id)}}>
                      {headerItem.key === "id" ? (
                        index + 1
                      ) : headerItem.key === "status" ? (
                        <div
                          onClick={() => context.selectPage === "Main" && funSetStatus(row.id)}
                          className={context.selectPage === "Main" && styles.statusClick}
                          style={{
                          whiteSpace: 'nowrap',
                          backgroundColor: 
                            context.selectPage === "Main" 
                              ? row[headerItem.key] === "Новая заявка" 
                                ? "#d69a81" //красный
                                : row[headerItem.key] === "В работе" 
                                ? "#ffe78f" // желтый
                                : row[headerItem.key] === "Выполнена" 
                                ? "#C5E384"  // зеленый
                                : ""
                              : ""
                        }}                         
                        ref={statusPopRef}
                        >
                          {row[headerItem.key]}
                          {shovStatusPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context?.filteredTableData,index) ? {top:"-70%", width: "150px"} : {width: "150px"}}>
                              <ul>
                                {Object.values(status).map((value, index) => (
                                  <li
                                    onClick={() => editStatus(index + 1, row.id)}
                                    key={index}
                                  >
                                    {value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : headerItem.key === "isActivated" ? (
                        <>{row[headerItem.key] === true ? "Активириван" : "Не активирован"}</>
                      ): headerItem.key === "photo"  ? (
                        <div>
                          <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`}
                            alt="Uploaded file"
                            onClick={() =>
                              openModal(
                                `${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`
                              )
                            }
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                          />
                        </div>
                      )
                        : headerItem.key === "checkPhoto"  ? (
                        <div>
                        {
                          row.checkPhoto === null
                            ? "___"
                            : <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${row.checkPhoto}`}
                            alt="checkPhoto file"
                            onClick={() =>
                              openModal(
                                `${process.env.REACT_APP_API_URL}/uploads/${row.checkPhoto}`
                              )
                            }
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                          />
                        }
                         
                        </div>
                      ) : headerItem.key === "contractor" ? (
                        <div
                          onClick={() => context.selectPage === "Main" && funSetBulder(row.id)}
                          className={context.selectPage === "Main" && styles.statusClick}
                          ref={builderPopRef}
                        >
                          {getContractorItem(row)}
                          {shovBulderPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context?.filteredTableData,index) ? {top:"-70%", width: "200%"} : {width: "200%", right:"-365px", top:"40px"}}>
                              <ul>
                              { row[headerItem.key] !== null && <li onClick={() => deleteBilder(row.id)}>Удалить исполнителя</li>}
                                {context.dataContractors?.map((value, index) => (
                                  <li
                                    onClick={() => SetBilder(value.id, row.id)}
                                    key={index}
                                  >

                                    {value.name}
                                  </li>
                                ))}
                                <li onClick={() => setPerformersDirectory(row.id)}>Внешний подрядчик</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : headerItem.key === "builder" && context?.filteredTableData[index].isExternal?  (
                        <div
                          onClick={() => context.selectPage === "Main" && funSetExp(row.id)}
                          className={context.selectPage === "Main" && styles.statusClick}
                          ref={extPopRef}
                        >
                          {getItemBuilder(row)} 
                          {shovExtPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context?.filteredTableData,index) ? {top:"-70%", width: "200%"} : {width: "200%"}}  >
                              <ul>
                              { row[headerItem.key] !== null && <li onClick={() => deleteExp(row.id)}>Удалить подрядчика</li>}
                                {dataBuilder?.map((value, index) => (
                                  <>
                                    <li
                                      onClick={() => SetExp(row.id, value.id)}
                                      key={index}
                                    >
                                      {value.name}
                                    </li>
                                  </>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ): headerItem.key === "urgency" ? (
                        <div
                        
                          onClick={() => context.selectPage === "Main" && funSetUrgency(row.id)}
                          className={context.selectPage === "Main" && styles.statusClick}
                          style={{
                          backgroundColor: 
                            context.selectPage === "Main" 
                              ? row[headerItem.key] === "В течении часа" 
                                ? "#d69a81" //красный
                                : row[headerItem.key] === "В течении текущего дня" 
                                ? "#f9ab23" // ?оранжевый
                                : row[headerItem.key] === "В течении 3-х дней" 
                                ? "#ffe78f"  // желтый
                                : row[headerItem.key] === "В течении недели" 
                                ? "#eaf45b"  // ?светло желтый
                                : row[headerItem.key] === "Выполнено" 
                                ? "#C5E384"  // зеленый
                                : ""
                              : ""
                        }}     
                          ref={urgencyPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
                          {shovUrgencyPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context?.filteredTableData,index) ? {top:"-70%", width: "200%"} : {width: "200%"}}
                            >
                              <ul>
                                {DataUrgency?.map((value, index) => (
                                  <li
                                    onClick={() => SetUrgency(value.name, row.id)}
                                    key={index}
                                  >
                                    {value.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ):
                       headerItem.key === "role" ? (
                        <div
                          onClick={() =>((row[headerItem.key] === 1 || row[headerItem.key] === 2) && JSON.parse(localStorage.getItem("userData")).user.role === "ADMIN" &&ClickRole(row.id, row[headerItem.key]))}
                          className={styles[(row[headerItem.key] === 1 || row[headerItem.key] === 2) && JSON.parse(localStorage.getItem("userData")).user.role === "ADMIN" ? "statusClick" : ""]}
                        >
                          {getRole(row[headerItem.key])}
                        </div>
                      ):
                       headerItem.key === "itineraryOrder" ? (
                        <div
                          onClick={() => context.selectPage !== "Main" && funSetItineraryOrder(row.id)}
                          className={context.selectPage !== "Main" && styles.statusClick}
                          ref={ItineraryOrderPopRef}
                        >
                         {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
                          {itineraryOrderPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context?.filteredTableData, index) ? {top:"-10%", right:"100px", width: "auto"} : {width: "auto"}}>
                              <ul>
                              {
                                arrCount.map((el)=>{
                                  return  <li key={el} onClick={(event) => SetCountCard(el, row.id)}> {el}</li>
                                })
                              }

                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{whiteSpace: (headerItem.key === "createdAt" ||  headerItem.key === "completeDate") ? 'nowrap' : 'wrap'}}>{getItem(row[headerItem.key],headerItem.key)}</p>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              </>
            ):(
             <tr><td colSpan={15} className={styles.tableNotData}>Нет данных</td></tr>
            )}
            </tbody>
          </table>
         
        </div>
        { context.selectedTable === "Заявки" && <div><p style={{margin: "10px 0 0 0px"}}>Кол-во выбранных заявок: {context.moreSelect.length}</p></div>}
    
      {modalImage && (
        <div className={styles.modal} onClick={closeModal}>
          <span className={styles.close}>&times;</span>
          <img className={styles.modalContent} src={modalImage} alt="Full size" />
        </div>
      )}
      {
        context.popUp === "СonfirmDelete" &&  <СonfirmDelete />    
      }
      {
        context.popUp === "СonfirmDeleteUser" &&  <СonfirmDeleteUser/>
      }
      {openConextMenu &&
        <div ref={contextmenuRef} style={{display:openConextMenu ? "block" : "none"}}>
          <Contextmenu X={coordinatesX} Y={coordinatesY} setOpenConextMenu={setOpenConextMenu}/>
        </div>
      }
    </div>
  );
}

export default Table;
