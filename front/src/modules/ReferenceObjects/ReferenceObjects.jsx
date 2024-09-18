import { useContext, useEffect, useState } from "react";
import styles from "./ReferenceObjects.module.scss";
import { DeleteObjects, GetObjectsAll } from "../../API/API";
import { tableHeaderObject } from "./DirectoryObjectData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";

function ReferenceObjects() {
    const [tableDataObject, setTableDataObject] = useState([]);
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
    

    
    const getData = () => {
        GetObjectsAll().then((response) => {
            setTableDataObject(formatData(response.data));
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

    return ( 
        <div className={styles.ReferenceObjects}>
            <div className={styles.ReferenceObjectsTop}>
                <div>
                    <h2>Объекты</h2>
                </div>
                <div className={styles.ReferenceObjectsTopButton}>
                    <button>Добавить объект</button>
                    <button onClick={()=>deleteObjcect()}>Удалить объект</button>
                </div>
            </div>
          <UniversalTable tableHeader={tableHeaderObject} tableBody={tableDataObject} selectFlag={true}/>
          { deleteUnitFlag &&  <UneversalDelete text="Объект" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete}/>}
        {context.popUp === "PopUpError" && <PopUpError />}
       </div>
     );
}

export default ReferenceObjects;