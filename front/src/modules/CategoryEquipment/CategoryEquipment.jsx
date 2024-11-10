import styles from "./CategoryEquipment.module.scss";

function CategoryEquipment() {
    return ( 
        <div className={styles.CategoryEquipment}>
        <div className={styles.CategoryEquipmentButton}>
            <button>Добавить</button>
            <button>Редактировать</button>
            <button>Удалить</button>
        </div>
        <div>
            <p>CategoryEquipment</p>
        </div>
    </div>
     );
}

export default CategoryEquipment;