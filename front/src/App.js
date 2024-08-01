import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import { tableHeadAppoint, tableUser } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllRequests, GetAllUsers, GetAllСontractors, GetContractorsItenerarity } from "./API/API";
import Activate from "./pages/Login/Activate/Activate";

function App() {
  const [popupErrorText, setPopupErrorText] = useState("")
  const [tableData, setTableData] = useState([]); // данные таблицы
  const [selectedTr, setSelectedTr] = useState(null); // выбранная строка
  const [selectedTable, setSelectedTable] = useState("Заявки"); // выбранная таблица
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
    popupErrorText,
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
    activateId

  };
  useEffect(() => {
    if(selectedTable === "Заявки"){
      UpdateTableReguest(1)
    }else if(selectedTable === "Пользователи"){
      UpdateTableReguest(2)
    }else{
      UpdateTableReguest(3)
    }
  },[textSearchTableData, selectedTable] )

  function UpdateTableReguest(param, idInteger = null) {
    if(param === 1){
      let url = ``;
        if(textSearchTableData === ""){
          GetAllRequests("").then((resp) => {
            setTableData(resp.data.requestsDtos)
            settableHeader(tableHeadAppoint);
          })
        }else{
          url = `?search=${context.textSearchTableData}`;
          GetAllRequests(url).then((resp) => {
            if(resp) {
              setTableData(resp.data.requestsDtos)
              settableHeader(tableHeadAppoint);
            }
          })
        }
    }if(param === 2){
          GetAllUsers().then((resp) => {
          if(resp) {
            setTableData(resp.data);
            settableHeader(tableUser);
          }
        })
    }if(param === 3){
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
        console.log(resp.data)
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
            <Route path="/" element={<HomePageAdmin />}></Route>
            <Route path="/Activate" element={<Activate />}></Route>
            <Route path="/Authorization" element={<Authorization />}></Route>
            
          </Routes>
        </main>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;
