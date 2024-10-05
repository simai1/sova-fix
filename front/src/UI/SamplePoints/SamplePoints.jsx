import React, { useEffect, useRef, useState } from "react";
import styles from "./SamplePoints.module.scss";
// import DataContext from "../../context";
import { FilteredSample } from "./Function";
import { useDispatch } from "react-redux";
import {
  addAllCheckeds,
  addChecked,
  removeAllCheckeds,
  removeChecked,
} from "../../store/filter/isChecked.slice";

export function SamplePoints(props) {
  const dispatch = useDispatch();
  // const { basicTabData } = React.useContext(DataContext);

  //! поиск
  const [searchText, setSearchText] = useState("");
  const handleInputChange = (event) => {
    setSearchText(event.target.value);
  };
  const [filteredData, setFilteredData] = useState([]);

  //! чтобы SamplePoints не выходил за пределы таблицы
  const spRef = useRef(null);
  useEffect(() => {
    if (spRef.current) {
      const divRect = spRef.current.getBoundingClientRect();
      if (divRect.x + 300 > window.innerWidth) {
        spRef.current.style.left = "-100px";
      }
    }
  }, [spRef]);

  //! закрытие модального окна при нажати вне него
  useEffect(() => {
    const handler = (event) => {
      if (spRef.current && !spRef.current.contains(event.target)) {
        props.setSpShow("");
      }
    };
    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler);
    };
  }, []);

  useEffect(() => {
    //! isSamplePointsData это массив в котором текстовые елементы, взятые из столбца
    //! в fd храним все строки из столбца, и добавляем к ним те которые отфильтрованны (строки из redux)
    const mass = [
      ...props.isSamplePointsData,
      ...props.isChecked
        .filter((el) => el.itemKey === props.itemKey)
        .map((el) => el.value),
    ];
    const fd = [
      ...mass.filter((el) => {
        // Преобразовываем el в строку, если он является числом
        const elString = typeof el === "number" ? el.toString() : el;
        return elString?.toLowerCase().includes(searchText?.toLowerCase());
      }),
    ].sort((a, b) => {
      // Сортируем отфильтрованные данные по возрастанию
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    //! записываем только уникальные значения
    console.log("[...new Set(fd)]", [...new Set(fd)]);
    setFilteredData([...new Set(fd)]);
  }, [props.isSamplePointsData, searchText]);

  //! при нажатии на Input All
  const onAllChecked = () => {
    let checked = [...props.isChecked];
    if (
      [...props.isChecked].filter((el) => el.itemKey === props.itemKey)
        ?.length > 0
    ) {
      checked = checked.filter((el) => el.itemKey !== props.itemKey);
      dispatch(
        removeAllCheckeds({
          itemKey: props.itemKey,
        })
      );
    } else {
      //! записываем уникальные
      const uniqueItems = new Set();
      [...props.isSamplePointsData].forEach((item) => {
        const itemKey = {
          value: item,
          itemKey: props.itemKey,
        };
        if (!uniqueItems.has(JSON.stringify(itemKey))) {
          uniqueItems.add(JSON.stringify(itemKey));
          checked.push(itemKey);
        }
      });
      dispatch(
        addAllCheckeds({
          checked: checked,
        })
      );
    }
    const uniqueArray = [
      ...new Set(checked.map((item) => JSON.stringify(item))),
    ].map((item) => JSON.parse(item));
    props.setIsChecked(uniqueArray);
    // Фильтруем данные
    const fdfix = FilteredSample(
      props.workloadData,
      uniqueArray,
      props.sesionName
    );
    props.setWorkloadDataFix(fdfix);
  };
  //! при нажатии на Input
  const onChecked = (el) => {
    console.log("el", el, [...props.isChecked]);
    let checked = [...props.isChecked]; // основной массив
    if (
      checked.some(
        (item) => item.value === el && props.itemKey === item.itemKey
      )
    ) {
      checked = checked.filter((item) => item.value !== el);
      dispatch(
        removeChecked({
          value: el,
        })
      );
    } else {
      checked.push({ value: el, itemKey: props.itemKey });
      dispatch(
        addChecked({
          value: el,
          itemKey: props.itemKey,
        })
      );
    }
    const uniqueArray = [
      ...new Set(checked.map((item) => JSON.stringify(item))),
    ].map((item) => JSON.parse(item));
    props.setIsChecked(uniqueArray);
    // Фильтруем данные
    const fdfix = FilteredSample(
      props.workloadData,
      uniqueArray,
      props.sesionName
    );
    console.log("fdfix", fdfix);

    props.setWorkloadDataFix(fdfix);
  };

  const getText = (index, el) => {
    console.log("props.", props.isSamplePointsData);
    if (index === 0) {
      return index + 1;
    } else {
      if (el === "" || el === null || el === undefined) {
        return "___";
      } else {
        return el;
      }
    }
  };

  return (
    <main
      className={styles.SamplePoints}
      style={{
        marginLeft:
          props.actiwFilter === "itineraryOrder"
            ? "-50px"
            : props.actiwFilter === "comment"
            ? "126px"
            : props.actiwFilter === "legalEntity"
            ? "8px"
            : "0px",
      }}
      ref={spRef}
    >
      <div className={styles.container}>
        <div>
          <input
            className={styles.search}
            type="text"
            placeholder="Поиск"
            value={searchText}
            onChange={handleInputChange}
          />
          <div className={styles.points}>
            <div htmlFor="allCheckbox">
              <input
                id="allCheckbox"
                type="checkbox"
                onChange={onAllChecked}
                checked={
                  ![...props.isChecked].filter(
                    (el) => el.itemKey === props.itemKey
                  )?.length > 0
                }
              />
              <p>Все</p>
            </div>
            {filteredData.map((el, index) => {
              return (
                <div key={index} htmlFor={`checkbox-${index}`}>
                  <input
                    id={`checkbox-${index}`}
                    type="checkbox"
                    onChange={() => onChecked(el)}
                    checked={
                      !props.isChecked.some(
                        (item) =>
                          item.value === el && props.itemKey === item.itemKey
                      )
                    }
                  />
                  <p>{getText(props.index, el)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
