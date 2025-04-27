import { useContext } from "react";
import Layout from "../../../UI/Layout/Layout";
import Header from "../../../components/Header/Header";
import { Outlet } from "react-router-dom";
import DataContext from "../../../context";
import PopUpNewTO from "../../../components/PopUp/PopUpNewTO/PopUpNewTO";
import { PopUpError } from "../../../UI/PopUpError/PopUpError";
import PopUpGoodMessage from "../../../UI/PopUpGoodMessage/PopUpGoodMessage";
import PopUpNewTOCategory from "../../../components/PopUp/Category/PopUpNewTOCategory/PopUpNewTOCategory";
import CreateCategory from "../../../components/PopUp/Category/CreateCategory/CreateCategory";
import CreateNomenclature from "../../../components/PopUp/Nomenclature/CreateNomenclature/CreateNomenclature";
import PopUpDeleteNomeclature from "../../../components/PopUp/Nomenclature/PopUpDeleteNomeclature/PopUpDeleteNomeclature";
import PopUpEditTOCategory from "../../../components/PopUp/Category/PopUpEditTOCategory/PopUpEditTOCategory";
import EditNomenclature from "../../../components/PopUp/Nomenclature/EditNomenclature/EditNomenclature";
import PopUpDeleteCategory from "../../../components/PopUp/Category/PopUpDeleteCategory/PopUpDeleteCategory";
import PopUpNewEquipment from "../../../components/PopUp/Equipment/PopUpNewEquipment/PopUpNewEquipment";
import PopUpDeleteEquipment from "../../../components/PopUp/Equipment/PopUpDeleteEquipment/PopUpDeleteEquipment";
import PopUpEditEquipment from "../../../components/PopUp/Equipment/PopUpEditEquipment/PopUpEditEquipment";
import PopUpToGraphic from "../../../components/PopUp/PopUpToGraphic/PopUpToGraphic";
import PopUpToCopy from "../../../components/PopUp/PopUpToCopy/PopUpToCopy";

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
            {context.popUp === "CreateNomenclature" && <CreateNomenclature />}
            {context.popUp === "PopUpDeleteNomeclature" && <PopUpDeleteNomeclature />}
            {context.popUp === "PopUpEditTOCategory" && <PopUpEditTOCategory />}
            {context.popUp === "EditNomenclature" && <EditNomenclature />}
            {context.popUp === "PopUpDeleteCategory" && <PopUpDeleteCategory />}
            {context.popUp === "PopUpEditEquipment" && <PopUpEditEquipment />}
            {context.popUp === "PopUpToGraphic" && <PopUpToGraphic />}
            {context.popUp === "PopUpToCopy" && <PopUpToCopy />}
        </div>
     );
}



export default Equipment;