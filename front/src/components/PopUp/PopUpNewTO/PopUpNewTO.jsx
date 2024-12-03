import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import React from "react";
import styles from "./PopUpNewTO.module.scss"
function PopUpNewTO() {
    return ( 
        <PopUpContainer width={true} title={"Новое техническое обслуживание"} mT={150}>
            <div className={styles.PopUpNewTO}>
                <div className={styles.pupUpFirstContainer}>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Категория:</p></div>
                        <div className={styles.pupUpContainerInfoSubtitle}> <p>Тепловое оборудование</p></div>
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Название:</p></div>
                        <div className={styles.pupUpContainerInfoSubtitle}> <p>Пароконвектомат</p></div>
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Объект:</p></div>
                        <div className={styles.pupUpContainerInfoSubtitle}> <p>Объект А</p></div>
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
                        <div className={styles.pupContainerInfoTitle}> <p>Когда провести следующее ТО:</p></div>
                        <input className={styles.pupUpContainerInfoInput} placeholder="Укажите количество дней"></input>
                    </div>
                    <div className={styles.pupUpSecondContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Дата следующего ТО:</p></div>
                        <input className={styles.pupUpContainerInfoInput} type="date"></input>
                    </div>
            </div>
            </div>
            <div className={styles.buttonSubmitBlock}>
                <button className={styles.buttonSubmit}>Добавить Запись</button>
            </div>
        </PopUpContainer>
     );
}

export default PopUpNewTO;