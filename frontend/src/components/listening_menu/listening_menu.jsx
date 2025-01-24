import {useState, useEffect} from 'react';
import {Input, Button, message, Spin} from 'antd';
import {useNavigate} from 'react-router-dom';

const Listening_menu = ({ setError }) => {
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [isDisabled, setIsDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [isBlurred, setIsBlurred] = useState(true); // Состояние для размытия

    const navigate = useNavigate();

    // useEffect для проверки доступности сервера
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/check_user_verification', {
                    method: 'GET',
                    credentials: 'include',
                })  // Замените на ваш реальный эндпоинт
                if (!response.ok) {
                    const errorData = await response.json();
                    setError(`Ошибка: ${response.status} - ${errorData.detail || 'No details provided'}`); // Устанавливаем сообщение об ошибке

                } else {
                    setIsBlurred(false); // Устанавливаем состояние размытия
                }


            } catch (error) {
                console.error('Ошибка при обращении к серверу:', error);
                setIsBlurred(true); // Устанавливаем состояние размытия
            }
        };

        checkServerStatus();
    }, [setError]);

    const handleInputChange = (field, value) => {
        if (field === 'field1') setField1(value);
        if (field === 'field2') setField2(value);

        const currentField1 = field === 'field1' ? value : field1;
        const currentField2 = field === 'field2' ? value : field2;

        setIsDisabled(!(currentField1.trim() || currentField2.trim()));
    };

    const handleRandomClick = async () => {
        setLoading(true);
        setLoadingStatus('');

        try {
            const params = new URLSearchParams({
                rq_artist_name: field1 || '',
                rq_song_name: field2 || ''
            });

            const eventSource = new EventSource(`http://localhost:8000/sse_create_session?${params.toString()}`, {
                withCredentials: true // Убедитесь, что куки передаются при настройке сервером.
            });

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.status !== 'Нет слов или mp3 трека, попробуй выбрать другой' && data.status !== 'completed') {
                    setLoadingStatus(data.status);
                } else if (data.status === 'completed') {
                    eventSource.close();
                    setLoading(false);
                    navigate(`/session/${data.session_id}`, {
                        state: {
                            session_id: data.session_id,
                            lyrics: data.lyrics,
                            image_url: data.image_url,
                            artist_name: data.artist_name,
                            song_title: data.song_title,
                        },
                    });
                } else {
                    setLoadingStatus(data.status);
                    eventSource.close();
                    setLoading(false);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Ошибка подключения:', error);
                message.error('Ошибка при получении данных от сервера.');
                eventSource.close();
                setLoading(false);
            };

        } catch (error) {
            console.error('Ошибка:', error);
            message.error('There was an error with your request.');
            setLoading(false);
        }
    };

    return (
        <div
            className="space-y-20"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                minHeight: 380,
                filter: isBlurred ? 'blur(2px)' : 'none', // Применяем размытие
                pointerEvents: isBlurred ? 'none' : 'auto', // Делаем некликабельным
            }}
        >
            <div className="space-y-6" style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
                <span style={{
                    display: 'flex',
                    justifyContent: 'center'
                }}>Слушай определенный трек</span>

                <div className="space-y-2" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <Input
                        style={{minWidth: '250px'}}
                        placeholder="Имя артиста/название группы"
                        value={field1}
                        onChange={(e) => handleInputChange('field1', e.target.value)}
                        required
                    />
                    <Input
                        style={{minWidth: '250px'}}
                        placeholder="Название трека"
                        value={field2}
                        onChange={(e) => handleInputChange('field2', e.target.value)}
                        required
                    />
                    <Button onClick={handleRandomClick}
                            type="primary"
                            htmlType="submit"
                            disabled={isDisabled}
                            style={{
                                minWidth: '100px',
                                backgroundColor: isDisabled ? 'grey' : '',
                                borderColor: isDisabled ? 'grey' : '',
                                alignSelf: 'center',
                            }}>
                        Начать 🎧
                    </Button>
                </div>
            </div>
            <div className="space-y-6" style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
                <span>Или выбери случайный</span>
                <Button style={{
                    minWidth: '70px',
                    minHeight: '70px',
                    fontSize: '40px'
                }}
                        type="primary"
                        onClick={handleRandomClick}>
                    🎲
                </Button>
                {loading && <Spin style={{marginTop: '20px'}}/>}
                <div style={{
                    marginTop: '20px',
                    whiteSpace: 'pre-wrap',
                }}>{loadingStatus}</div>
            </div>
        </div>
    );
};

export default Listening_menu;
