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

  const [modalImage, setModalImage] = useState(null);

  const statusPopRef = useRef(null);
  const builderPopRef = useRef(null);
  const urgencyPopRef = useRef(null);

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
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
    }
  };

  const funSetBulder = (data) => {
    if (shovBulderPop === "") {
      setshovBulderPop(data);
      setshovStatusPop("");
      setshovUrgencyPop("");
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
    }
  };

  const funSetUrgency = (data) => {
    if (shovUrgencyPop === "") {
      setshovUrgencyPop(data);
      setshovStatusPop("");
      setshovBulderPop("");
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
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
      if (resp) {
        context.UpdateTableReguest(1);
      }
    });
  }

  const SetUrgency = (name, idAppoint) =>{
    const data = {
      urgency: name,
    };
    console.log('data', data)
    ReseachDataRequest(idAppoint, data).then((resp)=>{
      context.UpdateTableReguest(1);
    })
  }

  //!Тут ошибкаа проверить
  const handleClickOutside = (event) => {
    if (
      statusPopRef.current && !statusPopRef.current.contains(event.target)
    ) {
      setshovStatusPop("");
    }
    if (
      builderPopRef.current && !builderPopRef.current.contains(event.target)
    ) {
      setshovBulderPop("");
    }
    if (
      urgencyPopRef.current && !urgencyPopRef.current.contains(event.target)
    ) {
      setshovUrgencyPop("");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredTableData = context.tableData.filter((row) =>
    Object.values(row).some(
      (value) =>
        value && 
        value.toString().toLowerCase().includes(context.textSearchTableData.toLowerCase())
    )
  );

  const getItem = (item) =>{
    if(item === null || item === undefined){
      return "___"
    }else{
      return item
    }
  };

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
                          onClick={() => funSetStatus(row.id)}
                          className={styles.statusClick}
                          ref={statusPopRef}
                        >
                          {status[row[headerItem.key]]}
                          {shovStatusPop === row.id && (
                            <div className={styles.shovStatusPop}>
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
                          onClick={() => funSetBulder(row.id)}
                          className={styles.statusClick}
                          ref={builderPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key]?.name : "___"}
                          {shovBulderPop === row.id && (
                            <div className={styles.shovStatusPop}>
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
                          onClick={() => funSetUrgency(row.id)}
                          className={styles.statusClick}
                          ref={urgencyPopRef}
                        >
                          {row[headerItem.key] !== null ? row[headerItem.key] : "___"}
                          {shovUrgencyPop === row.id && (
                            <div className={styles.shovStatusPop}>
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
                      ): (
                        getItem(row[headerItem.key])
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
