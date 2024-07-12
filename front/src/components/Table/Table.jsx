import React, { useState, useContext } from "react";
import styles from "./Table.module.scss";
import DataContext from "../../context";
import { SetStatusRequest, SetcontractorRequest } from "../../API/API";

function Table() {
  const { context } = useContext(DataContext);

  const trClick = (row) => {
    context.setSelectedTr(row.id);
  };

  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Принята",
  };

  const [shovStatusPop, setshovStatusPop] = useState("");
  const [shovBulderPop, setshovBulderPop] = useState("");

  const [modalImage, setModalImage] = useState(null);

  const editStatus = (status, id) => {
    const data = {
      requestId: id,
      status: status,
    };
    SetStatusRequest(data).then((resp) => {
      if (resp) {
        context.UpdateTableReguest(1);
      }
    });
  };

  const funSetStatus = (data) => {
    if (shovStatusPop === "") {
      setshovStatusPop(data);
    } else {
      setshovStatusPop("");
    }
  };
  const funSetBulder = (data) => {
    if (shovBulderPop === "") {
      setshovBulderPop(data);
    } else {
      setshovBulderPop("");
    }
  };

  const openModal = (src) => {
    setModalImage(src);
  };

  const closeModal = () => {
    setModalImage(null);
  };
  const SetBilder = (contractorId, idAppoint) =>{
    const data = {
      requestId: idAppoint,
      contractorId: contractorId,
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp) {
        context.UpdateTableReguest(1);
      }
    });
  }

  const filteredTableData = context.tableData.filter((row) =>
  Object.values(row).some(
    (value) =>
      value && 
      value.toString().toLowerCase().includes(context.textSearchTableData.toLowerCase())
  )
);
    const getItem = (item) =>{
     if(item === null || item === undefined){
       return "___"
     }else{
      return item
     }
    }
  return (
    <>
      {filteredTableData.length > 0 ? (
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
              {filteredTableData.map((row, index) => (
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
                                    onClick={() => editStatus(index + 1, row.id)}
                                    key={index}
                                  >
                                    {value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : headerItem.key === "photo" ? (
                        <div>
                          <img
                            src={`http://localhost:3000/uploads/${row.fileName}`}
                            alt="Uploaded file"
                            onClick={() =>
                              openModal(
                                `http://localhost:3000/uploads/${row.fileName}`
                              )
                            }
                            style={{ cursor: "pointer" }}
                            className={styles.imgTable}
                          />
                        </div>
                      ) : headerItem.key === "contractor" ? (
                        <div onClick={() => funSetBulder(row.id)}
                            className={styles.statusClick}>
                        {row[headerItem.key] !== null ? row[headerItem.key]?.name : "___"}
                          {shovBulderPop === row.id && (
                            <div className={styles.shovStatusPop}>
                              <ul>
                                {context.dataContractors?.map((value, index) => (
                                  <li
                                    onClick={() => SetBilder(value.id, row.id)}
                                    key={index}
                                  >
                                    {value.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        getItem(row[headerItem.key])
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

      {modalImage && (
        <div className={styles.modal} onClick={closeModal}>
          <span className={styles.close}>&times;</span>
          <img className={styles.modalContent} src={modalImage} alt="Full size" />
        </div>
      )}
    </>
  );
}

export default Table;
