import { useContext, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useGetPendingRegistrationsQuery,
  useApproveUserMutation,
  useDeleteUserMutation,
} from '../../../../API/rtkQuery/users.api'
import DataContext from '../../../../context.ts'
import { PopUpError } from '../../../../UI/PopUpError/PopUpError'
import styles from './RegistrationRequests.module.scss'

const ROLE_LABELS = {
  CUSTOMER: 'Заказчик',
  CONTRACTOR: 'Исполнитель',
  ADMIN: 'Администратор',
  OBSERVER: 'Наблюдатель',
}

function RegistrationRequests() {
  const role = JSON.parse(sessionStorage.getItem('userData'))?.user?.role
  const isAdmin = role === 'ADMIN'

  const { context } = useContext(DataContext)
  const { data = [], isLoading, isError } = useGetPendingRegistrationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !isAdmin,
  })
  const [approve, { isLoading: aLoad }] = useApproveUserMutation()
  const [del, { isLoading: dLoad }] = useDeleteUserMutation()
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!isAdmin) return <Navigate to="/" replace />

  const onApprove = async (id) => {
    try {
      await approve(id).unwrap()
    } catch (e) {
      context.setPopupErrorText(e?.data?.message || 'Ошибка подтверждения')
      context.setPopUp('PopUpError')
    }
  }

  const onReject = async () => {
    if (!confirmDelete) return
    try {
      await del(confirmDelete).unwrap()
      setConfirmDelete(null)
    } catch (e) {
      context.setPopupErrorText(e?.data?.message || 'Ошибка удаления')
      context.setPopUp('PopUpError')
      setConfirmDelete(null)
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
              <td>{ROLE_LABELS[u.role] || u.role}</td>
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
                    disabled={aLoad || dLoad}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    className={styles.reject}
                    onClick={() => setConfirmDelete(u.id)}
                    disabled={aLoad || dLoad}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p>Удалить заявку на регистрацию? Действие необратимо.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancel}
                onClick={() => setConfirmDelete(null)}
                disabled={dLoad}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.confirm}
                onClick={onReject}
                disabled={dLoad}
              >
                {dLoad ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {context.popUp === 'PopUpError' && <PopUpError />}
    </div>
  )
}

export default RegistrationRequests
