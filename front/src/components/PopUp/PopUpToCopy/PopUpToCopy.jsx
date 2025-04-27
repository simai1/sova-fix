import React, { useContext, useState } from "react";
import styles from "./PopUpToCopy.module.css";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import DataContext from "../../../context";
import { CreateCopyToEquipments } from "../../../API/API";

function PopUpToCopy(props) {
    const [quantityCopies, setQuantityCopies] = useState(1);
    const { context } = useContext(DataContext);


    const handleCreateCopies = () => {
        CreateCopyToEquipments(context.selectRowDirectory, quantityCopies).then(res => {
            if (res?.status === 200) {
                context.setPopUp("")
                context.UpdateDataEquipment()
            }
        })
    }
    return (
        <PopUpContainer title={"Копирование ТО оборудования"} mT={150}>
            <div className={styles.PopUpToCopy}>
                <p>Укажите количество копий</p>
                <input
                    value={quantityCopies}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value >= 1 || isNaN(value)) {
                            setQuantityCopies(e.target.value);
                        }
                    }}
                    placeholder="Укажите количество"
                    className={styles.input}
                    type="number"
                    min="1"
                />

                <button onClick={() => handleCreateCopies()}>
                    Создать копию
                </button>
            </div>
        </PopUpContainer>
    );
}

export default PopUpToCopy;
