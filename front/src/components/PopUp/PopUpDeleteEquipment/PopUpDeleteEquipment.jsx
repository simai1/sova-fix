import React, { useContext } from "react";
import styles from "./PopUpDeleteEquipment.module.scss";
import DataContext from "../../../context";
import { DeleteEquipment } from "../../../API/API";

function PopUpDeleteEquipment() {
    const { context } = useContext(DataContext);


    const DeletedRequest = () => {
        DeleteEquipment(context.selectedTr).then((resp) => {
            if (resp?.status === 200) {
                context.setPopUp("PopUpGoodMessage")
                context.setPopupGoodText("Оборудование успешно удалено!")
                context.UpdateDataEquipment()
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
                <p>Вы уверены что хотите удалить оборудование?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={DeletedRequest}>Да</button>
                    <button onClick={() => ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
        </div>
     );
}

export default PopUpDeleteEquipment;