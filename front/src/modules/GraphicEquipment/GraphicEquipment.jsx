import styles from "./GraphicEquipment.module.scss";

function GraphicEquipment() {
    return ( 
       
        <div className={styles.GraphicEquipment}>
            <div className={styles.GraphicEquipmentButton}>
                <button>Проведено ТО</button>
                <button>Добавить оборудование</button>
                <button>Удалить оборудование</button>
                <button>Экспорт</button>
            </div>
            <div>
                <p>GraphicEquipment</p>
            </div>
        </div>
     );
}

export default GraphicEquipment;