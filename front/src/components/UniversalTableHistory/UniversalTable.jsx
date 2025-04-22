import React, { useContext, useEffect, useState } from "react";
import styles from "./UniversalTable.module.scss";
import DataContext from "../../context";



function UniversalTableHistory(props) {
  const context = useContext(DataContext);
  const [tableHeaderData, setTableHeaderData] = useState([]);
  const [tableBodyData, setTableBodyData] = useState([]);

 
  useEffect(() => {
    setTableHeaderData(props?.tableHeader);
    setTableBodyData(props?.tableBody);
  }, [props?.tableHeader, props?.tableBody]);


  const getValue = (value, key, rowIndex) => {
    switch (key) {
      case "id":
        return rowIndex + 1 || "___";   
      case "repairPrice":
        case "sum":
        return value?.toLocaleString().replace(",", " ") + " руб." || "___";  
      default:
        return value || "___";
    }
  };




 
  return (
    <div
      className={styles.UniversalTable}>
      <table>
        <thead>
          {tableHeaderData?.map((el, index) => (
            <th
              key={index}
              name={el.key}>
              {el.value}
             </th>
          ))}
        </thead>
        <tbody>
          {tableBodyData?.length === 0 ? (
            <tr>
              <td
                colSpan={tableHeaderData.length}
                className={styles.tableNotData}
              >
                Нет данных
              </td>
            </tr>
          ) : (
            tableBodyData?.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={context?.selectedRows === row?.id && styles.setectedTr}
            >
              {tableHeaderData.map((header) => (
                <td
                  key={header.key}
                  name={header.key}
                  className={header.key}
                >
                {getValue(row[header.key], header.key, rowIndex)}
                </td>
              ))}
            </tr>
          ))
          )
          
          }
        </tbody>
      </table>
    </div>
  );
}

export default UniversalTableHistory;
