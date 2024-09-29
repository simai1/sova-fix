import React, { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import styles from "./UniversalTable.module.scss";

function UniversalTable(props) {
    const { context } = useContext(DataContext);
    const [tableHeaderData, setTableHeaderData] = useState([]);
    const [tableBodyData, setTableBodyData] = useState([]);
    const [modalImage, setModalImage] = useState(null);

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

    const getValue = (value, key) => {
        if (key === "repairPrice" && key !== "fileName" && key !== "checkPhoto") {
            return value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        } else if (key === "fileName" || key === "checkPhoto") {
            if (value) {
                return (
                    <div>
                        <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                            alt="Uploaded file"
                            onClick={() =>
                                openModal(
                                    `${process.env.REACT_APP_API_URL}/uploads/${value}`
                                )
                            }
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                        />
                    </div>
                );
            } else {
                return "___";
            }
        } else {
            if (value) {
                return value;
            } else {
                return "___";
            }
        }
    };

    const clickTr = (value) => {
        console.log(value);
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
        console.log("keys", keys)
        if(keys === "number" || keys === "count" || keys === "itineraryOrder" || keys === "startCoop" || keys === "daysAtWork" || keys === "completeDate" || keys === "createdAt" || keys === "repairPrice" || keys === "startCoop" || keys === "tgId" || keys === "id"){
          return "center"
        }if(item === null){
          return "center"
        }
        else{
          return "left"
        }
      }

    return (
        <div className={styles.UniversalTable}>
            <table>
                <thead>
                    {tableHeaderData?.map((el, index) => (
                        <th key={index} name={el.key}>{el.value}</th>
                    ))}
                </thead>
                <tbody>
                    {tableBodyData?.map((row, rowIndex) => (
                        <tr key={rowIndex} onClick={() => props?.selectFlag && clickTr(row)}>
                            {tableHeaderData.map((header) => (
                                <td key={header.key} name={header.key} className={header.key} style={context.selectRowDirectory === row.id ? { backgroundColor: "#D8CDC1FF", textAlign: textAlign(header.key, row[header.key])} : {textAlign: textAlign(header.key, row[header.key])}}>
                                    {getValue(row[header.key], header.key)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {tableBodyData.length === 0 && <tr><td colSpan={tableHeaderData.length} className={styles.tableNotData}>Нет данных</td></tr>}
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
