import { useContext, useEffect } from "react";
import DataContext from "../../context";
import styles from "./CategoryEquipment.module.scss";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { headerTableCategory } from "./dataEquipmentCategory";

function CategoryEquipment() {
    const { context } = useContext(DataContext);

    useEffect(() => {
        context?.UpdateDataCategory();
      }, []);
    
    return ( 
        <div className={styles.CategoryEquipment}>
        <div className={styles.CategoryEquipmentButton}>
            <button onClick={()=> context.setPopUp("PopUpNewTOCategory")}>Добавить</button>
            <button>Редактировать</button>
            <button>Удалить</button>
        </div>
        <div>
            <UniversalTable FilterFlag={true} tableName="table5" tableHeader={headerTableCategory} tableBody={context?.dataCategory} selectFlag={true}/>

        </div>
    </div>
     );
}

export default CategoryEquipment;