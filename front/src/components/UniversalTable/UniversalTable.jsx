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

function UniversalTable(props) {
  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );
  const { context } = useContext(DataContext);
  const [tableHeaderData, setTableHeaderData] = useState([]);
  const [tableBodyData, setTableBodyData] = useState([filterBasickData(props?.tableBody, store)]);
  const [modalImage, setModalImage] = useState(null);
  const [actiwFilter, setActiwFilter] = useState(null);
  const [itineraryOrderPop, setItineraryOrderPop] = useState("");
  const [arrCount, setArrCount] = useState([]);
  const [sampleShow, setSampleShow] = useState(null);
  const [basickData, setBasickData] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(null);
  const dropdownRef = useRef(null);
  const [selecedAccount, setSelecedAccount] = useState(null)


  useEffect(() => {
    setTableHeaderData(props?.tableHeader);
    setTableBodyData(filterBasickData(props?.tableBody, store));
    setBasickData(props?.tableBody);
    context.setSelectRowDirectory(null);
  }, [props?.tableHeader, props?.tableBody, store]);



  const openModal = (src) => {
    if (modalImage) {
      setModalImage(null);
    } else {
      setModalImage(src);
    }
  };

  //! открываем или закрываем модальное окно samplePoints
  const funClickTh = (event, index, key) => {
    if (
      event.target.localName === "th" &&
      key !== "number" &&
      key !== "tgId" &&
      key !== "login" &&
      key !== "checkPhoto" &&
      key !== "photo" &&
      key !== "fileName" &&
      key !== "problemDescription" &&
      key !== "id" && 
      key !== "repairPrice"
    ) {
      if (sampleShow === index) {
        setSampleShow(null);
      } else {
        setSampleShow(index);
      }
    }
  };

  //! при клике на пункт li убираем его из массива данных таблицы
  // useEffect(() => {
  //   setTableBodyData(filterBasickData(basickData, store));
  // }, [store]);


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
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
    return videoExtensions.some(ext => fileName.endsWith(ext));
  };

  const getValue = (value, key, index, row) => {
    switch (key) {
      case "itineraryOrder":
        return;
      case "tgId":
        return value ? (
          <a
            className={styles.tgIdLink}
            href={`https://t.me/${row[index]?.linkId}`}
          >
            {value}
          </a>
        ) : (
          "___"
        );

      case "id":
        return index + 1;
   
      case "repairPrice":
        return value.toLocaleString().replace(",", " ") || "___";

     
      case "checkPhoto":
        return value !== "___" ? (
          <div>
            <img
              src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
              alt="Uploaded file"
              onClick={() =>
                openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)
              }
              style={{ cursor: "pointer" }}
              className={styles.imgTable}
            />
          </div>
        ) : (
          "___"
        );
      case "fileName":
        return value !== "___" ? (
          <div>
          {
            isVideo(value) ? (
              <div className={styles.FileVideo}>
                <video
                  onClick={(e) => {
                    e.preventDefault(); // Prevent the modal from closing
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
            )
          }
          </div>
         
        ) : (
          "___"
        );
      default:
        return value || "___";
    }
  };

  const clickTr = (value) => {
    context.setSelectRowDirectory(value.id);
    context.setSelectedTr(value.id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("tr") && !event.target.closest("button")) {
        context.setSelectRowDirectory(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [context]);

  const textAlign = (keys, item) => {
    if (
      keys === "number" ||
      keys === "count" ||
      keys === "itineraryOrder" ||
      keys === "startCoop" ||
      keys === "daysAtWork" ||
      keys === "completeDate" ||
      keys === "createdAt" ||
      keys === "repairPrice" ||
      keys === "startCoop" ||
      keys === "tgId" ||
      keys === "id" ||
      keys === "planCompleteDate"
    ) {
      return "center";
    }
    if (item === "___") {
      return "center";
    } else {
      return "left";
    }
  };
  const clickTh = (key) => {
    if (key !== "number") {
      setActiwFilter(key);
    }
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
        props.updateTable();
        setItineraryOrderPop("");
      }
    });
  };

  const dispatch = useDispatch();

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
    if (key === "legalEntity" && props?.top) {
      return 175;
    }
    if (key === "itineraryOrder" && props?.top) {
      return 175;
    } else if (key === "comment" && props?.top) {
      return 50;
    } else {
      return 0;
    }
  };


  const handleRoleClick = (rowIndex, role) => {
    (role === "Пользователь" || role === "Администратор" || role === "Наблюдатель") && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN" && setDropdownVisible(dropdownVisible === rowIndex ? null : rowIndex);
  };

 

  const checkHeights = (arr, index) => {
    return arr?.length - 1 === index && index === arr?.length - 1 && arr?.length !== 1;
  };
  return (
    <div
      className={styles.UniversalTable}
      style={{
        maxHeight:
          document.location.pathname === "/CardPage/CardPageModule"
            ? "73vh"
            : "auto",
      }}
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
                el.key !== "login" &&
                el.key !== "photo" &&
                el.key !== "problemDescription" &&
                el.key !== "fileName" &&
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
              onClick={() => props?.selectFlag && clickTr(row)}
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
                      : { textAlign: textAlign(header.key, row[header.key]) }
                  }
                >
                   {header.key !== "role" ? (
        getValue(row[header.key], header.key, rowIndex, row)
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
                    <li onClick={() => {props.ClickRole("Администратор", row.id); setDropdownVisible(null);}}>Администратор</li>
                    <li onClick={() => {props.ClickRole("Пользователь", row.id); setDropdownVisible(null);}}>Пользователь</li>
                    <li onClick={() => {props.ClickRole("Наблюдатель", row.id); setDropdownVisible(null);}}>Наблюдатель</li>
                  </ul>
                </div>
                )}
              </div>
            )}

                  {header.key === "itineraryOrder" && (
                    <div
                      onClick={() => JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" && setItineraryOrderPop(row.id)}
                      className={
                        document.location.pathname ===
                        "/CardPage/CardPageModule"
                          ? styles.statusClick
                          : styles.statusNotClick
                      }
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
    </div>
  );
}

export default UniversalTable;
