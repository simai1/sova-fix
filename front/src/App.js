import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import AdminPage from "./pages/AdminPages/HomePage/AdminPage";
import { tableHeadAppoint, tableUser } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllRequests, GetAllUsers, GetAllСontractors, GetContractorsItenerarity } from "./API/API";
import Activate from "./pages/Login/Activate/Activate";

function App() {
  const [tableData, setTableData] = useState([]); // данные таблицы
  const [selectedTr, setSelectedTr] = useState(null); // выбранная строка
  const [selectedTable, setSelectedTable] = useState("Заказы"); // выбранная таблица
  const [searchDataForTable, setsearchDataForTable] = useState(" "); // поиск по таблице
  const [tableHeader, settableHeader] = useState(tableHeadAppoint);
  const [dataApointment, setDataAppointment] = useState([]);
  const [dataUsers, setDataUsers] = useState(null);
  const [dataContractors, setDataContractors] = useState([]);
  const [textSearchTableData, setextSearchTableData] = useState("");
  const [popUp, setPopUp] = useState("");
  const [popupGoodText, setPopupGoodText] = useState("")
  const [selectPage, setSelectPage] = useState("Main")
  const [Dataitinerary, setDataitinerary] = useState([])
  const [nameClient, setnameClient] = useState("");
  const [activateId, setActivateId]= useState("");

  const context = {
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
    activateId

  };

  function UpdateTableReguest(param, idInteger = null) {
    if(param == 1){
      GetAllRequests().then((resp) => {
        if(resp) {
          setDataAppointment(resp.data.requestsDtos);
          setTableData(resp.data.requestsDtos);
          settableHeader(tableHeadAppoint);
        }
      })
    }if(param == 2){
      const accessToken = localStorage.getItem("accessToken")
      console.log('accessToken', accessToken)
        GetAllUsers(accessToken).then((resp) => {
          if(resp) {
             setTableData(resp.data);
            settableHeader(tableUser);
          }
        })
    }if(param == 3){
      GetContractorsItenerarity(idInteger).then((resp)=>{
        if(resp.status == 200){
          context.setDataitinerary(resp.data)
          setTableData(resp.data);
          settableHeader(tableHeadAppoint);
        }
      })
    }
  }

  useEffect(() => {
    GetAllСontractors().then((resp) => {
      if(resp) {
        setDataContractors(resp.data);
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
            <Route path="/" element={<Authorization />}></Route>
            <Route path="/Activate" element={<Activate />}></Route>
            <Route path="/AdminPage/*" element={<AdminPage />}>
              <Route path="*" element={<HomePageAdmin />}></Route>
            </Route>
          </Routes>
        </main>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;
