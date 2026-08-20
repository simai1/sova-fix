import React from 'react';
import { SetUserDisabled } from '../../API/API';
import DataContext from '../../context';
import { clearUserDirectorySelection } from '../../modules/UsersDirectory/userDirectoryActions';
import styles from './ConfirmDisableUser.module.scss';

function ConfirmDisableUser({ userId, disabled, updateTable }) {
    const { context } = React.useContext(DataContext);
    const [isLoading, setIsLoading] = React.useState(false);

    const ClosePopUp = () => {
        context.setPopUp('');
        clearUserDirectorySelection(context);
    };

    const showError = (message) => {
        context.setPopupErrorText(message);
        context.setPopUp('PopUpError');
    };

    const Confirm = async () => {
        if (!userId) {
            ClosePopUp();
            return;
        }
        setIsLoading(true);
        try {
            const resp = await SetUserDisabled(userId, disabled);
            if (resp?.status === 200) {
                updateTable();
                ClosePopUp();
                context.setPopupGoodText(disabled ? 'Доступ отключён!' : 'Доступ включён!');
                context.setPopUp('PopUpGoodMessage');
            }
        } catch (error) {
            showError(
                error?.response?.data?.message ||
                    (disabled ? 'Не удалось отключить доступ' : 'Не удалось включить доступ')
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.ConfirmDisableUser}>
            <div className={styles.ConfirmDisableInner}>
                <p>
                    {disabled
                        ? 'Отключить пользователю доступ? Он не сможет войти в систему и в бот, но все его данные и заявки останутся.'
                        : 'Включить пользователю доступ обратно?'}
                </p>
                <div className={styles.ButtonInner}>
                    <button onClick={Confirm} disabled={isLoading}>
                        Да
                    </button>
                    <button onClick={ClosePopUp} disabled={isLoading}>
                        Нет
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDisableUser;
