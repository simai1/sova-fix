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
import UserObjectsAssign from "../UserObjectsAssign/UserObjectsAssign";
import { getStoredRole } from "../../constants/roles.constant";
import {
  formatUserDirectoryRole,
  getUserDirectoryPolicy,
  getUserDirectoryRowPolicy,
} from "./userDirectoryPolicy";

function getStoredUserId() {
  try {
    return JSON.parse(sessionStorage.getItem("userData"))?.user?.id ?? null;
  } catch {
    return null;
  }
}

function funFixRole(value) {
  return formatUserDirectoryRole(value);
}

function UsersDirectory() {
    const [tableDataObject, setTableDataObject] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const {context} = useContext(DataContext);
    const [Email, setEmail] = useState("");
    const [NewRole, setNewRole] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useDispatch();
    const [objectsAssignFor, setObjectsAssignFor] = useState(null);
    const currentRole = getStoredRole();
    const currentUserId = getStoredUserId();
    const { canActivate, canCreateOrDelete, roleOptions } = getUserDirectoryPolicy(currentRole);

    function funFixData(data) {
        return data.map((item) => {
          const roleId = Number(item?.role);
          const rowPolicy = getUserDirectoryRowPolicy(currentRole, currentUserId, {
            id: item?.id,
            role: roleId,
          });
          return {
            ...item,
            id: item?.id || "___",
            isConfirmed: item?.isConfirmed === true ? "Активирован" : "Не активирован",
            login: item?.login || "___",
            tgUserId: item?.tgUserId || "___",
            name: item?.name || "___",
            role: funFixRole(roleId),
            roleId,
            roleEditable: rowPolicy.canChangeRole,
            accessButton: rowPolicy.canAssignObjects ? "button" : null,
          };
        });
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
        if (!canActivate) return;
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

    const ClickRole = (roleId, id) => {
      if (!roleOptions.includes(roleId)) return;
      const data = {
        role: roleId,
        userId: id,
      }
      if(id !== currentUserId){
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
    const renderAccessButton = (value, row) => {
      if (value) {
        return (
          <button
            className={styles.accessButton}
            onClick={() => setObjectsAssignFor({ id: row.id, name: row.name })}
          >
            Доступы
          </button>
        );
      }
      return null;
    };

    const handleCreateUnit = () => {
        if (!canCreateOrDelete) return;
        if (!Email || !NewRole) {
            setErrorMessage("Пожалуйста, заполните все поля!");
            return;
        }
        const dataApointment = {
            login: Email,
            role: Number(NewRole),
        };

        Register(dataApointment).then((resp)=>{
            if(resp?.status === 200){
              context.setPopUp("PopUpGoodMessage")
              context.setPopupGoodText("Пользователь успешно создан!")
              getData();
              setPopUpCreate(false);
              setEmail("");
              setNewRole("");
            }
        })
    }

    const deletedUser = ()=>{
        if (!canCreateOrDelete) return;
        if( context.selectRowDirectory !== null && context.selectRowDirectory !== currentUserId){
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
            {canActivate &&
              <div className={styles.ReferenceObjectsTopButton}>
                  {canCreateOrDelete ? <button onClick={() => setPopUpCreate(true)}>Добавить</button> : null}
                  <button onClick={() => ActivateUser()}>Активировать</button>
                  {canCreateOrDelete ? <button onClick={()=>deletedUser()}>Удалить</button> : null}
              </div>
            }
        </div>
        <UniversalTable 
          FilterFlag={true} 
          tableName="table5" 
          tableHeader={tableUser} 
          tableBody={tableDataObject} 
          selectFlag={true} 
          ClickRole={ClickRole} 
          roleOptions={roleOptions}
          roleOptionLabel={funFixRole}
          heightTable="calc(100vh - 285px)"
          customRender={{
            accessButton: renderAccessButton,
          }}
        />
        <UserObjectsAssign
          open={objectsAssignFor !== null}
          userId={objectsAssignFor?.id ?? null}
          userName={objectsAssignFor?.name}
          onClose={() => setObjectsAssignFor(null)}
        />
        {canCreateOrDelete && popUpCreate && (
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
                                    <select
                                        value={NewRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                    >
                                        <option value="" disabled>Выберите роль...</option>
                                        <option value="2">Администратор</option>
                                        <option value="3">Заказчик</option>
                                        <option value="4">Исполнитель</option>
                                        <option value="5">Наблюдатель</option>
                                        <option value="6">Менеджер</option>
                                    </select>
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
             {canCreateOrDelete && context.popUp === "СonfirmDeleteUser" &&  <СonfirmDeleteUser updateTable={getData} />}
    </div>
     );
}

export default UsersDirectory;
