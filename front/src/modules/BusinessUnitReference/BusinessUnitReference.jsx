import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./BusinessUnitReference.module.scss";
import {
  DeleteUnit,
  GetUnitsAll,
  CreateUnit,
  GetUnitsOne,
  EditUnit,
} from "../../API/API"; // Ensure CreateUnit is imported
import { tableUnitHeader } from "./DirectoryUnitData";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import Input from "../../UI/Input/Input";
import { useDispatch } from "react-redux";
import ClearImg from "./../../assets/images/ClearFilter.svg"
import { resetFilters } from "../../store/samplePoints/samplePoits";
function BusinessUnitReference() {
  const { context } = useContext(DataContext);
  const [tableDataUnit, setTableDataUnit] = useState([]);
  const [popUpCreate, setPopUpCreate] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [popUpEdit, setPopUpEdit] = useState(false);
  const [selectId, setSelectId] = useState("");

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    GetUnitsAll().then((response) => {
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
    DeleteUnit(context.selectRowDirectory).then((response) => {
      if (response?.status === 200) {
        setDeleteUnitFlag(false);
        getData();
      }
    });
  };

  const closePopUp = () => {
    setPopUpCreate(false);
    setPopUpEdit(false);
    setUnitName("");
    setUnitDescription("");
    setErrorMessage("");
  };

  const handleCreateUnit = () => {
    if (!unitName || !unitDescription) {
      setErrorMessage("Пожалуйста, заполните все поля!");
      return;
    }

    const newUnit = {
      name: unitName,
      description: unitDescription,
    };

    popUpEdit
      ? EditUnit(newUnit, selectId).then((response) => {
          if (response?.status === 200) {
            getData();
            closePopUp();
          }
        })
      : CreateUnit(newUnit).then((response) => {
          if (response?.status === 200) {
            getData();
            closePopUp();
          }
        });
  };
  const dispatch = useDispatch()
  const EditUnitFinc = () => {
    if (context.selectRowDirectory) {
      setPopUpCreate(true);
      setPopUpEdit(true);
      setSelectId(context.selectRowDirectory);
      GetUnitsOne(context.selectRowDirectory).then((response) => {
        setUnitName(response.data.name);
        setUnitDescription(response.data.description);
      });
    } else {
      context.setPopupErrorText("Сначала выберите подразделение!");
      context.setPopUp("PopUpError");
    }
  };

  return (
    <div className={styles.BusinessUnitReference}>
      <div className={styles.BusinessUnitReferenceTop}>
        <div className={styles.BusinessUnitReferenceTopTitle}>
          <div>
            <p style={{fontSize:"24px", margin:"0px"}}>Подразделения</p>
          </div>
          <div className={styles.clear}>
            <button onClick={() => dispatch(resetFilters({tableName: "table2"}))} ><img src={ClearImg} /></button>
          </div>
        </div>
        {JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" &&
          <div className={styles.BusinessUnitReferenceTopButton}>
            <button onClick={() => setPopUpCreate(true)}>
              Добавить
            </button>
            <button onClick={() => EditUnitFinc()}>
              Редактировать
            </button>
            <button onClick={() => deleteUnit()}>Удалить</button>
          </div>
        }
      </div>
      <UniversalTable
        tableName="table2"
        tableHeader={tableUnitHeader}
        tableBody={tableDataUnit}
        selectFlag={true}
        FilterFlag={true}
        heightTable="calc(100vh - 285px)"
      />
      {deleteUnitFlag && (
        <UneversalDelete
          text="Подразделение"
          ClosePopUp={ClosePopUp}
          FunctionDelete={FunctionDelete}
        />
      )}
      {context.popUp === "PopUpError" && <PopUpError />}
      {popUpCreate && (
        <div className={styles.PupUpCreate}>
          <PopUpContainer
            mT={300}
            title={
              popUpEdit ? "Редактирование подразделения" : "Новое подразделение"
            }
            closePopUpFunc={closePopUp}
          >
            <div className={styles.PupUpCreateInputInner}>
              <div>
                <div>
                  <input
                    placeholder="Название..."
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                  <input
                    placeholder="Описание..."
                    value={unitDescription}
                    onChange={(e) => setUnitDescription(e.target.value)}
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
                {popUpEdit ? "Сохранить" : "Создать"}
              </button>
            </div>
          </PopUpContainer>
        </div>
      )}
    </div>
  );
}

export default BusinessUnitReference;
