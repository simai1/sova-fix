import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import styles from "./PhoneDataVizulizer.module.scss";
import { phoneHeaderData } from "../Table/Data";
import { GetAllRequests } from "../../API/API";
import DataContext from "../../context";
import { funFixEducator } from "../../UI/SamplePoints/Function";
import EditImg from "./../../assets/images/Edit.svg";

Modal.setAppElement("#root");

function PhoneDataVizulizer(props) {
  const [dataBody, setDataBody] = useState([]); // Данные
  const [dataHeader, setDataHeader] = useState([]); // Заголовки
  const [loading, setLoading] = useState(false); // Индикатор загрузки
  const [error, setError] = useState(null); // Ошибка
  const [hasMore, setHasMore] = useState(true); // Есть ли еще данные для загрузки
  const [offset, setOffset] = useState(0); // Текущий офсет
  const [modalContent, setModalContent] = useState(null); // Контент для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false); // Управление модальным окном
  const { context } = useContext(DataContext);
  const observerRef = useRef(null); // Ссылка на наблюдатель для скролла
  const [showScrollToTop, setShowScrollToTop] = useState(false); // Состояние для отображения кнопки
  const PAGE_SIZE = 10; // Количество строк на одной подгрузке

  // Ссылка на элемент с прокруткой
  const containerRef = useRef(null);
  
  // Функция прокрутки вверх
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };
  
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
  
  
  // Обновляем данные при изменении поиска или popUp
  useEffect(() => {
    if (context.textSearchTableDataPhone) {
      setOffset(0); // Сбрасываем offset
      setDataBody([]); // Очищаем текущие данные
      fetchData(0, context.textSearchTableDataPhone); // Заново выполняем поиск
    }
  }, [context.textSearchTableDataPhone]);
  
  useEffect(() => {
    if (context.reloadTable) {
      setOffset(0); // Сбрасываем offset
      setDataBody([]); // Очищаем текущие данные
      fetchData(0); // Перезагружаем данные
      context.setReloadTable(false); // Сбрасываем флаг после обновления
    }
  }, [context.reloadTable]);
  
  // Функция загрузки данных
  const fetchData = async (currentOffset, text) => {
    if (loading) return; // Блокируем повторные запросы
    setLoading(true);
    setError(null);
  
    try {
      let url;
      if (text) {
        // Если есть текст поиска, игнорируем offset
        url = `?search=${encodeURIComponent(text)}`;
      } else {
        // Если поиска нет, используем пагинацию
        url = `?offset=${currentOffset}&limit=${PAGE_SIZE}`;
      }
  
      const response = await GetAllRequests(url);
      const newData = response?.data?.requestsDtos || [];
  
      if (text) {
        // Если это поиск, полностью перезаписываем данные
        setDataBody(funFixEducator(newData));
      } else {
        // Если это подгрузка, добавляем данные
        setDataBody((prev) => [...prev, ...funFixEducator(newData)]);
      }
  
      // Проверяем, есть ли ещё данные для подгрузки
      setHasMore(newData.length === PAGE_SIZE);
    } catch (err) {
      setError("Ошибка загрузки данных.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Callback для Intersection Observer
  const handleObserver = (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      fetchData(offset); // Загружаем данные с текущим offset
      setOffset((prevOffset) => prevOffset + PAGE_SIZE); // Увеличиваем offset после загрузки
    }
  };
  
  // Устанавливаем Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    });
  
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
  
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [observerRef.current, hasMore, loading, offset]);
  
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
      {/* Отображаем данные */}
      {dataBody.map((item, index) => (
        <div key={item.id + index} className={styles.dataBlock}>
          <div className={styles.dataBlockInner}>
            <div
              className={styles.EditDataBlock}
              onClick={() => {
                context.setPopUp("PopUpEditAppoint");
                context.setSelectedTr(item.id);
              }}
            >
              <img src={EditImg} alt="Edit" />
            </div>
            {phoneHeaderData?.map((header) => {
                  if (header.isActive && header.key !== "Qr") {
                    const value = item[header.key];

                    // Если значение — фото или видео
                    if (header.key === "fileName") {
                      return (
                        <div key={header.key + index} className={styles.photoBlock}>
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
                        <div key={header.key + index} className={styles.dataItemRejected}>
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
                        <div key={header.key + index} className={styles.dataItemRejected}>
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
                        key={header.key + index}
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
      {/* Индикатор загрузки */}
      {loading && <div className={styles.loading}>Загрузка...</div>}

      {/* Ошибка */}
      {error && <div className={styles.error}>{error}</div>}
      {showScrollToTop &&
            <button className={styles.scrollToTop} onClick={() => scrollToTop()}>
            ↑
            </button>
        }
      {/* Наблюдатель для Intersection Observer */}
      <div ref={observerRef} className={styles.observer}></div>
    </div>
  );
}

export default PhoneDataVizulizer;
