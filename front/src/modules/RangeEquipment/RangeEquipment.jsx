import styles from "./RangeEquipment.module.scss";

function RangeEquipment() {
    return ( 
        <div className={styles.RangeEquipment}>
        <div className={styles.RangeEquipmentButton}>
            <button>Добавить</button>
            <button>Редактировать</button>
            <button>Удалить</button>
        </div>
        <div>
            <p>RangeEquipment</p>
        </div>
    </div>
     );
}

export default RangeEquipment;