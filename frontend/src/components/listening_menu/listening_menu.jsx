import React, {useState, useEffect} from 'react';
import {Input, Button, message, Spin, Divider} from 'antd';
import {useNavigate} from 'react-router-dom';

const ListeningMenu = ({setError}) => {
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
        <div
            // className="space-y-20"
            style={{
                justifyContent: "space-between",
                display: "flex",
                flexDirection: "column",
                alignItems: 'center',
                // justifyContent: 'center',
                // padding: 24,
                minHeight: 380,
                filter: isBlurred ? 'blur(2px)' : 'none', // Apply blur
                pointerEvents: isBlurred ? 'none' : 'auto', // Make non-clickable
            }}
        >
            <div
                // className="space-y-6"
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    // borderBottom: "1px solid #ddd"
                }}>
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
                        style={{minWidth: '250px'}}
                        placeholder="Artist name/band name"
                        value={field1}
                        onChange={(e) => handleInputChange('field1', e.target.value)}
                        required
                    />
                    <Input
                        style={{minWidth: '250px'}}
                        placeholder="Track name"
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
                                backgroundColor: isDisabled ? 'grey' : 'black',
                                borderColor: isDisabled ? 'grey' : '',
                                alignSelf: 'center',
                            }}>
                        Start 🎧
                    </Button>
                </div>
            </div>
            <Divider
                style={{
                    // margin: '24px 0',
                    fontWeight: 400,
                    color: '#b5b5b5'
            }}>Or</Divider>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    flex: 1,
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
                        backgroundColor: "black"
                    }}
                    type="primary"
                    onClick={handleRandomClick}>
                    🎲
                </Button>
                {loading && <Spin
                    style={{
                        marginTop: '20px'
                    }}/>}
                <div
                    style={{
                        marginTop: '20px',
                        whiteSpace: 'pre-wrap',
                    }}>{loadingStatus}</div>
            </div>
        </div>
    );
};

export default ListeningMenu;