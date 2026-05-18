import { useContext, useEffect, useState } from "react";
import styles from "./SamplePoints.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { dropFilters, setChecked, setFilters } from "../../store/samplePoints/samplePoits";
import DataContext from "../../context";

function SamplePoints(props) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const [filtredPunkts, setFiltredPunkts] = useState([]);
  const {context} = useContext(DataContext);

  const store = useSelector(
    (state) => state.isSamplePoints[props.tableName].isChecked
  );

  const funLiCkick = (el) => {
 
    if(props.tableName === "table9"){
        dispatch(setFilters({ tableName: props.tableName, filter: el, key: props.itemKey }))
    }
    if(props.tableName !== "table9"){
      context.UpdateTableReguest()
    }
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
      dispatch(setChecked({ tableName: props.tableName, checked }));
      dispatch(dropFilters({ tableName: props.tableName }));
    } else {
      const bd = [...props.tableBodyData].map((el) => {
        const isContractorEmpty = props.itemKey === 'contractor' && el.contractor === '___';
  
        if (isContractorEmpty && (el.contractorManager === 'Внешний подрядчик' || el.contractorManager === 'Укажите подрядчика')) {
          return {
            itemKey: null,
            value: null
          };
        }
  
        let rawValue = isContractorEmpty ? el.contractorManager : el[props.itemKey];
  
        if (props.itemKey === 'status') {
          const statusObj = context?.statusList?.find((status) => status.number === rawValue);
          rawValue = statusObj ? statusObj.name : rawValue;
        } else if (typeof rawValue === 'object' && rawValue !== null) {
          rawValue = rawValue.name;
        }
  
        return {
          itemKey: props.itemKey,
          value: rawValue
        };
      });
  
      if (props.itemKey === 'contractor') {
        bd.push({ itemKey: props.itemKey, value: "Внешний подрядчик" });
        bd.push({ itemKey: props.itemKey, value: "Укажите подрядчика" });
      }
  
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
    const fd = Array.from(
      new Set(
        uniquePunkts
          .map((el) => (typeof el === "object" && el !== null ? el.name : el))
          .filter(
            (name) =>
              typeof name === "string" &&
              name !== "___" && // исключаем "___"
              name !== 'null' &&
              name.toLowerCase().includes(search?.toLowerCase())
          )
      )
    );
  
    const parseDate = (dateString) => {
      if (typeof dateString !== "string") {
        return null;
      }

      const parts = dateString.split(".");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10) + 2000;
        return new Date(year, month, day);
      }

      return null;
    };

    const sortedFd = fd.sort((a, b) => {
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (dateA && dateB) {
        return dateB - dateA;
      } else if (dateA) {
        return -1;
      } else if (dateB) {
        return 1;
      } else if (typeof a === "number" && typeof b === "number") {
        return a - b;
      } else {
        return a.toString().localeCompare(b.toString());
      }
    });
    
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