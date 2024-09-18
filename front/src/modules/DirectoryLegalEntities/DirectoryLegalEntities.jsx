import { useContext, useEffect, useState } from "react";
import { DeletelegalEntities, GetlegalEntitiesAll } from "../../API/API";
import { tableLagealEntries } from "./DirectoryLegalEntitiesData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./DirectoryLegalEntities.module.scss";
import DataContext from "../../context";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
function DirectoryLegalEntities() {
    const [tableDataEnries, setTableDataEnries] = useState([]);
    useEffect(() => {
        getData()
    },[])
    const getData = () => {
        GetlegalEntitiesAll().then((response) => {
            setTableDataEnries(response.data);
        })
    }
    const { context } = useContext(DataContext);
    const [deleteUnitFlag, setDeleteUnitFlag] = useState(false)
    const deleteUnit = () => {
        if(context.selectRowDirectory){
            setDeleteUnitFlag(true)
        }else{
            context.setPopupErrorText("Сначала выберите Юр. лицо!");
            context.setPopUp("PopUpError")
        }
        
    }

    const ClosePopUp = () => {
        setDeleteUnitFlag(false)
    }

    const FunctionDelete = () => {
        DeletelegalEntities(context.selectRowDirectory).then((response) => {
            if(response?.status === 200){
                setDeleteUnitFlag(false)   
                getData()
            }
        })
    }

    return ( 
       <div className={styles.DirectoryLegalEntities}>
            <div className={styles.DirectoryLegalEntitiesTop}>
                <div>
                    <h2>Юридические лица</h2>
                </div>
                <div className={styles.DirectoryLegalEntitiesTopButton}>
                    <button>Добавить юридическое лицо</button>
                    <button onClick={()=>deleteUnit()}>Удалить юридическое лицо</button>
                </div>
            </div>
          <UniversalTable tableHeader={tableLagealEntries} tableBody={tableDataEnries} selectFlag={true}/>
          { deleteUnitFlag &&  <UneversalDelete text="Юр. лицо" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete}/>}
        {context.popUp === "PopUpError" && <PopUpError />}
       </div>
     );
}

export default DirectoryLegalEntities;