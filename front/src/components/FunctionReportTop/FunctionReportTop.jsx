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
    const TimeComplite = () => {
        let time = 0;
        props?.dataTable.map((el) => time += el.daysAtWork)
        console.log("time", time)
        if(time === 0){
            return 0
        }else{
            return Math.floor(time / props?.dataTable.length)+1
        }

    }
    
    const editAppoint = ()=>{
        if(context.selectedTr != null){
        context.setPopUp("PopUpEditAppoint")
        }else{
          context.setPopupErrorText("Сначала выберите заявку!");
            context.setPopUp("PopUpError")
        }
      }

    return ( 
        <div className={styles.FunctionReportTop}>
            {
                location.pathname === "/ReportFinansing" ?
                <div className={styles.ReportFinansingMenu}>
                    <div className={styles.ReportFinansingList}>
                        <CountInfoBlock dataCount={props?.dataTable} keys="count"  value="Новая заявка" color="#d69a81" name="Всего"/>
                        <CountInfoBlock dataCount={props?.dataTable} keys="status" value="Выполнена" color="#ffe78f" name="Выполненых"/>
                        <CountInfoBlock dataCount={props?.dataTable} keys="checkPhoto" value="Новая заявка" color="#C5E384" name="С чеком"/>
                    </div>
                    <div className={styles.ReportFinansingButton}>
                        <p className={styles.ReportFinansingButton__text}>Сумма расхода:  {summ?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") } руб.</p>
                        <button onClick={() => generateAndDownloadExcel(props?.dataTable, "Финансы", summ)}>Экспорт</button>
                    </div>
                </div> :
            
                <div className={styles.ReportFinansingMenu}>
                    <div className={styles.ReportFinansingList}>
                    <CountInfoBlock dataCount={props?.dataTable} keys="status" value="Новая заявка" color="#d69a81" name="Новых"/>
                    <CountInfoBlock dataCount={props?.dataTable} keys="status" value="В работе" color="#ffe78f" name="В работе"/>
                    <CountInfoBlock dataCount={props?.dataTable} keys="status" value="Выполнена" color="#C5E384" name="Выполнены"/>
                    </div>
                    <div className={styles.ReportFinansingButton}>
                        <p className={styles.ReportFinansingButton__text}>Средняя скорость выполнения:  {TimeComplite()} (дней)</p>
                        <p className={styles.ReportFinansingButton__text}>Количество заявок:  {props?.dataTable.length }</p>
                        <button style={{margin: "0px 10px 0px 0px"}} onClick={()=>editAppoint()}>
                            <img src="./img/Edit.svg" alt="View" />
                            Редактировать заявку
                        </button>
                        <button onClick={() => generateAndDownloadExcel(props?.dataTable, "Показатели")}>Экспорт</button>
                    </div>
                </div>

            }
           
        </div>
    );
}

export default FunctionReportTop;
