import {useState, useEffect} from 'react';
import {Layout, theme} from 'antd';
import {BrowserRouter as Router, Route, Routes, useNavigate, useLocation} from 'react-router-dom';
import Listening_menu from "./components/listening_menu/listening_menu.jsx";
import MyProfile from "./components/profile_menu/menu_profile.jsx";
import About from "./components/about.jsx";
import Session from "./components/listening_menu/session.jsx";
import Signup_test from "./components/profile_menu/signup.jsx";

const App = () => {
    const {Header, Content, Footer} = Layout;

    const MainLayout = () => {
        const menuLabels = ['Мой профиль', 'Аудирование', 'О проекте'];
        const location = useLocation();
        const navigate = useNavigate();

        const getInitialActiveTab = () => {
            switch (location.pathname) {
                case '/':
                    return '2'; // "Аудирование"
                case '/signup':
                    return '1';
                case '/profile':
                    return '1'; // "Мой профиль"
                case '/about':
                    return '3'; // "О проекте"
                default:
                    return '2'; // По умолчанию - "Аудирование"
            }
        };

        const [activeTab, setActiveTab] = useState(getInitialActiveTab());
        const [hoveredKey, setHoveredKey] = useState(null);
        const [error, setError] = useState(null); // Состояние для ошибок

        useEffect(() => {
            setActiveTab(getInitialActiveTab());
        }, [location.pathname]);

        const {
            token: {colorBgContainer, borderRadiusLG},
        } = theme.useToken();

        const handleMenuClick = (key) => {
            setActiveTab(key);
            switch (key) {
                case '1':
                    navigate('/profile');
                    break;
                case '2':
                    navigate('/');
                    break;
                case '3':
                    navigate('/about');
                    break;
            }
        };

        const commonStyle = {
            color: 'white',
            flex: 1,
            transition: 'background-color 0.3s ease',
        };

        const activeStyle = {
            backgroundColor: 'rgba(24, 144, 255, 0.6)',
        };

        const hoverStyle = {
            backgroundColor: 'rgba(24, 144, 255, 0.3)',
        };

        const menuItems = menuLabels.map((label, index) => ({
            key: String(index + 1),
            label,
            style: commonStyle,
            activeStyle,
        }));

        return (
            <Layout style={{
                minHeight: '900px',
            }}>
                <Header
                    style={{
                        position: 'sticky',
                        top: 2,
                        zIndex: 123,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#001529',
                    }}
                >
                    {menuItems.map((item) => (
                        <div
                            key={item.key}
                            onClick={() => handleMenuClick(item.key)}
                            onMouseEnter={() => setHoveredKey(item.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            style={{
                                ...item.style,
                                ...(activeTab === item.key ? item.activeStyle : {}),
                                ...(hoveredKey === item.key ? hoverStyle : {}),
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </Header>
                <Content
                    style={{
                        display: 'flex',
                        alignItems: "center",
                        justifyContent: "center",
                        padding: '24px 12px',
                        flexDirection: "column",
                        // width: '100%',
                        // textAlign: 'center',
                    }}
                >
                    <div style={{
                        position: 'relative'
                    }}>
                        {error && (
                            <div style={{
                                position: "absolute",
                                bottom: '102%', // Позиционируем от нижней границы
                                // transform: 'translateY(-100%)', // Смещаем его вверх на свою
                                backgroundColor: '#fff3cd',
                                color: '#856404',
                                padding: '10px 15px',
                                borderRadius: borderRadiusLG,
                                width: '100%',
                                textAlign: 'center',
                            }}>
                                {error}
                            </div>
                        )}
                        <div style={{
                            padding: 24,
                            flexDirection: "column",
                            alignItems: 'center',
                            display: 'flex',
                            justifyContent: 'center',
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}>
                            <Routes>
                                <Route path="/" element={<Listening_menu setError={setError}/>}/>
                                <Route path="/profile" element={<MyProfile setError={setError}/>}/>
                                <Route path="/about" element={<About setError={setError}/>}/>
                                <Route path="/session/:sessionId" element={<Session setError={setError}/>}/>
                                {/*<Route path="/signup" element={<Register setError={setError}/>}/>*/}
                                <Route path="/signup" element={<Signup_test setError={setError}/>}/>

                            </Routes>
                        </div>
                    </div>

                </Content>
                <Footer
                    style={{
                        textAlign: 'center',
                    }}
                >
                    Created by <a href="https://github.com/sega-gremlen" className="text-blue-700">@sega-gremlen</a>
                </Footer>
            </Layout>
        );
    };

    return (
        <Router>
            <MainLayout/>
        </Router>
    );
};

export default App;
