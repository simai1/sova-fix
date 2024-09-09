import React, { useEffect } from "react";
import styles from "./HomePageAdmin.module.scss";
import Table from "../../../components/Table/Table";
import DataContext from "../../../context";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";
import PopUpCreateUser from "../../../components/PopUp/PopUpCreateUser/PopUpCreateUser";
import PopUpGoodMessage from "../../../UI/PopUpGoodMessage/PopUpGoodMessage";
import PageCardContractors from "../PageCardContractors/PageCardContractors";
import PopUpEditAppoint from "../../../components/PopUp/PopUpEditAppoint/PopUpEditAppoint";
import { PopUpError } from "../../../UI/PopUpError/PopUpError";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";
function HomePageAdmin() {
  const { context } = React.useContext(DataContext);
  return (
    <div className={styles.HomePage}>
     <Layout>
      <Header />
      {context.selectPage === "Main" ? 
        <>
          <FunctionTableTop />
          <div className={styles.Table} >
            <Table />
          </div>
        </>:
        <>
          <PageCardContractors/>
        </>
      }
    </Layout>
    
      {context.popUp === "PopUpError" && <PopUpError />}
      {context.popUp === "PopUpEditAppoint" && <PopUpEditAppoint />}
      {context.popUp === "PopUpCreateUser" && <PopUpCreateUser />}
      {context.popUp === "PopUpGoodMessage" && <PopUpGoodMessage />}
    </div>
  );
}

export default HomePageAdmin;
