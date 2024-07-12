import React, { useEffect } from "react";
import styles from "./HomePageAdmin.module.scss";
import Table from "../../../components/Table/Table";
import HeadMenu from "../../../components/HeadMenu/HeadMenu";
import DataContext from "../../../context";
import PopUpNewClient from "../../../components/PopUp/PopUpNewClient/PopUpNewClient";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";
function HomePageAdmin() {
  const { context } = React.useContext(DataContext);

  const TableName = [
    {
      id: 1,
      name: "Заказы",
    },
    {
      id: 2,
      name: "Карта",
    }
  ];
  return (
    <div className={styles.HomePage}>
      {/* <Header /> */}
      {/* <HeadMenu
        state={"home"}
        setFiltredData={context.setTableData}
        filtredData={context.tableData}
      /> */}
      <FunctionTableTop TableName={TableName} />
      <div className={styles.Table}>
        <Table />
      </div>
      {context.popUp === "PopUpNewClient" && <PopUpNewClient />}
      
    </div>
  );
}

export default HomePageAdmin;
