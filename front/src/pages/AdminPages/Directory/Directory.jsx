import { Outlet } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";
import DataContext from "../../../context";
import { useContext } from "react";
import UneversalDelete from "../../../components/UneversalDelete/UneversalDelete";
import { PopUpError } from "../../../UI/PopUpError/PopUpError";
import PopUpGoodMessage from "../../../UI/PopUpGoodMessage/PopUpGoodMessage";


function Directory() {

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

export default Directory;