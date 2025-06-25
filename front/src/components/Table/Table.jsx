import React, { useState, useContext, useRef, useEffect } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import {
  DeleteExtContractorsRequest,
  GetAllUrgensies,
  GetOneRequests,
  GetextContractorsAll,
  RemoveContractor,
  ReseachDataRequest,
  SetExtContractorsRequest,
  SetStatusRequest,
  SetcontractorRequest,
  GetAllManagers,
  GetAllAdmins,
  GetAllStatuses,
} from "../../API/API";
import { useSelector } from "react-redux";
import СonfirmDelete from "./../СonfirmDelete/СonfirmDelete";
import Contextmenu from "../../UI/Contextmenu/Contextmenu";
import SamplePoints from "../SamplePoints/SamplePoints";
import FilteImg from "./../../assets/images/filterColumn.svg";
import { status } from "./Data";
import { funFixEducator } from "../../UI/SamplePoints/Function";

function Table() {
  const isJsonString = (str) => {
    if (!str) return false;
    try {
      const json = JSON.parse(str);
      return typeof json === 'object';
    } catch (e) {
      return false;
    }
  };

  const { context } = useContext(DataContext);
  const [actiwFilter, setActiwFilter] = useState(null);
  const [coordinatesX, setCoordinatesX] = useState(0);
  const [openConextMenu, setOpenConextMenu] = useState(false);
  const [coordinatesY, setCoordinatesY] = useState(0);

  const trClick = (row, target) => {
    context.setSelectedTr(row.id);
    if (
      target.className !== "Table_statusClick__QSptV" &&
      target.tagName !== "LI" &&
      target.className !== "planCompleteDate" &&
      target.tagName !== "INPUT"
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
    if (
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER"
    ) {
      setOpenConextMenu(true);
    }
  };

  const contextmenuClick = (event) => {
    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;
    setCoordinatesX(x);
    setCoordinatesY(y);
  };

  const store = useSelector(
    (state) => {
      return state.isSamplePoints["table9"].isChecked
    }
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
  const [managers, setManagers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const contextmenuRef = useRef(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [sliderPhotos, setSliderPhotos] = useState([]);
  const [showSlider, setShowSlider] = useState(false);
  const tableWrapperRef = useRef()

  useEffect(() => {
    GetextContractorsAll().then((response) => {
      setDataBuilder(response.data);
    });
    
    GetAllManagers().then((response) => {
      if (response && response.data) {
        setManagers(response.data);
      }
    });
    
    GetAllAdmins().then((response) => {
      if (response && response.data) {
        setAdmins(response.data);
      }
    });
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const funSetStatus = (data) => {
    togglePopupState(setshovStatusPop, data);
    setshovUrgencyPop("");
    setshovBulderPop("");
    setItineraryOrderPop("");
  };

  const funSetBulder = (data) => {
    togglePopupState(setshovBulderPop, data);
    setshovStatusPop("");
    setshovUrgencyPop("");
    setItineraryOrderPop("");
  };

  const funSetUrgency = (data) => {
    togglePopupState(setshovUrgencyPop, data);
    setshovStatusPop("");
    setshovBulderPop("");
    setItineraryOrderPop("");
  };

  const funSetExp = (data) => {
    togglePopupState(setshovExtPop, data);
    setshovStatusPop("");
    setshovBulderPop("");
    setshovUrgencyPop("");
    setItineraryOrderPop("");
  };

  const openModal = (url) => {
    setModalImage(url);
  };

  const closeModal = () => setModalImage(null);

  const SetBilder = (contractorId, idAppoint) => {
    const data = { requestId: idAppoint, contractorId };
    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(idAppoint).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const editStatus = (status, requestId) => {
    const data = {
      requestId: requestId,
      status: status,
    };
    SetStatusRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const deleteBilder = (requestId) => {
    const data = {
      requestId: requestId,
    };
    RemoveContractor(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const UpdateRequest = (updatedRequest) => {
    const editAppoint = funFixEducator(updatedRequest);
    const updatedDataTable = context.dataTableHomePage.map((item) =>
      item.id === editAppoint.id ? editAppoint : item
    );
    context.setDataTableHomePage(updatedDataTable);
    const updateDataAppoint = context.dataApointment.map((item) =>
      item.id === editAppoint.id ? editAppoint : item
    );
    context.setDataAppointment(updateDataAppoint);
  }

  //!Запрос на смену срочности
  const SetUrgency = (name, idAppoint, idUrgency) => {
    const data = { urgency: name, urgencyId: idUrgency};
    ReseachDataRequest(idAppoint, data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(idAppoint).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const setPerformersDirectory = (requestId) => {
    const data = {
      requestId: requestId,
      contractorId: "Внешний подрядчик",
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
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
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
            setshovExtPop("");
          }
        });
      }
    });
  };

  const selectadNewPlanDateFunction = (id, date) => {
    const data = {
      planCompleteDate: new Date(date),
    };
    ReseachDataRequest(id, data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(id).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const deleteExp = (id) => {
    const data = {
      requestId: id,
    };
    DeleteExtContractorsRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(id).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

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

  const checkHeights = (arr, index) =>
    index === arr.length - 1 && arr.length !== 1;

  const getCountList = () =>
    setArrCount(
      Array.from({ length: context.tableData?.length || 0 }, (_, i) => i + 1)
    );

  useEffect(() => {
    getCountList();
  }, [context.Dataitinerary]);

  const getPopupClassName = (triggerEl, index, totalRows) => {
    const isNearBottom = index > (totalRows * 2 / 3);
    let classNames = [styles.shovStatusPop];

    if (isNearBottom) {
      classNames.push(styles['top-aligned'] || 'top-aligned');
    }
  
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      if (spaceRight < 370) {
        classNames.push(styles['right-aligned'] || 'right-aligned');
      }
    }
  
    return classNames.join(' ');
  };

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;
  
    let lastScrollLeft = el.scrollLeft;
  
    const handleScroll = () => {
      const currentScrollLeft = el.scrollLeft;
  
      if (currentScrollLeft !== lastScrollLeft) {
        // горизонтальный скролл
        setshovStatusPop("");
        setshovBulderPop("");
        setshovUrgencyPop("");
        setItineraryOrderPop("");
        lastScrollLeft = currentScrollLeft;
      }
    };
  
    el.addEventListener('scroll', handleScroll);
  
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);
  

  const clickTh = (key, index, el) => {
    if (
      el?.target?.tagName !== "IMG" &&
      key !== "fileName" &&
      key !== "number" &&
      key !== "problemDescription" &&
      key !== "repairPrice" &&
      key !== "commentAttachment" &&
      key !== "checkPhoto" &&
      key !== "itineraryOrder" &&
      key !== "daysAtWork" &&
      key !== "planCompleteDate" &&
      key !== "completeDate" &&
      key !== "createdAt"
    ) {
      const modalData =
        key === "status"
          ? context.tableData.map((item) => status[item[key]])
          : context.tableData.map((item) => item[key]?.name || item[key]);
      context.setSamplePointsData(modalData);
      setActiwFilter(key);
    }
  };

  const sortDataTable = () => {
    if (!context.sortStateParam) {
      const sortedData = [...context?.dataTableHomePage].sort(
        (a, b) => b.number - a.number
      );
      context.setDataTableHomePage(sortedData);
      return;
    }

    const [colPart, typePart] = context.sortStateParam.split("&");
    const col = colPart.split("=")[1];
    const type = typePart.split("=")[1];

    const sortedData = [...context?.dataTableHomePage].sort((a, b) => {
      if (a[col] === null || a[col] === undefined) return 1;
      if (b[col] === null || b[col] === undefined) return -1;

      if (typeof a[col] === "string") {
        return type === "asc"
          ? a[col].localeCompare(b[col])
          : b[col].localeCompare(a[col]);
      }

      if (typeof a[col] === "number" || a[col] instanceof Date) {
        return type === "asc" ? a[col] - b[col] : b[col] - a[col];
      }

      return 0;
    });

    context.setDataTableHomePage(sortedData);
  };

  useEffect(() => {
    sortDataTable();
  }, [context.sortStateParam]);

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

  const getItemBuilder = (row, isBuilderColumn) => {
    // Если есть подрядчик с именем
    if (row?.contractor && typeof row.contractor === 'object' && row.contractor.name) {
      return row.contractor.name;
    } 
    // Если это менеджер-исполнитель
    else if (row?.managerId) {
      // Ищем менеджера среди списка всех менеджеров
      const manager = managers.find(m => m.id === row.managerId);
      return manager ? manager.name : "Менеджер";
    } 
    else if (row?.isExternal && isBuilderColumn) {
      return row?.extContractor?.name
    }
    // Если это внешний подрядчик
    else if ((row?.isExternal || row?.builder === 'Внешний подрядчик') && !isBuilderColumn) {
      return "Внешний подрядчик";
    } 
    else if ((!row?.isExternal && row?.builder === 'Внешний подрядчик') && isBuilderColumn) {
      return 'Не назначен'
    }
    // В остальных случаях
    else {
      return "Укажите подрядчика";
    }
  };

  const textAlign = (key, item) =>
    [
      "number",
      "itineraryOrder",
      "id",
      "createdAt",
      "daysAtWork",
      "completeDate",
      "repairPrice",
      "commentAttachment",
      "planCompleteDate",
    ].includes(key) || item === "___"
      ? "center"
      : "left";

  const isVideo = (fileName) => {
    if (!fileName) return false;
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"];
    return videoExtensions.some((ext) => fileName.endsWith(ext));
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
    const isSelected =
      context?.selectedTable === "Заявки"
        ? context.moreSelect.includes(row)
        : context.selectedTr === row;
    return isSelected ? "#D8CDC1FF" : undefined;
  };

  useEffect(() => {
    context.checkedAllFunc();
  }, [context.filteredTableData, context?.moreSelect]);

  const clickAllTh = () => {
    if (context?.moreSelect?.length > 0) {
      context.setMoreSelect([]);
    } else {
      const ids = context?.dataTableHomePage?.map((el) => el.id) || [];
      context.setMoreSelect(ids);
    }
  };
  
  //! Функция разрешения сортировки
  const filterAndNote = (key) => {
      const arrayNotFilter = [
        "number", "fileName", "checkPhoto", "commentAttachment",
      ]
      if (arrayNotFilter.includes(key)) {
        return false
      }else{
        return true
      }
  }

   //! Функция Получения цвета Urgensy
  const getColorUrgensy = (value) =>{
    const urgency = context?.urgencyList.find(urgency => urgency.name === value)
    if(urgency) return urgency.color

    return ''
    // context?.urgencyList[indexUrgency]
    // console.log(context?.urgencyList[indexUrgency])
    // switch (value) {
    //   case "В течение часа":
    //     return "#d69a81" //красный
    //   case "В течение текущего дня":
    //     return "#f9ab23" // ?оранжевый
    //   case "В течение 3-х дней":
    //     return "#ffe78f" // желтый
    //   case "В течение недели":
    //     return "#eaf45b" // ?светло желтый
    //   case "Выполнено":
    //     return "#C5E384" // зеленый
    //   default:
    //     return ""
    // }
  }

  const getUrgencyById = (id, value) => {
    if(!id) return value
    const findedUrgency = context?.urgencyList?.find(urgency => urgency.id === id)

    return findedUrgency.name
  }

  const getStatusValue = (statusNumber) => {
    const statusFromDb = context?.statusList.find(status => status.number === statusNumber)
    return statusFromDb;
  }

  const getValue = (value, key, index, row) => {
    const totalRows = context?.dataTableHomePage?.length || 0;
    
    switch (key) {
      case "id":
        return index + 1;
        case "status":
        const statusFromDb = getStatusValue(value)
        return (
          <div
            onClick={() => funSetStatus(row.id)}
            className={styles.statusClick}
            style={{ backgroundColor: statusFromDb?.color }}
            ref={statusPopRef}
            key={key + row.id}
          >
            {statusFromDb?.name}
            {shovStatusPop === row.id && (
              <div
                className={getPopupClassName(statusPopRef.current, index, totalRows)}
              >
                <ul>
                  {context?.statusList.map((statusValue, statusIndex) => (
                    <li
                      onClick={() => editStatus(statusIndex + 1, row.id)}
                      key={statusIndex}
                    >
                      {statusValue.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "number":
        return (
          <div key={key + row.id}>
            {row?.copiedRequestId !== null ? `(${value})` : value}
          </div>
        );
      case "contractor":
        return (
          <div
            onClick={() => funSetBulder(row.id)}
            className={styles.statusClick}
            ref={builderPopRef}
            key={key + row.id}
          >
            {getItemBuilder(row)}
            {shovBulderPop === row.id && (
              <div
                className={getPopupClassName(builderPopRef.current, index, totalRows)}
              >
                <ul>
                  <li className={styles.listHeader}>Действия:</li>
                  {(row?.contractor !== "___" || row?.managerId || row?.isExternal) && (
                    <li onClick={() => deleteBilder(row.id)}>
                      Удалить исполнителя
                    </li>
                  )}
                  <li onClick={() => setPerformersDirectory(row.id)}>
                    Выбрать внешнего подрядчика
                  </li>
                  
                  <li className={styles.listHeader}>Менеджеры:</li>
                  {managers && managers.length > 0 && 
                    managers.map((manager, idx) => manager.role === 'ADMIN' && (
                      <li onClick={() => SetManager(manager.id, row.id)} key={`manager-${idx}`}>
                        {manager.name}
                      </li>
                    ))
                  }
                  
                  <li className={styles.listHeader}>Исполнители:</li>
                  {context.dataContractors?.map((value, index) => (
                    <li onClick={() => SetBilder(value.id, row.id)} key={index}>
                      {value.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "builder":
        return row.isExternal || row.builder === 'Внешний подрядчик' ? (
          <div
            onClick={() => funSetExp(row.id)}
            className={styles.statusClick}
            ref={extPopRef}
            key={key + row.id}
          >
            {getItemBuilder(row, true) || "Не назначен"}
            {shovExtPop === row.id && (
              <div
                className={getPopupClassName(extPopRef.current, index, totalRows)}
              >
                <ul>
                  {(row?.isExternal && row?.builder || row.builder === 'Внешний подрядчик') && (
                    <li onClick={() => deleteBilder(row.id)}>
                      Удалить исполнителя
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
        ) : (
          (() => {
            if (row?.managerId) {
              const manager = managers.find(m => m.id === row.managerId);
              return manager ? manager.name : "Менеджер";
            } 
            else if (row?.contractor && typeof row.contractor === 'object' && row.contractor.name) {
              return row.contractor.name;
            }
            else if (typeof row?.contractor === 'string' && row.contractor !== "___") {
              return row.contractor;
            }
            else {
              return "Не назначен";
            }
          })()
        );
      case "urgency":
        return (
          <div
            onClick={() => funSetUrgency(row.id)}
            className={styles.statusClick}
            style={{
              backgroundColor: getColorUrgensy(getUrgencyById(row?.urgencyId, value))
            }}
            ref={urgencyPopRef}
            key={key + row.id}
          >
            {value || "___"}
            {shovUrgencyPop === row.id && (
              <div
                className={getPopupClassName(urgencyPopRef.current, index, totalRows)}
              >
                <ul>
                  {context?.urgencyList?.map((value, index) => (
                    <li
                      onClick={() =>
                        SetUrgency(value.name, row.id, value.id)
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
            ) : JSON.parse(localStorage.getItem("userData"))?.user?.role !==
              "OBSERVER" ? (
              <div className={styles.planCompleteDate} key={row.id}>
                <input
                  type="date"
                  value={row["planCompleteDateRaw"].split("T")[0]}
                  onChange={(e) => {
                    selectadNewPlanDateFunction(row.id, e.target.value);
                  }}
                />
              </div>
            ) : (
              {
                value,
              }
            )}
          </>
        );
      case "fileName":
        return value !== null && value !== "___" ? (
          <div className={styles.fileTableContainer} key={key + row.id}>
            {isVideo(value) ? (
              <div className={styles.fileVideoTable}>
                <video
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal(
                      `${process.env.REACT_APP_API_URL}/uploads/${value}`
                    );
                  }}
                  style={{ cursor: "pointer" }}
                  className={styles.videoTable}
                >
                  <source
                    src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <img
                src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                alt="Uploaded file"
                onClick={() => {
                  if (
                    row.commentAttachment &&
                    isJsonString(row.commentAttachment)
                  ) {
                    const additionalPhotos = JSON.parse(row.commentAttachment);
                    if (
                      Array.isArray(additionalPhotos) &&
                      additionalPhotos.length > 0
                    ) {
                      openPhotoSlider([value, ...additionalPhotos]);
                    } else {
                      openModal(
                        `${process.env.REACT_APP_API_URL}/uploads/${value}`
                      );
                    }
                  } else {
                    openModal(
                      `${process.env.REACT_APP_API_URL}/uploads/${value}`
                    );
                  }
                }}
                style={{ cursor: "pointer" }}
                className={styles.imgTable}
              />
            )}
          </div>
        ) : (
          "___"
        );
      case "commentAttachment":
      case "checkPhoto":
        return value !== null && value !== "___" ? (
          <div key={key + row.id}>
            {isVideo(value) ? (
              <div className={styles.fileVideoTable}>
                <video
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal(
                      `${process.env.REACT_APP_API_URL}/uploads/${value}`
                    );
                  }}
                  style={{ cursor: "pointer" }}
                  className={styles.videoTable}
                >
                  <source
                    src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : isJsonString(value) ? (
              <img
                src={`${process.env.REACT_APP_API_URL}/uploads/${
                  JSON.parse(value)[0]
                }`}
                alt="Uploaded file"
                onClick={() => openPhotoSlider(JSON.parse(value))}
                style={{ cursor: "pointer" }}
                className={styles.imgTable}
              />
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
        return (
          <p key={key + row.id} style={{ whiteSpace: "nowrap" }}>
            {value || "___"}
          </p>
        );
      case "itineraryOrder":
        return (
          <div
            onClick={() => togglePopupState(setItineraryOrderPop, row.id)}
            className={styles.statusClick}
            ref={ItineraryOrderPopRef}
            key={key + row.id}
          >
            {value || "___"}
            {itineraryOrderPop === row.id && (
              <div className={getPopupClassName(ItineraryOrderPopRef.current, index, totalRows)}>
                <ul>
                  {arrCount?.map((el) => (
                    <li
                      key={el}
                      onClick={() => SetCountCard(el, row.id)}
                    >
                      {el}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      default:
        return (
          <p style={{ whiteSpace: "wrap" }} key={key + row.id}>
            {value || "___"}
          </p>
        );
    }
  };

  const tableRef = useRef(null);
  const handleScroll = () => {
    const container = tableRef.current?.parentElement;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScrollTop = scrollHeight - clientHeight;
      if (
        scrollTop >= maxScrollTop - 50 &&
        context.loader &&
        context.totalCount > context?.dataTableHomePage.length
      ) {
        context.setLoader(false);
        context.setOfset((prev) => prev + 10);
      }
    }
  };

  useEffect(() => {
    context.UpdateTableReguest();
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
  }, [context.loader]);

  const openPhotoSlider = (photos) => {
    setSliderPhotos(photos);
    setCurrentSlideIndex(0);
    setShowSlider(true);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % sliderPhotos.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex(
      (prev) => (prev - 1 + sliderPhotos.length) % sliderPhotos.length
    );
  };

  const closeSlider = () => {
    setShowSlider(false);
    setSliderPhotos([]);
  };
  
  useEffect(() => {
    GetAllUrgensies().then(response => {
      context?.setUrgencyList(response.data)
    })
    GetAllStatuses().then(response => {
      if (response?.status === 200) {
        context?.setStatusList(response.data)
      }
    })
  }, [])

  const SetManager = (managerId, requestId) => {
    const data = { requestId: requestId, managerId: managerId };
    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const SetAdmin = (adminId, requestId) => {
    const data = { requestId: requestId, managerId: adminId };
    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(requestId).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
          }
        });
      }
    });
  };

  const SetCountCard = (el, idAppoint) => {
    const data = {
      itineraryOrder: el,
    };
    ReseachDataRequest(idAppoint, data).then((resp) => {
      if (resp?.status === 200) {
        GetOneRequests(idAppoint).then((resp) => {
          if (resp?.status === 200) {
            UpdateRequest(resp?.data);
            setItineraryOrderPop("");
          }
        });
      }
    });
  };

  return (
    <div className={styles.TableWrapper}>
      <div
        className={styles.Table}
        style={{
          overflow: context?.dataTableHomePage.length === 0 ? "hidden" : "auto",
        }}
        ref={tableWrapperRef}
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
                              : "./img/=.svg"
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
                            basickData={context.dataApointment}
                            tableBodyData={context.dataApointment}
                            punkts={[
                              ...context.dataApointment.flatMap((it) => {
                                // все что касается фильтра по исполнителю на фронте написано коряво. ПЕРЕДЕЛАТЬ при возможности.
                                if (item.key === "contractor" && it[item.key] === "___" && it["contractorManager"] === null && it['extContractor'] === null) {
                                  return "Укажите подрядчика"
                                }
                                if (item.key === "contractor" && it[item.key] === "___" && it["contractorManager"] === "Внешний подрядчик" && it['extContractor'] !== null) {
                                  return it["contractorManager"]
                                }
                                if (item.key === "contractor" && it[item.key] !== "___") {
                                  return it[item.key].name;
                                } else if (item.key === "contractor" && it[item.key] === "___" && it["contractorManager"] !== 'Укажите подрядчика' && it["contractorManager"] !== 'Внешний подрядчик') {
                                  return [it["contractorManager"]]
                                } else if (item.key === 'status') {
                                  return context?.statusList?.find(statusItem => statusItem?.number === it[item.key])?.name
                                }
                                return [it[item.key]];
                              }).map((val) => (val === null ? "___" : val)),
                              ...store
                              .filter((it) =>
                                item.key === "contractor"
                                  ? it.itemKey === "contractorManager"
                                  : it.itemKey === item.key
                                )
                                .map((it) => it.value),
                            ].sort((a, b) => {
                              return String(a).localeCompare(String(b));
                            })}
                            itemKey={item.key}
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
            {context?.dataTableHomePage.length > 0 ? (
              <>
                {context?.dataTableHomePage?.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        row?.copiedRequestId !== null ? "#ffe78f" : "",
                    }}
                    onClick={(e) => {
                      trClick(row, e.target);
                    }}
                    onContextMenu={(e) => {
                      trClickRight(row, e.target);
                      contextmenuClick(e);
                    }}
                    className={
                      context.moreSelect.some((el) => el === row.id)
                        ? styles.setectedTr
                        : ""
                    }
                  >
                    <td
                      key={new Date().getTime() + row.id}
                      name="checkAll"
                      style={{
                        textAlign: "center",
                        backgroundColor: whatPageBgTd(row.id),
                      }}
                      className={styles.MainTd}
                      id={row?.copiedRequestId !== null ? "copiedRequestId" : undefined}
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
                    {storeTableHeader
                      ?.filter((el) => el.isActive === true)
                      ?.map((headerItem) => (
                        <td
                          key={headerItem.key}
                          name={headerItem.key}
                          className={styles.MainTd}
                          id={row?.copiedRequestId !== null ? "copiedRequestId" : undefined}
                          style={{
                            textAlign: textAlign(
                              headerItem.key,
                              row[headerItem.key]
                            ),
                            backgroundColor: whatPageBgTd(row.id),
                          }}
                        >
                          {getValue(
                            row[headerItem.key],
                            headerItem.key,
                            index,
                            row
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={21} className={styles.tableNotData}>
                  <div className={styles.notData}> Нет данных</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {context.loader && (
        <div>
          <p style={{ margin: "10px 0 0 0px" }}>
            Кол-во выбранных заявок: {context.moreSelect.length}
          </p>
        </div>
      )}

      {showSlider && (
        <div className={styles.photoSlider}>
          <div className={styles.sliderContent}>
            <button className={styles.closeSlider} onClick={closeSlider}>
              ×
            </button>
            <div className={styles.sliderControls}>
              <button className={styles.prevButton} onClick={prevSlide}>
                ❮
              </button>
              <img
                src={`${process.env.REACT_APP_API_URL}/uploads/${sliderPhotos[currentSlideIndex]}`}
                alt={`Slide ${currentSlideIndex + 1}`}
                className={styles.sliderImage}
              />
              <button className={styles.nextButton} onClick={nextSlide}>
                ❯
              </button>
            </div>
            <div className={styles.sliderIndicator}>
              {currentSlideIndex + 1} / {sliderPhotos.length}
            </div>
          </div>
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
      {modalImage && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>×</button>
            {isVideo(modalImage.split('/').pop()) ? (
              <video controls className={styles.modalVideo}>
                <source src={modalImage} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={modalImage} alt="Enlarged media" className={styles.modalImage} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;

{
  /* {!context.loader ? (
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
    <>*/
}
