import { Outlet } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";

function Directory() {
    return ( 
            <Layout>
                <Header/>
                <Outlet/>
            </Layout>
     );
}

export default Directory;