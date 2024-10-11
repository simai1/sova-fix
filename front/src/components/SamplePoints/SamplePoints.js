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
      dispatch(setChecked({ tableName: props.tableName, checked: [] }));
    } else {
      const bd = [...props.basickData].map((el) => ({
        itemKey: props.itemKey,
        value: el[props.itemKey],
      }));
      dispatch(
        setChecked({
          tableName: props.tableName,
          checked: bd,
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
    console.log('fd', fd)
    setFiltredPunkts(fd);
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
