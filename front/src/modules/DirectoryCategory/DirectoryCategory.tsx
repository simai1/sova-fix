import { FC, useContext, useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { useAppDispatch } from "../../hooks/store";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
// @ts-ignore
import UniversalTable from "../../components/UniversalTable/UniversalTable.jsx";
import { tableColumn } from "./constant";
import { useGetAllDirectoryCategoryQuery } from "./directoryCategory.api";
import DirectoryCategoryModal from "./DirectoryCategoryModal/DirectoryCategoryModal";
import { ModalState } from "./types";
import DataContext from "../../context";

const DirectoryCategory: FC = () => {
    const [modalState, setModalState] = useState<ModalState>({
        open: false,
        type: "add",
    });
    const [isEditButtonDisabled, setIsEditButtonDisabled] =
        useState<boolean>(false);
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
        useState<boolean>(false);

    const dispatch = useAppDispatch();
    const { context } = useContext(DataContext);

    const rawUserData = localStorage.getItem("userData");
    const userRole = rawUserData ? JSON.parse(rawUserData)?.user?.role : null;

    const { data: directoryCategories } = useGetAllDirectoryCategoryQuery();

    const handleOpenAddModal = () => {
        setModalState({ open: true, type: "add" });
    };

    const handleOpenEditModal = () => {
        setModalState({ open: true, type: "edit" });
    };

    const handleCloseModal = () => {
        setModalState({ open: false, type: "add" });
    };

    useEffect(() => {
        if (!context?.selectRowDirectory) {
            setIsEditButtonDisabled(true);
            setIsDeleteButtonDisabled(true);
        } else {
            setIsEditButtonDisabled(false);
            setIsDeleteButtonDisabled(false);
        }
    }, [context?.selectRowDirectory]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.text__header}>
                    <p>Категории</p>
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
                {userRole && (
                    <div className={styles.button__header}>
                        <button onClick={handleOpenAddModal}>Добавить</button>

                        <button
                            disabled={isEditButtonDisabled}
                            onClick={handleOpenEditModal}
                        >
                            Редактировать
                        </button>

                        <button
                            disabled={isDeleteButtonDisabled}
                            onClick={() => {}}
                        >
                            Удалить
                        </button>
                    </div>
                )}
            </div>
            <div className={styles.DirectoryUrgency__tableContainer}>
                <div className={styles.DirectoryUrgency__table}>
                    <UniversalTable
                        tableName="table16"
                        tableHeader={tableColumn}
                        tableBody={directoryCategories}
                        selectFlag={true}
                        FilterFlag={true}
                        heightTable="calc(100vh - 285px)"
                    />
                </div>
            </div>

            <DirectoryCategoryModal
                state={modalState}
                selectedRow={context?.selectRowDirectory}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default DirectoryCategory;
