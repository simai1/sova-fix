import { useContext, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useGetPendingRegistrationsQuery,
  useApproveUserMutation,
  useDeleteUserMutation,
} from '../../../../API/rtkQuery/users.api'
import DataContext from '../../../../context.ts'
import {
  ROLE_LABELS_BY_NAME,
  getStoredRole,
  isAdminOnlyRole,
  isAdminUiRole,
} from '../../../../constants/roles.constant.ts'
import { PopUpError } from '../../../../UI/PopUpError/PopUpError'
import styles from './RegistrationRequests.module.scss'

function DeleteRegistrationButton({ userId, approveLoading }) {
  const { context } = useContext(DataContext)
  const [deleteUser, { isLoading }] = useDeleteUserMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onDelete = async () => {
    try {
      await deleteUser(userId).unwrap()
      setConfirmDelete(false)
    } catch (e) {
      context.setPopupErrorText(e?.data?.message || 'Ошибка удаления')
      context.setPopUp('PopUpError')
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.reject}
        onClick={() => setConfirmDelete(true)}
        disabled={approveLoading || isLoading}
      >
        Удалить
      </button>
      {confirmDelete ? (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p>Удалить заявку на регистрацию? Действие необратимо.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancel}
                onClick={() => setConfirmDelete(false)}
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.confirm}
                onClick={onDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function RegistrationRequests() {
  const role = getStoredRole()
  const canManageRegistrations = isAdminUiRole(role)
  const canDeleteUsers = isAdminOnlyRole(role)

  const { context } = useContext(DataContext)
  const { data = [], isLoading, isError } = useGetPendingRegistrationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !canManageRegistrations,
  })
  const [approve, { isLoading: aLoad }] = useApproveUserMutation()

  if (!canManageRegistrations) return <Navigate to="/" replace />

  const onApprove = async (id) => {
    try {
      await approve(id).unwrap()
    } catch (e) {
      context.setPopupErrorText(e?.data?.message || 'Ошибка подтверждения')
      context.setPopUp('PopUpError')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <h2>Заявки на регистрацию</h2>
        <p>Загрузка...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.wrap}>
        <h2>Заявки на регистрацию</h2>
        <p>Не удалось загрузить заявки. Попробуйте обновить страницу.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h2>Заявки на регистрацию</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Дата подачи</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan="5" className={styles.empty}>
                Нет заявок на регистрацию
              </td>
            </tr>
          )}
          {data.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.login}</td>
              <td>{ROLE_LABELS_BY_NAME[u.role] || u.role}</td>
              <td>
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleString('ru-RU', {
                      timeZone: 'Europe/Moscow',
                    })
                  : '—'}
              </td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.approve}
                    onClick={() => onApprove(u.id)}
                    disabled={aLoad}
                  >
                    Одобрить
                  </button>
                  {canDeleteUsers ? (
                    <DeleteRegistrationButton userId={u.id} approveLoading={aLoad} />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {context.popUp === 'PopUpError' && <PopUpError />}
    </div>
  )
}

export default RegistrationRequests
