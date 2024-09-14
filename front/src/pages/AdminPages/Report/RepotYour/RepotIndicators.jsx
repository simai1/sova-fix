import { useContext, useEffect, useState } from "react";
import Layout from "../../../../UI/Layout/Layout";
import UneversalList from "../../../../UI/UneversalList/UneversalList";
import FunctionReportTop from "../../../../components/FunctionReportTop/FunctionReportTop";
import Header from "../../../../components/Header/Header";
import UniversalTable from "../../../../components/UniversalTable/UniversalTable";
import { DataList } from "../ReportFinansing/ReportFinansingData";
import styles from "./RepotIndicators.module.scss";
import DataContext from "../../../../context";
import { funFixEducator } from "../../../../UI/SamplePoints/Function";
import { tableHeadIndicators } from "./RepotIndicatorsDaat";
import UniversalDashbordSrochn from "../../../../components/UniversalDashbord/UniversalDashbordSrochn";
import UniversalDashbordStatus from "../../../../components/UniversalDashbord/UniversalDashbordStatus";
import UniversalDashboardStatus from "../../../../components/UniversalDashbord/UniversalDashbordStatus";
function RepotIndicators() {
    
    const { context } = useContext(DataContext);
    const [tableDataIndicators, setTableDataIndicators] = useState([]);
    const [valueName, setValueName] = useState("");
    const [vidView, setVidView] = useState("Таблица");
    const [vidViewChange, setVidViewChange] = useState(false);


    useEffect(() => {
        setTableDataIndicators(funFixEducator(context.dataApointment));
    }, [context.dataApointment]);

    const refreshFilters = () => {
        setValueName("")
    };

    return ( 
        <div className={styles.RepotYour}>
        <Layout>
            <Header/>
            <div>
                    <h2>Показатели</h2>
                    <div className={styles.ReportFinansingList}>
                        <div className={styles.ReportFinansingListInner}>
                            <UneversalList dataList={DataList} placeholder="Период..." value="" setValueName={setValueName} valueName={valueName}/>
                            <div className={styles.dropFilter} onClick={refreshFilters} title="нажмите для сброса фильтров"><img src="./img/ClearFilter.svg"/></div>
                        </div>
                        <div className={styles.ReportFinansingvidView}>
                            <p>Визуализация отчета:</p>
                            <div>
                                <input placeholder="" value={vidView} onClick={()=>setVidViewChange(!vidViewChange)} className={styles.ReportFinansingvidViewInput} readOnly/>
                                    <span
                                        onClick={() => setVidView(!vidView)}
                                        className={styles.arrowBot}
                                    >
                                        <img
                                        style={{
                                            transform: !vidViewChange ? "rotate(-90deg)" : "rotate(0deg)",
                                        }}
                                        src="./img/arrow_bottom.svg"
                                        />
                                    </span>
                                {vidViewChange && 
                                    <div className={styles.ReportFinansingvidViewList}>
                                        <ul>
                                            <li onClick={()=>{setVidView("Таблица"); setVidViewChange(false)}}>Таблица</li>
                                            <li onClick={()=>{setVidView("Графики"); setVidViewChange(false)}}>Графики</li>
                                        </ul>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <FunctionReportTop dataTable={tableDataIndicators}/>
                    {vidView === "Таблица" ?
                    <UniversalTable tableHeader={tableHeadIndicators} tableBody={tableDataIndicators}/>
                    :
                     <div className={styles.ReportIndicatorsDashbord}>
                        <div>
                            <UniversalDashboardStatus dataDashbord={tableDataIndicators}/>
                        </div>
                        <div >
                            <UniversalDashbordSrochn dataDashbord={tableDataIndicators}/>
                        </div>
                    </div>
                    }
                </div>
        </Layout>
       
        </div>
     );
}

export default RepotIndicators;