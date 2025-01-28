import { DeleteRequest, GetAllRequests } from '../../API/API';
import { funFixEducator } from '../../UI/SamplePoints/Function';
import DataContext from '../../context';
import styles from './СonfirmDelete.module.scss';
import React from 'react';
function СonfirmDelete() {
    const { context } = React.useContext(DataContext);
    const idToDelete = context.moreSelect[0]; // Получаем id записи для удаления

    const DeletedRequest = () => {
      DeleteRequest(idToDelete).then((resp) => {
        if (resp) {
          // Удаляем запись из таблицы локально
          context.setDataTableHomePage((prevData) => {
            // Фильтруем записи, чтобы удалить по id
            return prevData.filter((item) => item.id !== idToDelete);
          }); 
        context.setDataAppointment((prevDataAppointment) => {
            return prevDataAppointment.filter((item) => item.id !== idToDelete);
          })
          
            //   context.UpdateForse()
          // Очищаем выбранные записи и показываем сообщение
          context.UpdateTableReguest()
          context.setSelectedTr(null);
          context.setMoreSelect([]);
          context.setPopUp("PopUpGoodMessage");
          context.setPopupGoodText("Заявка успешно удалена!");
        }
      }).catch(error => {
        console.error("Ошибка при удалении заявки:", error);
        // Вы можете добавить обработку ошибок
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