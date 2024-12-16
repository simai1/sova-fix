import { useContext, useEffect, useState } from "react";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { tableList } from "./CardPageModuleData";
import DataContext from "../../context";
import { GetContractorsItenerarity } from "../../API/API";
import { funFixEducator } from "../../UI/SamplePoints/Function";
import ClearImg from "./../../assets/images/ClearFilter.svg"
import { useDispatch } from "react-redux";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import styles from "./CardPageModule.module.scss";
function CardPageModule() {
    const [tableDataEntries, setTableDataEntries] = useState([]);
    const { context } = useContext(DataContext);
    const dispatch = useDispatch();
    useEffect(() => {
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
        <div className={styles.BusinessUnitReferenceTopTitle}>
            <div>
            <p style={{fontSize:"24px", margin:"0px"}}>Маршрутный лист</p>
          </div>
          <div className={styles.clear}>
            <button onClick={() => dispatch(resetFilters({tableName: "table8"}))} ><img src={ClearImg} /></button>
          </div>
        </div>
            <UniversalTable FilterFlag={true} top={90} tableName="table8"  tableHeader={tableList} tableBody={tableDataEntries} selectFlag={false} updateTable={getData}/>
       </div>
     );
}

export default CardPageModule;