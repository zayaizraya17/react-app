import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function RegisterForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) newErrors.username = 'Имя пользователя обязательно';
    if (!formData.password) newErrors.password = 'Пароль обязателен';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (!formData.fullName) newErrors.fullName = 'Полное имя обязательно';
    if (!formData.email) newErrors.email = 'Email обязателен';
    
    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await register(formData);
      if (result.success) {
        // Перенаправление на дашборд
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setErrors({ submit: 'Ошибка при регистрации' });
    }
  };

  return (
    <div className="auth-form">
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Придумайте имя пользователя"
          />
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Придумайте пароль"
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Подтвердите пароль:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Повторите пароль"
          />
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="fullName">Полное имя:</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Введите ваше полное имя"
          />
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Телефон:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Введите номер телефона"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Введите ваш email"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        
        <button type="submit" className="submit-btn">
          Зарегистрироваться
        </button>
      </form>
      
      <div className="switch-form">
        <p>Уже есть аккаунт? <button onClick={onSwitchToLogin} className="link-btn">Войти</button></p>
      </div>
    </div>
  );
}