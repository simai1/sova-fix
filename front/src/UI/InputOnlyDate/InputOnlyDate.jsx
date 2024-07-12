import styles from "./InputOnlyDate.module.scss";

function InputOnlyDate({ name, handleInputChange,Textlabel,value }) {
  const inpChange = (e) => {
    handleInputChange(name, e.target.value);
  };
  return (
    <div className={styles.inputTime}>
      <div className={styles.inputDate}>
        {Textlabel && (
          <div>
            <label>{Textlabel}</label>
          </div>
        )}
        <div>
          <input onChange={inpChange} type="date" value={value}/>
        </div>
      </div>
    </div>
  );
}
export default InputOnlyDate;
