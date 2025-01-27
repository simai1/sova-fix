import { DeleteRequest } from '../../API/API';
import { funFixEducator } from '../../UI/SamplePoints/Function';
import DataContext from '../../context';
import styles from './СonfirmDelete.module.scss';
import React from 'react';
function СonfirmDelete() {
    const { context } = React.useContext(DataContext);


    const DeletedRequest = () => {
    const idToDelete = context.moreSelect[0]; // Получаем id записи для удаления
    DeleteRequest(idToDelete).then((resp) => {
        if (resp?.status === 200) {
        // Удаляем запись из таблицы локально
        context.setDataTableHomePage((prevData) => prevData.filter((item) => item.id !== idToDelete));
        // Очищаем выбранные записи и показываем сообщение
        context.setSelectedTr(null);
        context.setMoreSelect([]);
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Заявка успешно удалена!");
        }
    });
    };
      
     const ClosePopUp = () => {
        context.setPopUp("");
        context.setSelectedTr(null)
    }
    return ( 
        <div className={styles.СonfirmDelete}>
            <div className={styles.СonfirmDeleteInner}>
                <p>Вы уверены что хотите удалить заявку?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={DeletedRequest}>Да</button>
                    <button onClick={() => ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
     );
}

export default СonfirmDelete;