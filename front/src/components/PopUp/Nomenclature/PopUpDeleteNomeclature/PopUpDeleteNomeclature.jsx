import React, { useContext } from "react";
import styles from "./PopUpDeleteNomeclature.module.scss";
import DataContext from "../../../../context";
import {DeleteNomenclaturesAPI } from "../../../../API/API";

function PopUpDeleteNomeclature() {
    const { context } = useContext(DataContext);


    const DeletedRequest = () => {
        DeleteNomenclaturesAPI(context.selectedTr).then((resp) => {
            if (resp?.status === 200) {
                context.setPopUp("PopUpGoodMessage")
                context.setPopupGoodText("Номенклатура успешно удалена!")
                context.UpdateDataNomenclature()
            }
        })
    }


     const ClosePopUp = () => {
        context.setPopUp("");
        context.setSelectedTr(null)
    }

    return ( 
        <div className={styles.PopUpDeleteNomeclature}>
                <div className={styles.СonfirmDelete}>
            <div className={styles.СonfirmDeleteInner}>
                <p>Вы уверены что хотите удалить выбранную номенклатуру?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={DeletedRequest}>Да</button>
                    <button onClick={() => ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
        </div>
     );
}

export default PopUpDeleteNomeclature;