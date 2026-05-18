import React, { useEffect, useState } from "react";
import styles from "./ListInputTOForm.module.scss";
import DataContext from "../../context";

function ListInputTOForm(props) {
  const { context } = React.useContext(DataContext);
  const [valueName, setValueName] = useState(null);
  useEffect(()=>{
    setValueName(
      props.dataList.find((item) => item.id === props.value)?.name || ""
    )
  },[ props.dataList, props.value])
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const filteredList = props.dataList.filter((item) =>
    item.name.toLowerCase().includes(valueName.toLowerCase())
  );

  const handleInputChange = (e) => {
    setValueName(e.target.value);
    setDropdownVisible(true);
  };

  const selectSuggestion = (item) => {
    props.handleListData(props.name, item.id);
    setValueName(item.name);
    setDropdownVisible(false); // Скрыть подсказки после выбора
  };

  const handleBlur = () => {
    setTimeout(() => {
      const matchedItem = props.dataList.find(
        (item) => item.name.toLowerCase() === valueName.toLowerCase()
      );

      if (!matchedItem) {
        setValueName("");
        props.handleListData(props.name, null);
      }

      setDropdownVisible(false);
    }, 100);
  };

 
  return (
    <div className={styles.ListInputTOForm}>
      {props.Textlabel && <label>{props.Textlabel}</label>}

      <div className={styles.ListCont}>
        <input
          type="text"
          value={valueName}
          onChange={handleInputChange}
          onFocus={() => setDropdownVisible(true)}
          onBlur={handleBlur}
          placeholder={props?.placeholder}
          style={{
            borderRadius:
              isDropdownVisible && filteredList.length ? "5px 5px 0 0" : "5px",
            width: props?.width,
          }}
        />

        {isDropdownVisible && (
          <div className={styles.ListData}>
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <p
                  key={item.id}
                  className={styles.NameForList}
                  onMouseDown={() => selectSuggestion(item)}
                >
                  {item.name}
                </p>
              ))
            ) : (
              <p className={styles.noResults}>Ничего не найдено</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListInputTOForm;
