import React, { useContext, useEffect, useState } from "react";
import styles from "./DirectoryUrgency.module.scss";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import { useDispatch } from "react-redux";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { tableUrgencyHeader } from "./DirectoryUrgencyData";
import {
    ChangeUrgency,
    CreateUrgency,
    DeleteUrgency,
    EditUrgency,
    GetAllUrgensies,
} from "../../API/API";
import DataContext from "../../context";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";

function DirectoryUrgency(props) {
    const [tableBodyUrgency, setTableBodyUrgency] = useState([]);
    const [popUpCreateUrgency, setPopUpCreateUrgency] = useState(false);
    const [popUpEditUrgency, setPopUpEditUrgency] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState("");
    const [deletedModalOpen, setDeletedModalOpen] = useState(false);
    const [validationError, setValidationError] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [errorHeader, setErrorHeader] = useState("")
    const [isHiding, setIsHiding] = useState(false);
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);
    const { context } = useContext(DataContext);
    const dispatch = useDispatch();

    const getData = () => {
        GetAllUrgensies().then((response) => {
            setTableBodyUrgency(response.data);
        });
    };

    const createNewUrgency = () => {
        setPopUpCreateUrgency(true);
    };

    const editUrgency = () => {
        if (context?.selectRowDirectory) {
            const currentUrgency = tableBodyUrgency.find(
                (urgency) => urgency.id === context?.selectRowDirectory
            );
            setColor(currentUrgency.color);
            setName(currentUrgency.name);

            setPopUpCreateUrgency(true);
            setPopUpEditUrgency(true);
        } else {
            context?.setPopUp("PopUpError");
            context?.setPopupErrorText("Сначала выберите срочность!");
        }
    };

    const deleteUrgency = () => {
        DeleteUrgency(context?.selectRowDirectory).then((response) => {
            if (response?.status === 200) {
                context?.UpdateUrgency();
                closePopUp();
            } else {
                const currentUrgency = tableBodyUrgency.find(urgency => urgency.id === context?.selectRowDirectory)
                closePopUp();
                setIsError(true);
                setErrorHeader(`Срочность "${currentUrgency.name}" не может быть удалена ❌`)
                setErrorText(`Срочность "${currentUrgency.name}" не может быть удалена, есть связанные заявки.`);
                setTimeout(() => {
                    handleClose();
                }, 4000);
            }
        });
    };

    useEffect(() => {
        getData();
    }, [context?.urgencyList]);

    useEffect(() => {
        const routeRow = tableBodyUrgency.find(
            (urgency) => urgency.name === "Маршрут"
        );
        if (context?.selectRowDirectory === routeRow?.id) {
            return setIsDeleteButtonDisabled(true);
        }
        setIsDeleteButtonDisabled(false);
    }, [tableBodyUrgency, context?.selectRowDirectory]);

    const closePopUp = () => {
        setPopUpCreateUrgency(false);
        setPopUpEditUrgency(false);
        setDeletedModalOpen(false);
        setValidationError(false);
        setName("");
        setColor("");
    };

    const createUrgency = () => {
        if (popUpEditUrgency) {
            const idUrgency = context?.selectRowDirectory;
            const prev = tableBodyUrgency.find(
                (urgency) => urgency.id === idUrgency
            );
            const editUrgencyData = { name, color };
            return EditUrgency(editUrgencyData, idUrgency).then((response) => {
                if (response?.status === 200) {
                    const changeUrgencyData = {
                        prevName: prev.name,
                        urgencyId: idUrgency,
                    };
                    ChangeUrgency(changeUrgencyData).then((res) => {
                        if (res?.status === 200) {
                            context?.UpdateUrgency();
                            closePopUp();
                        }
                    });
                } else {
                    closePopUp();
                    setErrorHeader("Ошибка редактирования ❌")
                    setErrorText(
                        "Срочность «Маршрут» не может быть изменена или удалена"
                    );
                    setIsError(true);
                    setTimeout(() => {
                        handleClose();
                    }, 4000);
                }
            });
        }
        if (!name) setValidationError(true);
        if (color === "") setColor("#000");
        const createUrgencyData = { name, color };
        CreateUrgency(createUrgencyData).then((response) => {
            if (response?.status === 200) {
                context?.UpdateUrgency();
                closePopUp();
            }
        });
    };

    const openDelete = () => {
        if (context?.selectRowDirectory) setDeletedModalOpen(true);
        else {
            context?.setPopUp("PopUpError");
            context?.setPopupErrorText("Сначала выберите срочность!");
        }
    };

    const handleClose = () => {
        setIsHiding(true);
        setTimeout(() => {
            setErrorText("");
            setErrorHeader("")
            setIsError(false);
            setIsHiding(false);
        }, 400);
    };

    return (
        <div className={styles.DirectoryStatuses}>
            <div className={styles.Functional__header}>
                <div className={styles.text__header}>
                    <p>Срочность заявок</p>
                    <div className={styles.clear}>
                        <button
                            onClick={() =>
                                dispatch(resetFilters({ tableName: "table14" }))
                            }
                        >
                            <img src={ClearImg} />
                        </button>
                    </div>
                </div>

                {JSON.parse(localStorage.getItem("userData"))?.user?.role !==
                    "OBSERVER" && (
                    <div className={styles.button__header}>
                        <button onClick={() => createNewUrgency()}>
                            Добавить
                        </button>

                        <button onClick={() => editUrgency()}>
                            Редактировать
                        </button>

                        <button
                            className={
                                isDeleteButtonDisabled
                                    ? styles.disabledDelete
                                    : ""
                            }
                            disabled={isDeleteButtonDisabled}
                            onClick={() => openDelete()}
                        >
                            Удалить
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.DirectoryUrgency__tableContainer}>
                <div className={styles.DirectoryUrgency__table}>
                    <UniversalTable
                        tableName="table14"
                        tableHeader={tableUrgencyHeader}
                        tableBody={tableBodyUrgency}
                        selectFlag={true}
                        FilterFlag={true}
                        heightTable="calc(100vh - 285px)"
                    />
                </div>
            </div>

            {popUpCreateUrgency && (
                <PopUpContainer
                    mT={150}
                    title={"Создание новой срочности"}
                    closePopUpFunc={closePopUp}
                >
                    <div classNmae={styles.PopUpContainerDiv}>
                        {validationError && (
                            <p>Заполните все обязательные поля!</p>
                        )}
                        <input
                            value={popUpEditUrgency ? name : name}
                            placeholder="Введите название"
                            onChange={(e) => setName(e.target.value)}
                            className={styles.PopUpInput}
                        />

                        <div className={styles.ColorInput}>
                            <label>Выберите цвет: </label>
                            <input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                type="color"
                                className={styles.PopUpColorInput}
                            />
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                className={styles.CreateButton}
                                onClick={() => createUrgency()}
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </PopUpContainer>
            )}

            {popUpEditUrgency && (
                <PopUpContainer
                    mT={150}
                    title={"Редактирование срочности"}
                    closePopUpFunc={closePopUp}
                >
                    <div classNmae={styles.PopUpContainerDiv}>
                        <input
                            value={name}
                            placeholder="Введите название"
                            onChange={(e) => setName(e.target.value)}
                            className={styles.PopUpInput}
                        />

                        <div className={styles.ColorInput}>
                            <label>Выберите цвет:</label>
                            <input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                type="color"
                                className={styles.PopUpColorInput}
                            />
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                className={styles.CreateButton}
                                onClick={() => createUrgency()}
                            >
                                Редактировать
                            </button>
                        </div>
                    </div>
                </PopUpContainer>
            )}

            {deletedModalOpen && (
                <UneversalDelete
                    text="эту срочность"
                    ClosePopUp={closePopUp}
                    FunctionDelete={deleteUrgency}
                />
            )}

            {context.popUp === "PopUpError" && <PopUpError />}
            {isError && (
                <div
                    className={`${styles.ErrorUrgency} ${
                        isHiding ? styles.hide : ""
                    }`}
                >
                    <div className={styles.content}>
                        <div
                            onClick={() => handleClose()}
                            className={styles.closeButton}
                        >
                            X
                        </div>
                        <div className={styles.contentBox}>
                            <p className={styles.errorHeader}>{errorHeader}</p>
                            <p className={styles.errorText}>{errorText}</p>
                            <div className={styles.progressBar}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DirectoryUrgency;
