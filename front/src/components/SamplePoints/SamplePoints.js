import { useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { setChecked } from "../../store/samplePoints/samplePoits";

function SamplePoints(props) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const [filtredPunkts, setFiltredPunkts] = useState(props.punkts || []);

  useEffect(() => {
    console.log("filtredPunkts", filtredPunkts);
  }, [filtredPunkts]);

  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );
  console.log("store", store);
  //! при клике на Li переключается состояние checkedAll
  const funLiCkick = (el) => {
    //! если в массиве есть уже это значение то удаляем его если нет добавляем
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

  //! функция которая проверяет есть ли в checkedAll данное значенее чтобы отображать активность инпута
  const getChecked = (el) => {
    const flag = store?.find(
      (ell) => ell.itemKey === props.itemKey && ell.value === el
    );
    if (flag) {
      return false;
    } else {
      return true;
    }
  };

  useEffect(() => {
    console.log("props.punkts", props.punkts);
    const fd = [
      ...props.punkts.filter((el) => {
        const elString = typeof el === "number" ? el.toString() : el;
        return elString?.toLowerCase().includes(search?.toLowerCase());
      }),
    ];
    console.log("fd", fd);
    setFiltredPunkts(fd);
  }, [search]);

  return (
    <div className={styles.SamplePoints}>
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(el) => setSearch(el.target.value)}
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
