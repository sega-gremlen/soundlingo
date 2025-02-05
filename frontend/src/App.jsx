import { useState, useEffect } from 'react';
import { Layout, theme, ConfigProvider } from 'antd';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Listening_menu from "./components/listening_menu/listening_menu.jsx";
import MyProfile from "./components/profile_menu/menu_profile.jsx";
import About from "./components/about_menu/about.jsx";
import Session from "./components/listening_menu/session.jsx";
import Signup_test from "./components/profile_menu/signup.jsx";
import Leaderbord from "./components/leaderbord_menu/leaderbord.jsx";

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
    const menuLabels = ['My profile', 'Leaderboard', 'Listening', 'About'];
    const location = useLocation();
    const navigate = useNavigate();

    const getInitialActiveTab = () => {
        switch (location.pathname) {
            case '/signup':
                return '1';
            case '/profile':
                return '1';
            case '/leaderboard':
                return '2';
            case '/':
                return '3';
            case '/about':
                return '4';
            default:
                return '3';
        }
    };

    const [activeTab, setActiveTab] = useState(getInitialActiveTab());
    const [hoveredKey, setHoveredKey] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setActiveTab(getInitialActiveTab());
    }, [location.pathname]);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleMenuClick = (key) => {
        setActiveTab(key);
        switch (key) {
            case '1':
                navigate('/profile');
                break;
            case '2':
                navigate('/leaderboard');
                break;
            case '3':
                navigate('/');
                break;
            case '4':
                navigate('/about');
                break;
            default:
                break;
        }
    };

    const commonStyle = {
        color: 'black',
        flex: 1,
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
        border: '2px solid transparent',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
    };

    const activeStyle = {
        border: '4px solid black',
    };

    const hoverStyle = {
        border: '3px solid rgba(0, 0, 0, 0.2)',
    };

    const menuItems = menuLabels.map((label, index) => ({
        key: String(index + 1),
        label,
        style: commonStyle,
        activeStyle,
    }));

    return (
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header
                style={{
                    top: 0,
                    zIndex: 123,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#EDD238',
                    padding: 0,
                    fontSize: "14px",
                    letterSpacing: "2px",
                    fontFamily: "Inter, sans-serif",
                    justifyContent: "center",
                    height: '100px',
                }}
            >
                <div style={{ display: 'flex', height: '100%', marginInline: '16px', alignItems: "center" }}>
                    <img src="/logo.png" alt="Logo" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                    <img src="/logo_name.png" alt="Logo" style={{ height: '50%' }} />
                </div>
                {menuItems.map((item) => (
                    <div
                        key={item.key}
                        onClick={() => handleMenuClick(item.key)}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{
                            ...item.style,
                            ...(activeTab === item.key ? item.activeStyle : {}),
                            ...(hoveredKey === item.key && activeTab !== item.key ? hoverStyle : {}),
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            flex: 1,
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </Header>
            <Content
                style={{
                    display: 'flex',
                    flexDirection: "column",
                    alignItems: "center",
                    background: "white",
                    position: 'relative',
                }}
            >
                {error && (
                    <div style={{
                        position: "sticky",
                        bottom: '102%',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '10px 15px',
                        borderRadius: borderRadiusLG,
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                )}
                <Routes>
                    <Route path="/" element={<Listening_menu setError={setError} />} />
                    <Route path="/profile" element={<MyProfile setError={setError} />} />
                    <Route path="/leaderboard" element={<Leaderbord setError={setError} />} />
                    <Route path="/about" element={<About setError={setError} />} />
                    <Route path="/session/:sessionId" element={<Session setError={setError} />} />
                    <Route path="/signup" element={<Signup_test setError={setError} />} />
                </Routes>
            </Content>
            <Footer style={{ textAlign: 'center', marginTop: 'auto', backgroundColor: '#131010' }}>
                <p style={{ color: "white", fontFamily: 'Inter, sans-serif' }}>
                    Created by <a style={{ color: '#7fa6bf', fontFamily: 'Inter, sans-serif' }} href="https://github.com/sega-gremlen">@sega-gremlen</a>
                </p>
            </Footer>
        </Layout>
    );
};

const App = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#000000',
                    colorSuccess: '#4caf50',
                    colorWarning: '#ffc107',
                    colorError: '#f44336',
                    colorInfo: '#2196f3',
                    borderRadius: 4,
                    fontSize: 16,
                },
            }}
        >
            <Router>
                <MainLayout />
            </Router>
        </ConfigProvider>
    );
};

export default App;