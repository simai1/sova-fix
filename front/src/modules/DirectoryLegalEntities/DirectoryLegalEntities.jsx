import { useContext, useEffect, useRef, useState } from "react";
import { DeletelegalEntities, GetlegalEntitiesAll, CreateLegalEntity, CreateLegalEntities, GetlegalEntitiesOne, EditLegalEntities } from "../../API/API"; // Ensure CreateLegalEntity is imported
import { tableLagealEntries } from "./DirectoryLegalEntitiesData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./DirectoryLegalEntities.module.scss";
import DataContext from "../../context";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import arrow from "./../../assets/images/arrow_bottom.svg";
function DirectoryLegalEntities() {
    const [tableDataEntries, setTableDataEntries] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const [unitName, setUnitName] = useState('');
    const [legalForm, setLegalForm] = useState('');
    const [startCoop, setstartCoop] = useState(new Date());
    const [errorMessage, setErrorMessage] = useState('');
    const [popUpEdit, setPopUpEdit] = useState(false);
    const [selectId, setSelectId] = useState('');
    const { context } = useContext(DataContext);
    const [deleteUnitFlag, setDeleteUnitFlag] = useState(false);
    const [openvaluelegalForm, setOpenvaluelegalForm] = useState(false);
    const containerRef = useRef(null);
    const [legalFormEcho, setLegalFormEcho] = useState('');
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
        setPopUpEdit(false);
        setUnitName('');
        setLegalForm('');
        setstartCoop('');
        setErrorMessage('');
        setLegalFormEcho('');
    };

    const handleCreateUnit = () => {
        if (!unitName || !legalForm || !startCoop || (legalForm === "Другое" && !legalFormEcho)) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }
        const formattedStartCoop = new Date(startCoop).toISOString();
        const legalFormValue = legalForm === 'Другое' ? legalFormEcho : legalForm;
        const newUnit = {
            name: unitName,
            legalForm: legalFormValue,
            startCoop: formattedStartCoop,
        };
        popUpEdit ? EditLegalEntities(newUnit, selectId).then((response) => {
            if (response?.status === 200) {
                getData();
                closePopUp();
            }
        }) :
        CreateLegalEntities(newUnit).then((response) => {
            if (response?.status === 200) {
                getData();
                closePopUp();
            }
        });
    };

    const EditLegalEntitiesFinc = () => {
        if (context.selectRowDirectory) {
            setSelectId(context.selectRowDirectory);
            setPopUpEdit(true);
            setPopUpCreate(true);
            GetlegalEntitiesOne(context.selectRowDirectory).then((response) => {
                setUnitName(response.data.name);
                setLegalForm(response.data.legalForm);
                setstartCoop(response.data.startCoop.split('T')[0]); // Format the date to 'YYYY-MM-DD'
            });
        } else {
            context.setPopupErrorText("Сначала выберите Юр. лицо!");
            context.setPopUp("PopUpError");
        }
    }
    
    const legalFormData = [
        {id: 1, name : 'ООО'},
        {id: 2, name : 'ИП'},
        {id: 3, name : 'Самозанятый'},
        {id: 4, name : 'Физ.лицо'},
        {id: 5, name : 'Другое'},
    ]
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
            setOpenvaluelegalForm(false);
        }
    };
    



    return (
        <div className={styles.DirectoryLegalEntities}>
            <div className={styles.DirectoryLegalEntitiesTop}>
                <div>
                    <h2>Юридические лица</h2>
                </div>
                <div className={styles.DirectoryLegalEntitiesTopButton}>
                    <button onClick={() => setPopUpCreate(true)}>Добавить юридическое лицо</button>
                    <button onClick={() => EditLegalEntitiesFinc()}>Редактировать юридическое лицо</button>
                    <button onClick={() => deleteUnit()}>Удалить юридическое лицо</button>
                </div>
            </div>
            <UniversalTable tableHeader={tableLagealEntries} tableBody={tableDataEntries} selectFlag={true} setData={setTableDataEntries}/>
            {deleteUnitFlag && <UneversalDelete text="Юр. лицо" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete} />}
            {context.popUp === "PopUpError" && <PopUpError />}
            {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title={ popUpEdit ? "Редактирование юридического лица" : "Новое юридическое лицо"} closePopUpFunc={closePopUp}>
                        <div className={styles.PupUpCreateInputInner}>
                            <div>
                                <div>
                                    <input 
                                        placeholder="Название..." 
                                        value={unitName} 
                                        onChange={(e) => setUnitName(e.target.value)} 
                                        maxLength={50}
                                    />
                                    <div className={styles.ListCreateDataCont} ref={containerRef}>
                                        <input 
                                            placeholder="Подразделение" 
                                            value={legalForm} 
                                            onClick={() => setOpenvaluelegalForm(!openvaluelegalForm)} 
                                            readOnly 
                                            style={{borderBottom: !openvaluelegalForm ? "1px solid #ADADAD" : "none", borderRadius: openvaluelegalForm ? "8px 8px 0 0" : "8px"}}

                                        />
                                         <span
                                                className={styles.arrowBot}
                                            >
                                        <img
                                        style={{
                                            transform: openvaluelegalForm ? "rotate(0deg)" : "rotate(-90deg)",
                                        }}
                                        src={arrow}
                                        />
                                    </span>
                                        {openvaluelegalForm && <ul className={styles.ListCreateData}>
                                            {legalFormData?.map((item, index) => <li onClick={() => {setLegalForm(item.name); setOpenvaluelegalForm(false);}} key={index}>{item.name}</li>)}
                                        </ul>}
                                    </div>
                                    <div>

                                  
                                    {
                                        legalForm === "Другое" && <input 
                                            placeholder="Другое..." 
                                            value={legalFormEcho} 
                                            onChange={(e) => setLegalFormEcho(e.target.value)} 
                                            maxLength={50}
                                        />
                                    }
                                    </div>
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
                            <button className={styles.PupUpCreateButton} onClick={handleCreateUnit}>{ popUpEdit ? "Сохранить" : "Создать"}</button>
                        </div>
                    </PopUpContainer>
                </div>
            )}
            
        </div>
    );
}

export default DirectoryLegalEntities;
