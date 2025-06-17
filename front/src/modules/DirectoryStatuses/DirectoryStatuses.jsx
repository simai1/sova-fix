import React, { useContext, useEffect, useState } from "react";
import styles from "./DirectoryStatuses.module.scss";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import { useDispatch } from "react-redux";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { tableStatusHeader } from "./DirectoryStatusesData";
import {
    ChangeStatus,
    CreateStatus,
    DeleteStatus,
    EditStatus,
    GetAllStatuses,
} from "../../API/API";
import DataContext from "../../context";
import UneversalDelete from "../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";

const DirectoryStatuses = () => {
    const [tableBodyStatuses, setTableBodyStatuses] = useState([]);
    const [popUpCreateStatuses, setPopUpCreateStatuses] = useState(false);
    const [validationError, setValidationError] = useState(false);
    const [popUpEditStatus, setPopUpEditStatus] = useState(false);
    const [deletedModalOpen, setDeletedModalOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [popUpCreateUrgency, setPopUpCreateUrgency] = useState(false);
    const [popUpEditUrgency, setPopUpEditUrgency] = useState(false);

    const [errorHeader, setErrorHeader] = useState("");

    const [errorText, setErrorText] = useState("");

    const [name, setName] = useState("");
    const [color, setColor] = useState("");

    const { context } = useContext(DataContext);

    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);

    const getData = () => {
        GetAllStatuses().then((response) => {
            if (response?.status === 200) {
                setTableBodyStatuses(response.data);
            }
        });
    };

    useEffect(() => {
        getData();
    }, [context?.statusList]);

    const dispatch = useDispatch();

    const openCreateNewStatus = () => {
        setPopUpCreateStatuses(true);
    };

    const openEditStatus = () => {
        if (context?.selectRowDirectory) {
            const currentStatus = tableBodyStatuses.find(
                (status) => status.id === context?.selectRowDirectory
            );

            setColor(currentStatus.color);
            setName(currentStatus.name);

            setPopUpEditStatus(true);
        } else {
            context?.setPopUp("PopUpError");
            context?.setPopupErrorText("Сначала выберите статус!");
        }
    };

    const openDelete = () => {
        if (context?.selectRowDirectory) setDeletedModalOpen(true);
        else {
            context?.setPopUp("PopUpError");
            context?.setPopupErrorText("Сначала выберите статус!");
        }
    };

    const createStatus = () => {
        if (popUpEditStatus) {
            const statusId = context?.selectRowDirectory;
            const prev = tableBodyStatuses.find(
                (status) => status.id === statusId
            );
            const editStatusData = { name, color };

            return EditStatus(editStatusData, statusId).then((response) => {
                if (response?.status === 200) {
                    const changeStatusData = {
                        prevNumber: prev.number,
                        statusId,
                    };

                    ChangeStatus(changeStatusData).then((response) => {
                        context?.UpdateStatus();
                        closePopUp();
                    });
                } else {
                    closePopUp();
                    setErrorHeader("Ошибка редактирования ❌");
                    setErrorText(
                        `Статус "${prev.name}" не может быть изменен или удален`
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
        const createStatusData = { name, color };

        CreateStatus(createStatusData).then((response) => {
            if (response?.status === 200) {
                context?.UpdateStatus();
                closePopUp();
            }
        });
    };

    const deleteStatus = () => {
        DeleteStatus(context?.selectRowDirectory).then((response) => {
            if (response?.status === 200) {
                context?.UpdateStatus();
                closePopUp();
            } else {
                const currenStatus = tableBodyStatuses.find(
                    (status) => status.id === context?.selectRowDirectory
                );
                closePopUp();
                setIsError(true);
                setErrorHeader(
                    `Срочность "${currenStatus.name}" не может быть удалена ❌`
                );
                setErrorText(
                    `Срочность "${currenStatus.name}" не может быть удалена, есть связанные заявки.`
                );
                setTimeout(() => {
                    handleClose();
                }, 4000);
            }
        });
    };

    const handleClose = () => {
        setIsHiding(true);
        setTimeout(() => {
            setErrorText("");
            setErrorHeader("");
            setIsError(false);
            setIsHiding(false);
        }, 400);
    };

    const closePopUp = () => {
        setPopUpCreateStatuses(false);
        setPopUpEditStatus(false);
        setDeletedModalOpen(false);
        setValidationError(false);
        setName("");
        setColor("");
    };

    useEffect(() => {
        const defaultStatuses = tableBodyStatuses
            .filter((status) => status.number < 6)
            .map((status) => status.id);
        if (defaultStatuses.includes(context?.selectRowDirectory)) {
            return setIsDeleteButtonDisabled(true);
        }
        setIsDeleteButtonDisabled(false);
    }, [tableBodyStatuses, context?.selectRowDirectory]);

    return (
        <div className={styles.DirectoryStatuses}>
            <div className={styles.Functional__header}>
                <div className={styles.text__header}>
                    <p>Статус заявок</p>
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
                        <button onClick={() => openCreateNewStatus()}>
                            Добавить
                        </button>

                        <button onClick={() => openEditStatus()}>
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
                        tableName="table15"
                        tableHeader={tableStatusHeader}
                        tableBody={tableBodyStatuses}
                        selectFlag={true}
                        FilterFlag={true}
                        heightTable="calc(100vh - 285px)"
                    />
                </div>
            </div>

            {popUpCreateStatuses && (
                <PopUpContainer
                    mT={150}
                    title={"Создание нового статуса"}
                    closePopUpFunc={closePopUp}
                >
                    <div classNmae={styles.PopUpContainerDiv}>
                        {validationError && (
                            <p>Заполните все обязательные поля!</p>
                        )}
                        <input
                            value={popUpEditStatus ? name : name}
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
                                onClick={() => createStatus()}
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </PopUpContainer>
            )}

            {popUpEditStatus && (
                <PopUpContainer
                    mT={150}
                    title={"Редактирование cтатуса"}
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
                                onClick={() => createStatus()}
                            >
                                Редактировать
                            </button>
                        </div>
                    </div>
                </PopUpContainer>
            )}

            {deletedModalOpen && (
                <UneversalDelete
                    text="этот статус"
                    ClosePopUp={closePopUp}
                    FunctionDelete={deleteStatus}
                />
            )}

            {context?.popUp === "PopUpError" && <PopUpError />}
            {isError && (
                <div
                    className={`${styles.ErrorStatus} ${
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
};

export default DirectoryStatuses;
