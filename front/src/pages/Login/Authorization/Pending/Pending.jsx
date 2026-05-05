import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WS_URL } from '../../../../constants/env.constant'
import styles from '../Authorization.module.scss'

function Pending() {
  const navigate = useNavigate()
  const [pending] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pendingRegistration') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!pending) {
      navigate('/Authorization')
      return
    }
    if (!WS_URL) {
      // если переменная окружения не задана — просто остаёмся ждать без сокета
      return
    }
    let ws
    try {
      ws = new WebSocket(WS_URL)
    } catch {
      return
    }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'USER_CONFIRM' && data.msg?.userId === pending.userId) {
          localStorage.removeItem('pendingRegistration')
          navigate('/Authorization', { state: { approvedLogin: pending.login } })
        }
      } catch {
        // игнорируем не-JSON
      }
    }
    return () => {
      try {
        ws.close()
      } catch {
        // ignore
      }
    }
  }, [pending, navigate])

  const onLogout = () => {
    localStorage.removeItem('pendingRegistration')
    navigate('/Authorization')
  }

  if (!pending) return null

  const roleLabel = (() => {
    switch (pending.role) {
      case 'CUSTOMER':
        return 'Заказчик'
      case 'CONTRACTOR':
        return 'Исполнитель'
      default:
        return pending.role
    }
  })()

  return (
    <div className={styles.AuthorRegistrar}>
      <div>
        <div className={styles.box}>
          <div className={styles.text_Logo}>
            <img src="./img/SOVA.jpg" className={styles.LogoAuth} alt="logo" />
          </div>
          <div className={styles.container}>
            <h2>Заявка отправлена</h2>
            <p style={{ margin: '4px 0' }}>
              <b>{pending.name}</b>
            </p>
            <p style={{ margin: '4px 0' }}>{pending.login}</p>
            <p style={{ margin: '4px 0' }}>Роль: {roleLabel}</p>
            <p style={{ textAlign: 'center', maxWidth: 360 }}>
              Дождитесь подтверждения менеджера. Страница обновится автоматически после одобрения.
            </p>
            <button className={styles.button} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pending
