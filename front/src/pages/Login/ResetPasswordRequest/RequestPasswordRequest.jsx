import React, { useState } from "react";
import styles from "./RequestPasswordRequest.module.scss";
import { useNavigate } from "react-router-dom";
import arrowLeft from "./../../../assets/images/back-arrow.svg";
import { SendRequestToResetPassword } from "../../../API/API";
import NotificationError from "../../../components/Notification/NotificationError/NotificationError";
import NotificationSuccess from "../../../components/Notification/NotificationSuccess/NotificationSuccess";

const RequestPasswordRequest = () => {
    const [email, setEmail] = useState("");
    const [isError, setIsError] = useState(false);
    const [errorHeader, setErrorHeader] = useState("");
    const [errorText, setErrorText] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [successHeader, setSuccessHeader] = useState("");
    const [successText, setSuccessText] = useState("");
    const [isHidingError, setIsHidingError] = useState(false);
    const [isHidingSuccess, setIsHiddingSuccess] = useState(false);

    const navigate = useNavigate();

    const closeErrorPopUpFun = (header, text) => {
        setErrorHeader(header);
        setErrorText(text);
        setIsError(true);
        setTimeout(() => {
            handleCloseError();
        }, 4000);
    };

    const closeSuccessPopUpFun = (header, text) => {
        setSuccessHeader(header);
        setSuccessText(text);
        setIsSuccess(true);
        setTimeout(() => {
            handleCloseSuccess();
        }, 4000);
    };

    const sendRequest = () => {
        if (!email) {
            return closeErrorPopUpFun("Ошибка", "Заполните все обязательные поля!");
        }
        SendRequestToResetPassword(email)
            .then((response) => {
                console.log(response)
                if (response?.status === 200) {
                    closeSuccessPopUpFun("Успешно", "Письмо отправлено на вашу почту!")
                } else if (!response) {
                    closeErrorPopUpFun('Ошибка', `Пользователь с почтой "${email}" не найден`)
                }
            })
    };

    const handleCloseError = () => {
        setIsHidingError(true);
        setTimeout(() => {
            setErrorText("");
            setErrorHeader("");
            setIsError(false);
            setIsHidingError(false);
        }, 400);
    };

    const handleCloseSuccess = () => {
        setIsHidingError(true);
        setTimeout(() => {
            setSuccessText("");
            setSuccessHeader("");
            setIsSuccess(false);
            setIsHiddingSuccess(false);
        }, 400);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content__box}>
                <div className={styles.text_Logo}>
                    <img src="./img/SOVA.jpg" className={styles.LogoAuth} />
                </div>

                <div className={styles.form}>
                    <div className={styles.form__content}>
                        <div className={styles.header}>
                            <img
                                src={arrowLeft}
                                onClick={() => navigate("/Authorization")}
                                className={styles.arrow}
                            />
                            <h1>Запрос на смену пароля</h1>
                        </div>

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="Введите вашу почту"
                        />

                        <button className={styles.button} onClick={sendRequest}>
                            Отправить
                        </button>
                    </div>
                </div>
            </div>

            {isError && (
                <NotificationError
                    isHiding={isHidingError}
                    errorText={errorText}
                    errorHeader={errorHeader}
                    handleClose={handleCloseError}
                />
            )}

            {isSuccess && (
                <NotificationSuccess
                    isHiding={isHidingSuccess}
                    successText={successText}
                    successHeader={successHeader}
                    handleClose={handleCloseSuccess}
                />
            )}
        </div>
    );
};

export default RequestPasswordRequest;
