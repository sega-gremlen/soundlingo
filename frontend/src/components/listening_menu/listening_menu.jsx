import {useState, useEffect, useCallback} from 'react';
import {Input, Button, message, Spin, Divider, List, AutoComplete} from 'antd';
import {useNavigate} from 'react-router-dom';
import {debounce} from 'lodash';

const ListeningMenu = ({setError}) => {
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [isDisabled, setIsDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [isBlurred, setIsBlurred] = useState(true); // State for blur
    const navigate = useNavigate();
    // Для автокомплита
    const [isSearching, setIsSearching] = useState(false);
    const [autoCompleteTrackOptions, setAutoCompleteTrackOptions] = useState([]);
    const [isSearchingTrack, setIsSearchingTrack] = useState(false);
    const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);
    const SPOTIFY_CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;

    // Хук для получения токена
    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = localStorage.getItem('spotify_token');
            const tokenExpiry = localStorage.getItem('spotify_token_expiry');
            const now = new Date().getTime();

            // Если есть действующий токен в localStorage, используем его
            if (storedToken && tokenExpiry && now < tokenExpiry) {
                console.log('Используем токен из localStorage');
                return;
            }

            try {
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
                    },
                    body: 'grant_type=client_credentials'
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('spotify_token', data.access_token);
                    localStorage.setItem('spotify_token_expiry', new Date().getTime() + (data.expires_in * 1000));
                    console.log('Токен успешно получен и сохранён в localStorage');
                } else {
                    console.error('Ошибка получения токена:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка запроса токена:', error);
            }
        };

        fetchToken();
    }, []);

    const searchArtists = useCallback(
        debounce(async (query) => {
            if (!query) {
                setAutoCompleteOptions([]);
                return;
            }

            setIsSearching(true);
            const token = localStorage.getItem('spotify_token');

            try {
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
                    headers: {Authorization: `Bearer ${token}`},
                });

                if (response.ok) {
                    const data = await response.json();
                    setAutoCompleteOptions(
                        data.artists.items.map(artist => ({
                            value: artist.name,
                            label: artist.name,
                        }))
                    );
                }
            } catch (error) {
                console.error('Ошибка:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        []
    );

    // Функция поиска треков с учетом артиста
    const searchTracks = useCallback(
        debounce(async (trackQuery, artistQuery) => {
            if (!trackQuery || !artistQuery) {
                setAutoCompleteTrackOptions([]);
                return;
            }

            setIsSearchingTrack(true);
            const token = localStorage.getItem('spotify_token');

            try {
                const response = await fetch(
                    `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(trackQuery)}+artist:${encodeURIComponent(artistQuery)}&type=track&limit=5`,
                    {
                        headers: {Authorization: `Bearer ${token}`},
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setAutoCompleteTrackOptions(
                        data.tracks.items.map(track => ({
                            value: track.name,
                            label: track.name,
                        }))
                    );
                }
            } catch (error) {
                console.error('Ошибка:', error);
            } finally {
                setIsSearchingTrack(false);
            }
        }, 300),
        []
    );

    // useEffect to check server availability
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/check_user_verification', {
                    method: 'GET',
                    credentials: 'include',
                });  // Replace with your actual endpoint
                if (!response.ok) {
                    const errorData = await response.json();
                    setError(`Error: ${response.status} - ${errorData.detail || 'No details provided'}`); // Set error message
                } else {
                    setIsBlurred(false); // Set blur state
                }
            } catch (error) {
                console.error('Error accessing the server:', error);
                setIsBlurred(true); // Set blur state
            }
        };

        checkServerStatus();
    }, [setError]);

    const handleInputChange = (field, value) => {
        if (field === 'field1') {
            setField1(value);
            searchArtists(value);
        }
        if (field === 'field2') setField2(value);

        // Проверяем только поле Artist name/band title (field1)
        setIsDisabled(!field1.trim()); // Кнопка активна, только если field1 не пустое
    };

    // Модифицированный обработчик изменения поля трека
    const handleTrackInputChange = (value) => {
        setField2(value);
        if (field1.trim()) { // Ищем треки только если указан артист
            searchTracks(value, field1);
        }
    };

    // Обновляем поиск треков при изменении артиста
    useEffect(() => {
        if (field2.trim() && field1.trim()) {
            searchTracks(field2, field1);
        }
    }, [field1]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSessionRequest = async (artist = '', song = '') => {
        setLoading(true);
        setLoadingStatus('');

        try {
            const params = new URLSearchParams({
                rq_artist_name: artist,
                rq_song_name: song
            });

            const eventSource = new EventSource(`http://localhost:8000/sse_create_session?${params.toString()}`, {
                withCredentials: true
            });

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.status !== 'No lyrics or mp3 track, try choosing another' && data.status !== 'completed') {
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
                            peaks: data.peaks,
                            duration: data.duration,
                        },
                    });
                } else {
                    setLoadingStatus(data.status);
                    eventSource.close();
                    setLoading(false);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Connection error:', error);
                message.error('Error receiving data from the server.');
                eventSource.close();
                setLoading(false);
            };

        } catch (error) {
            console.error('Error:', error);
            message.error('There was an error with your request.');
            setLoading(false);
        }
    };

