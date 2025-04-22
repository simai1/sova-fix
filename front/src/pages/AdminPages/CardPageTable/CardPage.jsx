import { Outlet } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Layout from "../../../UI/Layout/Layout";
import DataContext from "../../../context";
import { useContext } from "react";


function CardPage() {

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

export default CardPage;