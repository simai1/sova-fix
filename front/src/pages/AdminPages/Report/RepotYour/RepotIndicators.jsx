import { useContext, useEffect, useRef, useState } from "react";
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
import { sortDataTable } from "../functionSort/functionSort";

function RepotIndicators() {
    const { context } = useContext(DataContext);
    const [tableDataIndicators, setTableDataIndicators] = useState([]);
    const [tableDataIndicatorsSort, setTableDataIndicatorsSort] = useState([]);
    const [valueName, setValueName] = useState("Все время");
    const [vidView, setVidView] = useState("Таблица");
    const [vidViewChange, setVidViewChange] = useState(false);
    const dropdownRef = useRef(null); // Create a ref for the dropdown
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        setTableDataIndicators(funFixEducator(context.dataApointment));
        setTableDataIndicatorsSort(funFixEducator(context.dataApointment));
    }, [context.dataApointment]);



    useEffect(() => {
        setTableDataIndicatorsSort(sortDataTable(valueName, tableDataIndicators, dateFrom, dateTo));
    }, [valueName, tableDataIndicators, dateFrom, dateTo]);

    const refreshFilters = () => {
        setValueName("Все время");
        setDateFrom(new Date().toISOString().slice(0, 10));
        setDateTo(new Date().toISOString().slice(0, 10));
    };


    // Close dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setVidViewChange(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return ( 
        <div className={styles.RepotYour}>
            <Layout>
                <Header/>
                <div>
                    <h2>Показатели</h2>
                    <div className={styles.ReportFinansingList}>
                        <div className={styles.ReportFinansingListInner}>
                            <UneversalList dataList={DataList} placeholder="Период..." value="" setValueName={setValueName} valueName={valueName}/>
                          
                            <div className={styles.ReportFinansingListInnerDate}>
                            <span>От:</span>
                                <input 
                                    style={valueName !== "Все время" ? {cursor: "not-allowed", backgroundColor: "#f0f0f0"} : {}} 
                                    disabled={valueName !== "Все время"}
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}/>
                                    <span>До:</span>
                                <input 
                                    style={valueName !== "Все время" ? {cursor: "not-allowed", backgroundColor: "#f0f0f0"} : {}} 
                                    disabled={valueName !== "Все время"}
                                    type="date" 
                                    value={dateTo} 
                                    onChange={(e) => setDateTo(e.target.value)}/>
                            </div>
                            <div className={styles.dropFilter} onClick={refreshFilters} title="нажмите для сброса фильтров">
                                <img src="./img/ClearFilter.svg"/>
                            </div>
                        </div>
                        <div className={styles.ReportFinansingvidView} ref={dropdownRef}>
                            <p>Визуализация отчета:</p>
                            <div>
                                <input placeholder="" value={vidView} onClick={() => setVidViewChange(!vidViewChange)} className={styles.ReportFinansingvidViewInput} readOnly/>
                                <span onClick={() => setVidViewChange(!vidViewChange)} className={styles.arrowBot}>
                                    <img style={{ transform: !vidViewChange ? "rotate(-90deg)" : "rotate(0deg)" }} src="./img/arrow_bottom.svg"/>
                                </span>
                                {vidViewChange && 
                                    <div className={styles.ReportFinansingvidViewList}>
                                        <ul>
                                            <li onClick={() => { setVidView("Таблица"); setVidViewChange(false); }}>Таблица</li>
                                            <li onClick={() => { setVidView("Графики"); setVidViewChange(false); }}>Графики</li>
                                        </ul>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <FunctionReportTop dataTable={tableDataIndicatorsSort}/>
                    {vidView === "Таблица" ?
                        <UniversalTable tableHeader={tableHeadIndicators} tableBody={tableDataIndicatorsSort}/>
                        :
                        <div className={styles.ReportIndicatorsDashbord}>
                            <div>
                                <UniversalDashboardStatus dataDashbord={tableDataIndicatorsSort}/>
                            </div>
                            <div>
                                <UniversalDashbordSrochn dataDashbord={tableDataIndicatorsSort}/>
                            </div>
                        </div>
                    }
                </div>
            </Layout>
        </div>
    );
}

export default RepotIndicators;
