import React, { useEffect, useState } from 'react';
import styles from "./PhoneDataVizulizer.module.scss";
import { tableHeadAppoint } from '../Table/Data';
import { GetAllRequests } from '../../API/API';

function PhoneDataVizulizer(props) {
    const [dataBody, setDataBody] = useState([]); // Состояние для данных
    const [dataHeader, setDataHeader] = useState([]); // Состояние для заголовков
    const [loading, setLoading] = useState(false); // Индикатор загрузки
    const [error, setError] = useState(null); // Ошибка, если что-то пошло не так

    const context = props.context;

    useEffect(() => {
        setDataHeader(tableHeadAppoint); // Устанавливаем заголовки из пропсов или статичных данных
        fetchData(); // Загружаем данные
    }, [props?.tableBody, props?.tableHeader]);

    // Асинхронная функция для загрузки данных
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await GetAllRequests(""); // Выполняем запрос
            if (response?.data?.requestsDtos) {
                setDataBody(response.data.requestsDtos); // Сохраняем данные в состояние
            } else {
                setDataBody([]); // Если данных нет
            }
        } catch (err) {
            setError("Ошибка загрузки данных."); // Устанавливаем ошибку
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.PhoneDataVizulizer}>
            {/* Отображаем загрузку */}
            {loading && <div className={styles.loading}>Загрузка данных...</div>}

            {/* Отображаем ошибку */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            {/* Если данные есть, отображаем их */}
            {!loading && !error && dataBody?.length > 0 ? (
                <>
                {dataBody?.map((item, index) => (
                    <div key={item.id} className={styles.dataBlock}>
                        <div className={styles.dataBlockInner}>
                            {dataHeader?.map(header => {
                                if (header.isActive && header.key !== "Qr") {
                                    const value = item[header.key];

                                    // Check if the value is an object
                                    const displayValue = typeof value === "object" && value !== null
                                        ? JSON.stringify(value)  // Or use a specific property like value.name if it has a name property
                                        : value ?? "—";

                                    return (
                                        <div
                                            key={header.key}
                                            className={`${styles.dataItem} ${header.key === "conditionHuman" ? styles.dataItemCondition : ''}`}
                                        >
                                            <strong>{header.value}:</strong>
                                            <span>{displayValue}</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                ))}
                </>
            ) : (
                // Если данных нет
                !loading && (
                    <div className={styles.dataBlockNote}>
                        <p>Нет данных</p>
                    </div>
                )
            )}
        </div>
    );
}

export default PhoneDataVizulizer;
