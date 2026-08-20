import { DeleteUserFunc } from '../../API/API';
import DataContext from '../../context';
import {
    clearUserDirectorySelection,
    getDeletableUserId,
} from '../../modules/UsersDirectory/userDirectoryActions';
import styles from './СonfirmDeleteUser.module.scss';
import React from 'react';
function СonfirmDeleteUser(props) {
    const { context } = React.useContext(DataContext);

    const ClosePopUp = () => {
        context.setPopUp("");
        clearUserDirectorySelection(context);
    }
    const DeletedRequest = async () => {
        const deletableUserId = getDeletableUserId(props.userId, props.currentUserId);
        if (deletableUserId === null) {
            ClosePopUp();
            return;
        }
        try {
            const resp = await DeleteUserFunc(deletableUserId);
            if (resp?.status === 200) {
                props.updateTable();
                ClosePopUp();
            }
        } catch (error) {
            // 409 приходит, когда у пользователя есть заявки или комментарии —
            // сервер предлагает вместо удаления отключить доступ.
            context.setPopupErrorText(
                error?.response?.data?.message || "Ошибка при удалении пользователя!"
            );
            context.setPopUp("PopUpError");
        }
    }
    return ( 
        <div className={styles.СonfirmDeleteUser}>
            <div className={styles.СonfirmDeleteInner}>
                <p>Вы уверены что хотите удалить пользователя?</p>
                <div className={styles.ButtonInner}>
                    <button onClick={DeletedRequest}>Да</button>
                    <button onClick={() => ClosePopUp()}>Нет</button>
                </div>
            </div>
        </div>
     );
}

export default СonfirmDeleteUser;
