import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import { GetAllRequests, GetAllUsers, RemoveContractor, ReseachDataRequest, SetRole, SetStatusRequest, SetcontractorRequest } from "../../API/API";
import App from "../../App";
import { tableList, tableUser } from "./Data";
import { SamplePoints } from "../../UI/SamplePoints/SamplePoints";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import { useDispatch, useSelector } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";
import СonfirmDelete from "../СonfirmDelete/СonfirmDelete";
function Table() {
  const { context } = useContext(DataContext);
  const [actiwFilter, setActiwFilter] = useState(null);
  const trClick = (row) => {
    context.setSelectedTr(row.id);
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
    // {id:5, name:"ВЫПОЛНИТЬ СЕГОДНЯ"},
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
  const [itineraryOrderPop,setItineraryOrderPop] = useState("");
  const [modalImage, setModalImage] = useState(null);
  const statusPopRef = useRef(null);
  const builderPopRef = useRef(null);
  const urgencyPopRef = useRef(null);
  const ItineraryOrderPopRef = useRef(null)
  const [arrCount, setArrCount] = useState([])

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
    }
  };

  useEffect(() => {
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
  const idInteger = roleUser.find(el => el.name === role)?.id;
  if(idInteger === 1){
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
  // console.log("el", el.target.tagName)
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

  document.addEventListener('click', handleClickOutside);
  return () => {
      document.removeEventListener('click', handleClickOutside);
  };
}, [context]);

const setPerformersDirectory = (el) => {
  console.log("el", el)
};
return (
    <>
      
        <div className={styles.Table} style={{overflow: context.filteredTableData.length === 0 ? 'hidden' : 'auto'}}>
          <table className={styles.TableInner} >
          {(context.selectedTable === "Заявки" && context.selectPage === "Main") ?(
            <thead>
              <tr>
              {storeTableHeader.filter((el)=>(el.isActive === true)).map((item, index) => (
                                <th onClick={(el) => { clickTh(item.key, index, el) }} name={item.key} key={item.key}>
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
                {context.tableHeader.map((item,index) => (
                  <th onClick={() => {clickTh(item.key, index)}} name={item.key} key={item.key} className={styles.headerNotMain}>
                      {item.value} 
                  </th>
                ))}
              </tr>
            </thead>
            )
          }
            <tbody >
            {context.filteredTableData.length > 0 ? (
            
           <>
              {context.filteredTableData.map((row, index) => (  
                <tr
                  key={index}
                  onClick={() => trClick(row)}
                  className={
                    context.selectedTr === row.id && styles.setectedTr
                  }
                >
                
                  { (context.selectedTable === "Заявки" ? storeTableHeader.filter((el)=>(el.isActive === true)) :  context.tableHeader ).map((headerItem) => (
                    <td key={headerItem.key}>
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
                            <div className={styles.shovStatusPop} style={checkHeights(context.filteredTableData,index) ? {top:"-70%", width: "150px"} : {width: "150px"}}>
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
                          {getItem(row[headerItem.key])}
                          {shovBulderPop === row.id && (
                            <div className={styles.shovStatusPop} style={checkHeights(context.filteredTableData,index) ? {top:"-70%", width: "200%"} : {width: "200%"}}  >
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
                                {/* <li onClick={() => setPerformersDirectory(row.id)}>Внешний исполнитель</li> */}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : headerItem.key === "urgency" ? (
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
                            <div className={styles.shovStatusPop} style={checkHeights(context.filteredTableData,index) ? {top:"-70%", width: "200%"} : {width: "200%"}}
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
                          onClick={() =>(row[headerItem.key] === 1 || row[headerItem.key] === 2 && ClickRole(row.id, row[headerItem.key]))}
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
                            <div className={styles.shovStatusPop} style={checkHeights(context.filteredTableData, index) ? {top:"-10%", right:"100px", width: "auto"} : {width: "auto"}}>
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
              <tr className={styles.tdNotData} style={{ pointerEvents: "none"}}><td style={{background: "#e3dfda"}}><div className={styles.noteData}>Нет данных</div></td></tr>
            )}
            </tbody>
          </table>
        </div>
      

      {modalImage && (
        <div className={styles.modal} onClick={closeModal}>
          <span className={styles.close}>&times;</span>
          <img className={styles.modalContent} src={modalImage} alt="Full size" />
        </div>
      )}
      {
        context.popUp === "СonfirmDelete" &&  <СonfirmDelete />
      }
     
    </>
  );
}

export default Table;
