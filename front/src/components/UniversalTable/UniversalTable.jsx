import React, { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import styles from "./UniversalTable.module.scss";


function UniversalTable(props) {
    const { context } = useContext(DataContext);
    const [tableHeaderData, setTableHeaderData] = useState([]);
    const [tableBodyData, setTableBodyData] = useState([]);


    useEffect(() => {
        setTableHeaderData(props?.tableHeader);
        setTableBodyData(props?.tableBody);
    }, [props?.tableHeader, props?.tableBody]);
    const getValue = (value, key) => {
        if(key === "repairPrice") {
            return    value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") 
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
                                <td key={header.key}>
                                {getValue(row[header.key], header.key)}
                               
                                
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
     );
}

export default UniversalTable;