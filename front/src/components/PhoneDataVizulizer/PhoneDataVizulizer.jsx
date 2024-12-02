import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from "react-modal"; // Подключаем библиотеку для модального окна
import styles from "./PhoneDataVizulizer.module.scss";
import { phoneHeaderData, tableHeadAppoint } from "../Table/Data";
import { GetAllRequests } from "../../API/API";
import DataContext from "../../context";
import { funFixEducator } from "../../UI/SamplePoints/Function";
import { use } from "echarts";

Modal.setAppElement("#root"); // Указываем элемент для библиотеки react-modal

function PhoneDataVizulizer(props) {
  const [dataBody, setDataBody] = useState([]); // Состояние для данных
  const [dataHeader, setDataHeader] = useState([]); // Состояние для заголовков
  const [loading, setLoading] = useState(false); // Индикатор загрузки
  const [error, setError] = useState(null); // Ошибка, если что-то пошло не так
  const [modalContent, setModalContent] = useState(null); // Контент для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false); // Управление модальным окном
  const [showScrollToTop, setShowScrollToTop] = useState(false); // Состояние для отображения кнопки

  const { context } = useContext(DataContext);

   // Ссылка на элемент с прокруткой
   const containerRef = useRef(null);

   // Слежение за прокруткой в контейнере
   useEffect(() => {
     const container = containerRef.current;
 
     const handleScroll = () => {
       if (container) {
         setShowScrollToTop(container.scrollTop > 300); // Показываем кнопку при скролле вниз
       }
     };
 
     container.addEventListener("scroll", handleScroll);
     return () => container.removeEventListener("scroll", handleScroll);
   }, []);

  // Функция прокрутки вверх
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    setDataHeader(tableHeadAppoint); // Устанавливаем заголовки
    fetchData(); // Загружаем данные
  }, [props?.tableBody, props?.tableHeader]);

  useEffect(() => {
    fetchData(context.textSearchTableDataPhone); // Загружаем данные при изменении флага
  }, [context.textSearchTableDataPhone]);

  useEffect(() => {
    if (context.updatedDataApointment === 1) {
      fetchData(context.textSearchTableDataPhone);
      context.setUpdatedDataApointment(0);
    }
  }, [context.updatedDataApointment]);

  // Асинхронная функция для загрузки данных
  const fetchData = async (text) => {
    setLoading(true);
    setError(null);
    try {
      let url = text ? `?search=${text}` : "";
      const response = await GetAllRequests(url); // Выполняем запрос
      if (response?.data?.requestsDtos) {
        setDataBody(funFixEducator(response.data.requestsDtos)); // Сохраняем данные
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

  // Функция открытия модального окна
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  // Функция закрытия модального окна
  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
    fetchData(context.textSearchTableDataPhone);
  };

  // Проверка на видео
  const isVideo = (fileName) => {
    if (typeof fileName !== "string") return false; // Проверяем, что fileName — строка
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"];
    return videoExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const getColorStatus = (statusId) => {
    switch (statusId) {
      case "Новая заявка":
        return "#d69a81"; // красный
      case "В работе":
        return "#ffe78f"; // жёлтый
      case "Выполнена":
        return "#C5E384"; // зелёный
      case "Выезд без выполнения":
        return "#f9ab23"; // оранжевый
      default:
        return "#ccc"; // цвет по умолчанию
    }
  };

  const getColorUrgensy = (name) => {
    switch (name) {
      case "В течение часа":
        return "#d69a81"; // красный
      case "В течение текущего дня":
        return "#f9ab23"; // оранжевый
      case "В течение 3-х дней":
        return "#ffe78f"; // жёлтый
      case "В течение недели":
        return "#eaf45b"; // светло жёлтый
      case "Выполнено":
        return "#C5E384"; // зеленый
      default:
        return "#ccc"; // цвет по умолчанию
    }
  };
  const getContractorItem = (row) => {
    if (row?.isExternal) {
      return "Внешний подрядчик";
    } else {
      if (row?.contractor !== "___") {
        return row?.contractor;
      } else {
        return "Не назначен";
      }
    }
  };

  return (
    <div className={styles.PhoneDataVizulizer} ref={containerRef}>
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
                <div
                  className={styles.EditDataBlock}
                  onClick={() => {
                    context.setPopUp("PopUpEditAppoint");
                    context.setSelectedTr(item.id);
                  }}
                >
                  <img src="/img/edit.svg" />
                </div>
                {phoneHeaderData?.map((header) => {
                  if (header.isActive && header.key !== "Qr") {
                    const value = item[header.key];

                    // Если значение — фото или видео
                    if (header.key === "fileName") {
                      return (
                        <div key={header.key} className={styles.photoBlock}>
                          {isVideo(value) ? (
                            <video
                              className={styles.fileVideoTable}
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(
                                  <video
                                    controls
                                    className={styles.modalContent}
                                  >
                                    <source
                                      src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                                    />
                                    Ваш браузер не поддерживает видео.
                                  </video>
                                );
                              }}
                            >
                              <source
                                src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                              />
                              Ваш браузер не поддерживает видео.
                            </video>
                          ) : (
                            <img
                              src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                              alt="Фото"
                              className={styles.imgTable}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                openModal(
                                  <img
                                    src={`${process.env.REACT_APP_API_URL}/uploads/${value}`}
                                    alt="Фото"
                                    className={styles.modalContent}
                                  />
                                )
                              }
                            />
                          )}
                        </div>
                      );
                    } else if (header.key === "status") {
                      return (
                        <div key={header.key} className={styles.dataItemRejected}>
                          <p style={{ margin: "0px" }}>
                            Статус:{" "}
                            <span
                              className={styles.spanBgColor}
                              style={{
                                whiteSpace: "nowrap",
                                backgroundColor: getColorStatus(value),
                              }}
                            >
                              {value}
                            </span>
                          </p>
                        </div>
                      );
                    } else if (header.key === "urgency") {
                      return (
                        <div key={header.key} className={styles.dataItemRejected}>
                          <p style={{ margin: "3px 0px" }}>
                            Статус:{" "}
                            <span
                              className={styles.spanBgColor}
                              style={{
                                whiteSpace: "nowrap",
                                backgroundColor: getColorUrgensy(value),
                              }}
                            >
                              {value}
                            </span>
                          </p>
                        </div>
                      );
                    } else if (header.key === "builder") {
                      // подрядчик
                      return (
                        <p style={{ margin: "3px 0px" }}>
                          Подрядчик:{" "}
                          {value === "Внешний подрядчик" ? "Не назначeн" : value}
                        </p>
                      );
                    } else if (header.key === "contractor") {
                      // исполнитель
                      return (
                        <p style={{ margin: "3px 0px" }}>
                          Исполнитель: {getContractorItem(item)}
                        </p>
                      );
                    }

                    // Другое отображение значений
                    const displayValue =
                      typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : value ?? "—";

                    return (
                      <div
                        key={header.key}
                        className={`${styles.dataItem} ${
                          header.key === "conditionHuman"
                            ? styles.dataItemCondition
                            : ""
                        }`}
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

      {/* Модальное окно */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
      >
        <button className={styles.modalClose} onClick={closeModal}>
          &times;
        </button>
        <div className={styles.modalContentWrapper}>{modalContent}</div>
      </Modal>

        {showScrollToTop &&
            <button className={styles.scrollToTop} onClick={() => scrollToTop()}>
            ↑
            </button>
        }

      
    </div>
  );
}

export default PhoneDataVizulizer;
