import { useContext, useEffect, useState } from "react";
import styles from "./ReferenceObjects.module.scss";
import { CreateObjects, DeleteObjects, GetObjectsAll } from "../../API/API";
import { tableHeaderObject } from "./DirectoryObjectData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import UneversalList from "../../UI/UneversalList/UneversalList";
import arrow from "./../../assets/images/arrow_bottom.svg";
function ReferenceObjects() {
    const [tableDataObject, setTableDataObject] = useState([]);
    const [legalData, setLegalData] = useState([]);
    const [unitData, setUnitData] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const [unitName, setUnitName] = useState('');
    const [city, setCity] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [valueCreateUnit, setValueCreateUnit] = useState('');
    const [valueCreateLegal, setValueCreateLegal] = useState('');
    const [openvalueCreateUnit, setOpenvalueCreateUnit] = useState(false);
    const [openvalueCreateLegal, setOpenvalueCreateLegal] = useState(false);
    const [valueCreateUnitId, setValueCreateUnitId] = useState('');
    const [valueCreateLegalId, setValueCreateLegalId] = useState('');

    useEffect(() => {
        getData()
    },[])

    function formatData(data) {
        return data.map(item => ({
            id: item.id, // Include the id if needed for further operations
            number: item.number,
            name: item.name,
            legalForm: `${item.legalEntity.legalForm} ${item.legalEntity.name}`,
            unitName: item.unit.name,
            city: item.city
        }));
    }
    const formatDataObjectAndLegal = (data) => {
        let ObjectData = []
        let ObjectLegal = []
       data.map(item => {
           ObjectData.push(item.unit)
           ObjectLegal.push(item.legalEntity)
       })
       setLegalData(ObjectLegal);
       setUnitData(ObjectData);
       console.log(ObjectData, ObjectLegal)
    }

    
    const getData = () => {
        GetObjectsAll().then((response) => {
            setTableDataObject(formatData(response.data));
            formatDataObjectAndLegal(response.data)
        })
    }

    const { context } = useContext(DataContext);
    const [deleteUnitFlag, setDeleteUnitFlag] = useState(false)
    const deleteObjcect = () => {
        if(context.selectRowDirectory){
            setDeleteUnitFlag(true)
        }else{
            context.setPopupErrorText("Сначала выберите объект!");
            context.setPopUp("PopUpError")
        }
        
    }

    const ClosePopUp = () => {
        setDeleteUnitFlag(false)
    }

    const FunctionDelete = () => {
        DeleteObjects(context.selectRowDirectory).then((response) => {
            if(response?.status === 200){
                setDeleteUnitFlag(false)   
                getData()
            }
        })
    }

    const handleCreateUnit = () => {
        if (!unitName || !city || !valueCreateUnit || !valueCreateLegal) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }
      
        const newUnit = {
            name: unitName,
            city: city,
            unitId: valueCreateUnitId,
            legalEntityId: valueCreateLegalId
        };

        console.log(newUnit);
        CreateObjects(newUnit).then((response) => {
            if (response?.status === 201) {
                getData();
                closePopUp();
            }
        });
    };

    const closePopUp = () => {
        setPopUpCreate(false);
        setUnitName('');
        setCity('');
        setErrorMessage('');
        setOpenvalueCreateUnit(false);
        setOpenvalueCreateLegal(false);
        setValueCreateUnit('');
        setValueCreateLegal('');
    };

    return ( 
        <div className={styles.ReferenceObjects}>
            <div className={styles.ReferenceObjectsTop}>
                <div>
                    <h2>Объекты</h2>
                </div>
                <div className={styles.ReferenceObjectsTopButton}>
                    <button onClick={() => setPopUpCreate(true)}>Добавить объект</button>
                    <button onClick={()=>deleteObjcect()}>Удалить объект</button>
                </div>
            </div>
          <UniversalTable tableHeader={tableHeaderObject} tableBody={tableDataObject} selectFlag={true}/>
          { deleteUnitFlag &&  <UneversalDelete text="Объект" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete}/>}
        {context.popUp === "PopUpError" && <PopUpError />}
        {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title="Новый объект" closePopUpFunc={closePopUp}>
                        <div className={styles.PupUpCreateInputInner}>
                            <div>
                                <div>
                                    <input 
                                        placeholder="Название..." 
                                        value={unitName} 
                                        onChange={(e) => setUnitName(e.target.value)} 
                                    />
                                    <div className={styles.ListCreateDataCont}>
                                        <input 
                                            placeholder="Подразделение" 
                                            value={valueCreateUnit} 
                                            onClick={() => setOpenvalueCreateUnit(!openvalueCreateUnit)} 
                                            readOnly 
                                            style={{borderBottom: !openvalueCreateUnit ? "1px solid #ADADAD" : "none", borderRadius: openvalueCreateUnit ? "8px 8px 0 0" : "8px"}}

                                        />
                                         <span
                                                className={styles.arrowBot}
                                            >
                                        <img
                                        style={{
                                            transform: openvalueCreateUnit ? "rotate(0deg)" : "rotate(-90deg)",
                                        }}
                                        src={arrow}
                                        />
                                    </span>
                                        {openvalueCreateUnit && <ul className={styles.ListCreateData}>
                                            {unitData.map((item, index) => <li onClick={() => {setValueCreateUnit(item.name); setOpenvalueCreateUnit(false); setValueCreateUnitId(item.id)}} key={index}>{item.name}</li>)}
                                        </ul>}
                                    </div>
                                    <div className={styles.ListCreateDataCont}>
                                        <input placeholder="Юр. лицо" value={valueCreateLegal} onClick={() => setOpenvalueCreateLegal(!openvalueCreateLegal)} readOnly  style={{borderBottom: !openvalueCreateLegal ? "1px solid #ADADAD" : "none", borderRadius: openvalueCreateLegal ? "8px 8px 0 0" : "8px"}}
/>                                         <span
                                                className={styles.arrowBot}
                                            >
                                        <img
                                        style={{
                                            transform: openvalueCreateLegal ? "rotate(0deg)" : "rotate(-90deg)",
                                        }}
                                        src={arrow}
                                        />
                                    </span>
                                        {openvalueCreateLegal && <ul className={styles.ListCreateData}>
                                            {legalData.map((item, index) => <li onClick={() => {setValueCreateLegal(item.name); setOpenvalueCreateLegal(false); setValueCreateLegalId(item.id)}} key={index}>{item.name}</li>)}
                                        </ul>}
                                    </div>
                                    <input 
                                        placeholder="Правовая форма..." 
                                        value={city} 
                                        onChange={(e) => setCity(e.target.value)} 
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

export default ReferenceObjects;