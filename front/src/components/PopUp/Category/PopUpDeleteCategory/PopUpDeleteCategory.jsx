import React, { useContext } from "react";
import styles from "./PopUpDeleteCategory.module.scss";
import DataContext from "../../../../context";
import { DeleteCategories } from "../../../../API/API";

function PopUpDeleteCategory() {
    const { context } = useContext(DataContext);


    const DeletedRequest = () => {
        DeleteCategories(context.selectedTr).then((resp) => {
            if (resp?.status === 200) {
                context.setPopUp("PopUpGoodMessage")
                context.setPopupGoodText("Категория успешно удалено!")
                context.UpdateDataCategory()
            }
        })
    }


     const ClosePopUp = () => {
        context.setPopUp("");
        context.setSelectedTr(null)
    }

    return ( 
        <div className={styles.PopUpDeleteEquipment}>
                <div className={styles.СonfirmDelete}>
            <div className={styles.СonfirmDeleteInner}>
                <p>Вы уверены что хотите удалить выбранную категорию?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={DeletedRequest}>Да</button>
                    <button onClick={() => ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
        </div>
     );
}

export default PopUpDeleteCategory;