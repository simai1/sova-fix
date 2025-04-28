import React from "react";
import styles from "./DirectoryStatuses.module.scss";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import { useDispatch } from "react-redux";
import ClearImg from "./../../assets/images/ClearFilter.svg"

function DirectoryStatuses(props) {

    const dispatch = useDispatch()

    return (
        <div className={styles.DirectoryStatuses}>
            <div className={styles.Functional__header}>
                <div className={styles.text__header}>

                    <p>Срочность заявок</p>
                    <div className={styles.clear}>
                        <button
                            onClick={() =>
                                dispatch(resetFilters({ tableName: "statuses " }))
                            }
                        >
                            <img src={ClearImg} />
                        </button>
                    </div>

                </div>

                <div className={styles.button__header}>
                    <button>
                        Добавить
                    </button>

                    <button>
                        Редактировать
                    </button>

                    <button>
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DirectoryStatuses;
