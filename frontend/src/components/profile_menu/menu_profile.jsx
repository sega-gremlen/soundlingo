import React, {useEffect, useState} from 'react';
import {Spin, Modal} from 'antd';
import ProfileForm from './profile.jsx';
import {useLocation, useNavigate} from "react-router-dom";
import LoginTest from "./login.jsx";

const MyProfile = ({setError}) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();


    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const emailVerified = searchParams.get('email_verified');

        if (emailVerified === 'true') {
            navigate('/profile', {replace: true});
            Modal.success({
                title: 'Email подтвержден',
                content: 'Email успешно подтвержден! Теперь вы можете пользоваться всеми функциями.',
                onOk: () => navigate('/profile', {replace: true}) // Перенаправляем после закрытия модального окна
            });
        } else if (emailVerified === 'false') {
            navigate('/profile', {replace: true});
            Modal.error({
                title: 'Ошибка',
                content: 'Пользователь не существует.',
            });
        }
    }, [location, navigate]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('http://localhost:8000/my_profile', {
                    method: 'GET',
                    credentials: 'include',
                });

                // Проверяем статус ответа
                if (response.status === 307) {
                    Modal.success({
                        title: 'Email подтвержден',
                        content: 'Ваш адрес электронной почты успешно подтвержден! Теперь вы можете пользоваться всеми функциями.',
                    });
                    return; // Выходим, так как уже обработали этот случай
                }

                if (response.status === 401) {
                    setIsUnauthorized(true);
                    const errorData = await response.text();
                    console.error('Unauthorized (401):', errorData);
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch profile data');
                }

                // Здесь мы преобразуем ответ в JSON
                const data = await response.json();
                setProfileData(data); // Сохраняем объект профиля в состояние
            } catch (error) {
                console.error('Error fetching profile:', error);
                setIsUnauthorized(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [setError]);

    if (loading) {
        return <div style={{
            display: "flex",
            height: "100%",
            width: "100%",
            position: "absolute",
            alignItems: "center",
            justifyItems: "center",
            alignContent: "center",
            justifyContent: "center"
        }}>

            <Spin size="large"/>
        </div>;

    }

    if (isUnauthorized) {
        return <LoginTest setError={setError}/>;
    }

    return <ProfileForm profileData={profileData}/>; // Передаем объект профиля
};

export default MyProfile;
