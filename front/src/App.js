import Authorization from "./pages/Login/Authorization/Authorization";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import DataContext from "./context";
import "./styles/style.css";
import AdminPage from "./pages/AdminPages/HomePage/AdminPage";
import { tableHeadAppoint } from "./components/Table/Data";
import HomePageAdmin from "./pages/AdminPages/HomePageAdmin/HomePageAdmin";
import { GetAllRequests, GetAllUsers, GetAllСontractors } from "./API/API";

function App() {
  const [tableData, setTableData] = useState([]); // данные таблицы
  const [selectedTr, setSelectedTr] = useState(null); // выбранная строка
  const [selectedTable, setSelectedTable] = useState("Заказы"); // выбранная таблица
  const [searchDataForTable, setsearchDataForTable] = useState(" "); // поиск по таблице
  const [tableHeader, settableHeader] = useState(tableHeadAppoint);
  const [dataApointment, setDataAppointment] = useState([]);
  const [dataUsers, setDataUsers] = useState([]);
  const [dataContractors, setDataContractors] = useState([]);
  const [textSearchTableData, setextSearchTableData] = useState("");
  const [popUp, setPopUp] = useState("");

  const context = {
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
  };

  function UpdateTableReguest(param){
    if(param == 1){
      GetAllRequests().then((resp) => {
        if(resp) {
          setDataAppointment(resp.data.requestsDtos);
          setTableData(resp.data.requestsDtos);
          settableHeader(tableHeadAppoint);
        }
      })
    }if(param == 2){
        // GetAllUsers().then((resp) => {
        //   if(resp) {
        //      setTableData(resp.data);
          //settableHeader(tableHeadAppoint);
        //   }
        // })
    }
  }

  useEffect(() => {
    GetAllСontractors().then((resp) => {
      if(resp) {
        setDataContractors(resp.data);
      }
    })
    UpdateTableReguest(1)
  }, []);

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
