import React from "react";
import styles from "./HomePageAdmin.module.scss";
import Table from "../../../components/Table/Table";
import DataContext from "../../../context";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";
import PopUpCreateUser from "../../../components/PopUp/PopUpCreateUser/PopUpCreateUser";
import PopUpGoodMessage from "../../../UI/PopUpGoodMessage/PopUpGoodMessage";
import PopUpEditAppoint from "../../../components/PopUp/PopUpEditAppoint/PopUpEditAppoint";
import { PopUpError } from "../../../UI/PopUpError/PopUpError";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";
import PhoneDataVizulizer from "../../../components/PhoneDataVizulizer/PhoneDataVizulizer";
function HomePageAdmin() {
  const { context } = React.useContext(DataContext);
  return (
    <div className={styles.HomePage}>
     <Layout>
      <Header />
        <>
        <div className={styles.TableTop}>
          <FunctionTableTop />
        </div>
          <div className={styles.Table} >
            <Table />
          </div>
        </>
      <div className={styles.PhoneData}>
      <div className={styles.Search}>
        <input type="text" placeholder="Поиск" onChange={(e) => context.setextSearchTableDataPhone(e.target.value)}/>
      </div>
      <PhoneDataVizulizer/>
    </div>
    </Layout>
  
    
      {context.popUp === "PopUpError" && <PopUpError />}
      {context.popUp === "PopUpEditAppoint" && <PopUpEditAppoint />}
      {context.popUp === "PopUpCreateUser" && <PopUpCreateUser />}
      {context.popUp === "PopUpGoodMessage" && <PopUpGoodMessage />}
    </div>
  );
}

export default HomePageAdmin;
