import { useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { setChecked } from "../../store/samplePoints/samplePoits";

function SamplePoints(props) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const [filtredPunkts, setFiltredPunkts] = useState([]);

  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );

  const funLiCkick = (el) => {
    if (
      store?.find((elem) => elem.value === el && elem.itemKey === props.itemKey)
    ) {
      let c = [...store];
      c = c.filter(
        (elem) => elem.itemKey !== props.itemKey || elem.value !== el
      );
      dispatch(setChecked({ tableName: props.tableName, checked: c }));
    } else {
      dispatch(
        setChecked({
          tableName: props.tableName,
          checked: [...store, { itemKey: props.itemKey, value: el }],
        })
      );
    }
  };

  const funLiCkickAll = () => {
    if (store?.find((elem) => elem.itemKey === props.itemKey)) {
      const checked = store.filter((elem) => elem.itemKey !== props.itemKey);
      dispatch(setChecked({ tableName: props.tableName, checked: checked }));
    } else {
      const bd = [...props.tableBodyData].map((el) => ({
        itemKey: props.itemKey,
        value: el[props.itemKey],
      }));
      dispatch(
        setChecked({
          tableName: props.tableName,
          checked: [...store, ...bd],
        })
      );
    }
  };

  const getChecked = (el) => {
    const flag = store?.find(
      (ell) => ell.itemKey === props.itemKey && ell.value === el
    );
    return !flag;
  };

  const getCheckedAll = () => {
    const flag = store?.find((ell) => ell.itemKey === props.itemKey);
    return !flag;
  };

  useEffect(() => {
    const uniquePunkts = Array.from(new Set(props.punkts));
    const fd = uniquePunkts.filter((el) => {
      if (typeof el !== "boolean") {
        const elString = typeof el === "number" ? el.toString() : el;
        return elString?.toLowerCase().includes(search?.toLowerCase());
      }
    });
  
    // Function to parse custom date format "dd.MM.yy"
    const parseDate = (dateString) => {
      const parts = dateString.split(".");
      // Check if the date is in the correct format (dd.MM.yy)
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JavaScript
        const year = parseInt(parts[2], 10) + 2000; // Assuming the year is in 21st century
        return new Date(year, month, day);
      }
      return null; // Return null if the date is invalid
    };
  
    // Sorting logic
    const sortedFd = fd.sort((a, b) => {
      const dateA = parseDate(a);
      const dateB = parseDate(b);
  
      if (dateA && dateB) {
        // Both are valid dates, sort from newest to oldest
        return dateB - dateA; // Change the order for newest to oldest
      } else if (typeof a === "number" && typeof b === "number") {
        // Both are numbers
        return a - b; // Sort numbers in ascending order
      } else {
        // Default to string comparison
        return a.toString().localeCompare(b.toString());
      }
    });
  
    console.log("sortedFd", sortedFd);
    setFiltredPunkts(sortedFd);
  }, [search, props.punkts]);
  

  return (
    <div className={styles.SamplePoints}>
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(el) => setSearch(el.target.value)}
          className={styles.inputLabel}
        />
      </div>
      <ul>
        <li key={"all"} onClick={funLiCkickAll}>
          <input type="checkbox" checked={getCheckedAll()} />
          <p>Все</p>
        </li>
        {filtredPunkts?.map((el, index) => (
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
