import { useContext, useEffect, useState } from "react";
import Layout from "../../../../UI/Layout/Layout";
import UneversalList from "../../../../UI/UneversalList/UneversalList";
import Header from "../../../../components/Header/Header";
import styles from "./ReportFinansing.module.scss";
import { DataList, TableHeader } from "./ReportFinansingData";
import DataContext from "../../../../context";
import FunctionReportTop from "../../../../components/FunctionReportTop/FunctionReportTop";
import UniversalTable from "../../../../components/UniversalTable/UniversalTable";
import { funFixEducator } from "../../../../UI/SamplePoints/Function";
import { sortDataTable } from "../functionSort/functionSort";
import BasicDateRangePicker from "../../../../UI/BasicDateRangePicker/BasicDateRangePicker";

function ReportFinansing() {
    const { context } = useContext(DataContext);
    const [tableDataFinansing, setTableDataFinansing] = useState([]);
    const [tableDataFinansingSort, setTableDataFinansingSort] = useState([]);
    const [valueName, setValueName] = useState("Все время");
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));


    useEffect(() => {
        const fixedData = funFixEducator(context.dataApointment);
        setTableDataFinansing(fixedData);
        setTableDataFinansingSort(sortDataTable(valueName, fixedData, dateFrom, dateTo)); // Ensure initial sort
    }, [context.dataApointment]); // Add valueName to dependencies


    useEffect(() => {
        setTableDataFinansingSort(sortDataTable(valueName, tableDataFinansing, dateFrom, dateTo));
    }, [valueName, tableDataFinansing, dateFrom, dateTo]);

    const refreshFilters = () => {
        setValueName("Все время");
        setDateFrom(new Date().toISOString().slice(0, 10));
        setDateTo(new Date().toISOString().slice(0, 10));
    };

    useEffect(() => {
        setTableDataFinansingSort(sortDataTable(valueName, tableDataFinansing));
    }, [valueName, tableDataFinansing]); // Ensure sorting happens when data changes


    useEffect(() => {
        switch(valueName){
            case "Все время":
                setDateFrom(new Date().toISOString().slice(0, 10));
                setDateTo(new Date().toISOString().slice(0, 10));
                break;
            case "Сегодня":
                const today = new Date();
                const startOfToday = new Date(today.setHours(0, 0, 0, 0));
                const endOfToday = new Date(today.setHours(23, 59, 59, 999));
                setDateFrom(startOfToday.toISOString().slice(0, 10));
                setDateTo(endOfToday.toISOString().slice(0, 10));
                break;
            case "Вчера":
                const yesterday = new Date();
                const startOfYesterday = new Date(yesterday.setDate(yesterday.getDate() - 1));
                const endOfYesterday = new Date(yesterday.setDate(yesterday.getDate() - 1));
                setDateFrom(startOfYesterday.toISOString().slice(0, 10));
                setDateTo(endOfYesterday.toISOString().slice(0, 10));
                break;
            case "Текущая неделя":
                const startOfWeek = new Date();
                const endOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 6);
                setDateFrom(startOfWeek.toISOString().slice(0, 10));
                setDateTo(endOfWeek.toISOString().slice(0, 10));
                break;
            case "Текущий месяц":
                const startOfMonth = new Date();
                const endOfMonth = new Date();
                startOfMonth.setDate(1);
                endOfMonth.setDate(0);
                setDateFrom(startOfMonth.toISOString().slice(0, 10));
                setDateTo(endOfMonth.toISOString().slice(0, 10));
                break;
            case "Текущий год":
                const startOfYear = new Date();
                const endOfYear = new Date();
                startOfYear.setMonth(0);
                startOfYear.setDate(1);
                endOfYear.setMonth(11);
                endOfYear.setDate(31);
                setDateFrom(startOfYear.toISOString().slice(0, 10));
                setDateTo(endOfYear.toISOString().slice(0, 10));
                break;
            case "Прошлая неделя":
                const startOfLastWeek = new Date();
                const endOfLastWeek = new Date();
                startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
                endOfLastWeek.setDate(endOfLastWeek.getDate() - endOfLastWeek.getDay());
                setDateFrom(startOfLastWeek.toISOString().slice(0, 10));
                setDateTo(endOfLastWeek.toISOString().slice(0, 10));
                break;
            case "Прошлый месяц":
                const startOfLastMonth = new Date();
                const endOfLastMonth = new Date();
                startOfLastMonth.setDate(1);
                startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
                endOfLastMonth.setDate(0);
                setDateFrom(startOfLastMonth.toISOString().slice(0, 10));
                setDateTo(endOfLastMonth.toISOString().slice(0, 10));
                break;
            case "Прошлый год":
                const startOfLastYear = new Date();
                const endOfLastYear = new Date();
                startOfLastYear.setMonth(0);
                startOfLastYear.setDate(1);
                startOfLastYear.setFullYear(startOfLastYear.getFullYear() - 1);
                endOfLastYear.setMonth(11);
                endOfLastYear.setDate(31);
                endOfLastYear.setFullYear(endOfLastYear.getFullYear() - 1);
                setDateFrom(startOfLastYear.toISOString().slice(0, 10));
                setDateTo(endOfLastYear.toISOString().slice(0, 10));
                break;
            default:
                break;
        }
    }, [valueName]);
    
    return ( 
        <div className={styles.ReportFinansing}>
            <Layout>
                <Header/>
                <div>
                    <h2>Финансы</h2>
                    <div className={styles.ReportFinansingList}>
                        <UneversalList dataList={DataList} placeholder="Период..." value="" setValueName={setValueName} valueName={valueName}/>
                        <div className={styles.ReportFinansingListInnerDate}>
                        <span>От:</span>
                        <input 
                            type="date" 
                            value={dateFrom} 
                            onChange={(e) => setDateFrom(e.target.value)} 
                            style={valueName !== "Все время" ? {cursor: "not-allowed", backgroundColor: "#f0f0f0"} : {}} 
                            disabled={valueName !== "Все время"} 
                            />
                            <span>До:</span>
                            <input 
                                type="date" 
                                value={dateTo} 
                                onChange={(e) => setDateTo(e.target.value)}
                                style={valueName !== "Все время" ? {cursor: "not-allowed", backgroundColor: "#f0f0f0"} : {}} 
                                disabled={valueName !== "Все время"} 
                            />
                        </div>
                        <div className={styles.dropFilter} onClick={refreshFilters} title="нажмите для сброса фильтров"><img src="./img/ClearFilter.svg" alt="Clear Filter"/></div>
                    </div>
                </div>
                <div>
                    <FunctionReportTop dataTable={tableDataFinansingSort}/>
                    <UniversalTable tableHeader={TableHeader} tableBody={tableDataFinansingSort}/>
                </div>
            </Layout>
        </div>
    );
}

export default ReportFinansing;
