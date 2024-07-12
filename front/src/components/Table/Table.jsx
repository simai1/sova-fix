import React, {useState } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";

function Table() {
  const { context } = React.useContext(DataContext);

  const trClick = (row) => {
    context.setSelectedTr(row.id);
  };

  const status = {
    1: "Создан",
    2: "Подтвержден",
    3: "Отклонен",
    4: "Завершен",
  };
  const [shovStatusPop, setshovStatusPop] = useState("");
  const editStatus = (value) => {
    console.log(value);
  };

  const funSetStatus = (data) => {
    if (shovStatusPop === "") {
      setshovStatusPop(data);
    } else {
      setshovStatusPop("");
    }
  };

  return (
    <>
      {context.tableData.length > 0 ? (
        <div className={styles.Table}>
          <table className={styles.TableInner}>
            <thead>
              <tr>
                {context.tableHeader.map((item) => (
                  <th key={item.key}>{item.value}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {context.tableData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => trClick(row)}
                  className={
                    context.selectedTr === row.id ? styles.setectedTr : null
                  }
                >
                  {context.tableHeader.map((headerItem) => (
                    <td key={headerItem.key}>
                      {headerItem.key === "id" ? (
                        index + 1
                      ) : headerItem.key === "status" ? (
                        <div
                          onClick={() => funSetStatus(row.id)}
                          className={styles.statusClick}
                        >
                          {status[row[headerItem.key]]}
                          {shovStatusPop === row.id && (
                            <div className={styles.shovStatusPop}>
                              <ul>
                                {Object.values(status).map((value, index) => (
                                  <li
                                    onClick={() => editStatus(index + 1)}
                                    key={index}
                                  >
                                    {value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        row[headerItem.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.notdata}>Нет данных</div>
      )}
    </>
  );
}

export default Table;
