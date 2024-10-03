import { useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { setChecked } from "../../store/samplePoints/samplePoits";

function SamplePoints(props) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const [filtredPunkts, setFiltredPunkts] = useState([]);

  useEffect(() => {
    console.log("filtredPunkts", filtredPunkts);
  }, [filtredPunkts]);

  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );
  console.log("store", store);

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

  const getChecked = (el) => {
    const flag = store?.find(
      (ell) => ell.itemKey === props.itemKey && ell.value === el
    );
    return !flag;
  };

  useEffect(() => {
    console.log("props.punkts", props.punkts);
    const uniquePunkts = Array.from(new Set(props.punkts));
    const fd = uniquePunkts.filter((el) => {
      const elString = typeof el === "number" ? el.toString() : el;
      return elString?.toLowerCase().includes(search?.toLowerCase());
    });
    console.log("fd", fd);
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
