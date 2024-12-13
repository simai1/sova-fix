import { useContext, useEffect, useState } from "react";
import styles from "./GraphicEquipment.module.scss";
import DataContext from "../../context";
import { GetAllEquipment } from "../../API/API";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { headerTableEquipment } from "./dataEquipment";
import { generateAndDownloadExcel } from "../../function/function";

function GraphicEquipment() {

    const { context } = useContext(DataContext);
    
    useEffect(() => {
        context.UpdateDataEquipment()
    }, [])

    const deleteEquipment = () => {
        if(context.selectedTr !== null){
            context.setPopUp("PopUpDeleteEquipment")
        }else{
            context.setPopupErrorText("Сначала выберите оборудование!");
            context.setPopUp("PopUpError")
        }
    }

    const NewToChecker = () => {
        if(context.selectedTr !== null){
            context.setPopUp("PopUpNewTO")
        }else{
            context.setPopupErrorText("Сначала выберите оборудование!");
            context.setPopUp("PopUpError")
        }
    }

    return ( 
       
        <div className={styles.GraphicEquipment}>
            <div className={styles.GraphicEquipmentButton}>
                <div>
                    <h3>Графики ТО</h3>
                </div>
                <div className={styles.GraphicEquipmentButtonInner}>
                    <button onClick={()=> {NewToChecker()}}>Проведено ТО</button>
                    <button onClick={()=> context.setPopUp("PopUpNewEquipment")}>Добавить оборудование</button>
                    <button onClick={() => {deleteEquipment()}}>Удалить оборудование</button>
                    <button onClick={() => generateAndDownloadExcel(context?.dataEquipments, "Оборудование")}>Экспорт</button>
                </div>
            </div>
            <div>
                <UniversalTable FilterFlag={false} tableName="table5" tableHeader={headerTableEquipment} tableBody={context?.dataEquipments} selectFlag={true}/>

            </div>
        </div>
     );
}

export default GraphicEquipment;