import React, { useEffect } from "react";
import styles from "./HomePageAdmin.module.scss";
import Table from "../../../components/Table/Table";
import DataContext from "../../../context";
import PopUpEditAppoint from "../../../components/PopUp/PopUpEditAppoint/PopUpEditAppoint";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";
function HomePageAdmin() {
  const { context } = React.useContext(DataContext);
  return (
    <div className={styles.HomePage}>
      <FunctionTableTop />
      <div className={styles.Table}>
        <Table />
      </div>
      {context.popUp === "PopUpEditAppoint" && <PopUpEditAppoint />}
    </div>
  );
}

export default HomePageAdmin;
