import styles from "./GraphicEquipment.module.scss";

function GraphicEquipment() {
    return ( 
       
        <div className={styles.GraphicEquipment}>
            <div className={styles.GraphicEquipmentButton}>
                <button>Добавить</button>
                <button>Редактировать</button>
                <button>Удалить</button>
            </div>
            <div>
                <p>GraphicEquipment</p>
            </div>
        </div>
     );
}

export default GraphicEquipment;