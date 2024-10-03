import { useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { setChecked } from "../../store/samplePoints/samplePoits";

function SamplePoints(props) {
  const dispatch = useDispatch();
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

  return (
    <div className={styles.SamplePoints}>
      <ul>
        {props.punkts.map((el, index) => (
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
