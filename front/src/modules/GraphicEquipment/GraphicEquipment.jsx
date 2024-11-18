import { useContext } from "react";
import styles from "./GraphicEquipment.module.scss";
import DataContext from "../../context";

function GraphicEquipment() {

    const { context } = useContext(DataContext);


    return ( 
       
        <div className={styles.GraphicEquipment}>
            <div className={styles.GraphicEquipmentButton}>
                <button>Проведено ТО</button>
                <button onClick={()=> context.setPopUp("PopUpNewEquipment")}>Добавить оборудование</button>
                <button>Удалить оборудование</button>
                <button>Экспорт</button>
            </div>
            <div>
                <p>GraphicEquipment</p>
            </div>
        </div>
     );
}

export default GraphicEquipment;