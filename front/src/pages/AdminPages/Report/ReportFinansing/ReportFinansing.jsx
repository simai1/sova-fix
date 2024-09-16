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

    useEffect(() => {
        const fixedData = funFixEducator(context.dataApointment);
        setTableDataFinansing(fixedData);
        setTableDataFinansingSort(sortDataTable(valueName, fixedData)); // Ensure initial sort
    }, [context.dataApointment, valueName]); // Add valueName to dependencies

    const refreshFilters = () => {
        setValueName("Все время");
    };

    useEffect(() => {
        setTableDataFinansingSort(sortDataTable(valueName, tableDataFinansing));
    }, [valueName, tableDataFinansing]); // Ensure sorting happens when data changes

    return ( 
        <div className={styles.ReportFinansing}>
            <Layout>
                <Header/>
                <div>
                    <h2>Финансы</h2>
                    <div className={styles.ReportFinansingList}>
                        <UneversalList dataList={DataList} placeholder="Период..." value="" setValueName={setValueName} valueName={valueName}/>
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
