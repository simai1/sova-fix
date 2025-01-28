import { useContext, useEffect } from "react";
import styles from "./RangeEquipment.module.scss";
import DataContext from "../../context";
import { headerTableNumenclature } from "./dataRange";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { useDispatch } from "react-redux";
import { resetFilters } from "../../store/samplePoints/samplePoits";
function RangeEquipment() {

    const { context } = useContext(DataContext);
    
    useEffect(() => {
        context.UpdateDataNomenclature()
    }, [])

    const deleteNomenclature = () => {
        if(context.selectedTr !== null){
            context.setPopUp("PopUpDeleteNomeclature")
        }else{
            context.setPopupErrorText("Сначала выберите номенклатуру!");
            context.setPopUp("PopUpError")
        }
    }

    const EditNomenclature = () => {
        if(context.selectedTr !== null){
            context.setPopUp("EditNomenclature")
        }else{
            context.setPopupErrorText("Сначала выберите номенклатуру!");
            context.setPopUp("PopUpError")
        }
    }
    const dispatch = useDispatch();
    
    return ( 
        <div className={styles.RangeEquipment}>
            <div className={styles.RangeEquipmentButton}>
                <div>
                <div className={styles.RangeEquipmentTop}>
                    <div>
                        <h3>Номенклатура</h3>
                    </div>
                    <div className={styles.clear}>
                        <button onClick={() => dispatch(resetFilters({tableName: "table13"}))} ><img src={ClearImg} /></button>
                    </div>
                </div>
                </div>
                {
                    JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" &&
                    <div className={styles.RangeEquipmentButtonInner}>
                        <button onClick={()=> context.setPopUp("CreateNomenclature")}>Добавить</button>
                        <button onClick={() => EditNomenclature()} >Редактировать</button>
                        <button onClick={() => deleteNomenclature()}>Удалить</button>
                    </div>
                }
              
            </div>
            <div>
            <UniversalTable FilterFlag={true} tableName="table13" tableHeader={headerTableNumenclature} tableBody={context?.dataNomenclature} selectFlag={true} heightTable="calc(100vh - 285px)"/>

            </div>
    </div>
     );
}

export default RangeEquipment;