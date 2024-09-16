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
    }, [props?.tableHeader, props?.tableBody]);

    const openModal = (src) => {
        if(modalImage){
            setModalImage(null);
        }else{
            setModalImage(src);
        }
      };

    const getValue = (value, key) => {
        if(key === "repairPrice" && key !== "fileName" && key !== "checkPhoto") {
            return    value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") 
        }else if(key === "fileName" || key === "checkPhoto") {
            if(value) {
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
              </div>)
            }else{
                return "___"
            }
        }else{
            if(value) {
                return value
            }else{
                return "___"
            }
        }
    }
    return ( 
        <div className={styles.UniversalTable}>
            <table>
                <thead>
                   {tableHeaderData?.map((el, index) =>  
                        <th key={index}>{el.value}</th>
                   ) }
                </thead>
                <tbody>
                    {tableBodyData?.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {tableHeaderData.map((header) => (
                                <td key={header.key} class={header.key}>
                                {getValue(row[header.key], header.key)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {
                        tableBodyData.length === 0 && <tr><td colSpan={tableHeaderData.length} className={styles.tableNotData}>Нет данных</td></tr>
                    }
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