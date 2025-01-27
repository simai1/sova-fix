import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import { tableHeadAppoint, tableList, tableUser } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllCategories, GetAllEquipment, GetAllNomenclatures, GetAllRequests, GetAllUsers, GetAllСontractors, GetContractorsItenerarity, GetOneEquipment } from "./API/API";
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
import CategoryEquipment from "./modules/CategoryEquipment/CategoryEquipment";
import Equipment from "./pages/AdminPages/Equipment/Equipment";
import RangeEquipment from "./modules/RangeEquipment/RangeEquipment";
import GraphicEquipment from "./modules/GraphicEquipment/GraphicEquipment";
import EquipmentInfo from "./modules/EquipmentInfo/EquipmentInfo";

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
  const [textSearchTableData, setextSearchTableData] = useState("");
  const [popUp, setPopUp] = useState("");
  const [popUpEquipment, setPopUpEquipment] = useState("asddsa");
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
  const [dataEquipments, setDataEquipments] = useState([]);
  const [dataCategory, setDataCategory] = useState([]);
  const [dataNomenclature, setDataNomenclature] = useState([]);
  const [selectEquipment, setSelectEquipment] = useState(null);
  const [dataEquipment, setDataEquipment] = useState(null);
  const [ofset, setOfset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [loader, setLoader] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [dataTableHomePage, setDataTableHomePage] = useState([]);
  const checkedAllFunc = () => {
    if(moreSelect.length > 0){
      setCheckedAll(true)
    }else{
      setCheckedAll(false)
    }
  }

  const UpdateDataEquipment = () => {
    GetAllEquipment().then((res) => {
        if (res?.status === 200) {
         setDataEquipments(res.data)
        }
    });
}

const UpdateDataCategory = () => {
  GetAllCategories().then((res) => {
      if (res?.status === 200) {
       setDataCategory(res.data)
      }
  });
}

const UpdateDataNomenclature = () => {
  GetAllNomenclatures().then((res) => {
      if (res?.status === 200) {
       setDataNomenclature(res.data)
      }
  });
}

const GetDataEquipment = (id) =>{
  GetOneEquipment(id).then((res) => {
      setDataEquipment(res?.data)
      setSelectEquipment(res?.data)
  })
}

const UpdateForse = () =>{
  let url = `?offset=${ofset}&limit=${limit}`;
  
  GetAllRequests(url).then((resp) => {
    if (resp) {
      setTotalCount(resp?.data?.maxCount);
      setDataTableHomePage(funFixEducator(resp?.data?.data));
      setLoader(true); // Разрешаем загрузку следующих данных
    }
  });
}

  const context = {
    dataEquipment,
    setDataEquipment,
    GetDataEquipment,
    setSelectEquipment,
    selectEquipment,
    UpdateDataNomenclature,
    dataNomenclature,
    setDataNomenclature,
    UpdateDataCategory,
    setCheckedAll,
    dataCategory,
    setDataCategory,
    popUpEquipment,
    setPopUpEquipment,
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
    setDataEquipments,
    dataEquipments,
    UpdateDataEquipment,
    setOfset,
    ofset,
    limit,
    setLimit,
    scrollPosition,
    setScrollPosition,
    loader,
    setLoader,
    totalCount,
    dataTableHomePage,
    setDataTableHomePage,
    setTotalCount,
    UpdateForse
  };

  const isCheckedStore = useSelector((state) => state.isCheckedSlice.isChecked);
  const storeFilter = useSelector((state) => state.isSamplePoints["table9"]);

  const getUniqueItems = (array) => {
    const seen = new Set();
    return array.filter((item) => {
      const serialized = JSON.stringify(item); // Преобразуем объект в строку для проверки уникальности
      if (seen.has(serialized)) {
        return false; // Пропускаем дубликаты
      }
      seen.add(serialized);
      return true; // Оставляем уникальные
    });
  };
  

  
  useEffect(() => {
    context.setLoader(false);
    setDataTableHomePage([]);
    setTotalCount(0);
    setOfset(0);
    UpdateTableReguest();
  },[textSearchTableData, storeFilter] )

  function UpdateTableReguest() {
    let url = `?offset=${ofset}&limit=${limit}`;
  
    const uniqueData = getUniqueItems(storeFilter.isChecked);
    if (uniqueData.length !== 0) {
      const filterParams = uniqueData
        .map((item) => `exclude_${item.itemKey}=${item.value}`)
        .join("&");
      url += `&${filterParams}`;
    }
    if (textSearchTableData) {
      url += `&search=${textSearchTableData}`;
    }
  
    GetAllRequests(url).then((resp) => {
      if (resp) {
        setTotalCount(resp?.data?.maxCount);
  
        // Удаляем дублирующиеся данные с помощью Set
        const newData = funFixEducator(resp?.data?.data);
  
        setDataTableHomePage((prev) => {
          const combinedData = [...prev, ...newData];
          const uniqueDataSet = new Map(combinedData.map((item) => [item.id, item])); // Сохраняем только уникальные записи по id
          return Array.from(uniqueDataSet.values());
        });
  
        setLoader(true); // Разрешаем загрузку следующих данных
      }
    });
  }

 


  

  useEffect(() => {
    GetAllСontractors().then((resp) => {
      if(resp) {
        setDataContractors(resp?.data);
      }
    })
    GetAllRequests("").then((resp) => {
      setDataAppointment(funFixEducator(resp?.data?.data));
    });
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
            <Route path="/Equipment/*" element={<Equipment />}>
              <Route path="GraphicEquipment" element={<GraphicEquipment />}></Route>
              <Route path="CategoryEquipment" element={<CategoryEquipment />}></Route>
              <Route path="RangeEquipment" element={<RangeEquipment />}></Route>
              <Route path="EquipmentInfo" element={<EquipmentInfo />}></Route>
            </Route>
          </Routes>
        </main>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;


