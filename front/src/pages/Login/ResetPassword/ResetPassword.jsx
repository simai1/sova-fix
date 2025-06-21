import React, { useState } from "react";
import styles from "./ResetPassword.module.scss";
import openEye from "../../../assets/images/open-eye.svg";
import closedEye from "../../../assets/images/close-eye.svg";
import { ResetPasswordByToken } from "../../../API/API";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationError from "../../../components/Notification/NotificationError/NotificationError";
import NotificationSuccess from "../../../components/Notification/NotificationSuccess/NotificationSuccess";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorHeader, setErrorHeader] = useState("");
    const [errorText, setErrorText] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [successHeader, setSuccessHeader] = useState("");
    const [successText, setSuccessText] = useState("");
    const [isHidingError, setIsHidingError] = useState(false);
    const [isHidingSuccess, setIsHiddingSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const tokenId = searchParams.get("tokenId");
    const token = searchParams.get("token");

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
            navigate("/Authorization");
        }, 4000);
    };

    const resetPassword = () => {
        if (!password || !passwordRepeat) {
            return closeErrorPopUpFun(
                "Ошибка",
                "Заполните все обязательные поля!"
            );
        }

        if (password !== passwordRepeat) {
            return closeErrorPopUpFun("Ошибка", "Пароли не совпадают!");
        }

        ResetPasswordByToken(tokenId, token, password).then((reponse) => {
            console.log(reponse)
            if (reponse?.status === 200) {
                closeSuccessPopUpFun(
                    "Пароль изменен!",
                    "Перенаправляем вас на страницу входа."
                );
            }
        });
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
                    <img src="../../img/SOVA.jpg" className={styles.LogoAuth} />
                </div>

                <div className={styles.form}>
                    <div className={styles.form__content}>
                        <div className={styles.header}>
                            <h1>Смена пароля</h1>
                        </div>

                        <div className={styles.inputContainer}>
                            <div className={styles.inputWrapper}>
                                <input
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className={styles.input}
                                    placeholder="Пароль"
                                    type={showPassword ? "text" : "password"}
                                />
                                <img
                                    src={showPassword ? openEye : closedEye}
                                    alt="toggle"
                                    className={styles.eyeIcon}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                />
                            </div>

                            <div className={styles.inputWrapper}>
                                <input
                                    value={passwordRepeat}
                                    onChange={(e) =>
                                        setPasswordRepeat(e.target.value)
                                    }
                                    className={styles.input}
                                    placeholder="Повторите пароль"
                                    type={
                                        showPasswordRepeat ? "text" : "password"
                                    }
                                />
                                <img
                                    src={
                                        showPasswordRepeat ? openEye : closedEye
                                    }
                                    alt="toggle"
                                    className={styles.eyeIcon}
                                    onClick={() =>
                                        setShowPasswordRepeat(
                                            !showPasswordRepeat
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <button
                            className={styles.button}
                            onClick={resetPassword}
                        >
                            Сменить пароль
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

export default ResetPassword;
