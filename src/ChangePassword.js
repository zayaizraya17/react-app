// ChangePassword.js - исправленная версия
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function ChangePassword() {
  const navigate = useNavigate();
  const { currentUser, user } = useAuth();
  
  // Используем активного пользователя
  const activeUser = user || currentUser;
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Проверка силы пароля
  const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, message: '' };
    
    let score = 0;
    const messages = [];
    
    // Проверка длины
    if (password.length >= 8) score += 1;
    else messages.push('Минимум 8 символов');
    
    // Проверка наличия цифр
    if (/\d/.test(password)) score += 1;
    else messages.push('Добавьте цифры');
    
    // Проверка наличия букв в верхнем регистре
    if (/[A-Z]/.test(password)) score += 1;
    else messages.push('Добавьте заглавные буквы');
    
    // Проверка наличия специальных символов
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else messages.push('Добавьте специальные символы');
    
    let strength = 'слабый';
    let color = '#dc3545';
    
    if (score >= 4) {
      strength = 'сильный';
      color = '#28a745';
    } else if (score >= 3) {
      strength = 'средний';
      color = '#ffc107';
    }
    
    return {
      score,
      strength,
      color,
      messages: messages.length > 0 ? messages : ['Хороший пароль!']
    };
  };
  
  const passwordStrength = checkPasswordStrength(formData.newPassword);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Валидация
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Все поля обязательны для заполнения');
      setLoading(false);
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      setLoading(false);
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      setLoading(false);
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Пароль слишком слабый. Улучшите его согласно рекомендациям');
      setLoading(false);
      return;
    }
    
    // Имитация запроса на сервер
    try {
      // Получаем всех пользователей из localStorage
      const users = JSON.parse(localStorage.getItem('tic-tac-toe_users') || '[]');
      const currentUserIndex = users.findIndex(u => u.username === activeUser?.username);
      
      if (currentUserIndex === -1) {
        setError('Пользователь не найден');
        setLoading(false);
        return;
      }
      
      // Проверяем текущий пароль
      if (users[currentUserIndex].password !== formData.currentPassword) {
        setError('Текущий пароль неверен');
        setLoading(false);
        return;
      }
      
      // Обновляем пароль
      users[currentUserIndex].password = formData.newPassword;
      
      // Сохраняем дату изменения пароля
      users[currentUserIndex].passwordChangedAt = new Date().toISOString();
      
      // Сохраняем обновленных пользователей
      localStorage.setItem('tic-tac-toe_users', JSON.stringify(users));
      
      // Сохраняем информацию о пароле для текущего пользователя
      const passwordInfo = {
        username: activeUser.username,
        changedAt: new Date().toISOString(),
        isExpired: false,
        ageInDays: 0
      };
      localStorage.setItem(`tic-tac-toe_password_${activeUser.username}`, JSON.stringify(passwordInfo));
      
      setSuccess('Пароль успешно изменен!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Автоматический редирект через 3 секунды
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
      
    } catch (err) {
      console.error('Ошибка при смене пароля:', err);
      setError('Произошла ошибка при смене пароля. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!activeUser) {
    return (
      <div className="main-content with-topbar">
        <div className="not-found">
          <h2>Ошибка авторизации</h2>
          <p>Для смены пароля необходимо войти в систему.</p>
          <button 
            onClick={() => navigate('/login')}
            className="play-btn"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content with-topbar">
      <div className="auth-page">
        <div className="auth-container">
          <h2>🔒 Смена пароля</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ 
              color: '#28a745', 
              padding: '1rem',
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              borderRadius: '5px',
              marginBottom: '1rem'
            }}>
              {success}
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Вы будете перенаправлены в профиль через 3 секунды...
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Текущий пароль:</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Введите текущий пароль"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Новый пароль:</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Введите новый пароль"
                disabled={loading}
                required
              />
              
              {/* Индикатор силы пароля */}
              {formData.newPassword && (
                <div className="password-strength-meter" style={{ marginTop: '0.5rem' }}>
                  <div 
                    className="password-strength-meter-fill"
                    style={{
                      width: `${(passwordStrength.score / 4) * 100}%`,
                      backgroundColor: passwordStrength.color,
                      height: '4px',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}
                  ></div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '0.25rem',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: passwordStrength.color, fontWeight: 'bold' }}>
                      {passwordStrength.strength.toUpperCase()}
                    </span>
                    <span style={{ color: '#6c757d' }}>
                      {passwordStrength.score}/4
                    </span>
                  </div>
                </div>
              )}
              
              {/* Рекомендации по паролю */}
              <div className="password-requirements" style={{ 
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: '#6c757d'
              }}>
                {formData.newPassword ? (
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                    {[
                      { text: 'Минимум 8 символов', met: formData.newPassword.length >= 8 },
                      { text: 'Содержит цифры', met: /\d/.test(formData.newPassword) },
                      { text: 'Содержит заглавные буквы', met: /[A-Z]/.test(formData.newPassword) },
                      { text: 'Содержит спецсимволы', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) }
                    ].map((req, index) => (
                      <li key={index} style={{ 
                        color: req.met ? '#28a745' : '#dc3545',
                        fontWeight: req.met ? 'bold' : 'normal'
                      }}>
                        {req.met ? '✓ ' : '✗ '}{req.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Пароль должен содержать минимум 8 символов, цифры, заглавные буквы и специальные символы</p>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите новый пароль:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите новый пароль"
                disabled={loading}
                required
              />
              {formData.newPassword && formData.confirmPassword && (
                <div style={{ 
                  marginTop: '0.25rem',
                  fontSize: '0.85rem',
                  color: formData.newPassword === formData.confirmPassword ? '#28a745' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  {formData.newPassword === formData.confirmPassword 
                    ? '✓ Пароли совпадают' 
                    : '✗ Пароли не совпадают'}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            >
              {loading ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              <button 
                type="button"
                onClick={() => navigate('/profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF7A45',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textDecoration: 'underline'
                }}
              >
                ← Вернуться в профиль
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;