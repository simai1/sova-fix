import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterPublicMutation } from '../../../../API/rtkQuery/auth.api'
import styles from '../Authorization.module.scss'

function Register() {
  const navigate = useNavigate()
  const [registerPublic, { isLoading }] = useRegisterPublicMutation()
  const [form, setForm] = useState({
    name: '',
    login: '',
    password: '',
    confirm: '',
    role: 3,
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'role' ? Number(value) : value,
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Введите ФИО'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.login)) e.login = 'Введите корректный email'
    if (form.password.length < 6) e.password = 'Минимум 6 символов'
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают'
    if (![3, 4].includes(form.role)) e.role = 'Выберите роль'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async () => {
    setServerError('')
    if (!validate()) return
    try {
      const resp = await registerPublic({
        login: form.login,
        password: form.password,
        name: form.name,
        role: form.role,
      }).unwrap()
      localStorage.setItem(
        'pendingRegistration',
        JSON.stringify({
          userId: resp.userId,
          login: resp.login,
          name: resp.name,
          role: resp.role,
        }),
      )
      // pendingVerifyToken — одноразовый токен для ws-handshake pending.<token>.
      // Кладём в sessionStorage (вкладка-scoped: при закрытии вкладки токен
      // теряется, юзер вернётся через bookmark и будет ждать manual refresh —
      // это OK, токен не secret-уровня и через 24h всё равно протухнет).
      // Старые backend'ы pendingVerifyToken не возвращают — флоу деградирует
      // до текущего поведения (manual refresh).
      if (resp.pendingVerifyToken) {
        sessionStorage.setItem('pendingVerifyToken', resp.pendingVerifyToken)
      } else {
        sessionStorage.removeItem('pendingVerifyToken')
      }
      navigate('/Authorization/Pending')
    } catch (err) {
      setServerError(err?.data?.message || 'Ошибка регистрации. Попробуйте позже')
    }
  }

  return (
    <div className={styles.AuthorRegistrar}>
      <div>
        <div className={styles.box}>
          <div className={styles.text_Logo}>
            <img src="./img/SOVA.jpg" className={styles.LogoAuth} alt="logo" />
          </div>
          <div className={styles.container}>
            <h2>Регистрация</h2>

            <input
              type="text"
              name="name"
              placeholder="ФИО"
              aria-label="ФИО"
              value={form.name}
              onChange={onChange}
              style={{ borderColor: errors.name ? 'red' : '' }}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}

            <input
              type="text"
              name="login"
              placeholder="Email"
              aria-label="Email"
              value={form.login}
              onChange={onChange}
              style={{ borderColor: errors.login ? 'red' : '' }}
            />
            {errors.login && <span className={styles.errorText}>{errors.login}</span>}

            <input
              type="password"
              name="password"
              placeholder="Пароль"
              aria-label="Пароль"
              value={form.password}
              onChange={onChange}
              style={{ borderColor: errors.password ? 'red' : '' }}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}

            <input
              type="password"
              name="confirm"
              placeholder="Подтверждение пароля"
              aria-label="Подтверждение пароля"
              value={form.confirm}
              onChange={onChange}
              style={{ borderColor: errors.confirm ? 'red' : '' }}
            />
            {errors.confirm && <span className={styles.errorText}>{errors.confirm}</span>}

            <select
              name="role"
              aria-label="Роль"
              value={form.role}
              onChange={onChange}
              className={styles.select}
            >
              <option value={3}>Заказчик</option>
              <option value={4}>Исполнитель</option>
            </select>

            <button
              type="button"
              className={styles.button}
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
            </button>

            <Link to="/Authorization" className={styles.resetPassword}>
              Уже есть аккаунт? Войти
            </Link>

            {serverError && <span className={styles.errorText}>{serverError}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
