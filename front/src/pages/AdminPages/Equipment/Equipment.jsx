import { useContext } from "react";
import Layout from "../../../UI/Layout/Layout";
import Header from "../../../components/Header/Header";
import { Outlet } from "react-router-dom";
import DataContext from "../../../context";
import PopUpNewTO from "../../../components/PopUp/PopUpNewTO/PopUpNewTO";
import PopUpNewTOCategory from "../../../components/PopUp/PopUpNewTOCategory/PopUpNewTOCategory";

function Equipment() {

    const { context } = useContext(DataContext);

    return ( 
        <div>
            <Layout>
                <Header/>
                <Outlet/>
            </Layout>
            {context.popUp === "PopUpNewTO" && <PopUpNewTO />}
            {context.popUp === "PopUpNewTOCategory" && <PopUpNewTOCategory />}
        </div>
            
     );
     
}



export default Equipment;