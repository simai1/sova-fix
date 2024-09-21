


import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./ThePerformersDirectory.module.scss";
import { DeleteUnit, GetUnitsAll, CreateUnit, GetextContractorsAll, CreateextContractors, DeleteextContractors, GetextContractorsOne, EditExitContractors } from "../../API/API"; // Ensure CreateUnit is imported
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import Input from "../../UI/Input/Input";
import { tablePerformanseHeader } from "./PerformersData";

function ThePerformersDirectory() {
    const { context } = useContext(DataContext);
    const [tableDataUnit, setTableDataUnit] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const [performedName, setPerformedName] = useState('');
    const [performedspec, setPerformedspec] = useState('');
    const [performedLegalForm, setPerformedLegalForm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [popUpEdit, setPopUpEdit] = useState(false);
    const [selectId, setSelectId] = useState('');
    useEffect(() => {
        getData();
        console.log('Directory.selectRowDirectory', context.selectRowDirectory);
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
        setPerformedName('');
        setPerformedspec('');
        setPerformedLegalForm('');
        setErrorMessage('');
    };

    const handleCreateUnit = () => {
        if (!performedLegalForm || !performedName || !performedspec) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }

        const newUnit = {
            name: performedName,
            spec: performedspec,
            legalForm: performedLegalForm,
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
            })
        } else {
            context.setPopupErrorText("Сначала выберите внешнего подрядчика!");
            context.setPopUp("PopUpError");
        }
    }

    const handleEditPerformed = () => {
        if (!performedLegalForm || !performedName || !performedspec) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }else{
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
    }

    return (
        <div className={styles.ThePerformersDirectory}>
            <div className={styles.ThePerformersDirectoryTop}>
                <div>
                    <h2>Внешние подрядчики</h2>
                </div>
                <div className={styles.ThePerformersDirectoryTopButton}>
                    <button onClick={() => setPopUpCreate(true)}>Добавить внешнего подрядчика</button>
                    <button onClick={() => EditPerformers()}>Редактировать внешнего подрядчика</button>
                    <button onClick={() => deleteUnit()}>Удалить внешнего подрядчика</button>
                </div>
            </div>
            <UniversalTable tableHeader={tablePerformanseHeader} tableBody={tableDataUnit} selectFlag={true} />
            {deleteUnitFlag && <UneversalDelete text="Подразделение" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete} />}
            {context.popUp === "PopUpError" && <PopUpError />}
            {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title="Новый внешний подрядчик" closePopUpFunc={closePopUp}>
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
            {
                popUpEdit && 
                <div className={styles.PupUpCreate}>
                <PopUpContainer mT={300} title="Редактирование внешнего подрядчика" closePopUpFunc={closePopUp}>
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
                                {errorMessage && <div className={styles.ErrorMessage} >{errorMessage}</div>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.PupUpCreateButtonInner}>
                        <button className={styles.PupUpCreateButton} onClick={handleEditPerformed}>Сохранить</button>
                    </div>
                </PopUpContainer>
            </div>
            }
        </div>
    );
}

export default ThePerformersDirectory;
