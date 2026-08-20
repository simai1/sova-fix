import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import styles from "./UsersDirectory.module.scss";
import { GetAllUsers, Register, RejectActiveAccount, SetRole } from "../../API/API";
import DataContext from "../../context";
import { PopUpError } from "../../UI/PopUpError/PopUpError";
import PopUpGoodMessage from "../../UI/PopUpGoodMessage/PopUpGoodMessage";
import СonfirmDeleteUser from "./../../components/СonfirmDeleteUser/СonfirmDeleteUser";
import ConfirmDisableUser from "./../../components/ConfirmDisableUser/ConfirmDisableUser";
import UserObjectsAssign from "../UserObjectsAssign/UserObjectsAssign";
import { useStoredRole } from "../../hooks/useStoredRole";
import { getUserData } from "../../utils/auth";
import { ROLE_LABELS_BY_ID } from "../../constants/roles.constant";
import { normalizeUserId } from "./userDirectoryActions";
import {
  buildUserDirectoryRows,
  getUserDirectoryPolicy,
  getUserDirectoryRowPolicy,
  normalizeAllowedRoleId,
} from "./userDirectoryPolicy";

const ROLE_FILTER_OPTIONS = [2, 3, 4, 5, 6];

// buildUserDirectoryRows подставляет "___" вместо пустых значений — в новой
// вёрстке показываем нейтральное тире.
const renderCell = (value, mutedClass) =>
  !value || value === "___" ? <span className={mutedClass}>—</span> : value;

const matchesSearch = (user, query) => {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [user?.name, user?.login].filter(Boolean).map((v) => String(v).toLowerCase());
  return haystack.some((value) => value.includes(needle));
};

