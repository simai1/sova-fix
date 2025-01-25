import React, { useContext, useEffect, useState } from "react";

import styles from "./UsersDirectory.module.scss";
import { useDispatch } from "react-redux";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import { tableUser } from "./UsersDirectoryData";
import { GetAllUsers, GetOneRequests, GetOneUsers, Register, RejectActiveAccount, SetRole } from "../../API/API";
import DataContext from "../../context";
import PopUpContainer from "../../UI/PopUpContainer/PopUpContainer";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpGoodMessage from "../../UI/PopUpGoodMessage/PopUpGoodMessage";
import СonfirmDeleteUser from "./../../components/СonfirmDeleteUser/СonfirmDeleteUser";
import ClearImg from "./../../assets/images/ClearFilter.svg"
import { resetFilters } from "../../store/samplePoints/samplePoits";

function UsersDirectory() {
    const [tableDataObject, setTableDataObject] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const {context} = useContext(DataContext);
    const [Email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useDispatch();

    function funFixData(data) {
       
        return data.map((item) => {
          return {
            ...item,
            id: item?.id || "___",
            isConfirmed: item?.isConfirmed === true ? "Активирован" : "Не активирован",
            login: item?.login || "___",
            tgUserId: item?.tgUserId || "___",
            name: item?.name || "___",
            role: funFixRole(item?.role),
          };
        });
      }

    function funFixRole(value){
      if(value === 2){
        return "Администратор"
      }else if(value === 1){
        return "Пользователь"
      }else if(value === 3){
        return "Заказчик"
      }else if(value === 4){
        return "Исполнитель"
      }else if(value === 5){
        return "Наблюдатель"
      }
      else{
        return "___"
      }

    }

    const getData = () => {
        GetAllUsers().then((response) => {
            setTableDataObject(funFixData(response.data));
        })
    }

    useEffect(() => {
        getData();
    }, []);

    const ActivateUser = () => {
        if(context.selectRowDirectory != null){
            RejectActiveAccount(context.selectRowDirectory).then((resp)=>{
              if(resp?.status === 200){
               getData();
                context.setPopUp("PopUpGoodMessage")
                context.setPopupGoodText("Пользователь успешно активирован!")
              }else{
                context.setPopupErrorText("Нельзя активировать этого пользователя!");
                context.setPopUp("PopUpError")
              }
            })
           }else{
            context.setPopupErrorText("Сначала выберите пользователя!");
            context.setPopUp("PopUpError")
           }
        
    }

    const ClickRole = (role, id) => {
      let roleId;
      switch (role) {
        case "Администратор":
          roleId = 2;
          break;
        case "Пользователь":
          roleId = 1;
          break;
        case "Наблюдатель":
          roleId = 5;
          break;
        default:
          return;
      }
      const data = {
        role: roleId,
        userId: id,
      }
      if(id !== JSON.parse(sessionStorage.getItem("userData"))?.user?.id){
        SetRole(data).then((resp)=>{
          if(resp?.status === 200){
              getData();
          }
        })
    }else{
      context.setPopUp("PopUpError");
      context.setPopupErrorText("Вы не можете изменить свою роль!");
    }
    };


       const handleCreateUnit = () => {
        if (!Email) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }
        const dataApointment = {
            login: Email
        };

        Register(dataApointment).then((resp)=>{
            if(resp?.status === 200){
              context.setPopUp("PopUpGoodMessage")
              context.setPopupGoodText("Пользователь успешно создан!")
              getData();
              setPopUpCreate(false);
            }
        })
    }

      const deletedUser = ()=>{
        if( context.selectRowDirectory !== null &&   context.selectRowDirectory !== JSON.parse(sessionStorage.getItem("userData")).user?.id){
          context.setPopUp("СonfirmDeleteUser")
        }else if( context.selectRowDirectory === null){
          context.setPopupErrorText("Сначала выберите пользователя!");
          context.setPopUp("PopUpError")
        }else{
          context.setPopupErrorText("Вы не можете удалить себя!");
          context.setPopUp("PopUpError")
        }
      }

    return ( 
        <div className={styles.ReferenceObjects}>
            <div className={styles.ReferenceObjectsTop}>
            <div className={styles.BusinessUnitReferenceTopTitle}>
              <div >
                <p style={{fontSize:"24px", margin:"0px"}}>Пользователи</p>
              </div>
              <div className={styles.clear}>
                  <button onClick={() => dispatch(resetFilters({tableName: "table5"}))} ><img src={ClearImg} /></button>
              </div>
            </div>
            {JSON.parse(localStorage.getItem("userData"))?.user?.role === "ADMIN" && 
              <div className={styles.ReferenceObjectsTopButton}>
                  <button onClick={() => setPopUpCreate(true)}>Добавить</button>
                  <button onClick={() => ActivateUser()}>Активировать</button>
                  <button onClick={()=>deletedUser()}>Удалить</button>
              </div>
            }
        </div>
        <UniversalTable FilterFlag={true} tableName="table5" tableHeader={tableUser} tableBody={tableDataObject} selectFlag={true} ClickRole={ClickRole} heightTable="calc(100vh - 285px)"/>
        {popUpCreate && (
                <div className={styles.PupUpCreate}>
                    <PopUpContainer mT={300} title="Добавление пользователя" closePopUpFunc={setPopUpCreate}>
                        <div className={styles.PupUpCreateInputInner}>
                            <div>
                                <div>
                                    <input 
                                        placeholder="Email..." 
                                        value={Email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                    />
                                      <div>
                                    {errorMessage && <div className={styles.ErrorMessage}>{errorMessage}</div>}
                                </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.PupUpCreateButtonInner}>
                            <button className={styles.PupUpCreateButton} onClick={handleCreateUnit}>Добавить</button>
                        </div>
                    </PopUpContainer>
                </div>
            )}
            {context.popUp === "PopUpError" && <PopUpError />}
             {context.popUp === "PopUpGoodMessage" && <PopUpGoodMessage />}
             {context.popUp === "СonfirmDeleteUser" &&  <СonfirmDeleteUser updateTable={getData} />}
    </div>
     );
}

export default UsersDirectory;