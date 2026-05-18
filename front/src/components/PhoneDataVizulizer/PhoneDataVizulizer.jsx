import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import styles from "./PhoneDataVizulizer.module.scss";
import { phoneHeaderData } from "../Table/Data";
import { GetAllRequests } from "../../API/API";
import DataContext from "../../context";
import { funFixEducator } from "../../UI/SamplePoints/Function";
import EditImg from "./../../assets/images/Edit.svg";
import { API_URL } from "../../constants/env.constant";

Modal.setAppElement("#root");

function PhoneDataVizulizer(props) {
  const [dataBody, setDataBody] = useState([]);
  const [dataHeader, setDataHeader] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { context } = useContext(DataContext);
  const observerRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const PAGE_SIZE = 10;

  const containerRef = useRef(null);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };
  
  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      if (container) {
        setShowScrollToTop(container.scrollTop > 300);
      }
    };
  
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);
  
  
  useEffect(() => {
    if (context.textSearchTableDataPhone) {
      setOffset(0);
      setDataBody([]);
      fetchData(0, context.textSearchTableDataPhone);
    }
  }, [context.textSearchTableDataPhone]);

  useEffect(() => {
    if (context.reloadTable) {
      setOffset(0);
      setDataBody([]);
      fetchData(0);
      context.setReloadTable(false);
    }
  }, [context.reloadTable]);

  const fetchData = async (currentOffset, text) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      let url;
      if (text) {
        url = `?search=${encodeURIComponent(text)}`;
      } else {
        url = `?offset=${currentOffset}&limit=${PAGE_SIZE}`;
      }

      const response = await GetAllRequests(url);
      const newData = response?.data?.requestsDtos || [];

      if (text) {
        setDataBody(funFixEducator(newData));
      } else {
        setDataBody((prev) => [...prev, ...funFixEducator(newData)]);
      }

      setHasMore(newData.length === PAGE_SIZE);
    } catch (err) {
      setError("Ошибка загрузки данных.");
    } finally {
      setLoading(false);
    }
  };

  const handleObserver = (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      fetchData(offset);
      setOffset((prevOffset) => prevOffset + PAGE_SIZE);
    }
  };

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
  
    const openModal = (content) => {
      setModalContent(content);
      setIsModalOpen(true);
    };

    const closeModal = () => {
      setModalContent(null);
      setIsModalOpen(false);
      fetchData(context.textSearchTableDataPhone);
    };

    const isVideo = (fileName) => {
      if (typeof fileName !== "string") return false;
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
                                      src={`${API_URL}/uploads/${value}`}
                                    />
                                    Ваш браузер не поддерживает видео.
                                  </video>
                                );
                              }}
                            >
                              <source
                                src={`${API_URL}/uploads/${value}`}
                              />
                              Ваш браузер не поддерживает видео.
                            </video>
                          ) : (
                            <img
                              src={`${API_URL}/uploads/${value}`}
                              alt="Фото"
                              className={styles.imgTable}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                openModal(
                                  <img
                                    src={`${API_URL}/uploads/${value}`}
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
                      return (
                        <p style={{ margin: "3px 0px" }}>
                          Подрядчик:{" "}
                          {value === "Внешний подрядчик" ? "Не назначeн" : value}
                        </p>
                      );
                    } else if (header.key === "contractor") {
                      return (
                        <p style={{ margin: "3px 0px" }}>
                          Исполнитель: {getContractorItem(item)}
                        </p>
                      );
                    }

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
      {loading && <div className={styles.loading}>Загрузка...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {showScrollToTop &&
            <button className={styles.scrollToTop} onClick={() => scrollToTop()}>
            ↑
            </button>
        }
      <div ref={observerRef} className={styles.observer}></div>
    </div>
  );
}

export default PhoneDataVizulizer;
