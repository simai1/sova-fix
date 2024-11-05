import { useContext } from "react";
import Layout from "../../../UI/Layout/Layout";
import Header from "../../../components/Header/Header";
import { Outlet } from "react-router-dom";
import DataContext from "../../../context";

function Equipment() {

    const context = useContext(DataContext);
    return ( 
        <div>
            <Layout>
                <Header/>
                <Outlet/>
            </Layout>
            </div>
     );
}

export default Equipment;