import { DeleteRequest } from '../../API/API';
import DataContext from '../../context';
import styles from './СonfirmDelete.module.scss';
import React from 'react';
function СonfirmDelete() {
    const { context } = React.useContext(DataContext);


    const DeletedRequest = () => {
         DeleteRequest(context.selectedTr).then((resp)=>{
        if(resp?.status === 200){
          context.UpdateTableReguest(1);
          context.setSelectedTr(null)
          context.setPopUp("PopUpGoodMessage")
          context.setPopupGoodText("Заявка успешно удалена!")
        }
      })
    }
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