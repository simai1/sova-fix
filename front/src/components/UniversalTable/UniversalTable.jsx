import React, { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import styles from "./UniversalTable.module.scss";
import { ReseachDataRequest } from "../../API/API";
import { useDispatch, useSelector } from "react-redux";
import SamplePoints from "./../../components/SamplePoints/SamplePoints"
import FilteImg from "./../../assets/images/filterColumn.svg"
import { resetFilters } from "../../store/samplePoints/samplePoits";
import ClearImg from "./../../assets/images/ClearFilter.svg"
import { useRef } from "react";

function UniversalTable(props) {
    const { context } = useContext(DataContext);
    const [tableHeaderData, setTableHeaderData] = useState([]);
    const [tableBodyData, setTableBodyData] = useState([]);
    const [modalImage, setModalImage] = useState(null);
    const [actiwFilter, setActiwFilter] = useState(null);
    const [itineraryOrderPop, setItineraryOrderPop] = useState("");
    const [arrCount, setArrCount] = useState([])
    const [sampleShow, setSampleShow] = useState(null);
    const [basickData, setBasickData] = useState([]);

    const store = useSelector(
        (state) => state.isSamplePoints[props.tableName].isChecked
      );


   


    useEffect(() => {
     
        setTableHeaderData(props?.tableHeader);
        setTableBodyData(filterBasickData(props?.tableBody, store));
        setBasickData(props?.tableBody);
        context.setSelectRowDirectory(null);    
    }, [props?.tableHeader, props?.tableBody]);

    const openModal = (src) => {
        if (modalImage) {
            setModalImage(null);
        } else {
            setModalImage(src);
        }
    };
    
    //! открываем или закрываем модальное окно samplePoints
  const funClickTh = (event, index, key) => {
    if (event.target.localName === "th" && key !== "number" && key !== "tgId" && key !== "login" && key !== "checkPhoto" && key !== "photo" && key !== "fileName" && key !== "id") {
      if (sampleShow === index) {
        setSampleShow(null);
      } else {
        setSampleShow(index);
      }
    }
  };

  //! при клике на пункт li убираем его из массива данных таблицы
  useEffect(() => {
    setTableBodyData(filterBasickData(basickData, store));
  }, [store]);

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
      }

    useEffect(() => {
        getCountList()
    }, [tableBodyData])

      const getValue = (value, key, index) => {
        switch (key) {
            case "itineraryOrder":
                return 
            case "tgId":
                return value ? <a className={styles.tgIdLink} href={`tg://user?id=${value}`}>{value}</a> : "___";
            case "id":
                return index + 1;
            case "isConfirmed":
                return value ? "Активирован" : "Не активирован";
            case "repairPrice":
             
                return value.toLocaleString().replace(",", " ") || "___";
            
            case "fileName":
            case "checkPhoto":
                return value ? (
                    <div>
                        <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                            alt="Uploaded file"
                            onClick={() => openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)}
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                        />
                    </div>
                ) : "___";
            case "fileName":
                console.log("fileName", value);
                return value ? (
                    <div>
                        <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                            alt="Uploaded file"
                            onClick={() => openModal(`${process.env.REACT_APP_API_URL}/uploads/${value}`)}
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                        />
                    </div>
                ) : "___";
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
            if (!event.target.closest('tr') && !event.target.closest('button')) {
                context.setSelectRowDirectory(null);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [context]);

    const textAlign = (keys, item) => {
        if(keys === "number" || keys === "count" || keys === "itineraryOrder" || keys === "startCoop" || keys === "daysAtWork" || keys === "completeDate" || keys === "createdAt" || keys === "repairPrice" || keys === "startCoop" || keys === "tgId" || keys === "id"){
          return "center"
        }if(item === "___"){
          return "center"
        }
        else{
          return "left"
        }
      }
      const clickTh = (key) => {
        if(key !== "number"){
            setActiwFilter(key);
        }
      }

const SetCountCard = (el, idAppoint) =>{
    const idInteger = context.dataContractors.find(el => el.name === context?.tableData[0].contractor.name)?.id;
    const data = {
      itineraryOrder: el,
    };
    ReseachDataRequest(idAppoint, data).then((resp)=>{
      if(resp?.status === 200){
        props.updateTable();
        setItineraryOrderPop("");
      }
    })
  }

  const dispatch = useDispatch()
 
const contextmenuRef = useRef(null);

const handleClickOutside = (event) => {
  if (contextmenuRef.current && !contextmenuRef.current.contains(event.target)) {
    setSampleShow(null);
  }
};

useEffect(() => {
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

const whatRight = (key) => {
  if(key === "legalEntity" && props?.top){
    return 175
  }else if(key === "comment" && props?.top){
    return 50
  }else{
    return 0
  }
 
}

      //samplePointsData
    return (
<div className={styles.UniversalTable} style={{ maxHeight: document.location.pathname === "/CardPage/CardPageModule" ? "73vh" : "auto" }}>
        { props?.FilterFlag &&
        <div className={styles.clear}>
          <button onClick={() => dispatch(resetFilters({tableName: props.tableName}))} ><img src={ClearImg} /></button>
        </div>
        }
    <table >
    <thead>
    {tableHeaderData?.map((el, index) => (
      <th key={index} name={el.key} onClick={(event) => props?.FilterFlag && funClickTh(event, index, el.key)} 
      style={props?.FilterFlag && el.key !== "number" && el.key !== "checkPhoto" && el.key !== "id" && el.key !== "tgId" && el.key !== "login" && el.key !== "photo" && el.key !== "fileName" ? {cursor: "pointer"} : {cursor: "default"}}>
        {el.value}
        {store.find((elem) => elem.itemKey === el.key) && <img src={FilteImg} />}
        {sampleShow === index && (
          <div className={styles.sampleComponent} ref={contextmenuRef} style={{top: `${props?.top}px`, left: `-${whatRight(el.key)}px`, position: "absolute"}}>
            <SamplePoints
              basickData={basickData} // нефильтрованные данные
              punkts={basickData.map((it) => it[el.key] === null  ? "___" : it[el.key])} // пункты то есть то что отображается в li
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
            <tr key={rowIndex} onClick={() => props?.selectFlag && clickTr(row)}>
                {tableHeaderData.map((header) => (
                    <td 
                        key={header.key} 
                        name={header.key} 
                        className={header.key} 
                        style={context.selectRowDirectory === row.id ? { backgroundColor: "#D8CDC1FF", textAlign: textAlign(header.key, row[header.key]) } : { textAlign: textAlign(header.key, row[header.key]) }}
                    >
                        {(header.key !== "role" ) ? (
                            getValue(row[header.key], header.key, rowIndex) 
                        ) : (
                            <div
                                onClick={() => {
                                    if ((row[header.key] === "Пользователь" || row[header.key] === "Администратор") && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN") {
                                        props.ClickRole(row.id, row[header.key]);
                                    }
                                }}
                                className={((row[header.key] === "Пользователь" || row[header.key] === "Администратор") && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN") ? styles.statusClick : ""}
                            >
                             {row[header.key]}
                            </div>
                        )}
                        {header.key === "tgId" && (
                            <a  className={styles.tgIdLink} href={`tg://user?id=${row[header.key]}`}>{row[header.key]}</a>
                        )}
                        {header.key === "itineraryOrder" && (
                            <div
                                onClick={() => setItineraryOrderPop(row.id)}
                                className={styles.statusClick}
                                // ref={ItineraryOrderPopRef}
                                >
                                {row[header.key] !== null ? row[header.key] : "___"}
                                {itineraryOrderPop === row.id && (
                                    <div className={styles.shovStatusPop}>
                                    <ul>
                                    {
                                        arrCount?.map((el)=>{
                                        return  <li key={el} onClick={(event) => SetCountCard(el, row.id)}> {el}</li>
                                        })
                                    }

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
                <td colSpan={tableHeaderData.length} className={styles.tableNotData}>Нет данных</td>
            </tr>
        )}
    </tbody>
</table>

            {modalImage && (
                <div className={styles.modal} onClick={openModal}>
                    <span className={styles.close}>&times;</span>
                    <img className={styles.modalContent} src={modalImage} alt="Full size" />
                </div>
            )}
        </div>
    );
}

export default UniversalTable;
