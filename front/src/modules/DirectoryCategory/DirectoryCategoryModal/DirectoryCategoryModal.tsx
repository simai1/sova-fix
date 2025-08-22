import { FC, useContext, useEffect, useState } from "react";
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
    useLazyGetAllDirectoryCategoryQuery,
    useUpdateDirectoryCategoryMutation,
} from "../directoryCategory.api";
import { getBuilderFun } from "../constant";
import DataContext from "../../../context";
import { Setting } from "../../../types/settings";

const DirectoryCategoryModal: FC<DirectoryCategoryModalProps> = ({
    state,
    selectedRow,
    onClose,
}) => {
    const [autoSetting, setAutoSetting] = useState<boolean>(false);

    const { register, handleSubmit, control, reset } =
        useForm<DirectoryCategoryModalFormI>();

    const { data: allBuildersOptions } = useGetAllBuildersQuery();
    const { data: allCustomersOptions } = useGetAllCustomersQuery();
    const [getAllDirectoryCategory] = useLazyGetAllDirectoryCategoryQuery();
    const [createDirectoryCategory] = useCreateDirectoryCategoryMutation();
    const [updateDirectoryCategory] = useUpdateDirectoryCategoryMutation();

    const { context } = useContext(DataContext);

    useEffect(() => {
        if (state.open) {
            if (state.type === "edit" && selectedRow) {
                const builder = getBuilderFun(selectedRow);
                reset({
                    name: selectedRow.name,
                    customersIds: selectedRow.customers?.map((c) => c.id) ?? [
                        null,
                    ],
                    builder: builder?.id ?? "",
                    color: selectedRow.color,
                });
            } else {
                reset({
                    name: "",
                    customersIds: [null],
                    builder: "",
                    color: "#000000",
                });
            }
        }
    }, [state.open, state.type, selectedRow, reset]);

    const onSubmit: SubmitHandler<DirectoryCategoryModalFormI> = async (
        data
    ) => {
        const builder = allBuildersOptions?.find(
            (builder) => builder.value === data.builder
        );
        const payload = {
            name: data.name,
            color: data.color,
            builderId:
                !builder?.isManager && !builder?.isExternal
                    ? data.builder
                    : null,
            customersIds:
                (data.customersIds && data.customersIds[0] === null) ||
                data.customersIds === null
                    ? null
                    : data.customersIds,
            isExternal: builder?.isExternal ?? false,
            managerId:
                builder?.isManager && !builder?.isExternal
                    ? data.builder
                    : null,
            builderExternalId:
                !builder?.isManager && builder?.isExternal
                    ? data.builder
                    : null,
            isManager: builder?.isManager ?? false,
        };
        if (state.type === "add") {
            await createDirectoryCategory(payload);
            handleClose();
            getAllDirectoryCategory();
        }

        if (state.type === "edit" && selectedRow) {
            await updateDirectoryCategory({
                body: {
                    ...payload,
                },
                params: { directoryCategoryId: selectedRow.id },
            });
            handleClose();
            getAllDirectoryCategory();
        }
    };

    const handleClose = () => {
        onClose();
    };

    useEffect(() => {
        if (context?.settingsList.length > 0) {
            const auto = context?.settingsList.find(
                (setting: Setting) => setting.setting === "is_auto_set_category"
            );
            if (auto && typeof auto.value === "boolean")
                setAutoSetting(auto.value);
        }
    }, [context?.settingsList]);

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
                    name="customersIds"
                    label="Заказчики"
                    placeholder="Укажите заказчиков"
                    allValue={null}
                />
                <Dropdown
                    control={control}
                    options={allBuildersOptions ?? []}
                    name="builder"
                    label="Исполнитель"
                    placeholder="Укажите исполнителя"
                    disabled={!autoSetting}
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
