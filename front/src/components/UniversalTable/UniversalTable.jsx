import React, { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import styles from "./UniversalTable.module.scss";
import { SamplePoints } from "../../UI/SamplePoints/SamplePoints";
import { ReseachDataRequest } from "../../API/API";

function UniversalTable(props) {
    const { context } = useContext(DataContext);
    const [tableHeaderData, setTableHeaderData] = useState([]);
    const [tableBodyData, setTableBodyData] = useState([]);
    const [modalImage, setModalImage] = useState(null);
    const [actiwFilter, setActiwFilter] = useState(null);
    const [itineraryOrderPop, setItineraryOrderPop] = useState("");
    const [arrCount, setArrCount] = useState([])
    useEffect(() => {
        setTableHeaderData(props?.tableHeader);
        setTableBodyData(props?.tableBody);
        context.setSelectRowDirectory(null);
    }, [props?.tableHeader, props?.tableBody]);

    const openModal = (src) => {
        if (modalImage) {
            setModalImage(null);
        } else {
            setModalImage(src);
        }
    };
    
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
                return value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
        }if(item === null){
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

      const getRoleAdmin = (value) =>
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


      //samplePointsData
    return (
        <div className={styles.UniversalTable}>
            <table>
    <thead>
        {tableHeaderData?.map((el, index) => (
            <th key={index} name={el.key} onClick={() => clickTh(el.key)}>
                {el.value}
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
                                    if ((row[header.key] === 1 || row[header.key] === 2) && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN") {
                                        props.ClickRole(row.id, row[header.key]);
                                    }
                                }}
                                className={((row[header.key] === 1 || row[header.key] === 2) && JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN") ? styles.statusClick : ""}
                            >
                                {getRoleAdmin(row[header.key])}
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
                                    <div className={styles.shovStatusPop} >{/* style={checkHeights(context?.filteredTableData, index) ? {top:"-10%", right:"100px", width: "auto"} : {width: "auto"}} */}
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
