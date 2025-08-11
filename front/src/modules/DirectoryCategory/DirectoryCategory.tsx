import { FC } from "react";
import styles from "./styles.module.scss";
import { useAppDispatch } from "../../hooks/store";
import ClearImg from "./../../assets/images/ClearFilter.svg";
import { resetFilters } from "../../store/samplePoints/samplePoits";
// @ts-ignore
import UniversalTable from "../../components/UniversalTable/UniversalTable.jsx";
import { tableColumn } from "./constant";

const DirectoryCategory: FC = () => {
    const dispatch = useAppDispatch();

    const rawUserData = localStorage.getItem("userData");
    const userRole = rawUserData ? JSON.parse(rawUserData)?.user?.role : null;

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
                        <button onClick={() => {}}>Добавить</button>

                        <button onClick={() => {}}>Редактировать</button>

                        <button onClick={() => {}}>Удалить</button>
                    </div>
                )}
            </div>
            <div className={styles.DirectoryUrgency__tableContainer}>
                <div className={styles.DirectoryUrgency__table}>
                    <UniversalTable
                        tableName="table16"
                        tableHeader={tableColumn}
                        tableBody={[]}
                        selectFlag={true}
                        FilterFlag={true}
                        heightTable="calc(100vh - 285px)"
                    />
                </div>
            </div>
        </div>
    );
};

export default DirectoryCategory;
