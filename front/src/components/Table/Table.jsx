import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import {
  DeleteExtContractorsRequest,
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
      target.tagName !== "LI"
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

  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Выезд без выполнения",
  };

  const DataUrgency = [
    { id: 1, name: "В течение часа" },
    { id: 2, name: "В течение текущего дня" },
    { id: 3, name: "В течение 3-х дней" },
    { id: 4, name: "В течение недели" },
    { id: 5, name: "Маршрут" },
    { id: 6, name: "Выполнено" },
  ];
  const store = useSelector(
    (state) => state.isSamplePoints["table9"].isChecked
  );
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
  const [dataTable, setDataTable] = useState(context?.filteredTableData);

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

  //! при клике на пункт li убираем его из массива данных таблицы
  useEffect(() => {
    setDataTable(filterBasickData(context.dataTableFix, store));
  }, [store, context?.filteredTableData]);


  const editStatus = (status, id) => {
    const data = {
      requestId: id,
      status: status,
    };
    console.log("data", data)
    SetStatusRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const funSetStatus = (data) => {
    if (shovStatusPop === "") {
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setshovStatusPop(data);
      setshovUrgencyPop("");
      setshovBulderPop("");
      setItineraryOrderPop("");
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("");
    }
  };

  const funSetBulder = (data) => {
    if (shovBulderPop === "") {
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setshovBulderPop(data);
      setshovStatusPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("");
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("");
    }
  };

  const funSetUrgency = (data) => {
    if (shovUrgencyPop === "") {
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setshovUrgencyPop(data);
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("");
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("");
    }
  };

  const funSetItineraryOrder = (data) => {
    if (itineraryOrderPop === "") {
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setItineraryOrderPop(data);
    } else {
      setshovStatusPop("");
      setshovBulderPop("");
      setshovUrgencyPop("");
      setItineraryOrderPop("");
    }
  };

  const funSetExp = (data) => {
    if (shovExtPop === "") {
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setshovExtPop(data);
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("");
    } else {
      setshovUrgencyPop("");
      setshovStatusPop("");
      setshovBulderPop("");
      setItineraryOrderPop("");
    }
  };

  const openModal = (src) => {
    setModalImage(src);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const SetBilder = (contractorId, idAppoint) => {
    const data = {
      requestId: idAppoint,
      contractorId: contractorId,
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const SetCountCard = (el, idAppoint) => {
    const idInteger = context.dataContractors.find(
      (el) => el.name === context?.tableData[0].contractor.name
    )?.id;
    const data = {
      itineraryOrder: el,
    };
    ReseachDataRequest(idAppoint, data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(3, idInteger);
      }
    });
  };

  const SetUrgency = (name, idAppoint) => {
    const data = {
      urgency: name,
    };
    ReseachDataRequest(idAppoint, data).then((resp) => {
      context.UpdateTableReguest(1);
    });
  };

  const handleClickOutside = (event) => {
    if (
      contextmenuRef.current &&
      !contextmenuRef.current.contains(event.target)
    ) {
      setOpenConextMenu(false);
      setActiwFilter("");
    }
    if (
      statusPopRef.current &&
      !statusPopRef.current.contains(event.target) &&
      event.target.tagName !== "LI" &&
      event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovStatusPop("");
    }
    if (
      builderPopRef.current &&
      !builderPopRef.current.contains(event.target) &&
      event.target.tagName !== "LI" &&
      event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovBulderPop("");
    }
    if (
      urgencyPopRef.current &&
      !urgencyPopRef.current.contains(event.target) &&
      event.target.tagName !== "LI" &&
      event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setshovUrgencyPop("");
    }
    if (
      ItineraryOrderPopRef.current &&
      !ItineraryOrderPopRef.current.contains(event.target) &&
      event.target.tagName !== "LI" &&
      event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
      setItineraryOrderPop("");
    }
    if (
      extPopRef.current &&
      !extPopRef.current.contains(event.target) &&
      event.target.tagName !== "LI" &&
      event.target.className !== "Table_shovStatusPop__LcpzL"
    ) {
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

  const checkHeights = (arr, index) => {
    if (
      arr?.length - 1 === index &&
      index === arr?.length - 1 &&
      arr?.length !== 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const getItem = (item, key) => {
    if (key === "repairPrice" && key !== "isConfirmed") {
      return item?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    } else {
      return item;
    }
  };

  const getContractorItem = (row) => {
    if (row?.isExternal) {
      return "Внешний подрядчик";
    } else {
      if (row?.contractor !== "___") {
        return row?.contractor;
      } else {
        return "Не назначен";
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
  };

  useEffect(() => {
    getCountList();
  }, [context.Dataitinerary]);

  const deleteBilder = (id) => {
    const data = {
      requestId: id,
    };
    RemoveContractor(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  //! открытие модального окна фильтрации столбца
  const clickTh = (key, index, el) => {
    if (el?.target?.tagName !== "IMG") {
      const status = {
        1: "Новая заявка",
        2: "В работе",
        3: "Выполнена",
        4: "Неактуальна",
        5: "Выезд без выполнения",
      };
      let modalData = [];
      if (key !== "photo" && key !== "checkPhoto" && key !== "commentAttachment" && key !== "number" && key !== "problemDescription" && key !== "id" && key !== "repairPrice") {
        if (key === "status") {
          modalData = context?.tableData?.map((item) => status[item[key]]);
        } else {
          modalData = context?.tableData?.map(
            (item) => item[key]?.name || item[key]
          );
        }
        context.setSamplePointsData([...modalData]);
        setActiwFilter(key);
      }
    }
  };

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

  const storeTableHeader = useSelector(
    (state) => state.editColumTableSlice.ActiveColumTable
  );

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

  const setPerformersDirectory = (el) => {
    const data = {
      requestId: el,
      contractorId: "Внешний подрядчик",
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const SetExp = (requestId, ExpId) => {
    const data = {
      requestId: requestId,
      extContractorId: ExpId,
    };
    SetExtContractorsRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
        setshovExtPop("");
      }
    });
  };

  const getItemBuilder = (row) => {
    if (row?.extContractor && row?.isExternal) {
      return row?.extContractor?.name;
    } else {
      return "Не назначен";
    }
  };

  const deleteExp = (id) => {
    const data = {
      requestId: id,
    };
    DeleteExtContractorsRequest(data).then((resp) => {
      if (resp?.status === 200) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const textAlign = (keys, item) => {
    if (
      keys === "number" ||
      keys === "itineraryOrder" ||
      keys === "id" ||
      keys === "createdAt" ||
      keys === "daysAtWork" ||
      keys === "completeDate" ||
      keys === "createdAt" ||
      keys === "repairPrice" ||
      keys === "commentAttachment"
    ) {
      return "center";
    } else if (item === "___") {
      return "center";
    } else {
      return "left";
    }
  };

  // Helper function to check if the file is a video
const isVideo = (fileName) => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
  return videoExtensions.some(ext => fileName.endsWith(ext));
};

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

  const whatPageBgTd = (row) => {
    if (context?.selectedTable === "Заявки") {
      if (context.moreSelect.some((el) => el === row)) {
        return "#D8CDC1FF";
      }
    } else {
      if (context.selectedTr === row) {
        return "#D8CDC1FF";
      }
    }
  };
  useEffect(() => {
    context.checkedAllFunc();
  }, [context.filteredTableData, context?.moreSelect]);

  const clickAllTh = () => {
    if (context?.moreSelect?.length > 0) {
      context.setMoreSelect([]);
    } else {
      context.filteredTableData?.map((el) =>
        context.setMoreSelect((prevState) => [...prevState, el.id])
      );
    }
  };

  const getTgHref = (tg_user_id) => {
    return `tg://user?id=${tg_user_id}`;
  };

  // function filterBasickData(data, chekeds) {
  //   let tb = [...data];
  //   let mass = [];
  //   tb.filter((el) => {
  //     if (chekeds.find((it) => el[it.itemKey] === it.value)) {
  //       return;
  //     } else {
  //       mass.push(el);
  //     }
  //   });
  //   return mass;
  // }



  return (
    <div className={styles.TableWrapper}>
      <div
        className={styles.Table}
        style={{
          overflow: dataTable.length === 0 ? "hidden" : "auto",
        }}
      >
        <table className={styles.TableInner}>
          {context.selectedTable === "Заявки" &&
          context.selectPage === "Main" ? (
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

                        {item.key !== "number" &&
                          item.key !== "photo" &&
                          item.key !== "checkPhoto" && item.key !== "problemDescription" &&  item.key !== "repairPrice" &&  item.key !== "commentAttachment" && (
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
                              basickData={context.dataTableFix} // нефильтрованные данные
                              tableBodyData={filterBasickData(context.dataTableFix, store)} // фильтрованные данные
                              punkts={[
                                ...dataTable.map((it) =>
                                  it[item.key] === null ? "___" : it[item.key]
                                ),
                                ...store
                                  .filter((it) => it.itemKey === item.key)
                                  .map((it) => it.value),
                              ].sort((a, b) => {
                                // Convert to string to avoid TypeError
                                return String(a).localeCompare(String(b));
                              })}
                              itemKey={item.key} // ключь пунта
                              tableName={"table9"}
                            />
                          </div>
                          // <SamplePoints
                          //   index={index + 1}
                          //   actiwFilter={actiwFilter}
                          //   itemKey={item.key}
                          //   isSamplePointsData={context.isSamplePointsData.map(
                          //     (el) => (el === null ? "___" : el)
                          //   )}
                          //   isAllChecked={context.isAllChecked}
                          //   isChecked={context.isChecked}
                          //   setIsChecked={context.setIsChecked}
                          //   workloadData={context.dataTableFix}
                          //   setWorkloadDataFix={context.setFilteredTableData}
                          //   setSpShow={setActiwFilter}
                          //   sesionName={`isCheckedFilter`}
                          // />
                        )}
                        {store.find((elem) => elem.itemKey === item.key) && (
                            <img src={FilteImg} />
                          )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
          ) : (
            <thead>
              <tr>
                {context?.tableHeader?.map((item, index) => (
                  <th
                    onClick={() => {
                      clickTh(item.key, index);
                    }}
                    name={item.key}
                    key={item.key}
                    className={styles.headerNotMain}
                  >
                    {item.value}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {dataTable.length > 0 ? (
              <>
                {dataTable?.map((row, index) => (
                  <tr
                    key={index}
                    onClick={(e) => {
                      const target = e.target;
                      (context.selectedTable === "Заявки" ||
                        context.selectedTable === "Пользователи") &&
                        trClick(row, target);
                    }}
                    onContextMenu={(e) => {
                      const target = e.target;
                      context.selectedTable === "Заявки" &&
                        trClickRight(row, target);
                      context.selectedTable === "Заявки" && contextmenuClick(e); // Use onContextMenu instead of contextmenu
                    }}
                    className={
                      context.selectedTable === "Заявки"
                        ? context.moreSelect.some((el) => el === row.id) &&
                          styles.setectedTr
                        : context.selectedTr === row.id && styles.setectedTr
                    }
                  >
                    {context.selectedTable === "Заявки" && (
                      <td
                        name="checkAll"
                        style={{
                          textAlign: "center",
                          backgroundColor: whatPageBgTd(row.id),
                        }}
                        className={styles.MainTd}
                      >
                        <input
                          type="checkbox"
                          checked={context.moreSelect.some(
                            (el) => el === row.id
                          )}
                          key={index}
                          name="checkAll"
                          className={styles.checkbox}
                          readOnly
                        ></input>
                      </td>
                    )}
                    {(context.selectedTable === "Заявки"
                      ? storeTableHeader?.filter((el) => el.isActive === true)
                      : context.tableHeader
                    )?.map((headerItem) => (
                      <td
                        key={headerItem.key}
                        name={headerItem.key}
                        className={
                          context.selectedTable === "Заявки"
                            ? styles.MainTd
                            : null
                        }
                        style={{
                          textAlign: textAlign(
                            headerItem.key,
                            row[headerItem.key]
                          ),
                          backgroundColor: whatPageBgTd(row.id),
                        }}
                      >
                        {headerItem.key === "id" ? (
                          index + 1
                        ) : headerItem.key === "status" ? (
                          <div
                            onClick={() =>
                              context.selectPage === "Main" &&
                              funSetStatus(row.id)
                            }
                            className={
                              context.selectPage === "Main"
                                ? styles.statusClick
                                : styles.NostatusClick
                            }
                            style={{
                              whiteSpace: "nowrap",
                              backgroundColor:
                                context.selectPage === "Main"
                                  ? row[headerItem.key] === "Новая заявка"
                                    ? "#d69a81" //красный
                                    : row[headerItem.key] === "В работе"
                                    ? "#ffe78f" // желтый
                                    : row[headerItem.key] === "Выполнена"
                                    ? "#C5E384" // зеленый
                                    : row[headerItem.key] === "Выезд без выполнения"
                                    ? "#f9ab23" // ораньжевый
                                    : ""
                                  : "",
                            }}
                            ref={statusPopRef}
                          >
                            {row[headerItem.key]}
                            {shovStatusPop === row.id && (
                              <div
                                className={styles.shovStatusPop}
                                style={
                                  checkHeights(dataTable, index)
                                    ? { top: "-70%", width: "250px" }
                                    : { width: "250px" }
                                }
                              >
                                <ul>
                                  {Object.values(status)?.map(
                                    (value, index) => (
                                      <li
                                        onClick={() =>
                                          editStatus(index + 1, row.id)
                                        }
                                        key={index}
                                      >
                                        {value}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : headerItem.key === "isActivated" ? (
                          <>
                            {row[headerItem.key] === true
                              ? "Активириван"
                              : "Не активирован"}
                          </>
                        ) : headerItem.key === "photo" ? (
                  <div>
                    {isVideo(row.fileName) ? (
                      <div className={styles.fileVideoTable}>
                        <video
                          onClick={(e) => {
                            e.preventDefault(); // Prevent the default action
                            e.stopPropagation(); // Prevent the modal from closing
                            openModal(`${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`);
                          }}
                          style={{ cursor: "pointer" }}
                          className={styles.videoTable}
                        >
                          <source src={`${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <img
                        src={`${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`}
                        alt="Uploaded file"
                        onClick={() =>
                          openModal(`${process.env.REACT_APP_API_URL}/uploads/${row.fileName}`)
                        }
                        style={{ cursor: "pointer" }}
                        className={styles.imgTable}
                      />
                    )}
                  </div>
                ) : headerItem.key === "commentAttachment" ? (
            row.commentAttachment === "___" || row.commentAttachment === null ? (
              "___"
            ) : (
              <div className={styles.fileVideoTable}>
                {isVideo(row.commentAttachment) ? (
                  <video
                    
                    onClick={(e) =>{
                      e.preventDefault(); // Prevent the modal from closing
                      e.stopPropagation();
                      openModal(`${process.env.REACT_APP_API_URL}/uploads/${row.commentAttachment}`)
                    }
                    }
                    style={{ cursor: "pointer" }}
                    className={styles.videoTable}
                  >
                    <source src={`${process.env.REACT_APP_API_URL}/uploads/${row.commentAttachment}`} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={`${process.env.REACT_APP_API_URL}/uploads/${row.commentAttachment}`}
                    alt="Uploaded file"
                    onClick={() =>
                      openModal(`${process.env.REACT_APP_API_URL}/uploads/${row.commentAttachment}`)
                    }
                    style={{ cursor: "pointer" }}
                    className={styles.imgTable}
                  />
                )}
              </div>
            )
          ) : headerItem.key === "checkPhoto" ? (
                          <div>
                            {row.checkPhoto === "___" ? (
                              "___"
                            ) : (
                              <img
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
                            )}
                          </div>
                        ) : headerItem.key === "contractor" ? (
                          <div
                            onClick={() =>
                              context.selectPage === "Main" &&
                              funSetBulder(row.id)
                            }
                            className={
                              context.selectPage === "Main"
                                ? styles.statusClick
                                : styles.NostatusClick
                            }
                            ref={builderPopRef}
                          >
                            {getContractorItem(row)}
                            {shovBulderPop === row.id && (
                              <div
                                className={styles.shovStatusPop}
                                style={
                                  checkHeights(dataTable, index)
                                    ? { top: "-70%", width: "200%" }
                                    : {
                                        width: "200%",
                                        right: "-365px",
                                        top: "40px",
                                      }
                                }
                              >
                                <ul>
                                  {row[headerItem.key] !== "___" && (
                                    <li onClick={() => deleteBilder(row.id)}>
                                      Удалить исполнителя
                                    </li>
                                  )}
                                  {context.dataContractors?.map(
                                    (value, index) => (
                                      <li
                                        onClick={() =>
                                          SetBilder(value.id, row.id)
                                        }
                                        key={index}
                                      >
                                        {value.name}
                                      </li>
                                    )
                                  )}
                                  <li
                                    onClick={() =>
                                      setPerformersDirectory(row.id)
                                    }
                                  >
                                    Внешний подрядчик
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : headerItem.key === "builder" &&
                          dataTable[index].isExternal ? (
                          <div
                            onClick={() =>
                              context.selectPage === "Main" && funSetExp(row.id)
                            }
                            className={
                              context.selectPage === "Main"
                                ? styles.statusClick
                                : styles.NostatusClick
                            }
                            ref={extPopRef}
                          >
                            {getItemBuilder(row)}
                            {shovExtPop === row.id && (
                              <div
                                className={styles.shovStatusPop}
                                style={
                                  checkHeights(dataTable, index)
                                    ? { top: "-70%", width: "200%" }
                                    : { width: "200%" }
                                }
                              >
                                <ul>
                                  {row[headerItem.key] !== null &&
                                    row[headerItem.key] !== "___" &&
                                    row[headerItem.key] !==
                                      "Внешний подрядчик" && (
                                      <li onClick={() => deleteExp(row.id)}>
                                        Удалить подрядчика
                                      </li>
                                    )}
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
                        ) : headerItem.key === "urgency" ? (
                          <div
                            onClick={() =>
                              context.selectPage === "Main" &&
                              funSetUrgency(row.id)
                            }
                            className={
                              context.selectPage === "Main"
                                ? styles.statusClick
                                : styles.NostatusClick
                            }
                            style={{
                              backgroundColor:
                                context.selectPage === "Main"
                                  ? row[headerItem.key] === "В течение часа"
                                    ? "#d69a81" //красный
                                    : row[headerItem.key] ===
                                      "В течение текущего дня"
                                    ? "#f9ab23" // ?оранжевый
                                    : row[headerItem.key] ===
                                      "В течение 3-х дней"
                                    ? "#ffe78f" // желтый
                                    : row[headerItem.key] === "В течение недели"
                                    ? "#eaf45b" // ?светло желтый
                                    : row[headerItem.key] === "Выполнено"
                                    ? "#C5E384" // зеленый
                                    : ""
                                  : "",
                            }}
                            ref={urgencyPopRef}
                          >
                            {row[headerItem.key] !== null
                              ? row[headerItem.key]
                              : "___"}
                            {shovUrgencyPop === row.id && (
                              <div
                                className={styles.shovStatusPop}
                                style={
                                  checkHeights(dataTable, index)
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
                        ) : headerItem.key === "itineraryOrder" ? (
                          <div
                            onClick={() =>
                              context.selectPage !== "Main" &&
                              funSetItineraryOrder(row.id)
                            }
                            className={
                              context.selectPage !== "Main"
                                ? styles.statusClick
                                : styles.NostatusClick
                            }
                            ref={ItineraryOrderPopRef}
                          >
                            {row[headerItem.key] !== null
                              ? row[headerItem.key]
                              : "___"}
                            {itineraryOrderPop === row.id && (
                              <div
                                className={styles.shovStatusPop}
                                style={
                                  checkHeights(dataTable, index)
                                    ? {
                                        top: "-10%",
                                        right: "100px",
                                        width: "auto",
                                      }
                                    : { width: "auto" }
                                }
                              >
                                <ul>
                                  {arrCount?.map((el) => {
                                    return (
                                      <li
                                        key={el}
                                        onClick={(event) =>
                                          SetCountCard(el, row.id)
                                        }
                                      >
                                        {" "}
                                        {el}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p
                            style={{
                              whiteSpace:
                                headerItem.key === "createdAt" ||
                                headerItem.key === "completeDate"
                                  ? "nowrap"
                                  : "wrap",
                            }}
                          >
                            {getItem(row[headerItem.key], headerItem.key)}
                          </p>
                        )}
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
          </tbody>
        </table>
      </div>
      {context.selectedTable === "Заявки" && (
        <div>
          <p style={{ margin: "10px 0 0 0px" }}>
            Кол-во выбранных заявок: {context.moreSelect.length}
          </p>
        </div>
      )}

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
