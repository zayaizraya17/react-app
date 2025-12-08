import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const result = await login(username, password);
      if (result.success) {
        // Перенаправление на дашборд
        window.location.href = '/dashboard';
      } else {
        setError('Неверные учетные данные');
      }
    } catch (err) {
      setError('Ошибка при входе');
    }
  };

  return (
    <div className="auth-form">
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" className="submit-btn">
          Войти
        </button>
      </form>
      
      <div className="switch-form">
        <p>Нет аккаунта? <button onClick={onSwitchToRegister} className="link-btn">Зарегистрироваться</button></p>
      </div>
    </div>
  );
}