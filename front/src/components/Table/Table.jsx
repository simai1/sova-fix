import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import {
  DeleteExtContractorsRequest,
  GetOneRequests,
  GetextContractorsAll,
  RemoveContractor,
  ReseachDataRequest,
  SetExtContractorsRequest,
  SetRole,
  SetStatusRequest,
  SetcontractorRequest,
} from "../../API/API";
// import { SamplePoints } from "../../UI/SamplePoints/SamplePoints";
import { useSelector } from "react-redux";
import СonfirmDelete from "./../СonfirmDelete/СonfirmDelete";
import Contextmenu from "../../UI/Contextmenu/Contextmenu";
import SamplePoints from "../SamplePoints/SamplePoints";
import FilteImg from "./../../assets/images/filterColumn.svg";
import { status, DataUrgency } from "./Data";
import { funFixEducator } from "../../UI/SamplePoints/Function";
function Table() {
  const { context } = useContext(DataContext);
  const [actiwFilter, setActiwFilter] = useState(null);
  const [coordinatesX, setCoordinatesX] = useState(0);
  const [openConextMenu, setOpenConextMenu] = useState(false);
  const [coordinatesY, setCoordinatesY] = useState(0);

  const trClick = (row, target) => {
    context.setSelectedTr(row.id);
    if (
      target.className !== "Table_statusClick__QSptV" &&
      target.tagName !== "LI" && target.className !== "planCompleteDate"
    ) {
      if (context.moreSelect.includes(row.id)) {
        context.setMoreSelect(
          context.moreSelect.filter((item) => item !== row.id)
        );
      } else {
        context.setMoreSelect([...context.moreSelect, row.id]);
      }
    }
  };

  const trClickRight = (row, target) => {
    if (
      target.className !== "Table_statusClick__QSptV" &&
      target.tagName !== "LI" &&
      !context.moreSelect.includes(row.id) &&
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER"
    ) {
      context.setMoreSelect([...context.moreSelect, row.id]);
    }
    if(JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER"){
      setOpenConextMenu(true);
    }
  };

  const contextmenuClick = (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing
    const x = event.clientX; // Get the X coordinate
    const y = event.clientY; // Get the Y coordinate
    setCoordinatesX(x);
    setCoordinatesY(y);
  };

  const store = useSelector((state) => state.isSamplePoints["table9"].isChecked);
  const [shovStatusPop, setshovStatusPop] = useState("");
  const [shovBulderPop, setshovBulderPop] = useState("");
  const [shovUrgencyPop, setshovUrgencyPop] = useState("");
  const [shovExtPop, setshovExtPop] = useState("");
  const [itineraryOrderPop, setItineraryOrderPop] = useState("");
  const [modalImage, setModalImage] = useState(null);
  const statusPopRef = useRef(null);
  const builderPopRef = useRef(null);
  const urgencyPopRef = useRef(null);
  const extPopRef = useRef(null);
  const ItineraryOrderPopRef = useRef(null);
  const [arrCount, setArrCount] = useState([]);
  const [dataBuilder, setDataBuilder] = useState({});
  const contextmenuRef = useRef(null);

  //! Юз эффект при загрузке страницы
  useEffect(() => {
    GetextContractorsAll().then((response) => {
      setDataBuilder(response.data);
    });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

   //! Юз эффект при загрузке контекстов
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("tr") && !event.target.closest("button")) {
        context.setSelectedTr(null);
      }
    };
    WhatNanItem();
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [context]);


  const togglePopupState = (setter, data) => {
    const userRole = JSON.parse(localStorage.getItem("userData"))?.user?.role;
    setter((currentState) => {
      if (currentState === "") {
        if (userRole !== "OBSERVER") {
          return data;
        }
      }
      return "";
    });
  };
     
  //!функция смены статуса
  const funSetStatus = (data) => {
    togglePopupState(setshovStatusPop, data);
    setshovUrgencyPop("");
    setshovBulderPop("");
    setItineraryOrderPop("");
  };
   
  //!функция смены исполнителя
  const funSetBulder = (data) => {
    togglePopupState(setshovBulderPop, data);
    setshovStatusPop("");
    setshovUrgencyPop("");
    setItineraryOrderPop("");
  };
  
   //!функция смены объекта
  const funSetUrgency = (data) => {
    togglePopupState(setshovUrgencyPop, data);
    setshovStatusPop("");
    setshovBulderPop("");
    setItineraryOrderPop("");
  };

  //!функция смены подрядчика
  const funSetExp = (data) => {
    togglePopupState(setshovExtPop, data);
    setshovStatusPop("");
    setshovBulderPop("");
    setshovUrgencyPop("");
    setItineraryOrderPop("");
  };
  
  const openModal = setModalImage;
  const closeModal = () => setModalImage(null);
  
   //!Запрос на смену исполнителя
  const SetBilder = (contractorId, idAppoint) => {
    const data = { requestId: idAppoint, contractorId };
    SetcontractorRequest(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(idAppoint).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  };


  //!Запрос смены статуса
  const editStatus = (status, requestId) => {
    const data = {
      requestId: requestId,
      status: status,
    };
    SetStatusRequest(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(requestId).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  };
  
   //!Запрос на удаление билдера
  const deleteBilder = (requestId) => {
    const data = {
      requestId: requestId,
    };
    RemoveContractor(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(requestId).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  };
  
  //!При обновлении обновляет только 1 запись 
  const UpdateRequest = (updatedRequest) => {
    const editAppoint = funFixEducator(updatedRequest)
    const updatedDataTable = context.dataTableHomePage.map((item) =>
      item.id === editAppoint.id ? editAppoint : item
    );
    context.setDataTableHomePage(updatedDataTable);
    const updateDataAppoint = context.dataApointment.map((item) =>
      item.id === editAppoint.id ? editAppoint : item
    );
    context.setDataAppointment(updateDataAppoint)
  };
  

  //!Запрос на смену срочности
  const SetUrgency = (name, idAppoint) => {
    const data = { urgency: name };
    ReseachDataRequest(idAppoint, data).then((resp) => {
      if(resp?.status === 200){
      GetOneRequests(idAppoint).then((resp) => {
          if(resp?.status === 200){
            UpdateRequest(resp?.data)
          }
        })
      }
    });
  };
  
  //!Запрос на внешнего подрядчика
  const setPerformersDirectory = (requestId) => {
    const data = {
      requestId: requestId,
      contractorId: "Внешний подрядчик",
    };

    SetcontractorRequest(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(requestId).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  };

   //!Запрос на установку extContractor
  const SetExp = (requestId, ExpId) => {
    const data = {
      requestId: requestId,
      extContractorId: ExpId,
    };
    SetExtContractorsRequest(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(requestId).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
              setshovExtPop("");
            }
          })
        }
    });
  };

   //!Запрос на установку новой планорвой даты выполнения  
  const selectadNewPlanDateFunction = (id, date) => {
    const data = {
      planCompleteDate: new Date(date)
    }
    ReseachDataRequest(id, data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(id).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  }
   //!Запрос на удаление extContractor
  const deleteExp = (id) => {
    const data = {
      requestId: id,
    };
    DeleteExtContractorsRequest(data).then((resp) => {
      if(resp?.status === 200){
        GetOneRequests(id).then((resp) => {
            if(resp?.status === 200){
              UpdateRequest(resp?.data)
            }
          })
        }
    });
  };

  //!функция для обработки PopUp-ов
  const handleClickOutside = (event) => {
    const clickOutside = (ref, setter) => {
      if (
        ref.current &&
        !ref.current.contains(event.target) &&
        event.target.tagName !== "LI" &&
        event.target.className !== "Table_shovStatusPop__LcpzL"
      ) {
        setter("");
      }
    };
  
    clickOutside(contextmenuRef, () => {
      setOpenConextMenu(false);
      setActiwFilter("");
    });
  
    clickOutside(statusPopRef, setshovStatusPop);
    clickOutside(builderPopRef, setshovBulderPop);
    clickOutside(urgencyPopRef, setshovUrgencyPop);
    clickOutside(ItineraryOrderPopRef, setItineraryOrderPop);
    clickOutside(extPopRef, setshovExtPop);
  };

  //!Провека на последний элемент
  const checkHeights = (arr, index) => index === arr.length - 1 && arr.length !== 1;

  //!Если внешний отображать 
  const getContractorItem = (row) => {
    if(row?.isExternal) {
      return "Внешний подрядчик"
    }else if(row?.contractor === "___") {
      return "Не назначен"
    }else{
      return row?.contractor
    }
  }
 

  //!Получение количества элементов
  const getCountList = () => setArrCount(
    Array.from({ length: context.tableData?.length || 0 }, (_, i) => i + 1)
  );

  useEffect(() => {
    getCountList();
  }, [context.Dataitinerary]);

  //! открытие модального окна фильтрации столбца
  const clickTh = (key, index, el) => {
    if (el?.target?.tagName !== "IMG" && key !== "fileName" && key !== "number" && key !== "problemDescription" && key !== "repairPrice" && key !== "commentAttachment" && key !== "checkPhoto") {
      const modalData = key === "status" ? context.tableData.map((item) => status[item[key]]) : context.tableData.map((item) => item[key]?.name || item[key]);
      context.setSamplePointsData(modalData);
      setActiwFilter(key);
    }
  };

  const sortDataTable = () => {
    if (!context.sortStateParam) {
      // Если параметр сортировки отсутствует, сортируем по `number` по возрастанию
      const sortedData = [...context?.dataTableHomePage].sort((a, b) => b.number - a.number);
      context.setDataTableHomePage(sortedData);
      return;
    }
  
    const [colPart, typePart] = context.sortStateParam.split("&");
    const col = colPart.split("=")[1]; // Извлекаем имя столбца
    const type = typePart.split("=")[1]; // Извлекаем тип сортировки (asc/desc)
  
    const sortedData = [...context?.dataTableHomePage].sort((a, b) => {
      if (a[col] === null || a[col] === undefined) return 1; // Сортируем null/undefined в конец
      if (b[col] === null || b[col] === undefined) return -1;
  
      if (typeof a[col] === "string") {
        // Сортируем строки
        return type === "asc"
          ? a[col].localeCompare(b[col])
          : b[col].localeCompare(a[col]);
      }
  
      if (typeof a[col] === "number" || a[col] instanceof Date) {
        // Сортируем числа и даты
        return type === "asc" ? a[col] - b[col] : b[col] - a[col];
      }
  
      return 0; // Для остальных типов данных
    });
  
    context.setDataTableHomePage(sortedData); // Обновляем состояние с отсортированными данными
  };

  useEffect(() => {
    sortDataTable(); // Выполняем сортировку при изменении параметров сортировки
  }, [context.sortStateParam]);
  

  
  //! Function to handle sorting
  const funSortByColumn = (key) => {
    let par = "";
    const newSortState = { ...context.sortState }; 

    if (!newSortState[key]) {
      par = `col=${key}&type=${"asc"}`;
      newSortState[key] = { type: "asc" }; 
    } else if (newSortState[key].type === "asc") {
      par = `col=${key}&type=${"desc"}`;
      newSortState[key] = { type: "desc" }; 
    } else {
      par = ""; 
      newSortState[key] = null; 
    }

    for (const col in newSortState) {
      if (col !== key) {
        newSortState[col] = null;
      }
    }

    context.setSortState(newSortState); 
    context.setSortStateParam(par);
  };

  const storeTableHeader = useSelector(
    (state) => state.editColumTableSlice.ActiveColumTable
  );

  //! функция на определение исполнителя
  const getItemBuilder = (row) => {
    if(row?.builder === "Внешний подрядчик"){
      return "Не назначен";
    }
    if (row?.builder && row?.isExternal) {
      return row?.builder;
    } else {
      return "Не назначен";
    }
  };

   //! функция на определение TextAlign
  const textAlign = (key, item) => ["number", "itineraryOrder", "id", "createdAt", "daysAtWork", "completeDate", "repairPrice", "commentAttachment", "planCompleteDate"].includes(key) || item === "___" ? "center" : "left";

  //! функция на определение файл видео формата или нет
  const isVideo = (fileName) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
    return videoExtensions.some(ext => fileName.endsWith(ext));
  };

  //! Функция фильтрации всех столбцов пустых
  const WhatNanItem = () => {
    const tds = document.querySelectorAll("td[name='name']");
    tds?.forEach((el) => {
      if (el.innerText === "___") {
        el.style.textAlign = "center";
      } else {
        el.style.textAlign = "left";
      }
    });
  };

  //! Функция определения заднего фона
  const whatPageBgTd = (row) => {
    const isSelected = context?.selectedTable === "Заявки" 
      ? context.moreSelect.includes(row) 
      : context.selectedTr === row;
    return isSelected ? "#D8CDC1FF" : undefined;
  };

  useEffect(() => {
    context.checkedAllFunc();
  }, [context.filteredTableData, context?.moreSelect]);

  //! Функция нвжвтия на глобальный Th
  const clickAllTh = () => {
    if (context?.moreSelect?.length > 0) {
      context.setMoreSelect([]);
    } else {
      const ids = context?.dataTableHomePage?.map((el) => el.id) || [];
      context.setMoreSelect(ids);
    }
  };
  
  //! Функция разрешения фильтрации
  const filterAndNote = (key) => {
      const arrayNotFilter = [
        "number", "fileName", "checkPhoto", "problemDescription", "repairPrice", "commentAttachment"
      ]
      if (arrayNotFilter.includes(key)) {
        return false
      }else{
        return true
      }
  }

   //! Функция Получения цвета Urgensy
  const getColorUrgensy = (value) =>{
    switch (value) {
      case "В течение часа":
        return "#d69a81" //красный
      case "В течение текущего дня":
        return "#f9ab23" // ?оранжевый
      case "В течение 3-х дней":
        return "#ffe78f" // желтый
      case "В течение недели":
        return "#eaf45b" // ?светло желтый
      case "Выполнено":
        return "#C5E384" // зеленый
      default:
        return ""
    }
  }

 //! Функция Получения цвета Status
  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case "Новая заявка":
        return "#d69a81";
      case "В работе":
        return "#ffe78f";
      case "Выполнена":
        return "#C5E384";
      case "Выезд без выполнения":
        return "#f9ab23";
      default:
        return "";
    }
  };

  const getValue = (value, key, index, row) => {
    switch (key) {
      case "id":
        return index + 1;
      case "status":
        return (
          <div
            onClick={() => funSetStatus(row.id)}
            className={styles.statusClick}
            style={{ backgroundColor: getStatusColor(value) }}
            ref={statusPopRef}
            key={new Date().getTime() + row.id}
          >
            {value}
            {shovStatusPop === row.id && (
              <div
                className={styles.shovStatusPop}
                style={
                  checkHeights(context?.dataTableHomePage, index)
                    ? { top: "-70%", width: "250px" }
                    : { width: "250px" }
                }
              >
                <ul>
                  {Object.values(status).map((statusValue, statusIndex) => (
                    <li
                      onClick={() => editStatus(statusIndex + 1, row.id)}
                      key={statusIndex}
                    >
                      {statusValue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "number":
        return (
          <div key={new Date().getTime() + row.id}>
            {row?.copiedRequestId !== null ? `(${value})` : value}
          </div>
        );
      case "contractor": 
              return (
                <div
                onClick={() => funSetBulder(row.id)}
                className={styles.statusClick}
                ref={builderPopRef}
                key={new Date().getTime() + row.id}
              >
                {getContractorItem(row)}
                {shovBulderPop === row.id && (
                  <div
                    className={styles.shovStatusPop}
                    style={
                      checkHeights(context?.dataTableHomePage, index)
                        ? { top: "-70%", width: "200%" }
                        : {
                            width: "200%",
                            right: "-365px",
                            top: "40px",
                          }
                    }
                  >
                    <ul>
                      {value !== "___" && (
                        <li onClick={() => deleteBilder(row.id)}>
                          Удалить исполнителя
                        </li>
                      )}
                      {context.dataContractors?.map(
                        (value, index) => (
                          <li onClick={() => SetBilder(value.id, row.id)} key={index}>
                            {value.name}
                          </li>
                        )
                      )}
                      <li onClick={() =>setPerformersDirectory(row.id)}>
                        Внешний подрядчик
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              );
      case "builder":
        return (
          row.isExternal ? (
            <div
              onClick={() => funSetExp(row.id)}
              className={styles.statusClick}
              ref={extPopRef}
              key={new Date().getTime() + row.id}
            >
              {getItemBuilder(row)}
              {shovExtPop === row.id && (
                <div
                  className={styles.shovStatusPop}
                  style={
                    checkHeights(context?.dataTableHomePage, index)
                      ? { top: "-70%", width: "200%" }
                      : { width: "200%" }
                  }
                >
                  <ul>
                    {value && value !== "___" && value !== "Внешний подрядчик" && (
                      <li onClick={() => deleteExp(row.id)}>
                        Удалить подрядчика
                      </li>
                    )}
                    {dataBuilder?.map((builder, idx) => (
                      <li onClick={() => SetExp(row.id, builder.id)} key={idx}>
                        {builder.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ): (
            value || "___"
          )
        );
      case "urgency":
        return (
          <div
            onClick={() => funSetUrgency(row.id)}
            className={ styles.statusClick }
            style={{
              backgroundColor: getColorUrgensy(value)
            }}
            ref={urgencyPopRef}
            key={new Date().getTime() + row.id}
          >
            {value || "___"}
            {shovUrgencyPop === row.id && (
              <div
                className={styles.shovStatusPop}
                style={
                  checkHeights(context?.dataTableHomePage, index)
                    ? { top: "-70%", width: "200%" }
                    : { width: "200%" }
                }
              >
                <ul>
                  {DataUrgency?.map((value, index) => (
                    <li
                      onClick={() =>
                        SetUrgency(value.name, row.id)
                      }
                      key={index}
                    >
                      {value.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "repairPrice":
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "___";
      case "planCompleteDate":
        return (
          <>
            {value === "___" || value === null ? (
              "___"
            ) : (
              JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" ? (
                <div className={styles.planCompleteDate} key={new Date().getTime() + row.id}>
                  <input
                    type="date"
                    value={row["planCompleteDateRaw"].split('T')[0]} // Extracting date part from ISO string
                    onChange={(e) => {
                      selectadNewPlanDateFunction(row.id, e.target.value);
                    }}
                  />
                </div>
              ) : (
                value
              )
            )}
          </>
        );
      case "fileName":
        case "commentAttachment":
          case "checkPhoto" :
              return (value !== null && value !== "___") ? (
                <div  key={new Date().getTime() + row.id}>
                { isVideo(value) ? (
                  <div className={styles.fileVideoTable}>
                    <video
                      onClick={(e) => {
                        e.preventDefault(); // Prevent the default action
                        e.stopPropagation(); // Prevent the modal from closing
                        openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`);
                      }}
                      style={{ cursor: "pointer" }}
                      className={styles.videoTable}
                    >
                      <source src={`${process.env.REACT_APP_API_URL}/uploads/${value}`} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <img
                    src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                    alt="Uploaded file"
                    onClick={() =>
                      openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)
                    }
                    style={{ cursor: "pointer" }}
                    className={styles.imgTable}
                  />
                )}
              </div>
              ) : (
                "___"
              );
      case "createdAt":
        case "completeDate":
          return <p key={new Date().getTime() + row.id} style={{ whiteSpace: "nowrap" }}>{value || "___"}</p>
      default:
        return <p style={{ whiteSpace: "wrap" }} key={new Date().getTime() + row.id} >{value || "___"}</p>
    }
  };

  const tableRef = useRef(null); // Ссылка на таблицу для отслеживания скролла
  const handleScroll = () => {
    const container = tableRef.current?.parentElement;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScrollTop = scrollHeight - clientHeight;
      if (scrollTop >= maxScrollTop - 1 && context.loader && context.totalCount > context?.dataTableHomePage.length) {
        context.setLoader(false); // Отключаем загрузку, чтобы предотвратить повторные запросы
        context.setOfset((prev) => prev + 10); // Обновляем offset для запросаё

      }
    }
  };

  useEffect(() => {
    context.UpdateTableReguest(); // Загружаем данные, когда offset изменился
  }, [context.ofset]);
  
  useEffect(() => {
    const container = tableRef.current?.parentElement;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
  
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [context.loader]); // Следим за состоянием loader

  
  
  
  return (
    <div className={styles.TableWrapper}>
      <div
        className={styles.Table}
        style={{
          overflow: context?.dataTableHomePage.length === 0 ? "hidden" : "auto",
        }}
      >
        <table className={styles.TableInner} ref={tableRef}>
          <thead>
            <tr>
              <th name="checkAll" className={styles.MainTh}>
                <input
                  type="checkbox"
                  name="checkAll"
                  className={styles.checkbox}
                  checked={context.checkedAll}
                  onClick={clickAllTh}
                  readOnly
                ></input>
              </th>
              {storeTableHeader
                ?.filter((el) => el.isActive === true)
                ?.map((item, index) => (
                  <th
                    onClick={(el) => {
                      clickTh(item.key, index, el);
                    }}
                    name={item.key}
                    key={item.key}
                    className={styles.MainTh}
                  >
                    <div className={styles.thTable}>
                      {item.value}

                      {filterAndNote(item.key) && (
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
                              transform:
                                context?.sortState[item.key]?.type === "asc"
                                  ? "rotate(-180deg)"
                                  : "none",
                            }}
                          />
                        )}

                      {actiwFilter === item.key && (
                        <div
                          className={styles.sampleComponent}
                          ref={contextmenuRef}
                          style={{
                            top: "70px",
                            position: "absolute",
                            left: item.key === "legalEntity" ? "-110px" : "0",
                          }}
                        >
                          <SamplePoints
                            basickData={context.dataApointment} // нефильтрованные данные
                            tableBodyData={context.dataApointment} // фильтрованные данные
                            punkts={[
                              ...context.dataApointment.map((it) =>
                                it[item.key] === null ? "___" : it[item.key]
                              ),
                              ...store
                                .filter((it) => it.itemKey === item.key)
                                .map((it) => it.value),
                            ].sort((a, b) => {
                              return String(a).localeCompare(String(b));
                            })}
                            itemKey={item.key} // ключь пунта
                            tableName={"table9"}
                          />
                        </div>
                      )}
                      {store.find((elem) => elem.itemKey === item.key) && (
                          <img src={FilteImg} />
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {!context.loader ? (
              <tr>
                <td colSpan="21" className={styles.tableNotDataSpinner}>
                  <div className={styles.tableNotDataSpinnerInner}>
                      <div className={styles.spinnerContainer}>
                        <div className={styles.spinner}></div>
                      </div>
                      <div className={styles.notDataSpinner}>Загрузка данных</div>
                  </div>
                </td>
              </tr>
            ):(
              <>
              {context?.dataTableHomePage.length > 0 ? (
              <>
                {context?.dataTableHomePage?.map((row, index) => (
                    <tr
                      key={index}
                      style={{backgroundColor: row?.copiedRequestId !== null ? "#ffe78f" : ""}}
                      onClick={(e) => {trClick(row, e.target)}}
                      onContextMenu={(e) => {trClickRight(row, e.target); contextmenuClick(e)}}
                      className={context.moreSelect.some((el) => el === row.id) ? styles.setectedTr : ""}
                    >
                        <td
                        key={new Date().getTime() + row.id}
                          name="checkAll"
                          style={{textAlign: "center", backgroundColor: whatPageBgTd(row.id)}}
                          className={styles.MainTd}
                          id={row?.copiedRequestId !== null && "copiedRequestId"}
                        >
                          <input
                            type="checkbox"
                            checked={context.moreSelect.some((el) => el === row.id)}
                            key={index}
                            name="checkAll"
                            className={styles.checkbox}
                            readOnly
                          />
                        </td>
                        {storeTableHeader?.filter((el) => el.isActive === true)?.map((headerItem) => (
                          <td
                            key={headerItem.key}
                            name={headerItem.key}
                            className={styles.MainTd}
                            id={row?.copiedRequestId !== null && "copiedRequestId"}
                            style={{textAlign: textAlign(headerItem.key,row[headerItem.key]), backgroundColor: whatPageBgTd(row.id)}}
                          >
                            {getValue(row[headerItem.key], headerItem.key, index, row)}
                          </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={21} className={styles.tableNotData}></td>
                  <div className={styles.notData}> Нет данных</div>
                </tr>
              )}
              </>
            )
            
            }
          </tbody>
        </table>
      </div>
      {
      context.loader && <div>
        <p style={{ margin: "10px 0 0 0px" }}>
          Кол-во выбранных заявок: {context.moreSelect.length}
        </p>
      </div>
      }
  
      

      {modalImage && (
        <div className={styles.modal}>
          <span className={styles.close} onClick={closeModal}>&times;</span>
            {isVideo(modalImage) ? (
              <video
                controls
                className={styles.modalContent}
                src={modalImage}
                alt="Full size video"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div onClick={closeModal}>

              <img
                className={styles.modalContent}
                src={modalImage}
                alt="Full size"
              />
              </div>
            )}
        </div>
      )}
      {context.popUp === "СonfirmDelete" && <СonfirmDelete />}
      {openConextMenu && (
        <div
          ref={contextmenuRef}
          style={{ display: openConextMenu ? "block" : "none" }}
        >
          <Contextmenu
            X={coordinatesX}
            Y={coordinatesY}
            setOpenConextMenu={setOpenConextMenu}
          />
        </div>
      )}
    </div>
  );
}

export default Table;
