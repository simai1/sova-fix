import { useContext, useEffect, useRef, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./ThePerformersDirectory.module.scss";
import {
  DeleteUnit,
  GetUnitsAll,
  CreateUnit,
  GetextContractorsAll,
  CreateextContractors,
  DeleteextContractors,
  GetextContractorsOne,
  EditExitContractors,
} from "../../API/API"; // Ensure CreateUnit is imported
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import Input from "../../UI/Input/Input";
import { tablePerformanseHeader } from "./PerformersData";
import arrow from "./../../assets/images/arrow_bottom.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import { useDispatch } from "react-redux";
import ClearImg from "./../../assets/images/ClearFilter.svg"
function ThePerformersDirectory() {
  const { context } = useContext(DataContext);
  const [tableDataUnit, setTableDataUnit] = useState([]);
  const [popUpCreate, setPopUpCreate] = useState(false);
  const [performedName, setPerformedName] = useState("");
  const [performedspec, setPerformedspec] = useState("");
  const [performedLegalForm, setPerformedLegalForm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [popUpEdit, setPopUpEdit] = useState(false);
  const [selectId, setSelectId] = useState("");
  const [legalFormEcho, setLegalFormEcho] = useState("");
  const [openvaluelegalForm, setOpenvaluelegalForm] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    GetextContractorsAll().then((response) => {
      setTableDataUnit(response.data);
    });
  };

  const [deleteUnitFlag, setDeleteUnitFlag] = useState(false);
  const deleteUnit = () => {
    if (context.selectRowDirectory) {
      setDeleteUnitFlag(true);
    } else {
      context.setPopupErrorText("Сначала выберите подразделение!");
      context.setPopUp("PopUpError");
    }
  };

  const ClosePopUp = () => {
    setDeleteUnitFlag(false);
  };

  const FunctionDelete = () => {
    DeleteextContractors(context.selectRowDirectory).then((response) => {
      if (response?.status === 200) {
        setDeleteUnitFlag(false);
        getData();
      }
    });
  };

  const closePopUp = () => {
    setPopUpCreate(false);
    setPopUpEdit(false);
    setPerformedName("");
    setPerformedspec("");
    setPerformedLegalForm("");
    setErrorMessage("");
    setLegalFormEcho("");
  };

  const handleCreateUnit = () => {
    if (
      !performedLegalForm ||
      !performedName ||
      !performedspec ||
      (performedLegalForm === "Другое" && !legalFormEcho)
    ) {
      setErrorMessage("Пожалуйста, заполните все поля!");
      return;
    }
    const legalFormValue =
      performedLegalForm === "Другое" ? legalFormEcho : performedLegalForm;
    const newUnit = {
      name: performedName,
      spec: performedspec,
      legalForm: legalFormValue,
    };
    CreateextContractors(newUnit).then((response) => {
      if (response?.status === 200) {
        getData();
        closePopUp();
      }
    });
  };
  const EditPerformers = () => {
    if (context.selectRowDirectory) {
      setSelectId(context.selectRowDirectory);
      setPopUpEdit(true);
      GetextContractorsOne(context.selectRowDirectory).then((response) => {
        setPerformedName(response.data.name);
        setPerformedspec(response.data.spec);
        setPerformedLegalForm(response.data.legalForm);
      });
    } else {
      context.setPopupErrorText("Сначала выберите внешнего подрядчика!");
      context.setPopUp("PopUpError");
    }
  };

  const handleEditPerformed = () => {
    if (!performedLegalForm || !performedName || !performedspec) {
      setErrorMessage("Пожалуйста, заполните все поля!");
      return;
    } else {
      const newUnit = {
        name: performedName,
        spec: performedspec,
        legalForm: performedLegalForm,
      };

      EditExitContractors(newUnit, selectId).then((response) => {
        if (response?.status === 200) {
          getData();
          closePopUp();
        }
      });
    }
  };

  const legalFormData = [
    { id: 1, name: "ООО" },
    { id: 2, name: "ИП" },
    { id: 3, name: "Самозанятый" },
    { id: 4, name: "Физ.лицо" },
    { id: 5, name: "Другое" },
  ];

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setOpenvaluelegalForm(false);
    }
  };
  const dispatch = useDispatch();

  return (
    <div className={styles.ThePerformersDirectory}>
      <div className={styles.ThePerformersDirectoryTop}>
        <div className={styles.BusinessUnitReferenceTopTitle}>
            <div>
            <h2>Внешние подрядчики</h2>
            </div>
            <div className={styles.clear}>
                <button onClick={() => dispatch(resetFilters({tableName: "table4"}))} ><img src={ClearImg} /></button>
            </div>
        </div>
        <div className={styles.ThePerformersDirectoryTopButton}>
          <button onClick={() => setPopUpCreate(true)}>
            Добавить внешнего подрядчика
          </button>
          <button onClick={() => EditPerformers()}>
            Редактировать внешнего подрядчика
          </button>
          <button onClick={() => deleteUnit()}>
            Удалить внешнего подрядчика
          </button>
        </div>
      </div>
      <UniversalTable
        tableName="table4"
        tableHeader={tablePerformanseHeader}
        tableBody={tableDataUnit}
        selectFlag={true}
        FilterFlag={true}
      />
      {deleteUnitFlag && (
        <UneversalDelete
          text="Внешнего подрядчика"
          ClosePopUp={ClosePopUp}
          FunctionDelete={FunctionDelete}
        />
      )}
      {context.popUp === "PopUpError" && <PopUpError />}
      {popUpCreate && (
        <div className={styles.PupUpCreate}>
          <PopUpContainer
            mT={300}
            title="Новый внешний подрядчик"
            closePopUpFunc={closePopUp}
          >
            <div className={styles.PupUpCreateInputInner}>
              <div>
                <div>
                  <input
                    placeholder="Название..."
                    value={performedName}
                    onChange={(e) => setPerformedName(e.target.value)}
                  />
                  <input
                    placeholder="Специализация..."
                    value={performedspec}
                    onChange={(e) => setPerformedspec(e.target.value)}
                  />
                  {/* <input 
                                        placeholder="Правовая форма..." 
                                        value={performedLegalForm} 
                                        onChange={(e) => setPerformedLegalForm(e.target.value)} 
                                    /> */}
                  <div className={styles.ListCreateDataCont} ref={containerRef}>
                    <input
                      placeholder="Подразделение"
                      value={performedLegalForm}
                      onClick={() => setOpenvaluelegalForm(!openvaluelegalForm)}
                      readOnly
                      style={{
                        borderBottom: !openvaluelegalForm
                          ? "1px solid #ADADAD"
                          : "none",
                        borderRadius: openvaluelegalForm
                          ? "8px 8px 0 0"
                          : "8px",
                      }}
                    />
                    <span className={styles.arrowBot}>
                      <img
                        style={{
                          transform: openvaluelegalForm
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                        }}
                        src={arrow}
                      />
                    </span>
                    {openvaluelegalForm && (
                      <ul className={styles.ListCreateData}>
                        {legalFormData?.map((item, index) => (
                          <li
                            onClick={() => {
                              setPerformedLegalForm(item.name);
                              setOpenvaluelegalForm(false);
                            }}
                            key={index}
                          >
                            {item.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    {performedLegalForm === "Другое" && (
                      <input
                        placeholder="Другое..."
                        value={legalFormEcho}
                        onChange={(e) => setLegalFormEcho(e.target.value)}
                        maxLength={50}
                      />
                    )}
                  </div>
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
                {popUpEdit ? "Сохранить" : "Создать"}
              </button>
            </div>
          </PopUpContainer>
        </div>
      )}
      {popUpEdit && (
        <div className={styles.PupUpCreate}>
          <PopUpContainer
            mT={300}
            title="Редактирование внешнего подрядчика"
            closePopUpFunc={closePopUp}
          >
            <div className={styles.PupUpCreateInputInner}>
              <div>
                <div>
                  <input
                    placeholder="Название..."
                    value={performedName}
                    onChange={(e) => setPerformedName(e.target.value)}
                  />
                  <input
                    placeholder="Специализация..."
                    value={performedspec}
                    onChange={(e) => setPerformedspec(e.target.value)}
                  />
                  <input
                    placeholder="Правовая форма..."
                    value={performedLegalForm}
                    onChange={(e) => setPerformedLegalForm(e.target.value)}
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
                onClick={handleEditPerformed}
              >
                Сохранить
              </button>
            </div>
          </PopUpContainer>
        </div>
      )}
    </div>
  );
}

export default ThePerformersDirectory;
