import { useContext, useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { setChecked } from "../../store/samplePoints/samplePoits";
import DataContext from "../../context";

function SamplePoints(props) {
  const [search, setSearch] = useState(""); // Строка поиска
  const [filtredPunkts, setFiltredPunkts] = useState([]); // Отфильтрованные пункты
  const dispatch = useDispatch();
  const { context } = useContext(DataContext);

  // Получаем состояние чекбоксов из Redux
  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName]?.isChecked || []
  );

  // Обработка клика по пункту
  const funLiCkick = (el) => {
    context.UpdateTableReguest();
    context.setFlagFilter(true);

    if (
      store?.find((elem) => elem.value === el && elem.itemKey === props.itemKey)
    ) {
      // Убираем элемент из выбранных
      const updatedStore = store.filter(
        (elem) => elem.itemKey !== props.itemKey || elem.value !== el
      );
      dispatch(setChecked({ tableName: props.tableName, checked: updatedStore }));
    } else {
      // Добавляем новый элемент в выбранные
      dispatch(
        setChecked({
          tableName: props.tableName,
          checked: [...store, { itemKey: props.itemKey, value: el }],
        })
      );
    }
  };

  // Обработка клика "Выбрать все"
  const funLiCkickAll = () => {
    if (store?.find((elem) => elem.itemKey === props.itemKey)) {
      // Сброс всех выбранных
      const updatedStore = store.filter((elem) => elem.itemKey !== props.itemKey);
      dispatch(setChecked({ tableName: props.tableName, checked: updatedStore }));
    } else {
      // Добавление всех пунктов в выбранные
      const allItems = props.tableBodyData.map((el) => ({
        itemKey: props.itemKey,
        value: el[props.itemKey],
      }));
      dispatch(
        setChecked({
          tableName: props.tableName,
          checked: [...store, ...allItems],
        })
      );
    }
  };

  // Проверка, выбран ли элемент
  const getChecked = (el) => {
    return !store?.find(
      (elem) => elem.itemKey === props.itemKey && elem.value === el
    );
  };

  // Проверка, выбраны ли все элементы
  const getCheckedAll = () => {
    return !store?.find((elem) => elem.itemKey === props.itemKey);
  };

  // Фильтрация и сортировка данных
  useEffect(() => {
    if (!props.tableBodyData || props.tableBodyData.length === 0) return;

    const uniquePunkts = Array.from(
      new Set(props.tableBodyData.map((item) => item[props.itemKey]))
    );

    // Фильтрация данных по строке поиска
    const filteredData = uniquePunkts.filter((el) => {
      if (typeof el !== "boolean") {
        const elString = typeof el === "number" ? el.toString() : el;
        return elString?.toLowerCase().includes(search?.toLowerCase());
      }
      return false;
    });

    // Парсинг даты для сортировки (формат "dd.MM.yy")
    const parseDate = (dateString) => {
      if (typeof dateString !== "string") return null;
      const parts = dateString.split(".");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Месяцы 0-индексные
        const year = parseInt(parts[2], 10) + 2000; // Предполагаем 21 век
        return new Date(year, month, day);
      }
      return null;
    };

    // Сортировка
    const sortedData = filteredData.sort((a, b) => {
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (dateA && dateB) {
        return dateB - dateA; // Новейшие даты выше
      } else if (dateA) {
        return -1; // Даты имеют приоритет
      } else if (dateB) {
        return 1;
      } else if (typeof a === "number" && typeof b === "number") {
        return a - b; // Сортировка чисел по возрастанию
      } else {
        return a.toString().localeCompare(b.toString());
      }
    });

    setFiltredPunkts(sortedData); // Устанавливаем отфильтрованные и отсортированные данные
  }, [search, props.tableBodyData, props.itemKey]);

  return (
    <div className={styles.SamplePoints}>
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.inputLabel}
        />
      </div>
      <ul>
        <li key={"all"} onClick={funLiCkickAll}>
          <input type="checkbox" checked={getCheckedAll()} />
          <p>Все</p>
        </li>
        {filtredPunkts.map((el, index) => (
          <li key={index} onClick={() => funLiCkick(el)}>
            <input type="checkbox" checked={getChecked(el)} />
            <p>{el}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SamplePoints;
