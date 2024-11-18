import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import React from "react";
import styles from "./PopUpNewEquipment.module.scss"
function PopUpNewEquipment() {
    return ( 
        <PopUpContainer width={true} title={"Новое оборудоваине"} mT={150}>
            <div className={styles.PopUpNewTOCategory}>
                <div className={styles.pupUpFirstContainer}>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Категория:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Тепловое оборудование"></input>
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Название:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Пароконвектомат"></input>
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Подразделение:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="КЕКС"></input>
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Объект:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Газетный 48"></input>
                    </div>
                    <div className={styles.commentBlock}>
                        <div className={styles.commentBlockTitle}> <p>Комментарий:</p></div>
                        <input placeholder="Введите ваш комментарий к ТО" className={styles.commentBlockInput}></input>
                    </div>
            </div>
            <div className={styles.pupUpSecondContainer}>
                    <div className={styles.pupUpSecondContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Дата текущего ТО:</p></div>
                        <div className={styles.pupUpContainerInfoSubtitle}> <p>01.01.2023</p></div>
                    </div>
                    <div className={styles.pupUpSecondContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Обслуживающий подрядчик:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Исполнитель"></input>
                    </div>
                    <div className={styles.pupUpSecondContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Период обслуживания:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Укажите количество дней"></input>
                    </div>
            </div>
            </div>
            <div className={styles.buttonSubmitBlock}>
                <button className={styles.buttonSubmit}>Добавить оборудование</button>
            </div>
        </PopUpContainer>
     );
}

export default PopUpNewEquipment;