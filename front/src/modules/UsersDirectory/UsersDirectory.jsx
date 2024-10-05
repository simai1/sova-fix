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


function UsersDirectory() {
    const [tableDataObject, setTableDataObject] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const {context} = useContext(DataContext);
    const [Email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const getData = () => {
        GetAllUsers().then((response) => {
            setTableDataObject(response.data);
        })
    }

    useEffect(() => {
        getData();
    }, []);

    const ActivateUser = () => {
        if(context.selectRowDirectory != null){
            // let idUser = "";
            // tableDataObject.map((item) => {
            //     if(item.id === context.selectRowDirectory){
            //         idUser = item.id
            //     }
            // })
          console.log("ActivateUser", context.selectRowDirectory)
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

    const ClickRole = (id, role) =>{
        let data = {};
            if(role === 1){
            data = {
                role: 2,
                userId: id
            };
            }else{
            data = {
                role: 1,
                userId: id
            };
            }
        if(id !== JSON.parse(sessionStorage.getItem("userData"))?.user?.id){
            SetRole(data).then((resp)=>{
            if(resp?.status === 200){
                getData();
            }
            })
        }else{
                console.log("Вы не можете изменить свою роль!");
                context.setPopUp("PopUpError");
                context.setPopupErrorText("Вы не можете изменить свою роль!");
        }
      
       }

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
            <div>
                <h2>Пользователи</h2>
            </div>
            <div className={styles.ReferenceObjectsTopButton}>
                <button onClick={() => setPopUpCreate(true)}>Добавить пользователя</button>
                <button onClick={() => ActivateUser()}>Активировать пользователя</button>
                <button onClick={()=>deletedUser()}>Удалить пользователя</button>
            </div>
        </div>
        <UniversalTable FilterFlag={true} tableName="table5" tableHeader={tableUser} tableBody={tableDataObject} selectFlag={true} ClickRole={ClickRole}/>
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