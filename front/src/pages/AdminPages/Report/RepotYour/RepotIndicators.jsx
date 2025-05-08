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
import { DataListViborka, tableHeadIndicators } from "./RepotIndicatorsDaat";
import UniversalDashbordSrochn from "../../../../components/UniversalDashbord/UniversalDashbordSrochn";
import UniversalDashbordStatus from "../../../../components/UniversalDashbord/UniversalDashbordStatus";
import UniversalDashboardStatus from "../../../../components/UniversalDashbord/UniversalDashbordStatus";
import { sortDataTable } from "../functionSort/functionSort";
import { PopUpError } from "../../../../UI/PopUpError/PopUpError";
import PopUpEditAppoint from "../../../../components/PopUp/PopUpEditAppoint/PopUpEditAppoint";
import { useSelector } from "react-redux";
import { filterRequestsWithoutCopiedId } from "../../../../function/function";

function RepotIndicators() {
  const { context } = useContext(DataContext);
  const [tableDataIndicators, setTableDataIndicators] = useState([]);
  const [tableDataIndicatorsSort, setTableDataIndicatorsSort] = useState([]);
  const [valueName, setValueName] = useState("Все время");
  const [vidView, setVidView] = useState("Таблица");
  const [nameViborka, setNameViborka] = useState("");
  const [vidViewChange, setVidViewChange] = useState(false);
  const dropdownRef = useRef(null); // Create a ref for the dropdown
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setTableDataIndicators(context.dataApointment);
    setTableDataIndicatorsSort(context.dataApointment);
  }, [context.dataApointment]);
  
  useEffect(() => {
    switch (valueName) {
      case "Все время":
        setDateFrom(new Date().toISOString().slice(0, 10));
        setDateTo(new Date().toISOString().slice(0, 10));
        break;
      case "Сегодня":
        const today = new Date();
        const startOfToday = new Date(today.setHours(23, 59, 59, 999));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));
        setDateFrom(startOfToday.toISOString().slice(0, 10));
        setDateTo(endOfToday.toISOString().slice(0, 10));
        break;
      case "Вчера":
        const yesterday = new Date();
        const startOfYesterday = new Date(
          yesterday.setDate(yesterday.getDate() - 1)
        );
        const endOfYesterday = new Date(yesterday.setDate(yesterday.getDate()));
        setDateFrom(startOfYesterday.toISOString().slice(0, 10));
        setDateTo(endOfYesterday.toISOString().slice(0, 10));
        break;
      case "Текущая неделя":
        const startOfWeek = new Date();
        const endOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()+1);
        endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7);
        setDateFrom(startOfWeek.toISOString().slice(0, 10));
        setDateTo(endOfWeek.toISOString().slice(0, 10));
        break;
        case "Текущий месяц":
          const startOfMonth = new Date();
          const endOfMonth = new Date();
          
          // Set the start date to the first day of the current month
          startOfMonth.setDate(1);
          
          // Set the end date to the last day of the current month
          endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to the next month
          endOfMonth.setDate(0); // Set to the last day of the current month
          
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
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay() - 6
        );
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

  useEffect(() => {
    var sortParam = ""
    if(nameViborka === ""){
      sortParam = "Дата создания"
    }else{
      sortParam = nameViborka
    }
    setTableDataIndicatorsSort(
      sortDataTable(valueName, tableDataIndicators, dateFrom, dateTo, sortParam)
    );
  }, [ tableDataIndicators, dateFrom, dateTo, nameViborka, vidViewChange, valueName]);


  const refreshFilters = () => {
    setValueName("Все время");
    setDateFrom(new Date().toISOString().slice(0, 10));
    setDateTo(new Date().toISOString().slice(0, 10));
    setNameViborka("")
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

  const store = useSelector(
    (state) => state.isSamplePoints["table6"].isChecked
  );
  
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
    <div className={styles.RepotYour}>
      <Layout>
        <Header />
        <div>
          <p style={{fontSize:"24px", margin:"0px"}}>Показатели</p>
          <div className={styles.ReportFinansingList}>
            <div className={styles.ReportFinansingListInner}>
              <UneversalList
                dataList={DataList}
                placeholder="Период..."
                value=""
                setValueName={setValueName}
                valueName={valueName}
              />
              <div className={styles.ReportFinansingListInnerDate}>
                <span>От:</span>
                <input
                  style={
                    valueName !== "Все время"
                      ? { cursor: "not-allowed", backgroundColor: "#f0f0f0" }
                      : {}
                  }
                  disabled={valueName !== "Все время"}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span>До:</span>
                <input
                  style={
                    valueName !== "Все время"
                      ? { cursor: "not-allowed", backgroundColor: "#f0f0f0" }
                      : {}
                  }
                  disabled={valueName !== "Все время"}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              
              </div>
              <div className={styles.thisFilter}>
                  <UneversalList
                    dataList={DataListViborka}
                    placeholder="Формировать по..."
                    value=""
                    setValueName={setNameViborka}
                    valueName={nameViborka}
                  />
                </div>
              <div
                className={styles.dropFilter}
                onClick={refreshFilters}
                title="нажмите для сброса фильтров"
              >
                <img src="./img/ClearFilter.svg" />
              </div>
            </div>
            <div className={styles.ReportFinansingvidView} ref={dropdownRef}>
              <p>Визуализация отчета:</p>
              <div>
                <input
                  placeholder=""
                  value={vidView}
                  onClick={() => setVidViewChange(!vidViewChange)}
                  className={styles.ReportFinansingvidViewInput}
                  readOnly
                  style={{
                    borderBottom: !vidViewChange ? "1px solid #ADADAD" : "none",
                    borderRadius: vidViewChange ? "8px 8px 0 0" : "8px",
                  }}
                />
                <span
                  onClick={() => setVidViewChange(!vidViewChange)}
                  className={styles.arrowBot}
                >
                  <img
                    style={{
                      transform: !vidViewChange
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                    }}
                    src="./img/arrow_bottom.svg"
                  />
                </span>
                {vidViewChange && (
                  <div className={styles.ReportFinansingvidViewList}>
                    <ul>
                      <li
                        onClick={() => {
                          setVidView("Таблица");
                          setVidViewChange(false);
                        }}
                      >
                        Таблица
                      </li>
                      <li
                        onClick={() => {
                          setVidView("Графики");
                          setVidViewChange(false);
                        }}
                      >
                        Графики
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <FunctionReportTop dataTable={filterRequestsWithoutCopiedId(tableDataIndicatorsSort)} />
          {vidView === "Таблица" ? (
            <UniversalTable
              tableName="table6"
              selectFlag={true}
              tableHeader={tableHeadIndicators}
              tableBody={filterRequestsWithoutCopiedId(tableDataIndicatorsSort)}
              FilterFlag={true}
              top="95"
              heightTable="calc(100vh - 385px)"
            />
          ) : (
            <div className={styles.ReportIndicatorsDashbord}>
              <div>
                <UniversalDashboardStatus
                  dataDashbord={filterRequestsWithoutCopiedId(filterBasickData(tableDataIndicatorsSort, store))}
                />
              </div>
              <div>
                <UniversalDashbordSrochn
                  dataDashbord={filterRequestsWithoutCopiedId(filterBasickData(tableDataIndicatorsSort, store))}
                />
              </div>
            </div>
          )}
        </div>
      </Layout>
      {context.popUp === "PopUpError" && <PopUpError />}
      {context.popUp === "PopUpEditAppoint" && <PopUpEditAppoint />}
    </div>
  );
}

export default RepotIndicators;
