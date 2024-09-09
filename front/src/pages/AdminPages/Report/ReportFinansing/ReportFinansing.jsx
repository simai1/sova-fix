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

function ReportFinansing() {
    const { context } = useContext(DataContext);
    const [tableDataFinansing, setTableDataFinansing] = useState([]);

    useEffect(() => {
        console.log("context.dataApointment", funFixEducator(context.dataApointment));
        setTableDataFinansing(funFixEducator(context.dataApointment));
    }, [context.dataApointment]);

    return ( 
        <div className={styles.ReportFinansing}>
            <Layout>
                <Header/>
                <div>
                    <h2>Финансы</h2>
                    <div className={styles.ReportFinansingList}>
                        <UneversalList dataList={DataList} placeholder="Период..." value=""/>
                    </div>
                </div>
                <div>
                    <FunctionReportTop dataTable={tableDataFinansing}/>
                    <UniversalTable tableHeader={TableHeader} tableBody={tableDataFinansing}/>
                </div>
            </Layout>
        </div>
    );
}

export default ReportFinansing;
