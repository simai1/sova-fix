import { useContext, useEffect, useState } from "react";
import styles from "./GraphicEquipment.module.scss";
import DataContext from "../../context";
import { GetAllEquipment } from "../../API/API";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { headerTableEquipment } from "./dataEquipment";
import { generateAndDownloadExcel } from "../../function/function";
import { useDispatch } from "react-redux";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import ClearImg from "./../../assets/images/ClearFilter.svg";
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
            context.setPopUp("PopUpToGraphic")
        }else{
            context.setPopupErrorText("Сначала выберите оборудование!");
            context.setPopUp("PopUpError")
        }
    }
    const dispatch = useDispatch();

    return ( 
       
        <div className={styles.GraphicEquipment}>
            <div className={styles.GraphicEquipmentButton}>
                <div className={styles.GraphicEquipmentTop}>
                    <div>
                        <h3>Графики ТО</h3>
                    </div>
                    <div className={styles.clear}>
                        <button onClick={() => dispatch(resetFilters({tableName: "table11"}))} ><img src={ClearImg} /></button>
                    </div>
                </div>
                <div className={styles.GraphicEquipmentButtonInner}>
                    <button onClick={()=> {NewToChecker()}}>Проведено ТО</button>
                    <button onClick={()=> context.setPopUp("PopUpNewEquipment")}>Добавить оборудование</button>
                    <button onClick={() => {deleteEquipment()}}>Удалить оборудование</button>
                    <button onClick={() => generateAndDownloadExcel(context?.dataEquipments, "Оборудование")}>Экспорт</button>
                </div>
            </div>
            <div>
                <UniversalTable FilterFlag={true} tableName="table11" tableHeader={headerTableEquipment} tableBody={context?.dataEquipments} selectFlag={true} heightTable="calc(100vh - 288px)"/>

            </div>
        </div>
     );
}

export default GraphicEquipment;