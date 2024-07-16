import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import { ReseachDataRequest, SetStatusRequest, SetcontractorRequest } from "../../API/API";

function Table() {
  const { context } = useContext(DataContext);

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
    {id:5, name:"ВЫПОЛНИТЬ СЕГОДНЯ"},
    {id:6, name:"Маршрут"},
    {id:7, name:"Выполнено"}
  ];

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
      if (resp) {
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
      if (resp) {
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
      if(resp.status === 200){
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
      statusPopRef.current && !statusPopRef.current.contains(event.target) && event.target.tagName != "LI"  
    ) {
      setshovStatusPop("");
    }
    if (
      builderPopRef.current && !builderPopRef.current.contains(event.target) && event.target.tagName != "LI"
    ) {
      setshovBulderPop("");
    }
    if (
      urgencyPopRef.current && !urgencyPopRef.current.contains(event.target) && event.target.tagName != "LI"
    ) {
      setshovUrgencyPop("");
    }
    if (
      ItineraryOrderPopRef.current && !ItineraryOrderPopRef.current.contains(event.target) && event.target.tagName != "LI"
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

  const filteredTableData = context.tableData.filter((row) => {
    const values = Object.values(row).flatMap(value => {
      if (typeof value === 'object' && value !== null) {
        return Object.values(value);
      }
      return value;
    });
  
    return values.some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(context.textSearchTableData.toLowerCase())
    );
  });
  

  const getItem = (item) =>{
    if(item === null || item === undefined){
      return "___"
    }else{
      return item
    }
  };

  const getCountList = () => {
    let count = context.tableData.length;
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
      return `${dateFormat[2]}-${dateFormat[1]}-${dateFormat[0]}`
    }else{
      return "___"
    }
  }
  
  return (
    <>
      {filteredTableData.length > 0 ? (
        <div className={styles.Table}>
          <table className={styles.TableInner}>
            <thead>
              <tr>
                {context.tableHeader.map((item) => (
                  <th key={item.key}>{item.value}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTableData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => trClick(row)}
                  className={
                    context.selectedTr === row.id ? styles.setectedTr : null
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
                          ref={statusPopRef}
                        >
                          {status[row[headerItem.key]]}
                          {shovStatusPop === row.id && (
                            <div className={styles.shovStatusPop} style={{width: "150px"}}>
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
                            src={`http://localhost:3000/uploads/${row.fileName}`}
                            alt="Uploaded file"
                            onClick={() =>
                              openModal(
                                `http://localhost:3000/uploads/${row.fileName}`
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
                          {row[headerItem.key] !== null ? row[headerItem.key]?.name : "___"}
                          {shovBulderPop === row.id && (
                            <div className={styles.shovStatusPop} style={{width: "200%"}}>
                              <ul>
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
                          ref={urgencyPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
                          {shovUrgencyPop === row.id && (
                            <div className={styles.shovStatusPop} style={{width: "200%"}}>
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
                      ): headerItem.key === "itineraryOrder" ? (
                        <div 
                          onClick={() => context.selectPage != "Main" && funSetItineraryOrder(row.id)}
                          className={context.selectPage != "Main" && styles.statusClick}
                          ref={ItineraryOrderPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
                          {itineraryOrderPop === row.id && (
                            <div className={styles.shovStatusPop} style={{width: "auto"}}>
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
                        (headerItem.key === "createdAt" ||  headerItem.key === "completeDate") ? resechDate(row[headerItem.key]) : getItem(row[headerItem.key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.notdata}>Нет данных</div>
      )}

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
