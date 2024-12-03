import { useContext } from "react";
import Layout from "../../../UI/Layout/Layout";
import Header from "../../../components/Header/Header";
import { Outlet } from "react-router-dom";
import DataContext from "../../../context";
import PopUpNewTO from "../../../components/PopUp/PopUpNewTO/PopUpNewTO";
import PopUpNewEquipment from "../../../components/PopUp/PopUpNewEquipment/PopUpNewEquipment";
import { PopUpError } from "../../../UI/PopUpError/PopUpError";
import PopUpDeleteEquipment from "../../../components/PopUp/PopUpDeleteEquipment/PopUpDeleteEquipment";
import PopUpGoodMessage from "../../../UI/PopUpGoodMessage/PopUpGoodMessage";
import PopUpNewTOCategory from "../../../components/PopUp/Category/PopUpNewTOCategory/PopUpNewTOCategory";
import CreateCategory from "../../../components/PopUp/Category/CreateCategory/CreateCategory";

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
            {context.popUp === "PopUpNewEquipment" && <PopUpNewEquipment />}
            {context.popUp === "PopUpError" && <PopUpError />}
            {context.popUp === "PopUpDeleteEquipment" && <PopUpDeleteEquipment />}
            {context.popUp === "PopUpGoodMessage" && <PopUpGoodMessage />}
            {context.popUp === "CreateCategory" && <CreateCategory />}

        </div>
     );
}



export default Equipment;