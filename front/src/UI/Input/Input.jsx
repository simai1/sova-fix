import React, { useState, useEffect } from "react";
import styles from "./Input.module.scss";
import DataContext from "../../context";

function Input({
  Textlabel,
  placeholder,
  handleInputChange,
  name,
  settextSearchTableData,
  value,
  regex,
  type="text"
}) {
  const [textInput, settextInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true); // new state variable to track first render
  const context = React.useContext(DataContext);
  const InputText = (e) => {
    settextInput(e.target.value);
    settextSearchTableData && settextSearchTableData(e.target.value);
    handleInputChange && handleInputChange(name, e.target.value);
  };

  useEffect(() => {
    if (!isFirstRender) { // skip validation on first render
      validateField();
    } else {
      setIsFirstRender(false); // set isFirstRender to false after first render
    }
  }, [textInput]);

  const validateField = () => {
    let tempErrors = {};

    if (regex && !regex.test(textInput)) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }

    setErrors(tempErrors);
  };

  return (
    <div className={styles.input}>
    {type!= "textArea" ?
      <div>
        {Textlabel && (
          <div>
            <label>{Textlabel}</label>
            {errors['required'] && <div className={styles.error}>{errors['required']}</div>}
          </div>
        )}
        <input
          onChange={(e) => InputText(e)}
          placeholder={placeholder}
          value={value }
          type={type}
          style={isValid ? {} : {border: '1px solid red'}}
          maxLength={75}

        />
      </div>
      :
      <div className={styles.textarea}>
        {Textlabel && (
          <div className={styles.labeltextarea}>
            <label>{Textlabel}</label>
            {errors['required'] && <div className={styles.error}>{errors['required']}</div>}
          </div>
        )}
        <textarea
          onChange={(e) => InputText(e)}
          placeholder={placeholder}
          value={value}
          type={type}
          style={isValid ? {} : {border: '1px solid red'}}
          maxLength={300}
        />
      </div>
    }
     
    </div>
  );
}

export default Input;
