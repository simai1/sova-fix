import React from "react";
import styles from "./ErrorAuth.module.scss";
import DataContext from "../../../context";


function ErrorAuth() {
  const { context } = React.useContext(DataContext);

  return (
    <div className={styles.ErrorAuth}>
        <p>Упс, что-то пошло не так!</p>
    </div>
  );
}

export default ErrorAuth;
