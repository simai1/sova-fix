import React, { useState } from "react";
import styles from "./ListInput.module.scss";
import DataContext from "../../context";
import { SetExtContractorsRequest, SetcontractorRequest } from "../../API/API";

function ListInput(props) {
  const { context } = React.useContext(DataContext);
  const [valueName, setValueName] = useState(props.value);

  const addClient = (el) => {
    if(props?.name === "builder"){
      SetExp(el.id)
    }else if(props?.name === "contractorId"){
      setStatus(el.id)
    }else{
      props.handleListData(props.name, el.id);
      setValueName(el.name);
      props.toggleDropdown(); // Close the dropdown after selection
    }
  };

  const setPerformersDirectory = () => {
    const data = {
      requestId: props?.idRequest,
      contractorId: "Внешний подрядчик",
    };

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        props.updGetData(props?.idRequest);
        props.toggleDropdown();
      }
    });
  };

  const setStatus = (id) => {
    const data = {
      requestId: props?.idRequest,
      contractorId: id,
    };
    console.log("data", data)

    SetcontractorRequest(data).then((resp) => {
      if (resp?.status === 200) {
        props.updGetData(props?.idRequest);
        props.toggleDropdown();
      }
    });
  };

  const SetExp = (ExpId) => {
    console.log("builder", ExpId)
    const data = {
      requestId: props?.idRequest,
      extContractorId: ExpId,
    };
    console.log("data", data)
    SetExtContractorsRequest(data).then((resp) => {
      if (resp?.status === 200) {
        props.updGetData(props?.idRequest);
        props.toggleDropdown();
      }
    });
  };

  return (
    <div className={styles.List}>
      <div>
        {props.Textlabel && (
          <div>
            <label>{props.Textlabel}</label>
          </div>
        )}
        <div className={styles.ListCont}>
          <input
            readOnly
            onClick={props.toggleDropdown} // Toggle dropdown on click
            value={props.dataList.find((el) => el.id === props.value)?.name || props.value}
            placeholder={props?.placeholder}
            style={props.isActive ? {borderRadius: "5px 5px 0 0"} : null}
          />
          <span
            onClick={props.toggleDropdown}
            className={styles.arrowBot}
          >
            <img
              style={{
                transform: props.isActive ? "rotate(0deg)" : "rotate(-90deg)",
              }}
              src="./img/arrow_bottom.svg"
            />
          </span>
        </div>
        {props.isActive && (
          <div className={styles.ListData}>
            {props.dataList.map((item) => (
              <p
                className={styles.NameForList}
                onClick={() => addClient(item)}
                key={item.id}
              >
                {item.name}
              </p>
            ))}

            {props.name === "contractorId" &&
              <p className={styles.NameForList} style={{marginLeft: "8px"}} onClick={() =>setPerformersDirectory()}>Внешний подрядчик</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default ListInput;
