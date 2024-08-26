import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import { GetAllRequests, GetAllUsers, RemoveContractor, ReseachDataRequest, SetRole, SetStatusRequest, SetcontractorRequest } from "../../API/API";
import App from "../../App";
import { tableUser } from "./Data";
import { SamplePoints } from "../../UI/SamplePoints/SamplePoints";
import { removeTableCheckeds } from "../../store/filter/isChecked.slice";
import { useDispatch } from "react-redux";
import { FilteredSample, funFixEducator } from "../../UI/SamplePoints/Function";

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
    5: "Принята",
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
      statusPopRef.current && !statusPopRef.current.contains(event.target) && event.target.tagName != "LI" && event.target.className != "Table_shovStatusPop__LcpzL"
    ) {
      setshovStatusPop("");
    }
    if (
      builderPopRef.current && !builderPopRef.current.contains(event.target) && event.target.tagName != "LI" && event.target.className != "Table_shovStatusPop__LcpzL"
    ) {
      setshovBulderPop("");
    }
    if (
      urgencyPopRef.current && !urgencyPopRef.current.contains(event.target) && event.target.tagName != "LI" && event.target.className != "Table_shovStatusPop__LcpzL"
    ) {
      setshovUrgencyPop("");
    }
    if (
      ItineraryOrderPopRef.current && !ItineraryOrderPopRef.current.contains(event.target) && event.target.tagName != "LI" && event.target.className != "Table_shovStatusPop__LcpzL"
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
    if(arr?.length-1 === index && index === arr?.length-1){
      return true
    }else{
      return false
    }
  }

  const getItem = (item) =>{
    if(item === null || item === undefined){
      return "___"
    }else{
      return item
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

  const resechDate = (value)=>{
    if(value){
      let date = value.split("T")
      let dateFormat = date[0].split("-")
      return `${dateFormat[2]}.${dateFormat[1]}.${dateFormat[0]}`
    }else{
      return "___"
    }
  }

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
 const clickTh = (key,index) => {
  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Принята",
  };
  let modalData = [];
  if(key === "number" || key === "contractor" || key === "builder" || key === "status" || key === "unit"){
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
  } 
};

const dispatch = useDispatch();
 //!функция сброса фильтров
 const refreshFilters = () => {
  context.setIsChecked([]);
  context.setAllChecked([]);
  dispatch(removeTableCheckeds());
  const fdfix = FilteredSample(funFixEducator(context.tableData));
  context.setFilteredTableData(fdfix, []);
};

const getRole = (value) =>{
  if(value !== null){
    if(value === "ADMIN"){
      return "Администратор"
    }else{
      return "Пользователь"
    }
  }else{
    return "___"
  }
}
// const GetClassName = (selectPage, value) => {
//   if (selectPage === "Main") {
//     if (value === "Новая заявка") {
//       return "RedColor";
//     } else if (value === "В работе") {
//       return "YellowColor";
//     } else if (value === "Выполнена") {
//       return "GreenColor"; // Fixed typo from 'GeenColor' to 'GreenColor'
//     } else {
//       return "StatusClick"; // Fixed typo from 'tatusClick' to 'StatusClick'
//     }
//   } else {
//     return "";
//   }
// }
const GetClassName = (selectPage, value) => {
  if (selectPage === "Main") {
    switch (value) {
      case "Новая заявка":
        return styles.RedColor;
      case "В работе":
        return styles.YellowColor;
      case "Выполнена":
        return styles.GreenColor;
      default:
        return styles.StatusClick;
    }
  }
  return "";
}

return (
    <>
      
        <div className={styles.Table}>
          <table className={styles.TableInner}>
          {(context.selectedTable === "Заявки" && context.selectPage === "Main") ?(
            <thead>
            { (context.selectedTable === "Заявки" && context.selectPage === "Main") && <div className={styles.dropFilter} onClick={refreshFilters} title="нажмите для сброса фильтров"><img src="./img/ClearFilter.svg"/></div>}
              <tr>
                {context.tableHeader.map((item,index) => (
                  <th onClick={() => {clickTh(item.key, index)}} name={item.key} key={item.key}>
                    <div className={styles.thTable}>

                      {item.value} 
                      {actiwFilter === item.key && <SamplePoints
                          index={index+1}
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
                          {context.isChecked.find(el => el.itemKey === item.key) &&  <img src="./img/filterColumn.svg"/>}
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
            <tbody>
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
                  {context.tableHeader.map((headerItem) => (
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
                                ? "#dd2e2e" //красный
                                : row[headerItem.key] === "В работе" 
                                ? "#FFE20D" // желтый
                                : row[headerItem.key] === "Выполнена" 
                                ? "#22bf22"  // зеленый
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
                      ): headerItem.key === "photo" ? (
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
                      ) : headerItem.key === "contractor" ? (
                        <div
                          onClick={() => context.selectPage === "Main" && funSetBulder(row.id)}
                          className={context.selectPage === "Main" && styles.statusClick}
                          ref={builderPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
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
                                ? "#dd2e2e" //красный
                                : row[headerItem.key] === "В течении текущего дня" 
                                ? "#f9ab23" // оранжевый
                                : row[headerItem.key] === "В течении 3-х дней" 
                                ? "#FFE20D"  // желтый
                                : row[headerItem.key] === "В течении недели" 
                                ? "#eaf45b"  // светло желтый
                                : row[headerItem.key] === "Выполнено" 
                                ? "#22bf22"  // зеленый
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
                          onClick={() =>ClickRole(row.id, row[headerItem.key])}
                          className={styles.statusClick}
                        >
                          {getRole(row[headerItem.key])}
                        </div>
                      ):
                       headerItem.key === "itineraryOrder" ? (
                        <div
                          onClick={() => context.selectPage != "Main" && funSetItineraryOrder(row.id)}
                          className={context.selectPage != "Main" && styles.statusClick}
                          ref={ItineraryOrderPopRef}
                        >
                         {row[headerItem.key]}
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
                        <p style={{whiteSpace: (headerItem.key === "createdAt" ||  headerItem.key === "completeDate") ? 'nowrap' : 'wrap'}}>{(headerItem.key === "createdAt" ||  headerItem.key === "completeDate") ? resechDate(row[headerItem.key]) : getItem(row[headerItem.key])}</p>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              </>
            ):(
              <tr style={{ pointerEvents: "none"}}><td style={{background: "#fff"}}><div className={styles.noteData}>Нет данных</div></td></tr>
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
    </>
  );
}

export default Table;
