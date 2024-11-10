import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { useContext} from "react";
import DataContext from "../../context";
import styles from "./EquipmentInfo.module.scss"
import { TestDataTable, tableHeaderEquipmentInfo } from "./dataEquipmentInfo";

function EquipmentInfo() {
    const { context } = useContext(DataContext);

    return ( 
        
        <main className={styles.EquipmentInfo}>
            <div className={styles.EquipmentInfoBlockTopButton}>
                <button>Экспорт</button>
                <button>Сгенерировать QR-код</button>
                <button>Удалить оборудование</button>
            </div>     
            <div className={styles.EquipmentblockInfo}>
                <section className={styles.EquipmentSectionInfoFirst}>
                    <div className={styles.EquipmentblockInfoFirst}>
                        <div className={styles.EquipmentImg}>
                            <img src="/img/ImgEmp.svg"/>
                        </div>
                        <div className={styles.paramInfoContainer}>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Категория:</p>
                                <p className={styles.DataInfo}>Компьютеры</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Название:</p>
                                <p className={styles.DataInfo}>Пароконвектомат</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Статус:</p>
                                <p className={styles.DataInfo}>Требуется ТО</p>
                            </div>
                            <div className={styles.marginInfoAll}>
                                <p className={styles.paramInfoGray}>Объект: Аксайский проспект ТЦ МЕГА</p>
                            </div>
                            <div className={styles.marginInfoAll}>
                                <p className={styles.paramInfoGray}>Подразделение: КЕКС</p> 
                            </div>
                            <div >
                                <button className={styles.button} onClick={()=>   context.setPopUp("PopUpNewTO")}>Проведено ТО</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.EquipmentblockInfoSecond}>
                    <div className={styles.paramInfoContainer}>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Количество на объекте:</p>
                                <p className={styles.paramInfoSecond}>2</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Цена обслуживания за единицу:</p>
                                <p className={styles.paramInfoSecond}>1230 руб.</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Общая сумма ТО:</p>
                                <p className={styles.paramInfoSecond}>2460 руб.</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Период обслуживания: каждые:</p>
                                <p className={styles.paramInfoSecond}>31 день</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Дата последнего ТО:</p>
                                <p className={styles.paramInfoSecond}>10.10.2021</p>
                            </div>
                            <div className={styles.marginInfo}>
                                <p className={styles.paramInfo}>Дата следующего ТО:</p>
                                <p className={styles.paramInfoSecond}>10.11.2021</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className={styles.InfoSecodSection}>
                    <div className={styles.HistoryTo}>
                            <div className={styles.TitleSecondBlock}>
                                <p>История ТО</p>
                            </div>
                            <div>
                                <UniversalTable  
                                    tableName="table10"
                                    tableHeader={tableHeaderEquipmentInfo}
                                    tableBody={TestDataTable}
                                    selectFlag={false}
                                    FilterFlag={false}
                                    heightTable={365}
                                />
                            </div>
                    </div>
                    <div className={styles.CommentTo}>
                        <div className={styles.TitleSecondBlock}>
                            <p>Комментарии</p>
                        </div>
                        <div className={styles.CommentToBlock}>

                        </div>
                    </div>
                </section>
            </div> 
        </main>  
     );
}

export default EquipmentInfo;