import { FC, useContext, useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { useAppDispatch } from "../../hooks/store";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
// @ts-ignore
import UniversalTable from "../../components/UniversalTable/UniversalTable.jsx";
import { normalizeDataRender, tableColumn } from "./constant";
import {
    useDeleteDirectoryCategoryMutation,
    useGetAllDirectoryCategoryQuery,
} from "./directoryCategory.api";
import DirectoryCategoryModal from "./DirectoryCategoryModal/DirectoryCategoryModal";
import { GetDirectoryCategoryResponse, ModalState } from "./types";
import DataContext from "../../context";
import Confirm from "../../UI/Confirm/Confirm";

const DirectoryCategory: FC = () => {
    const [modalState, setModalState] = useState<ModalState>({
        open: false,
        type: "add",
    });
    const [isEditButtonDisabled, setIsEditButtonDisabled] =
        useState<boolean>(false);
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] =
        useState<boolean>(false);
    const [selectedRowState, setSelectedRowState] =
        useState<GetDirectoryCategoryResponse | null>(null);
    const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] =
        useState<boolean>(false);

    const dispatch = useAppDispatch();
    const { context } = useContext(DataContext);

    const rawUserData = localStorage.getItem("userData");
    const userRole = rawUserData ? JSON.parse(rawUserData)?.user?.role : null;

    const { data: directoryCategories, refetch: refetchAllDirectoryCategory } =
        useGetAllDirectoryCategoryQuery();
    const [deleteDirectoryCategory] = useDeleteDirectoryCategoryMutation();

    const handleOpenAddModal = () => {
        setModalState({ open: true, type: "add" });
    };

    const handleOpenEditModal = () => {
        setModalState({ open: true, type: "edit" });
    };

    const handleCloseModal = () => {
        setModalState({ open: false, type: "add" });
    };

    const handleOpenConfirm = () => {
        setIsConfirmDeleteVisible(true);
    };

    const handleCloseConfrim = () => {
        setIsConfirmDeleteVisible(false);
    };

    const handleDeleteCategory = async () => {
        if (selectedRowState) {
            await deleteDirectoryCategory({
                directoryCategoryId: selectedRowState.id,
            });
            handleCloseConfrim();
            refetchAllDirectoryCategory();
            context?.setSelectRowDirectory(null)
        }
    };

    useEffect(() => {
        if (!context?.selectRowDirectory) {
            setIsEditButtonDisabled(true);
            setIsDeleteButtonDisabled(true);
        } else {
            const selectedRow = directoryCategories?.find(
                (category) => category.id === context?.selectRowDirectory
            );
            if (selectedRow) {
                setSelectedRowState(selectedRow)
            } else {
                setSelectedRowState(null)
            }; 
            setIsEditButtonDisabled(false);
            setIsDeleteButtonDisabled(false);
        }
    }, [context?.selectRowDirectory, directoryCategories]);

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
                            onClick={handleOpenConfirm}
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
                        tableBody={normalizeDataRender(directoryCategories ?? [])}
                        selectFlag={true}
                        FilterFlag={true}
                        heightTable="calc(100vh - 285px)"
                    />
                </div>
            </div>

            <DirectoryCategoryModal
                state={modalState}
                selectedRow={selectedRowState}
                onClose={handleCloseModal}
            />

            <Confirm
                isVisible={isConfirmDeleteVisible}
                message={`Вы уверены, что хотите удалить категорию "${selectedRowState?.name}"?`}
                handleCancel={handleCloseConfrim}
                handleConfirm={handleDeleteCategory}
                confirmText="Удалить"
                danger
            />
        </div>
    );
};

export default DirectoryCategory;
