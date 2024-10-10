import { useContext, useEffect, useRef, useState } from "react";
import styles from "./ReferenceObjects.module.scss";
import {
  CreateObjects,
  DeleteObjects,
  EditObjects,
  GetObjectsAll,
  GetObjectsOne,
  GetUnitsAll,
  GetlegalEntitiesAll,
} from "../../API/API";
import { tableHeaderObject } from "./DirectoryObjectData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import UneversalList from "../../UI/UneversalList/UneversalList";
import arrow from "./../../assets/images/arrow_bottom.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import ClearImg from "./../../assets/images/ClearFilter.svg"
import { useDispatch } from "react-redux";
function ReferenceObjects() {
  const [tableDataObject, setTableDataObject] = useState([]);
  const [legalData, setLegalData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [popUpCreate, setPopUpCreate] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [city, setCity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [valueCreateUnit, setValueCreateUnit] = useState("");
  const [valueCreateLegal, setValueCreateLegal] = useState("");
  const [openvalueCreateUnit, setOpenvalueCreateUnit] = useState(false);
  const [openvalueCreateLegal, setOpenvalueCreateLegal] = useState(false);
  const [valueCreateUnitId, setValueCreateUnitId] = useState("");
  const [valueCreateLegalId, setValueCreateLegalId] = useState("");
  const [pupUpEdit, setPupUpEdit] = useState(false);
  const [selectId, setSelectId] = useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    getData();
    formatDataObjectAndLegal();
  }, []);

  function formatData(data) {
    return data?.map((item) => ({
      id: item?.id, // Include the id if needed for further operations
      number: item?.number,
      name: item?.name,
      legalForm: `${item?.legalEntity?.legalForm} ${item?.legalEntity?.name}`,
      unitName: item?.unit?.name,
      city: item?.city,
    }));
  }
  const formatDataObjectAndLegal = () => {
    GetlegalEntitiesAll().then((response) => {
      setLegalData(response.data);
    });
    GetUnitsAll().then((response) => {
      setUnitData(response?.data);
    });
  };

  const getData = () => {
    GetObjectsAll().then((response) => {
      setTableDataObject(formatData(response.data));
    });
  };

  const { context } = useContext(DataContext);
  const [deleteUnitFlag, setDeleteUnitFlag] = useState(false);
  const deleteObjcect = () => {
    if (context.selectRowDirectory) {
      setDeleteUnitFlag(true);
    } else {
      context.setPopupErrorText("Сначала выберите объект!");
      context.setPopUp("PopUpError");
    }
  };

  const ClosePopUp = () => {
    setDeleteUnitFlag(false);
  };

  const FunctionDelete = () => {
    DeleteObjects(context.selectRowDirectory).then((response) => {
      if (response?.status === 200) {
        setDeleteUnitFlag(false);
        getData();
      }
    });
  };

  const handleCreateUnit = () => {
    if (!unitName || !city || !valueCreateUnit || !valueCreateLegal) {
      setErrorMessage("Пожалуйста, заполните все поля!");
      return;
    }

    const newUnit = {
      name: unitName,
      city: city,
      unitId: valueCreateUnitId,
      legalEntityId: valueCreateLegalId,
    };

    pupUpEdit
      ? EditObjects(newUnit, selectId).then((response) => {
          if (response?.status === 200) {
            getData();
            closePopUp();
          }
        })
      : CreateObjects(newUnit).then((response) => {
          if (response?.status === 200) {
            getData();
            closePopUp();
          }
        });
  };

  const closePopUp = () => {
    setPopUpCreate(false);
    setPupUpEdit(false);
    setUnitName("");
    setCity("");
    setErrorMessage("");
    setOpenvalueCreateUnit(false);
    setOpenvalueCreateLegal(false);
    setValueCreateUnit("");
    setValueCreateLegal("");
  };

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setOpenvalueCreateUnit(false);
      setOpenvalueCreateLegal(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const containerRef = useRef(null);

  const EditObjectsFunc = () => {
    if (context.selectRowDirectory) {
      setPopUpCreate(true);
      setPupUpEdit(true);
      setSelectId(context.selectRowDirectory);
      GetObjectsOne(context.selectRowDirectory).then((response) => {
        setUnitName(response.data?.name);
        setCity(response.data?.city);
        setValueCreateUnitId(response.data?.unit?.id);
        setValueCreateLegalId(response.data?.legalEntity?.id);
        setValueCreateUnit(response.data?.unit?.name);
        setValueCreateLegal(response.data?.legalEntity?.name);
      });
    } else {
      context.setPopupErrorText("Сначала выберите объект!");
      context.setPopUp("PopUpError");
    }
  };

  return (
    <div className={styles.ReferenceObjects}>
      <div className={styles.ReferenceObjectsTop}>
        <div className={styles.BusinessUnitReferenceTopTitle}>
            <div>
              <h2>Объекты</h2>
            </div>
            <div className={styles.clear}>
                <button onClick={() => dispatch(resetFilters({tableName: "table3"}))} ><img src={ClearImg} /></button>
            </div>
        </div>
        <div className={styles.ReferenceObjectsTopButton}>
          <button onClick={() => setPopUpCreate(true)}>Добавить объект</button>
          <button onClick={() => EditObjectsFunc()}>
            Редактировать объект
          </button>
          <button onClick={() => deleteObjcect()}>Удалить объект</button>
        </div>
      </div>
      <UniversalTable
        tableName="table3"
        tableHeader={tableHeaderObject}
        tableBody={tableDataObject}
        selectFlag={true}
        FilterFlag={true}
      />
      {deleteUnitFlag && (
        <UneversalDelete
          text="Объект"
          ClosePopUp={ClosePopUp}
          FunctionDelete={FunctionDelete}
        />
      )}
      {context.popUp === "PopUpError" && <PopUpError />}
      {popUpCreate && (
        <div className={styles.PupUpCreate}>
          <PopUpContainer
            mT={300}
            title={pupUpEdit ? "Редактирование объекта" : "Новый объект"}
            closePopUpFunc={closePopUp}
          >
            <div className={styles.PupUpCreateInputInner}>
              <div>
                <div>
                  <input
                    placeholder="Адрес..."
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                  <div className={styles.ListCreateDataCont}>
                    <input
                      placeholder="Подразделение"
                      value={valueCreateUnit}
                      onClick={() =>
                        setOpenvalueCreateUnit(!openvalueCreateUnit)
                      }
                      readOnly
                      style={{
                        borderBottom: !openvalueCreateUnit
                          ? "1px solid #ADADAD"
                          : "none",
                        borderRadius: openvalueCreateUnit
                          ? "8px 8px 0 0"
                          : "8px",
                      }}
                    />
                    <span className={styles.arrowBot}>
                      <img
                        style={{
                          transform: openvalueCreateUnit
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                        }}
                        src={arrow}
                      />
                    </span>
                    {openvalueCreateUnit && (
                      <ul ref={containerRef} className={styles.ListCreateData}>
                        {unitData?.map((item, index) => (
                          <li
                            onClick={() => {
                              setValueCreateUnit(item.name);
                              setOpenvalueCreateUnit(false);
                              setValueCreateUnitId(item.id);
                            }}
                            key={index}
                          >
                            {item.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.ListCreateDataCont}>
                    <input
                      placeholder="Юр. лицо"
                      value={valueCreateLegal}
                      onClick={() =>
                        setOpenvalueCreateLegal(!openvalueCreateLegal)
                      }
                      readOnly
                      style={{
                        borderBottom: !openvalueCreateLegal
                          ? "1px solid #ADADAD"
                          : "none",
                        borderRadius: openvalueCreateLegal
                          ? "8px 8px 0 0"
                          : "8px",
                      }}
                    />{" "}
                    <span className={styles.arrowBot}>
                      <img
                        style={{
                          transform: openvalueCreateLegal
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                        }}
                        src={arrow}
                      />
                    </span>
                    {openvalueCreateLegal && (
                      <ul ref={containerRef} className={styles.ListCreateData}>
                        {legalData?.map((item, index) => (
                          <li
                            onClick={() => {
                              setValueCreateLegal(item.name);
                              setOpenvalueCreateLegal(false);
                              setValueCreateLegalId(item.id);
                            }}
                            key={index}
                          >
                            {item.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    placeholder="Город..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  {errorMessage && (
                    <div className={styles.ErrorMessage}>{errorMessage}</div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.PupUpCreateButtonInner}>
              <button
                className={styles.PupUpCreateButton}
                onClick={handleCreateUnit}
              >
                {pupUpEdit ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </PopUpContainer>
        </div>
      )}
    </div>
  );
}

export default ReferenceObjects;
