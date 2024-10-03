import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { tableList } from "./CardPageModuleData";
import DataContext from "../../context";
import { GetContractorsItenerarity } from "../../API/API";
import { funFixEducator } from "../../UI/SamplePoints/Function";

function CardPageModule() {
    const [tableDataEntries, setTableDataEntries] = useState([]);
    const { context } = useContext(DataContext);

    useEffect(() => {
        console.log(context.selectContructor)
        getData()
    }, []);

    const getData = () => {
        GetContractorsItenerarity(context.selectContructor).then((resp) => {
            if(resp?.status === 200){
                setTableDataEntries(funFixEducator(resp?.data));
            }
        })
    };
    return ( 
       <div>
        <div>
            <h2>Маршрутный лист</h2>
        </div>
            <UniversalTable tableName="table8"  tableHeader={tableList} tableBody={tableDataEntries} selectFlag={false} updateTable={getData}/>
       </div>
     );
}

export default CardPageModule;