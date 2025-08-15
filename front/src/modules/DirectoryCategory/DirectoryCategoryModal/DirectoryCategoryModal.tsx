import { FC } from "react";
import Modal from "../../../components/Modal/Modal";
import {
    DirectoryCategoryModalFormI,
    DirectoryCategoryModalProps,
} from "../types";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./styles.module.scss";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import CustomInput from "../../../UI/CustomInput/CustomInput";
import MultiDropdown from "../../../UI/MultiDropdown/MultiDropdown";
import {
    useCreateDirectoryCategoryMutation,
    useGetAllBuildersQuery,
    useGetAllCustomersQuery,
    useUpdateDirectoryCategoryMutation,
} from "../directoryCategory.api";

const DirectoryCategoryModal: FC<DirectoryCategoryModalProps> = ({
    state,
    selectedRow,
    onClose,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        reset,
    } = useForm<DirectoryCategoryModalFormI>();

    const { data: allBuildersOptions } = useGetAllBuildersQuery();
    const { data: allCustomersOptions } = useGetAllCustomersQuery();
    const [createDirectoryCategory] = useCreateDirectoryCategoryMutation();
    const [updateDirectoryCategory] = useUpdateDirectoryCategoryMutation();

    const onSubmit: SubmitHandler<DirectoryCategoryModalFormI> = (data) => {
        if (state.type === "add") {
            createDirectoryCategory(data);
        }

        if (state.type === "edit") {
            updateDirectoryCategory({
                body: data,
                params: { directoryCategoryId: selectedRow },
            });
        }
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    return (
        <Modal
            title={
                state.type === "add"
                    ? "Добавление категории"
                    : "Редактирование категории"
            }
            open={state.open}
            onClose={handleClose}
            className={styles.modal}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <CustomInput
                    label="Название"
                    control={control}
                    name="name"
                    placeholder="Введите название"
                    required
                />
                <MultiDropdown
                    control={control}
                    options={allCustomersOptions ?? []}
                    name="customersId"
                    label="Заказчики"
                    placeholder="Укажите заказчиков"
                    allValue={""}
                />
                <Dropdown
                    control={control}
                    options={allBuildersOptions ?? []}
                    name="builder"
                    label="Исполнитель"
                    placeholder="Укажите исполнителя"
                />
                <div className={styles.color__container}>
                    <p className={styles.color__label}>Цвет</p>
                    <input
                        {...register("color")}
                        type="color"
                        className={styles.color}
                    />
                </div>
                <div className={styles.button__container}>
                    <button type="submit" className={styles.submit__button}>
                        {state.type === "add" ? "Добавить" : "Редактировать"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DirectoryCategoryModal;
