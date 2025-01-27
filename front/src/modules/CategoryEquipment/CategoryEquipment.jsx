import { useContext, useEffect } from "react";
import DataContext from "../../context";
import styles from "./CategoryEquipment.module.scss";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { headerTableCategory } from "./dataEquipmentCategory";
import { DeleteCategories } from "../../API/API";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { useDispatch } from "react-redux";
import { resetFilters } from "../../store/samplePoints/samplePoits";
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
    const dispatch = useDispatch();
    return ( 
        <div className={styles.CategoryEquipment}>
        <div className={styles.CategoryEquipmentButton}>
            <div>
                <div className={styles.CategoryEquipmentTop}>
                    <div>
                        <h3>Категории оборудрования</h3>
                    </div>
                    <div className={styles.clear}>
                        <button onClick={() => dispatch(resetFilters({tableName: "table12"}))} ><img src={ClearImg} /></button>
                    </div>
                </div>
            </div>
            {
                JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" &&
                <div className={styles.CategoryEquipmentButtonInner}>
                    <button onClick={()=> context.setPopUp("CreateCategory")}>Добавить</button>
                    <button onClick={() => editCategory()}>Редактировать</button>
                    <button onClick={() => deleteCategory()}>Удалить</button>
                </div>
            }
          
            
        </div>
        <div>
            <UniversalTable FilterFlag={true} tableName="table12" tableHeader={headerTableCategory} tableBody={context?.dataCategory} selectFlag={true} heightTable="calc(100vh - 285px)"/>

        </div>
    </div>
     );
}

export default CategoryEquipment;