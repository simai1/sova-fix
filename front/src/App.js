import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import { tableHeadAppoint, tableList, tableUser } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllCategories, GetAllEquipment, GetAllNomenclatures, GetAllRequests, GetAllUrgensies, GetAllUsers, GetAllСontractors, GetContractorsItenerarity, GetOneEquipment } from "./API/API";
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
import PageCardContractors from "./pages/AdminPages/PageCardContractors/PageCardContractors";
import TgUserObjects from "./pages/AdminPages/Directory/TgUserObjects";
import DirectoryUrgency from "./modules/DirectoryUrgencies/DirectoryUrgency";

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
  const [enabledTo, setEnabledTo] = useState(false);
  const [urgencyList, setUrgencyList] = useState([])
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
  let url = `?offset=${ofset}&limit=${limit}&userId=${JSON.parse(sessionStorage.getItem("userData"))?.user?.id}`;
  
  GetAllRequests(url).then((resp) => {
    if (resp) {
      setTotalCount(resp?.data?.maxCount);
      setDataTableHomePage(funFixEducator(resp?.data?.data));
      setLoader(true); // Разрешаем загрузку следующих данных
    }
  });
}

const UpdateUrgency = () => {
  GetAllUrgensies().then(response => {
    console.log(response)
    if(response) {
      setUrgencyList(response.data)
    }
  })
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
    enabledTo,
    setEnabledTo,
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
    setDataAppointment,
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
    UpdateForse,
    SortDataTable,
    urgencyList,
    setUrgencyList,
    UpdateUrgency,
  };

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
    if(loader){
      context.setLoader(false);
      setDataTableHomePage([]);
      setTotalCount(0);
      setOfset(0);
      UpdateTableReguest();
    }
  },[textSearchTableData, storeFilter, enabledTo] )

  const getParam = (value, key) =>{
    switch (key) {
      case "status":
        return String(value).toLowerCase();
      default:
        return value === "___" ? null : value;
    }
  }

  function SortDataTable(data) {
    if (!context.sortStateParam) {
      // Если параметр сортировки отсутствует, сортируем по `number` по убыванию
      return [...data].sort((a, b) => b.number - a.number);
    }
  
    const [colPart, typePart] = context.sortStateParam.split("&");
    const col = colPart.split("=")[1]; // Извлекаем имя столбца
    const type = typePart.split("=")[1]; // Извлекаем тип сортировки (asc/desc)
  
    return [...data].sort((a, b) => {
      if (a[col] === null || a[col] === undefined) return 1; // Сортируем null/undefined в конец
      if (b[col] === null || b[col] === undefined) return -1;
  
      if (typeof a[col] === "string") {
        // Сортируем строки
        return type === "asc"
          ? a[col].localeCompare(b[col])
          : b[col].localeCompare(a[col]);
      }
  
      if (typeof a[col] === "number" || a[col] instanceof Date) {
        // Сортируем числа и даты
        return type === "asc" ? a[col] - b[col] : b[col] - a[col];
      }
  
      return 0; // Для остальных типов данных
    });
  }

  
  function UpdateTableReguest() {
    let url = `?offset=${ofset}&limit=${limit}&isAutoCreated=${Boolean(enabledTo)}&userId=${JSON.parse(sessionStorage.getItem("userData"))?.user?.id}`;
    
    const uniqueData = getUniqueItems(storeFilter.isChecked);
    if (uniqueData.length !== 0) {
      const filterParams = uniqueData
        .map((item) => `exclude_${item.itemKey}=${getParam(item.value, item.itemKey)}`)
        .join("&");
      url += `&${filterParams}`;
    }
    if (textSearchTableData) {
      url += `&search=${textSearchTableData}`;
    }
  
    GetAllRequests(url).then((resp) => {
      if (resp) {
        setTotalCount(resp?.data?.maxCount);
        
        // Обрабатываем и объединяем новые данные
        const newData = funFixEducator(resp?.data?.data);
        
        setDataTableHomePage((prev) => {
          const combinedData = [...prev, ...newData];
          const uniqueDataSet = new Map(combinedData.map((item) => [item.id, item])); // Удаляем дубликаты по id
          const uniqueDataArray = Array.from(uniqueDataSet.values());
          
          // Сортируем объединенные данные перед возвратом
          return SortDataTable(uniqueDataArray);
        });
  
        setLoader(true); // Разрешаем загрузку следующих данных
      }
    });
  }
  
  useEffect(() => {
    setDataAppointment([])
    GetAllСontractors().then((resp) => {
      if(resp) {
        setDataContractors(resp?.data);
      }
    })
    const url = JSON.parse(sessionStorage.getItem("userData"))?.user?.id ? `?userId=${JSON.parse(sessionStorage.getItem("userData"))?.user?.id}` : '';
    GetAllRequests(url).then((resp) => {
      setDataAppointment(funFixEducator(resp?.data?.data));
    });
  }, [dataUsers]);

  useEffect(() => {
    GetAllUrgensies().then(response => {
      if(response?.status === 200) setUrgencyList(response.data)
    })
  }, [dataApointment])

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
            
            {JSON.parse(sessionStorage.getItem("userData"))?.user?.role === "CUSTOMER" ? null : (
              <Route path="/Directory/*" element={<Directory />}>
               <Route path="BusinessUnitReference" element={<BusinessUnitReference />}></Route>
               <Route path="DirectoryLegalEntities" element={<DirectoryLegalEntities />}></Route>
               <Route path="ReferenceObjects" element={<ReferenceObjects />}></Route>
               <Route path="ThePerformersDirectory" element={<ThePerformersDirectory />}></Route>
               <Route path="UsersDirectory" element={<UsersDirectory />}></Route>
               <Route path="TgUserObjects" element={<TgUserObjects />}></Route>
               <Route path="Urgency" element={<DirectoryUrgency />}></Route>
             </Route>
            )}

            {JSON.parse(sessionStorage.getItem("userData"))?.user?.role === "CUSTOMER" ? null : (
              <Route path="/CardPage/*" element={<CardPage />}>
               <Route path="Card" element={<PageCardContractors />}></Route>
               <Route path="CardPageModule" element={<CardPageModule />}></Route>
             </Route>
            )}

            {JSON.parse(sessionStorage.getItem("userData"))?.user?.role === "CUSTOMER" ? null : (
              <Route path="/Equipment/*" element={<Equipment />}>
                <Route path="GraphicEquipment" element={<GraphicEquipment />}></Route>
                <Route path="CategoryEquipment" element={<CategoryEquipment />}></Route>
                <Route path="RangeEquipment" element={<RangeEquipment />}></Route>
                <Route path="EquipmentInfo" element={<EquipmentInfo />}></Route>
              </Route>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;


