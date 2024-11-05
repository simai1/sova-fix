import { useNavigate, useLocation } from "react-router-dom";
import styles from "./FunctionReportTop.module.scss";
import { useContext, useEffect, useState } from "react";
import DataContext from "../../context";
import CountInfoBlock from "../../UI/CountInfoBlock/CountInfoBlock";
import { generateAndDownloadExcel } from "../../function/function";
import { useDispatch, useSelector } from "react-redux";
import { resetFilters } from "../../store/samplePoints/samplePoits";
import ClearImg from "./../../assets/images/ClearFilter.svg"

function FunctionReportTop(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { context } = useContext(DataContext);
    const [summ, setSumm] = useState(0)

      const storeFinansing = useSelector(
        (state) => state.isSamplePoints["table7"].isChecked
      );
      const storeIndicators = useSelector(
        (state) => state.isSamplePoints["table6"].isChecked
      );

    const CountSumm = () => {
        let summ = 0;
        filterBasickData(props?.dataTable, storeFinansing).map((el) =>{
            if(typeof el.repairPrice === 'number'){
                summ += el.repairPrice
            }
        })        
    setSumm(Number(summ))
    }

    useEffect(() => {
        CountSumm()
    }, [props?.dataTable, storeFinansing])

    
    const TimeComplite = () => {
        let time = 0;
        filterBasickData(props?.dataTable, storeIndicators).map((el) => time += el.daysAtWork)
        if(time === 0){
            return 0
        }else{
            return Math.floor(time / filterBasickData(props?.dataTable, storeIndicators).length)+1
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
      const dispatch = useDispatch();
      
      //! функция фильтрации
      function filterBasickData(data, chekeds) {
        let tb = [...data];
        let mass = [];
        tb.filter((el) => {
          if (chekeds.find((it) => el[it.itemKey] === it.value)) {
            return;
          } else {
            mass.push(el);
          }
        });
        return mass;
      }


    return ( 
        <div className={styles.FunctionReportTop}>
            {
                location.pathname === "/ReportFinansing" ?
                <div className={styles.ReportFinansingMenu}>
                    <div className={styles.ReportFinansingList}>
                        <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeFinansing)} keys="count"  value="Новая заявка" color="#d69a81" name="Всего"/>
                        <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeFinansing)} keys="status" value="Выполнена" color="#ffe78f" name="Выполненых"/>
                        <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeFinansing)} keys="checkPhoto" value="Новая заявка" color="#C5E384" name="С чеком"/>
                        <div className={styles.clear}>
                            <button onClick={() => dispatch(resetFilters({tableName: "table7"}))} ><img src={ClearImg} /></button>
                        </div>
                    </div>
                    <div className={styles.ReportFinansingButton}>
                        <p className={styles.ReportFinansingButton__text}>Сумма расхода:  {summ.toLocaleString().replace(",", " ") || "___"} руб.</p>
                        <button onClick={() => generateAndDownloadExcel(props?.dataTable, "Финансы", summ)}>Экспорт</button>
                    </div>
                </div> :
            
                <div className={styles.ReportFinansingMenu}>
                    <div className={styles.ReportFinansingList}>
                    <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeIndicators)} keys="status" value="Новая заявка" color="#d69a81" name="Новых"/>
                    <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeIndicators)} keys="status" value="В работе" color="#ffe78f" name="В работе"/>
                    <CountInfoBlock dataCount={filterBasickData(props?.dataTable, storeIndicators)} keys="status" value="Выполнена" color="#C5E384" name="Выполнены"/>
                    <div className={styles.clear}>
                            <button onClick={() => dispatch(resetFilters({tableName: "table6"}))} ><img src={ClearImg} /></button>
                        </div>
                    </div>
                    <div className={styles.ReportFinansingButton}>
                        <p className={styles.ReportFinansingButton__text}>Средняя скорость выполнения:  {TimeComplite()} (дней)</p>
                        <p className={styles.ReportFinansingButton__text}>Количество заявок:  {filterBasickData(props?.dataTable, storeIndicators).length }</p>
                        {JSON.parse(localStorage.getItem("userData"))?.user?.role !== "OBSERVER" &&
                            <button style={{margin: "0px 10px 0px 0px"}} onClick={()=>editAppoint()}>
                                <img src="./img/Edit.svg" alt="View" />
                                Редактировать заявку
                            </button>
                        }
                        <button onClick={() => generateAndDownloadExcel(props?.dataTable, "Показатели")}>Экспорт</button>
                    </div>
                </div>

            }
           
        </div>
    );
}

export default FunctionReportTop;
