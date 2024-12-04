import { useContext, useEffect } from "react";
import DataContext from "../../context";
import styles from "./CategoryEquipment.module.scss";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { headerTableCategory } from "./dataEquipmentCategory";
import { DeleteCategories } from "../../API/API";

function CategoryEquipment() {
    const { context } = useContext(DataContext);

    useEffect(() => {
        context?.UpdateDataCategory();
      }, []);
    

    const deleteCategory = () => {
        if(context.selectedTr !== null){
            context.setPopUp("PopUpDeleteCategory")
        }else{
            context.setPopupErrorText("Сначала выберите категорию!");
            context.setPopUp("PopUpError")
        }
    }

    const editCategory = () => {
        if(context.selectedTr !== null){
            context.setPopUp("PopUpEditTOCategory")
        }else{
            context.setPopupErrorText("Сначала выберите категорию!");
            context.setPopUp("PopUpError")
        }
    }

    return ( 
        <div className={styles.CategoryEquipment}>
        <div className={styles.CategoryEquipmentButton}>
            <div>
                <h3>Категории оборудрования</h3>
            </div>
            <div className={styles.CategoryEquipmentButtonInner}>
                <button onClick={()=> context.setPopUp("CreateCategory")}>Добавить</button>
                <button onClick={() => editCategory()}>Редактировать</button>
                <button onClick={() => deleteCategory()}>Удалить</button>
            </div>
            
        </div>
        <div>
            <UniversalTable FilterFlag={false} tableName="table5" tableHeader={headerTableCategory} tableBody={context?.dataCategory} selectFlag={true}/>

        </div>
    </div>
     );
}

export default CategoryEquipment;