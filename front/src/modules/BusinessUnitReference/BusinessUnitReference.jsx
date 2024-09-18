import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./BusinessUnitReference.module.scss";
import { DeleteUnit, GetUnitsAll } from "../../API/API";
import { tableUnitHeader } from "./DirectoryUnitData";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";

function BusinessUnitReference() {
    const { context } = useContext(DataContext);
    const [tableDataUnit, setTableDataUnit] = useState([]);

    useEffect(() => {
       getData()
       console.log('Directory.selectRowDirectory', context.selectRowDirectory)
    },[])

    const getData = () => {
        GetUnitsAll().then((response) => {
            setTableDataUnit(response.data);
        })
    }

    const [deleteUnitFlag, setDeleteUnitFlag] = useState(false)
    const deleteUnit = () => {
        if(context.selectRowDirectory){
            setDeleteUnitFlag(true)
        }else{
            context.setPopupErrorText("Сначала выберите подразделение!");
            context.setPopUp("PopUpError")
        }
        
    }

    const ClosePopUp = () => {
        setDeleteUnitFlag(false)
    }

    const FunctionDelete = () => {
        DeleteUnit(context.selectRowDirectory).then((response) => {
            if(response?.status === 200){
                setDeleteUnitFlag(false)   
                getData()
            }
        })
    }
    return (
        <div className={styles.BusinessUnitReference}>
        <div className={styles.BusinessUnitReferenceTop}>
            <div>
                <h2>Подразделения</h2>
            </div>
            <div className={styles.BusinessUnitReferenceTopButton}>
                <button>Добавить подразделение</button>
                <button onClick={()=>deleteUnit()}>Удалить подразделение</button>
            </div>
        </div>
      <UniversalTable tableHeader={tableUnitHeader} tableBody={tableDataUnit} selectFlag={true}/>
      { deleteUnitFlag &&  <UneversalDelete text="Подразделение" ClosePopUp={ClosePopUp} FunctionDelete={FunctionDelete}/>}
      {context.popUp === "PopUpError" && <PopUpError />}
   </div>

    );
}

export default BusinessUnitReference;