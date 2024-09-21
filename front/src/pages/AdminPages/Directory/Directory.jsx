import { Outlet } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";
import DataContext from "../../../context";
import { useContext } from "react";
import UneversalDelete from "../../../components/UneversalDelete/UneversalDelete";

function Directory() {

    const context = useContext(DataContext);
    return ( 
            <Layout>
                <Header/>
                <Outlet/>
            </Layout>
     );
}

export default Directory;