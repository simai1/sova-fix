import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./BusinessUnitReference.module.scss";
import { DeleteUnit, GetUnitsAll, CreateUnit } from "../../API/API"; // Ensure CreateUnit is imported
import { tableUnitHeader } from "./DirectoryUnitData";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import Input from "../../UI/Input/Input";

function BusinessUnitReference() {
    const { context } = useContext(DataContext);
    const [tableDataUnit, setTableDataUnit] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const [unitName, setUnitName] = useState('');
    const [unitDescription, setUnitDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        getData();
        console.log('Directory.selectRowDirectory', context.selectRowDirectory);
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
        setUnitName('');
        setUnitDescription('');
        setErrorMessage('');
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
        console.log('newUnit', newUnit);
        CreateUnit(newUnit).then((response) => {
            if (response?.status === 200) {
                getData();
                closePopUp();
            }
        });
    };

    return (
        <div className={styles.BusinessUnitReference}>
            <div className={styles.BusinessUnitReferenceTop}>
                <div>
                    <h2>Подразделения</h2>
                </div>
                <div className={styles.BusinessUnitReferenceTopButton}>
                    <button onClick={() => setPopUpCreate(true)}>Добавить подразделение</button>
                    <button onClick={() => deleteUnit()}>Удалить подразделение</button>
                </div>
            </div>
            <UniversalTable tableHeader={tableUnitHeader} tableBody={tableDataUnit} selectFlag={true} />
            {deleteUnitFlag && <UneversalDelete text="Подразделение" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete} />}
            {context.popUp === "PopUpError" && <PopUpError />}
            {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title="Новое подразделение" closePopUpFunc={closePopUp}>
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
                                    {errorMessage && <div className={styles.ErrorMessage} >{errorMessage}</div>}
                                </div>
                            </div>

                        </div>
                        <div className={styles.PupUpCreateButtonInner}>
                            <button className={styles.PupUpCreateButton} onClick={handleCreateUnit}>Создать</button>
                        </div>
                    </PopUpContainer>
                </div>
            )}
        </div>
    );
}

export default BusinessUnitReference;