function UsersDirectory() {
  const { context } = useContext(DataContext);
  const currentRole = useStoredRole();
  const currentUserId = normalizeUserId(getUserData()?.user?.id);
  const { canActivate, canCreateOrDelete, roleOptions } = getUserDirectoryPolicy(currentRole);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmedFilter, setConfirmedFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");

  const [popUpCreate, setPopUpCreate] = useState(false);
  const [Email, setEmail] = useState("");
  const [NewRole, setNewRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [objectsAssignFor, setObjectsAssignFor] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const searchTimer = useRef(null);

  const getData = () => {
    setIsLoading(true);
    GetAllUsers()
      .then((response) => {
        if (response?.data) {
          setUsers(response.data);
          setLoadError(false);
        } else {
          setUsers([]);
          setLoadError(true);
        }
      })
      .catch(() => {
        setUsers([]);
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [search]);

  useEffect(() => {
    setObjectsAssignFor(null);
    setDisableTarget(null);
    setDeleteTarget(null);
  }, [currentRole, currentUserId]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!matchesSearch(user, debouncedSearch)) return false;
        if (roleFilter !== "all" && Number(user?.role) !== Number(roleFilter)) return false;
        if (confirmedFilter === "yes" && user?.isConfirmed !== true) return false;
        if (confirmedFilter === "no" && user?.isConfirmed === true) return false;
        if (accessFilter === "disabled" && user?.isDisabled !== true) return false;
        if (accessFilter === "active" && user?.isDisabled === true) return false;
        return true;
      }),
    [users, debouncedSearch, roleFilter, confirmedFilter, accessFilter],
  );

  const rows = useMemo(
    () => buildUserDirectoryRows(filteredUsers, currentRole, currentUserId),
    [filteredUsers, currentRole, currentUserId],
  );

  const canShowObjectsAssign =
    objectsAssignFor !== null &&
    getUserDirectoryRowPolicy(currentRole, currentUserId, {
      id: objectsAssignFor.id,
      role: objectsAssignFor.roleId,
    }).canAssignObjects;

  const ActivateUser = (userId) => {
    if (!canActivate) return;
    const targetId = normalizeUserId(userId);
    if (targetId === null) return;
    RejectActiveAccount(targetId).then((resp) => {
      if (resp?.status === 200) {
        getData();
        context.setPopupGoodText("Пользователь успешно активирован!");
        context.setPopUp("PopUpGoodMessage");
      } else {
        context.setPopupErrorText("Нельзя активировать этого пользователя!");
        context.setPopUp("PopUpError");
      }
    });
  };

  const ClickRole = (roleId, id) => {
    const normalizedRoleId = normalizeAllowedRoleId(roleId, roleOptions);
    const targetUserId = normalizeUserId(id);
    if (normalizedRoleId === null || targetUserId === null || currentUserId === null) return;
    if (targetUserId === currentUserId) return;
    SetRole({ role: normalizedRoleId, userId: targetUserId }).then((resp) => {
      if (resp?.status === 200) {
        getData();
      }
    });
  };

  const openDisable = (row) => {
    if (!canCreateOrDelete) return;
    setDisableTarget(row);
    context.setPopUp("ConfirmDisableUser");
  };

  const openDelete = (row) => {
    if (!canCreateOrDelete) return;
    setDeleteTarget(row);
    context.setPopUp("СonfirmDeleteUser");
  };

  const handleCreateUnit = () => {
    if (!canCreateOrDelete) return;
    if (!Email || !NewRole) {
      setErrorMessage("Пожалуйста, заполните все поля!");
      return;
    }
    Register({ login: Email, role: Number(NewRole) }).then((resp) => {
      if (resp?.status === 200) {
        context.setPopupGoodText("Пользователь успешно создан!");
        context.setPopUp("PopUpGoodMessage");
        getData();
        closeCreate();
      }
    });
  };

  const closeCreate = () => {
    setPopUpCreate(false);
    setEmail("");
    setNewRole("");
    setErrorMessage("");
  };

  const onReset = () => {
    setSearch("");
    setRoleFilter("all");
    setConfirmedFilter("all");
    setAccessFilter("all");
  };

  return (
    <div className={styles.wrap}>
      <h2>Пользователи</h2>

      <div className={styles.toolbar}>
        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label htmlFor="users-search">Поиск по ФИО или логину</label>
          <input
            id="users-search"
            type="text"
            placeholder="например: Иванов"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="users-role">Роль</label>
          <select
            id="users-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Все</option>
            {ROLE_FILTER_OPTIONS.map((roleId) => (
              <option key={roleId} value={roleId}>
                {ROLE_LABELS_BY_ID[roleId]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="users-confirmed">Активация</label>
          <select
            id="users-confirmed"
            value={confirmedFilter}
            onChange={(e) => setConfirmedFilter(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="yes">Активирован</option>
            <option value="no">Не активирован</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="users-access">Доступ</label>
          <select
            id="users-access"
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="active">Есть доступ</option>
            <option value="disabled">Отключён</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onReset} disabled={isLoading}>
            Сбросить
          </button>
          {canCreateOrDelete ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setPopUpCreate(true)}
            >
              Добавить
            </button>
          ) : null}
        </div>
      </div>

      {loadError && (
        <div className={styles.errorBanner}>
          Не удалось загрузить список пользователей. Попробуйте обновить страницу.
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNum}>№</th>
              <th className={styles.colName}>ФИО</th>
              <th className={styles.colLogin}>Логин</th>
              <th className={styles.colTg}>Телеграм</th>
              <th className={styles.colRole}>Роль</th>
              <th className={styles.colState}>Активация</th>
              <th className={styles.colState}>Доступ</th>
              <th className={styles.colActions}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Пользователи не найдены
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const isSelf = currentUserId !== null && row.id === currentUserId;
              const rowPolicy = getUserDirectoryRowPolicy(currentRole, currentUserId, {
                id: row.id,
                role: row.roleId,
              });
              const canEditRole =
                row.roleEditable && roleOptions.length > 0 && roleOptions.includes(row.roleId);
              return (
                <tr key={row.id ?? index}>
                  <td className={styles.colNum}>{index + 1}</td>
                  <td className={styles.colName}>{renderCell(row.name, styles.muted)}</td>
                  <td className={styles.colLogin}>{renderCell(row.login, styles.muted)}</td>
                  <td className={styles.colTg}>
                    {row.tgId ? (
                      <a className={styles.tgLink} href={`tg://user?id=${row.tgId}`}>
                        {row.tgId}
                      </a>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.colRole}>
                    {canEditRole ? (
                      <select
                        className={styles.roleSelect}
                        value={row.roleId}
                        onChange={(e) => ClickRole(e.target.value, row.id)}
                        aria-label={`Роль пользователя ${row.name}`}
                      >
                        {roleOptions.map((roleId) => (
                          <option key={roleId} value={roleId}>
                            {ROLE_LABELS_BY_ID[roleId]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      renderCell(row.role, styles.muted)
                    )}
                  </td>
                  <td className={styles.colState}>
                    <span
                      className={`${styles.chip} ${
                        row.isConfirmedFlag ? styles.chipSuccess : styles.chipNeutral
                      }`}
                    >
                      {row.isConfirmedFlag ? "Активирован" : "Не активирован"}
                    </span>
                  </td>
                  <td className={styles.colState}>
                    <span
                      className={`${styles.chip} ${
                        row.isDisabledFlag ? styles.chipError : styles.chipNeutral
                      }`}
                    >
                      {row.isDisabledFlag ? "Отключён" : "Есть"}
                    </span>
                  </td>
                  <td className={styles.colActions}>
                    <div className={styles.rowActions}>
                      {canActivate && !row.isConfirmedFlag ? (
                        <button type="button" onClick={() => ActivateUser(row.id)}>
                          Активировать
                        </button>
                      ) : null}
                      {rowPolicy.canAssignObjects ? (
                        <button
                          type="button"
                          onClick={() =>
                            setObjectsAssignFor({
                              id: row.id,
                              name: row.name,
                              roleId: row.roleId,
                            })
                          }
                        >
                          Доступы
                        </button>
                      ) : null}
                      {canCreateOrDelete && !isSelf ? (
                        <button
                          type="button"
                          onClick={() => openDisable(row)}
                          title={row.isDisabledFlag ? "Включить доступ" : "Отключить доступ"}
                        >
                          {row.isDisabledFlag ? "Включить" : "Отключить"}
                        </button>
                      ) : null}
                      {canCreateOrDelete && !isSelf ? (
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => openDelete(row)}
                        >
                          Удалить
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isLoading && <div className={styles.spinner}>Загрузка...</div>}

      <UserObjectsAssign
        open={canShowObjectsAssign}
        userId={canShowObjectsAssign ? objectsAssignFor.id : null}
        userName={objectsAssignFor?.name}
        onClose={() => setObjectsAssignFor(null)}
      />

      {canCreateOrDelete && popUpCreate && (
        <div className={styles.modalOverlay} onClick={closeCreate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавление пользователя</h3>
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="Закрыть"
                onClick={closeCreate}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label htmlFor="users-create-email">Email</label>
                <input
                  id="users-create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={styles.modalField}>
                <label htmlFor="users-create-role">Роль</label>
                <select
                  id="users-create-role"
                  value={NewRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="" disabled>
                    Выберите роль...
                  </option>
                  {roleOptions.map((roleId) => (
                    <option key={roleId} value={roleId}>
                      {ROLE_LABELS_BY_ID[roleId]}
                    </option>
                  ))}
                </select>
              </div>
              {errorMessage && <div className={styles.modalError}>{errorMessage}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={closeCreate}>
                Отмена
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleCreateUnit}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {context.popUp === "PopUpError" && <PopUpError />}
      {context.popUp === "PopUpGoodMessage" && <PopUpGoodMessage />}
      {canCreateOrDelete && context.popUp === "СonfirmDeleteUser" && (
        <СonfirmDeleteUser
          userId={deleteTarget?.id ?? null}
          currentUserId={currentUserId}
          updateTable={getData}
        />
      )}
      {canCreateOrDelete && context.popUp === "ConfirmDisableUser" && (
        <ConfirmDisableUser
          userId={disableTarget?.id ?? null}
          disabled={!disableTarget?.isDisabledFlag}
          updateTable={getData}
        />
      )}
    </div>
  );
}

export default UsersDirectory;
