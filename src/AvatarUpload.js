import React, { useState, useRef } from 'react';
import { Storage } from './storage';

const AvatarUpload = ({ username, currentAvatar, onAvatarChange, onClose }) => {
  const [preview, setPreview] = useState(currentAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения');
      return;
    }

    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 2MB');
      return;
    }

    setError('');
    
    // Создаем предпросмотр
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || preview === currentAvatar) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

     try {
    Storage.saveUserAvatar(username, preview);
    
    // Триггерим событие изменения localStorage
    window.dispatchEvent(new Event('storage'));
      // Обновляем родительский компонент
      if (onAvatarChange) {
        onAvatarChange(preview);
      }
      
      onClose();
    } catch (err) {
      setError('Ошибка при сохранении аватара');
      console.error('Ошибка загрузки аватара:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setLoading(true);
    setError('');
    
    try {
      Storage.deleteUserAvatar(username);
      setPreview(null);
       window.dispatchEvent(new Event('storage'));
      if (onAvatarChange) {
        onAvatarChange(null);
      }
      
      onClose();
    } catch (err) {
      setError('Ошибка при удалении аватара');
      console.error('Ошибка удаления аватара:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickAvatar = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="avatar-upload-modal">
      <div className="avatar-upload-content">
        <h3>Изменение аватара</h3>
        
        <div className="avatar-preview-container">
          <div 
            className="avatar-preview"
            onClick={handleClickAvatar}
            style={{ cursor: 'pointer' }}
          >
            {preview ? (
              <img 
                src={preview} 
                alt="Предпросмотр аватара" 
                className="avatar-preview-image"
              />
            ) : (
              <div className="avatar-placeholder">
                <span>Выберите фото</span>
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <div className="avatar-instructions">
            <p>• Нажмите на изображение для выбора файла</p>
            <p>• Поддерживаются JPG, PNG, GIF</p>
            <p>• Максимальный размер: 2MB</p>
          </div>
        </div>
        
        {error && <div className="error-message" style={{ margin: '1rem 0' }}>{error}</div>}
        
        <div className="avatar-actions">
          <button
            className="avatar-btn avatar-btn-primary"
            onClick={handleUpload}
            disabled={loading || !preview || preview === currentAvatar}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          
          {currentAvatar && (
            <button
              className="avatar-btn avatar-btn-danger"
              onClick={handleRemoveAvatar}
              disabled={loading}
            >
              Удалить аватар
            </button>
          )}
          
          <button
            className="avatar-btn avatar-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;