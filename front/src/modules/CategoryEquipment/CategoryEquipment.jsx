import { useContext } from "react";
import DataContext from "../../context";
import styles from "./CategoryEquipment.module.scss";

function CategoryEquipment() {
    const { context } = useContext(DataContext);

    
    return ( 
        <div className={styles.CategoryEquipment}>
        <div className={styles.CategoryEquipmentButton}>
            <button onClick={()=> context.setPopUp("PopUpNewTOCategory")}>Добавить</button>
            <button>Редактировать</button>
            <button>Удалить</button>
        </div>
        <div>
            <p>CategoryEquipment</p>
        </div>
    </div>
     );
}

export default CategoryEquipment;