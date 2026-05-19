import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WS_URL } from '../../../../constants/env.constant'
import styles from '../Authorization.module.scss'

const INITIAL_RECONNECT_DELAY = 5000
const MAX_RECONNECT_DELAY = 60000

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
      return
    }

    const verifyToken = sessionStorage.getItem('pendingVerifyToken')
    if (!verifyToken) {
      return
    }

    let cancelled = false
    let ws = null
    let reconnectTimer = null
    let delay = INITIAL_RECONNECT_DELAY

    const connect = () => {
      if (cancelled) return
      try {
        ws = new WebSocket(WS_URL, [`pending.${verifyToken}`])
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        delay = INITIAL_RECONNECT_DELAY
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.event === 'USER_CONFIRM' && data.msg?.userId === pending.userId) {
            cancelled = true
            try {
              ws?.close()
            } catch {}
            localStorage.removeItem('pendingRegistration')
            sessionStorage.removeItem('pendingVerifyToken')
            navigate('/Authorization', { state: { approvedLogin: pending.login } })
          }
        } catch {}
      }

      ws.onerror = () => {}

      ws.onclose = (ev) => {
        if (cancelled) return
        if (ev?.code === 1008) {
          cancelled = true
          return
        }
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (cancelled) return
      reconnectTimer = setTimeout(() => {
        if (delay < 10000) {
          delay = 10000
        } else if (delay < 30000) {
          delay = 30000
        } else {
          delay = MAX_RECONNECT_DELAY
        }
        connect()
      }, delay)
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      try {
        ws?.close()
      } catch {}
    }
  }, [pending, navigate])

  const onLogout = () => {
    localStorage.removeItem('pendingRegistration')
    sessionStorage.removeItem('pendingVerifyToken')
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
            <button type="button" className={styles.button} onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pending
