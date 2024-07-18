import React, { useState, useEffect } from "react";
import styles from "./Input.module.scss";

function Input({
  Textlabel,
  placeholder,
  handleInputChange,
  name,
  settextSearchTableData,
  value,
  regex,
  type="text",
  setInputValidity // new prop to set input validity
}) {
  const [textInput, settextInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const InputText = (e) => {
    settextInput(e.target.value);
    settextSearchTableData && settextSearchTableData(e.target.value);
    handleInputChange && handleInputChange(name, e.target.value);
  };

  useEffect(() => {
    if (!isFirstRender) {
      validateField();
    } else {
      setIsFirstRender(false);
    }
  }, [textInput]);

  const validateField = () => {
    let tempErrors = {};

    if (regex && !regex.test(textInput)) {
      setIsValid(false);
      setInputValidity(name, false); // update parent with invalid state
    } else {
      setIsValid(true);
      setInputValidity(name, true); // update parent with valid state
    }

    setErrors(tempErrors);
  };

  return (
    <div className={styles.input}>
      {type !== "textArea" ? (
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
            value={value}
            type={type}
            style={isValid ? {} : {border: '1px solid red'}}
          />
        </div>
      ) : (
        <div className={styles.textarea}>
          {Textlabel && (
            <div>
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
          />
        </div>
      )}
    </div>
  );
}

export default Input;
