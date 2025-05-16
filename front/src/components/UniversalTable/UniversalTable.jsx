import React, { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import styles from "./UniversalTable.module.scss";
import { ReseachDataRequest, SetRole } from "../../API/API";
import { useDispatch, useSelector } from "react-redux";
import SamplePoints from "./../../components/SamplePoints/SamplePoints";
import FilteImg from "./../../assets/images/filterColumn.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import EquipmentContextMenu from "../../UI/EquipmentContextMenu/EquipmentContextMenu";

function UniversalTable(props) {
  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );
  const { context } = useContext(DataContext);
  const [tableHeaderData, setTableHeaderData] = useState([]);
  const [tableBodyData, setTableBodyData] = useState([filterBasickData(props?.tableBody, store)]);
  const [modalImage, setModalImage] = useState(null);
  const [itineraryOrderPop, setItineraryOrderPop] = useState("");
  const [arrCount, setArrCount] = useState([]);
  const [sampleShow, setSampleShow] = useState(null);
  const [basickData, setBasickData] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [coordinatesX, setCoordinatesX] = useState(0);
  const [coordinatesY, setCoordinatesY] = useState(0);
  const dropdownRef = useRef(null);
  const contextCopyMenuRef = useRef(null)
  const navigate = useNavigate();

  useEffect(() => {
    setTableHeaderData(props?.tableHeader);
    setTableBodyData(filterBasickData(props?.tableBody, store));
    setBasickData(props?.tableBody);
   
  }, [props?.tableHeader, props?.tableBody, store]);

  useEffect(() => {
    context.setSelectRowDirectory(null);
  }, []);

  const openModal = (src) => {
    if (modalImage) {
      setModalImage(null);
    } else {
      setModalImage(src);
    }
  };

  //! открываем или закрываем модальное окно samplePoints
  const funClickTh = (event, index, key) => {
    const nonSelectableKeys = new Set([
      "number", "tgId", "info", "login", 
      "checkPhoto", "photo", "fileName", 
      "problemDescription", "id", "repairPrice", 
      "comment", "supportFrequency"
    ]);

    if (event.target.localName === "th" && !nonSelectableKeys.has(key)) {
      setSampleShow(sampleShow === index ? null : index);
    }
  };

  //! функция фильтрации
  function filterBasickData(data, chekeds) {
    if(data){
      let tb = [...data];
      let mass = [];
      tb?.filter((el) => {
        if (chekeds.find((it) => el[it.itemKey] === it?.value)) {
          return;
        } else {
          mass.push(el);
        }
      });
      return mass;
    }else{
      return []
    }
  }

  const getCountList = () => {
    let count = tableBodyData?.length;
    let countList = [];
    for (let i = 0; i < count; i++) {
      countList.push(i + 1);
    }
    setArrCount(countList);
  };

  useEffect(() => {
    getCountList();
  }, [tableBodyData]);

  const isVideo = (fileName) => {
    if (!fileName) return false;
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"];
    return videoExtensions.some((ext) => fileName.endsWith(ext));
  };

  const buttonInfoClick = (dataRow) => {
    navigate(`/Equipment/EquipmentInfo?idEquipment=${dataRow.id}`)
  };

  function getDayWord(number) {
  const absNumber = Math.abs(number) % 100;
  if (absNumber > 10 && absNumber < 20) return `${number} дней`;

  switch (absNumber % 10) {
    case 1:
      return `${number} день`;
    case 2:
    case 3:
    case 4:
      return `${number} дня`;
    default:
      return `${number} дней`;
  }
}

  const getValue = (value, key, index, row) => {
    switch (key) {
      case "contractor":
        return value?.name ?? row.extContractor;
      case "itineraryOrder":
        return null;
      case "tgId":
        return value ? (
          <a className={styles.tgIdLink} href={`tg://user?id=${value}`}>
            {value}
          </a>
        ) : (
          "___"
        );
      case "id":
        return index + 1;
      case "repairPrice":
      case "sum":
        return value ? value.toLocaleString().replace(",", " ") : "___";
      case "checkPhoto":
      case "photo":
        return value !== "___" ? (
          <img
            src={value !== null ? `${process.env.REACT_APP_API_URL}/uploads/${value}` : "/img/noimage.jpg"}
            alt="Uploaded file"
            onClick={() => value !== null && openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)}
            style={{ cursor: "pointer" }}
            className={styles.imgTable}
          />
        ) : (
          "___"
        );
      case "info":
        return <button className={styles.buttonInfo} onClick={() => buttonInfoClick(row)}>Карточка оборудования</button>;
      case "supportFrequency":
        return <p>{value ? getDayWord(value) : "___"} </p>;
      case "fileName":
        return value !== "___" ? (
          <div>
            {isVideo(value) ? (
              <div className={styles.FileVideo}>
                <video
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                onClick={() => openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)}
                style={{ cursor: "pointer" }}
                className={styles.imgTable}
              />
            )}
          </div>
        ) : (
          "___"
        );
      case "color": 
        return(
          <div className={styles.ColorContainer}>
            <div className={styles.ColorBlock} style={{backgroundColor: value}}></div>
            <p>Код цвета: {value}</p>
          </div> 
        )
      default:
        return value ?? "___";
    }
  };

  const clickTr = (value) => {
    context.setSelectRowDirectory(value.id);
    context.setSelectedTr(value.id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("tr") && !event.target.closest("button")) {
        // context.setSelectRowDirectory(null);
        context.setSelectedTr(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [context]);

  const textAlign = (key) => {
    const centerKeys = [
      "number",
      "count",
      "itineraryOrder",
      "startCoop",
      "daysAtWork",
      "completeDate",
      "createdAt",
      "repairPrice",
      "startCoop",
      "tgId",
      "id",
      "supportFrequency",
      "lastTOHuman",
      "nextTOHuman",
      "planCompleteDate",
      "countEquipment",
      "dateHuman",
      "sum",
    ];
    return centerKeys.includes(key) ? "center" : "left";
  };

  const SetCountCard = (el, idAppoint) => {
    const data = {
      itineraryOrder: el,
    };
    ReseachDataRequest(idAppoint, data).then((resp) => {
      if (resp?.status === 200) {
        props?.updateTable();
        setItineraryOrderPop("");
      }
    });
    
  };

  const contextmenuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (
      contextmenuRef.current &&
      !contextmenuRef.current.contains(event.target)
    ) {
      setSampleShow(null);
    }
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownVisible(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const whatRight = (key) => {
    if (props?.top) {
      switch (key) {
        case "legalEntity":
        case "itineraryOrder":
          return 175;
        case "comment":
          return 50;
        default:
          return 0;
      }
    }
    return 0;
  };

  const handleRoleClick = (rowIndex, role) => {
    (role === "Пользователь" || role === "Администратор" || role === "Наблюдатель") && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN" && setDropdownVisible(dropdownVisible === rowIndex ? null : rowIndex);
  };

  const checkHeights = (arr, index) => {
    return arr?.length - 1 === index && index === arr?.length - 1 && arr?.length !== 1;
  };

  const getBgColorlastTOHuman = (key, lastTOHuman) => {
    if (key !== "nextTOHuman" || !lastTOHuman) return null;

    const currentDate = new Date();
    const [day, month, year] = lastTOHuman.split('.').map(Number);
    const formattedDate = new Date(`20${year}`, month - 1, day);
    const diffInDays = Math.ceil((formattedDate - currentDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "#ffa500"; // оранжевый
    if (diffInDays >= 7) return "#C5E384"; // зелёный
    if (diffInDays > 0) return "#ffe78f"; // жёлтый
    return "#d69a81"; // красный
  };

  const chectHeights = () => {
    const url = window.location.pathname;
    switch (url) {
      case '/Equipment/EquipmentInfo':
        return 'auto';
      case '/RepotYour':
        return '20vh';
      default:
        return 'auto'
    }
}

  const contextmenuClick = (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing
    const x = event.clientX; // Get the X coordinate
    const y = event.clientY; // Get the Y coordinate
    setCoordinatesX(x);
    setCoordinatesY(y);
  };

  const trClickRight = (row, target) => {
    if (
      target.className !== "Table_statusClick__QSptV" &&
      target.tagName !== "LI" &&
      !(context.selectRowDirectory === row.id) &&
      JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER"
    ) {
        context.setSelectRowDirectory(row.id);
        context.setSelectedTr(row.id);
    }
    if(JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER"){
      setContextMenuOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextCopyMenuRef.current && !contextCopyMenuRef.current.contains(event.target)) {
        setContextMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      className={styles.UniversalTable}
      style={{ maxHeight: `${props?.heightTable}` || "auto", minHeight: chectHeights()}}
    >
     <table>
        <thead>
          {tableHeaderData?.map((el, index) => (
            <th
              key={index}
              name={el.key}
              onClick={(event) =>
                props?.FilterFlag && funClickTh(event, index, el.key)
              }
              style={
                props?.FilterFlag &&
                el.key !== "number" &&
                el.key !== "checkPhoto" &&
                el.key !== "id" &&
                el.key !== "tgId" &&
                el.key !== "info" &&
                el.key !== "supportFrequency" &&
                el.key !== "login" &&
                el.key !== "photo" &&
                el.key !== "problemDescription" &&
                el.key !== "fileName" &&
                el.key !== "comment" &&
                el.key !== "repairPrice"
                  ? { cursor: "pointer" }
                  : { cursor: "default" }
              }
            >
              {el.value}
              {store.find((elem) => elem.itemKey === el.key) && (
                <img src={FilteImg} />
              )}
              {sampleShow === index && (
                <div
                  className={styles.sampleComponent}
                  ref={contextmenuRef}
                  style={{
                    marginTop: props?.tableName==="table11" ? "50px" : "0px",
                    top: `${props?.top}px`,
                    left: `-${whatRight(el.key)}px`,
                    position: "absolute",
                  }}
                >
                  <SamplePoints
                    basickData={basickData} // нефильтрованные данные
                    tableBodyData={tableBodyData} // фильтрованные данные
                    punkts={[
                      ...tableBodyData.map((it) =>
                        it[el.key] === null ? "___" : String(it[el.key]) // Ensure it's a string
                      ),
                      ...store
                        .filter((it) => it.itemKey === el.key)
                        .map((it) => String(it.value)), // Ensure it's a string
                    ].sort((a, b) => {
                      // Handle cases where a or b might not be a string
                      if (typeof a === "string" && typeof b === "string") {
                        return a.localeCompare(b);
                      } else if (a == null) {
                        return 1; // Place nulls at the end
                      } else if (b == null) {
                        return -1; // Place nulls at the end
                      } else {
                        return String(a).localeCompare(String(b)); // Convert to string for comparison
                      }
                    })}
                    itemKey={el.key} // ключь пунта
                    tableName={props?.tableName}
                  />
                </div>
              )}
            </th>
          ))}
        </thead>
        <tbody>
          {tableBodyData?.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{backgroundColor: row?.copiedRequestId !== null ? "#ffe78f" : ""}}
              onClick={() => props?.selectFlag && clickTr(row)}
              onContextMenu={(e) => {
                if (props?.tableName === 'table11') {
                  trClickRight(row, e.target);
                  contextmenuClick(e)
                }
              }}
            >
              {tableHeaderData.map((header) => (
                <td
                  key={header.key}
                  name={header.key}
                  className={header.key}

                  style={
                    context.selectRowDirectory === row.id
                      ? {
                          backgroundColor: "#D8CDC1FF",
                          textAlign: textAlign(header.key, row[header.key]),
                        }
                      : { 
                        textAlign: textAlign(header.key, row[header.key]),
                      }
                  }
                >
        {header.key !== "role" ? (
          props.customRender && props.customRender[header.key] ? (
            props.customRender[header.key](row[header.key], row, rowIndex)
          ) : (
            header.key === "nextTOHuman" ?
            <span style={{ padding: header.key === "nextTOHuman" ? "5px 10px" : "0px", borderRadius: "5px", backgroundColor: getBgColorlastTOHuman(header.key, row[header.key])}} >{getValue(row[header.key], header.key, rowIndex, row)}</span> : 
            getValue(row[header.key], header.key, rowIndex, row)
          )
        ) : (
            <div key={rowIndex} className={styles.RoleClick}>
              <div
                onClick={() => handleRoleClick(rowIndex , row.role)}
                className={
                  (row.role === "Пользователь" || row.role === "Администратор" || row.role === "Наблюдатель") &&
                  JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN"
                    ? styles.statusClick
                    : ""
                }
              >
                {row.role}
              </div>
              {dropdownVisible === rowIndex && (
                <div
                  ref={dropdownRef}
                  className={styles.shovStatusPopRole}
                  style={
                    checkHeights(tableBodyData, rowIndex)
                      ? { top: "100%", width: "150px" }
                      : { width: "150px" }
                  }
                >
                  <ul>
                    <li onClick={() => {props?.ClickRole("Администратор", row.id); setDropdownVisible(null);}}>Администратор</li>
                    <li onClick={() => {props?.ClickRole("Пользователь", row.id); setDropdownVisible(null);}}>Пользователь</li>
                    <li onClick={() => {props?.ClickRole("Наблюдатель", row.id); setDropdownVisible(null);}}>Наблюдатель</li>
                  </ul>
                </div>
                )}
              </div>
            )}

                  {header.key === "itineraryOrder" && (
                    <div
                      onClick={() => JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setItineraryOrderPop(row.id)}
                      className={ document.location.pathname === "/CardPage/CardPageModule" ? styles.statusClick : styles.statusNotClick }
                      // ref={ItineraryOrderPopRef}
                    >
                      {row[header.key] !== null ? row[header.key] : "___"}
                      {itineraryOrderPop === row.id && (
                        <div className={styles.shovStatusPop}>
                          <ul>
                            {arrCount?.map((el) => {
                              return (
                                <li
                                  key={el}
                                  onClick={(event) => SetCountCard(el, row.id)}
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
                  )}
                </td>
              ))}
            </tr>
          ))}
          {tableBodyData.length === 0 && (
            <tr>
              <td
                colSpan={tableHeaderData.length}
                className={styles.tableNotData}
              >
                Нет данных
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalImage && (
    <div className={styles.modal}>
      <span className={styles.close} onClick={openModal}>&times;</span>
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
        <div onClick={openModal}>

        <img
          className={styles.modalContent}
          src={modalImage}
          alt="Full size"
        />
        </div>
      )}
    </div>
  )}
    
    {contextMenuOpen ? (
      <div
        ref={contextCopyMenuRef}
        style={{ display: contextMenuOpen ? "block" : "none" }}
      >
        <EquipmentContextMenu
            X={coordinatesX}
            Y={coordinatesY}
            setContextMenuOpen={setContextMenuOpen}
        />
      </div>
    ) : null}

    </div>
  );
}

export default UniversalTable;