// Обработчики для кнопок
    const handleStartClick = () => {
        handleSessionRequest(field1, field2);
    };

    const handleRandomClick = () => {
        handleSessionRequest('', '');
    };

    return (
        <div style={{
            display: "flex",
            height: "100%",
            width: "100%",
            position: "absolute",
            alignItems: "center",
            justifyItems: "center",
            alignContent: "center",
            justifyContent: "center"
        }}>
            <div
                style={{
                    justifyContent: "space-between",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: 'center',
                    minHeight: 340,
                    filter: isBlurred ? 'blur(2px)' : 'none', // Apply blur
                    pointerEvents: isBlurred ? 'none' : 'auto', // Make non-clickable
                    position: "relative",
                }}
            >
                <div>
                    <span style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '12px',
                    }}>Listen to a specific track</span>

                    <div className="space-y-2" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        position: 'relative'
                    }}>
                        <AutoComplete
                            style={{minWidth: '250px'}}
                            placeholder="Artist name/band title"
                            value={field1}
                            onChange={(value) => handleInputChange('field1', value)}
                            onSelect={(value) => handleInputChange('field1', value)}
                            options={autoCompleteOptions}
                            suffix={isSearching ? <Spin size="small"/> : null}
                            dropdownStyle={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                marginTop: '4px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                        />
                        <AutoComplete
                            style={{minWidth: '250px'}}
                            placeholder="Track title"
                            value={field2}
                            onChange={handleTrackInputChange}
                            onSelect={(value) => setField2(value)}
                            options={autoCompleteTrackOptions}
                            suffix={isSearchingTrack ? <Spin size="small"/> : null}
                            dropdownStyle={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                marginTop: '4px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                            disabled={!field1.trim()} // Блокируем поле пока не выбран артист
                        />
                        <Button onClick={handleStartClick}
                                type="primary"
                                htmlType="submit"
                                disabled={isDisabled || loading} // Disable if loading or field1 is empty
                                style={{
                                    minWidth: '100px',
                                    backgroundColor: (isDisabled || loading) ? 'grey' : 'black',
                                    borderColor: (isDisabled || loading) ? 'grey' : '',
                                    alignSelf: 'center',
                                }}>
                            Start 🎧
                        </Button>
                    </div>
                </div>
                <Divider
                    style={{
                        fontWeight: 400,
                        color: '#b5b5b5'
                    }}>Or</Divider>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}>
                    <span
                        style={{
                            marginBottom: '12px'
                        }}
                    >Choose a random one</span>
                    <Button
                        style={{
                            minWidth: '70px',
                            minHeight: '70px',
                            fontSize: '40px',
                            backgroundColor: loading ? 'grey' : 'black' // Change color if loading
                        }}
                        type="primary"
                        onClick={handleRandomClick}
                        disabled={loading} // Disable if loading
                    >
                        🎲
                    </Button>
                </div>
            </div>

            <div style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                textAlign: "center",
                top: "72%",
                left: "50%",
                transform: "translateX(-50%)",
            }}
            >
                {/* Спин */}
                <div style={{}}>
                    {
                        loading
                        && (
                            <Spin/>
                        )}
                </div>

                {/* Статус зарузки сессии */}
                <div
                    style={{
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                    }}>
                    {loadingStatus}
                </div>
            </div>

        </div>
    );
};

export default ListeningMenu;