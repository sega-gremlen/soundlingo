import React, { useState, useEffect } from 'react';
import { Input, Button, message, Spin, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';

const ListeningMenu = ({ setError }) => {
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [isDisabled, setIsDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [isBlurred, setIsBlurred] = useState(true); // State for blur

    const navigate = useNavigate();

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
        if (field === 'field1') setField1(value);
        if (field === 'field2') setField2(value);

        // Проверяем только поле Artist name/band title (field1)
        setIsDisabled(!field1.trim()); // Кнопка активна, только если field1 не пустое
    };

    // Обновляем состояние кнопки при изменении field1
    useEffect(() => {
        setIsDisabled(!field1.trim());
    }, [field1]);

    const handleRandomClick = async () => {
        setLoading(true);
        setLoadingStatus('');

        try {
            const params = new URLSearchParams({
                rq_artist_name: '',
                rq_song_name: ''
            });

            const eventSource = new EventSource(`http://localhost:8000/sse_create_session?${params.toString()}`, {
                withCredentials: true // Ensure cookies are passed when configured by the server.
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
                        flexDirection: 'column'
                    }}>
                        <Input
                            style={{ minWidth: '250px' }}
                            placeholder="Artist name/band title"
                            value={field1}
                            onChange={(e) => handleInputChange('field1', e.target.value)}
                            required
                        />
                        <Input
                            style={{ minWidth: '250px' }}
                            placeholder="Track title"
                            value={field2}
                            onChange={(e) => handleInputChange('field2', e.target.value)}
                            required
                        />
                        <Button onClick={handleRandomClick}
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
                            <Spin />
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