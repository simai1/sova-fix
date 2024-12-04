import { useContext, useEffect } from "react";
import styles from "./RangeEquipment.module.scss";
import DataContext from "../../context";
import { headerTableNumenclature } from "./dataRange";
import UniversalTable from "../../components/UniversalTable/UniversalTable";

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

    return ( 
        <div className={styles.RangeEquipment}>
        
       
            <div className={styles.RangeEquipmentButton}>
                <div>
                    <h3>Номенклатура</h3>
                </div>
                <div className={styles.RangeEquipmentButtonInner}>
                    <button onClick={()=> context.setPopUp("CreateNomenclature")}>Добавить</button>
                    <button onClick={() => EditNomenclature()} >Редактировать</button>
                    <button onClick={() => deleteNomenclature()}>Удалить</button>
                </div>
            </div>
            <div>
            <UniversalTable FilterFlag={false} tableName="table5" tableHeader={headerTableNumenclature} tableBody={context?.dataNomenclature} selectFlag={true}/>

            </div>
    </div>
     );
}

export default RangeEquipment;