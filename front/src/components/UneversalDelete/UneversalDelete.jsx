import { DeleteRequest } from '../../API/API';
import DataContext from '../../context';
import styles from './UneversalDelete.module.scss';
import React from 'react';
function UneversalDelete(props) {
    const { context } = React.useContext(DataContext);


    // const DeletedRequest = () => {
    //      DeleteRequest(context.selectedTr).then((resp)=>{
    //     if(resp?.status === 200){
    //       context.UpdateTableReguest(1);
    //       context.setSelectedTr(null)
    //       context.setPopUp("PopUpGoodMessage")
    //       context.setPopupGoodText("Заявка успешно удалена!")
    //     }
    //   })
    // }
    return ( 
        <div className={styles.UneversalDelete}>
            <div className={styles.СonfirmDeleteInner}>
                <p>Вы уверены что хотите удалить {props?.text}?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={() => props?.FunctionDelete()}>Да</button>
                    <button onClick={() => props?.ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
     );
}

export default UneversalDelete;