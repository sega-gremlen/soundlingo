import {Button, List, Pagination} from "antd"; // Импортируем компоненты из Ant Design
import React, {useState} from "react";

const ProfileForm = ({profileData}) => {
    const authTokenTitle = import.meta.env.VITE_APP_AUTH_TOKEN_TITLE;
    const [currentPage, setCurrentPage] = useState(1); // Состояние для текущей страницы
    const pageSize = 5; // Количество элементов на странице

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8000/logout', {
                method: 'GET',
                credentials: 'include', // Включает cookie в запрос
            });

            if (response.ok) {
                // Проверяем, что кука отсутствует, обновляем страницу
                const cookies = document.cookie;
                if (!cookies.includes(authTokenTitle)) {
                    window.location.reload();
                } else {
                    console.error('Failed to delete cookie');
                }
            } else {
                console.error('Failed to log out');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    // Обработчик изменения страницы
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Получение отсечённых данных для отображения
    const paginatedSessions = profileData.sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Обработчик клика по элементу списка
    const handleSessionClick = (id) => {
        window.open(`/session/${id}`, '_blank'); // Открываем сессию в новой вкладке
    };

    return (
        <div
            className="space-y-10"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // height: '100%',
                height: 510,
                // width: 300,
                position: 'relative'
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between', // Раздвигаем элементы по краям
                alignItems: 'center', // Центрируем по вертикали
                width: '100%', // Занимаем всю ширину родителя
                padding: '0 10px', // Немного отступа слева и справа
            }}>
                <h1
                    style={{
                        marginBottom: "10px"
                    }}
                >
                    ID: {profileData.user_id}
                </h1>

                <Button onClick={handleLogout}>Выйти из профиля</Button>
            </div>

            <div
                className='space-y-2'
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center', // Раздвигаем элементы по краям
                    alignContent: 'center',
                    justifyItems: 'center'
                }}
            >
                <Pagination
                    style={{
                        justifyContent: 'center', // Раздвигаем элементы по краям
                    }}
                    current={currentPage}
                    pageSize={pageSize}
                    total={profileData.sessions.length} // Общее количество элементов
                    onChange={handlePageChange} // Обработчик изменения страницы
                />
                <List style={{
                    width: 500
                }}
                    header={<div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >Your Sessions</div>} // Заголовок списка
                    bordered
                    dataSource={paginatedSessions} // Используем отсечённые данные
                    renderItem={item => ( // Форматирование каждой сессии
                        <List.Item
                            onClick={() => handleSessionClick(item.id)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: '#f0f0f0', // Цвет фона при наведении
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e6f7ff'} // Цвет фона при наведении
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0f0f0'} // Возврат к исходному цвету
                        >
                            <div style={{
                                // width: 300,
                                whiteSpace: 'nowrap', // Не переносить текст
                                overflow: 'hidden', // Скрыть переполнение
                                textOverflow: 'ellipsis', // Добавить многоточие
                            }}>
                                <strong>{item.title}</strong> by {item.artist_name}<br/>
                                {item.created_date}
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
};

export default ProfileForm;
