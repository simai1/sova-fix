import { useContext, useEffect, useState } from "react";
import { DeletelegalEntities, GetlegalEntitiesAll, CreateLegalEntity, CreateLegalEntities } from "../../API/API"; // Ensure CreateLegalEntity is imported
import { tableLagealEntries } from "./DirectoryLegalEntitiesData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./DirectoryLegalEntities.module.scss";
import DataContext from "../../context";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";

function DirectoryLegalEntities() {
    const [tableDataEntries, setTableDataEntries] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const [unitName, setUnitName] = useState('');
    const [legalForm, setLegalForm] = useState('');
    const [startCoop, setstartCoop] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const { context } = useContext(DataContext);
    const [deleteUnitFlag, setDeleteUnitFlag] = useState(false);

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        GetlegalEntitiesAll().then((response) => {
            setTableDataEntries(response.data);
        });
    };

    const deleteUnit = () => {
        if (context.selectRowDirectory) {
            setDeleteUnitFlag(true);
        } else {
            context.setPopupErrorText("Сначала выберите Юр. лицо!");
            context.setPopUp("PopUpError");
        }
    };

    const ClosePopUp = () => {
        setDeleteUnitFlag(false);
    };

    const FunctionDelete = () => {
        DeletelegalEntities(context.selectRowDirectory).then((response) => {
            if (response?.status === 200) {
                setDeleteUnitFlag(false);
                getData();
            }
        });
    };

    const closePopUp = () => {
        setPopUpCreate(false);
        setUnitName('');
        setLegalForm('');
        setstartCoop('');
        setErrorMessage('');
    };

    const handleCreateUnit = () => {
        if (!unitName || !legalForm || !startCoop) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }
        const formattedStartCoop = new Date(startCoop).toISOString();
        const newUnit = {
            name: unitName,
            legalForm: legalForm,
            startCoop: formattedStartCoop,
        };

        console.log(newUnit);
        CreateLegalEntities(newUnit).then((response) => {
            if (response?.status === 200) {
                getData();
                closePopUp();
            }
        });
    };

    return (
        <div className={styles.DirectoryLegalEntities}>
            <div className={styles.DirectoryLegalEntitiesTop}>
                <div>
                    <h2>Юридические лица</h2>
                </div>
                <div className={styles.DirectoryLegalEntitiesTopButton}>
                    <button onClick={() => setPopUpCreate(true)}>Добавить юридическое лицо</button>
                    <button onClick={() => deleteUnit()}>Удалить юридическое лицо</button>
                </div>
            </div>
            <UniversalTable tableHeader={tableLagealEntries} tableBody={tableDataEntries} selectFlag={true} />
            {deleteUnitFlag && <UneversalDelete text="Юр. лицо" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete} />}
            {context.popUp === "PopUpError" && <PopUpError />}
            {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title="Новое юридическое лицо" closePopUpFunc={closePopUp}>
                        <div className={styles.PupUpCreateInputInner}>
                            <div>
                                <div>
                                    <input 
                                        placeholder="Название..." 
                                        value={unitName} 
                                        onChange={(e) => setUnitName(e.target.value)} 
                                    />
                                    <input 
                                        placeholder="Правовая форма..." 
                                        value={legalForm} 
                                        onChange={(e) => setLegalForm(e.target.value)} 
                                    />
                                    <input 
                                        type="date" 
                                        placeholder="Дата начала сотрудничества..." 
                                        value={startCoop} 
                                        onChange={(e) => setstartCoop(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    {errorMessage && <div className={styles.ErrorMessage}>{errorMessage}</div>}
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

export default DirectoryLegalEntities;
