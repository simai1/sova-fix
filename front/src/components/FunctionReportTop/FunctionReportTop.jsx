import { useNavigate, useLocation } from "react-router-dom";
import styles from "./FunctionReportTop.module.scss";
import { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import CountInfoBlock from "../../UI/CountInfoBlock/CountInfoBlock";
import { generateAndDownloadExcel } from "../../function/function";


function FunctionReportTop(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { context } = useContext(DataContext);
    const [summ, setSumm] = useState(0)
    const CountSumm = () => {
        let summ = 0;
        props?.dataTable.map((el) => summ += el.repairPrice)
        setSumm(summ)
    }

    useEffect(() => {
        CountSumm()
    }, [props?.dataTable])

    return ( 
        <div className={styles.FunctionReportTop}>
            {
                location.pathname === "/ReportFinansing" ?
                <div className={styles.ReportFinansingMenu}>
                    <div className={styles.ReportFinansingList}>
                        <CountInfoBlock dataCount={context?.filteredTableData} keys="count" value="Новая заявка" color="#d69a81" name="Всего"/>
                        <CountInfoBlock dataCount={context?.filteredTableData} keys="status" value="Выполнена" color="#ffe78f" name="Выполненых"/>
                        <CountInfoBlock dataCount={context?.filteredTableData} keys="checkPhoto" value="Новая заявка" color="#C5E384" name="С чеком"/>
                    </div>
                    <div className={styles.ReportFinansingButton}>
                        <p className={styles.ReportFinansingButton__text}>Сумма расхода:  {summ?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") } руб.</p>
                        <button onClick={() => generateAndDownloadExcel(props?.dataTable, "Финансы", summ)}>Экспорт</button>
                    </div>
                </div> :
                <div>
                    <button onClick={() => navigate("/ReportFinansing")}>Пользователи</button>
                </div>
            }
        </div>
    );
}

export default FunctionReportTop;
