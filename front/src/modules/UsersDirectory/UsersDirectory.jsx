import React, { useContext, useEffect, useMemo, useState } from "react";

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
import { useStoredRole } from "../../hooks/useStoredRole";
import { getUserData } from "../../utils/auth";
import { normalizeUserId } from "./userDirectoryActions";
import {
  buildUserDirectoryRows,
  formatUserDirectoryRole,
  getUserDirectoryPolicy,
  getUserDirectoryRowPolicy,
  normalizeAllowedRoleId,
} from "./userDirectoryPolicy";

function funFixRole(value) {
  return formatUserDirectoryRole(value);
}

function UsersDirectory() {
    const [users, setUsers] = useState([]);
    const [popUpCreate, setPopUpCreate] = useState(false);
    const {context} = useContext(DataContext);
    const [Email, setEmail] = useState("");
    const [NewRole, setNewRole] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useDispatch();
    const [objectsAssignFor, setObjectsAssignFor] = useState(null);
    const currentRole = useStoredRole();
    const currentUserId = normalizeUserId(getUserData()?.user?.id);
    const { canActivate, canCreateOrDelete, roleOptions } = getUserDirectoryPolicy(currentRole);
    const selectedUserId = normalizeUserId(context.selectRowDirectory);
    const canShowObjectsAssign = objectsAssignFor !== null && getUserDirectoryRowPolicy(
      currentRole,
      currentUserId,
      { id: objectsAssignFor.id, role: objectsAssignFor.roleId },
    ).canAssignObjects;
    const tableDataObject = useMemo(
      () => buildUserDirectoryRows(users, currentRole, currentUserId),
      [users, currentRole, currentUserId],
    );

    const getData = () => {
        GetAllUsers().then((response) => {
            setUsers(response.data);
        })
    }

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
      setObjectsAssignFor(null);
    }, [currentRole, currentUserId]);

    const ActivateUser = () => {
        if (!canActivate) return;
        if(selectedUserId !== null){
            RejectActiveAccount(selectedUserId).then((resp)=>{
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
      const normalizedRoleId = normalizeAllowedRoleId(roleId, roleOptions);
      const targetUserId = normalizeUserId(id);
      if (normalizedRoleId === null || targetUserId === null || currentUserId === null) return;
      const data = {
        role: normalizedRoleId,
        userId: targetUserId,
      }
      if(targetUserId !== currentUserId){
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
            onClick={() => setObjectsAssignFor({ id: row.id, name: row.name, roleId: row.roleId })}
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
        if(selectedUserId !== null && selectedUserId !== currentUserId){
          context.setPopUp("СonfirmDeleteUser")
        }else if(selectedUserId === null){
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
          open={canShowObjectsAssign}
          userId={canShowObjectsAssign ? objectsAssignFor.id : null}
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
             {canCreateOrDelete && context.popUp === "СonfirmDeleteUser" &&  <СonfirmDeleteUser userId={selectedUserId} currentUserId={currentUserId} updateTable={getData} />}
    </div>
     );
}

export default UsersDirectory;
