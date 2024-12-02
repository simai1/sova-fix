import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import { tableHeadAppoint, tableList, tableUser } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllRequests, GetAllUsers, GetAllСontractors, GetContractorsItenerarity } from "./API/API";
import Activate from "./pages/Login/Activate/Activate";
import { useDispatch, useSelector } from "react-redux";
import { FilteredSample, funFixEducator } from "./UI/SamplePoints/Function";
import ReportFinansing from "./pages/AdminPages/Report/ReportFinansing/ReportFinansing";
import RepotYour from "./pages/AdminPages/Report/RepotYour/RepotIndicators";
import BusinessUnitReference from "./modules/BusinessUnitReference/BusinessUnitReference";
import DirectoryLegalEntities from "./modules/DirectoryLegalEntities/DirectoryLegalEntities";
import ReferenceObjects from "./modules/ReferenceObjects/ReferenceObjects";
import ThePerformersDirectory from "./modules/ThePerformersDirectory/ThePerformersDirectory";
import Directory from "./pages/AdminPages/Directory/Directory";
import UsersDirectory from "./modules/UsersDirectory/UsersDirectory";
import CardPage from "./pages/AdminPages/CardPageTable/CardPage";
import CardPageModule from "./modules/CardPageModule/CardPageModule";

function App() {
  const [selectContructor, setSelectContractor] = useState("")
  const [popupErrorText, setPopupErrorText] = useState("")
  const [tableData, setTableData] = useState([]); // данные таблицы
  const [selectedTr, setSelectedTr] = useState(null); // выбранная строка
  const [selectedTable, setSelectedTable] = useState("Заявки"); // выбранная таблица
  const [searchDataForTable, setsearchDataForTable] = useState(" "); // поиск по таблице
  const [tableHeader, settableHeader] = useState(tableHeadAppoint);
  const [dataApointment, setDataAppointment] = useState([]);
  const [dataUsers, setDataUsers] = useState(null);
  const [dataContractors, setDataContractors] = useState([]);
  const [moreSelect, setMoreSelect] = useState([]);
  const [textSearchTableData, setextSearchTableData] = useState(null);
  const [popUp, setPopUp] = useState("");
  const [popupGoodText, setPopupGoodText] = useState("")
  const [selectPage, setSelectPage] = useState("Main")
  const [Dataitinerary, setDataitinerary] = useState([])
  const [nameClient, setnameClient] = useState("");
  const [activateId, setActivateId]= useState("");
  const [dataFilter, SetDataFilter] = useState([]);
  const [isSamplePointsData, setSamplePointsData] = useState([]); // данные фильтрации по th
  const [isChecked, setIsChecked] = useState([]); // состояние инпутов в SamplePoints //! сбросить
  const [isAllChecked, setAllChecked] = useState([]); // инпут все в SamplePoints //! сбросить
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [dataTableFix, setDataTableFix] = useState([]);
  const [editListOpen, setEditListOpen] = useState(false);
  const [sortState, setSortState] = useState("");
  const [sortStateParam, setSortStateParam] = useState("");
  const [selectRowDirectory, setSelectRowDirectory] = useState(null);
  const [checkedAll, setCheckedAll] = useState(false);
  const [textSearchTableDataPhone, setextSearchTableDataPhone] = useState("");
  const checkedAllFunc = () => {
    if(moreSelect.length > 0){
      setCheckedAll(true)
    }else{
      setCheckedAll(false)
    }
  }
  const [flagFilter, setFlagFilter] = useState(false);
  const [updatedDataApointment, setUpdatedDataApointment] = useState(0);
  const context = {
    setextSearchTableDataPhone,
    updatedDataApointment,
    setUpdatedDataApointment,
    textSearchTableDataPhone,
    setFlagFilter,
    flagFilter,
    setCheckedAll,
    checkedAll,
    editListOpen,
    setMoreSelect,
    moreSelect,
    setSortStateParam,
    sortStateParam,
    sortState,
    setSortState,
    setEditListOpen,
    setDataTableFix,
    dataTableFix,
    setFilteredTableData,
    filteredTableData,
    setIsChecked,
    isChecked,
    setAllChecked,
    isAllChecked,
    isSamplePointsData,
    setSamplePointsData,
    SetDataFilter,
    dataFilter,
    popupErrorText,
    setSelectContractor,
    setPopupErrorText,
    nameClient,
    setnameClient,
    setDataUsers,
    tableData,
    setTableData,
    selectedTr,
    setSelectedTr,
    selectedTable,
    setSelectedTable,
    searchDataForTable,
    setsearchDataForTable,
    tableHeader,
    settableHeader,
    UpdateTableReguest,
    textSearchTableData,
    setextSearchTableData,
    dataContractors,
    popUp,
    setPopUp,
    popupGoodText,
    setPopupGoodText,
    setSelectPage,
    selectPage,
    dataApointment,
    Dataitinerary,
    setDataitinerary,
    setActivateId,
    activateId,
    selectContructor,
    setSelectRowDirectory,
    selectRowDirectory,
    checkedAllFunc,
    checkedAll,
  };

  const dispatch = useDispatch();

  // useEffect(() => {
  //   if(filteredTableData != null){
  //   dispatch(setTableData({tableData: 234}))
  //   }
  // }, [filteredTableData])

  useEffect(() => {console.log("textSearchTableData", textSearchTableData)},[textSearchTableData])

  const isCheckedStore = useSelector((state) => state.isCheckedSlice.isChecked);
  useEffect(() => {
    if(selectedTable === "Заявки" && selectPage === "Main"){
      UpdateTableReguest(1)
    }else if(selectedTable === "Пользователи" && selectPage === "Main"){
      UpdateTableReguest(2)
    }else if(selectPage === "Card"){
      if(selectContructor !== ""){
        UpdateTableReguest(3)
      }
    }
  },[textSearchTableData, selectedTable, selectContructor] )


  function UpdateTableReguest(param, par = sortStateParam, limit)  {
    let url = '';
    let limitNumber = limit ? limit : 8
    
    if (par || textSearchTableData) {
      if(par != "" && !textSearchTableData){
        url = `?${par}`;
      }
      else{
        url = `?search=${textSearchTableData}&${par}`
      }
    }
    else if(flagFilter) {
        url = ``;
    } else{
      url = `?&ofset=0&limit=${limitNumber}`;
    }
    
          GetAllRequests(url).then((resp) => {
            if(resp) {
              const checks = isCheckedStore || [];
              setIsChecked(checks);
              setTableData(resp?.data.requestsDtos)
              setDataTableFix(funFixEducator(resp?.data.requestsDtos))
              setFilteredTableData(FilteredSample(funFixEducator(resp?.data.requestsDtos), checks ))
              settableHeader(tableHeadAppoint);
            }
          })
        GetAllRequests("").then((resp) => {
          setDataAppointment(resp?.data.requestsDtos)
        })
  }

  useEffect(() => {
    GetAllСontractors().then((resp) => {
      if(resp) {
        setDataContractors(resp?.data);
      }
    })
    UpdateTableReguest(1)
  }, [dataUsers]);

  return (
    <DataContext.Provider
      value={{
        context,
      }}
    >
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/" element={<HomePageAdmin />}></Route>
            <Route path="/Activate" element={<Activate />}></Route>
            <Route path="/Authorization" element={<Authorization />}></Route>
            <Route path="/ReportFinansing" element={<ReportFinansing />}></Route>
            <Route path="/RepotYour" element={<RepotYour />}></Route>
            <Route path="/Directory/*" element={<Directory />}>
              <Route path="BusinessUnitReference" element={<BusinessUnitReference />}></Route>
              <Route path="DirectoryLegalEntities" element={<DirectoryLegalEntities />}></Route>
              <Route path="ReferenceObjects" element={<ReferenceObjects />}></Route>
              <Route path="ThePerformersDirectory" element={<ThePerformersDirectory />}></Route>
              <Route path="UsersDirectory" element={<UsersDirectory />}></Route>
            </Route>
            <Route path="/CardPage/*" element={<CardPage />}>
              <Route path="CardPageModule" element={<CardPageModule />}></Route>
            </Route>
          </Routes>
        </main>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;


