import {useState, useEffect} from 'react';
import {Layout, theme} from 'antd';
import {BrowserRouter as Router, Route, Routes, useNavigate, useLocation} from 'react-router-dom';
import Listening_menu from "./components/listening_menu/listening_menu.jsx";
import MyProfile from "./components/profile_menu/menu_profile.jsx";
import About from "./components/about_menu/about.jsx";
import Session from "./components/listening_menu/session.jsx";
import Signup_test from "./components/profile_menu/signup.jsx";
import Leaderbord from "./components/leaderbord_menu/leaderbord.jsx";

const App = () => {
    const {Header, Content, Footer} = Layout;

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
                default:
                    return '3';
                case '/about':
                    return '4';
            }
        };

        const [activeTab, setActiveTab] = useState(getInitialActiveTab());
        const [hoveredKey, setHoveredKey] = useState(null);
        const [error, setError] = useState(null);

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
                    navigate('/leaderboard');
                    break;
                case '3':
                    navigate('/');
                    break;
                case '4':
                    navigate('/about');
                    break;
            }
        };

        const commonStyle = {
            color: 'black',
            flex: 1,
            transition: 'border-color 0.3s ease, background-color 0.3s ease',
            border: '2px solid transparent',
            fontFamily: 'Inter, sans-serif', // Применяем шрифт Inter
            fontWeight: 500, // Средняя насыщенность
        };

        const activeStyle = {

            border: '4px solid black', // Черная рамка для активной вкладки
        };

        const hoverStyle = {
            position: "reveal",
            border: '3px solid rgba(0, 0, 0, 0.2)', // Еле заметная серая рамка при наведении
        };

        const menuItems = menuLabels.map((label, index) => ({
            key: String(index + 1),
            label,
            style: commonStyle,
            activeStyle,
        }));

        return (
            <Layout style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header
                    style={{
                        top: 0,
                        zIndex: 123,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#EDD238',

                        padding: 0, // Убираем отступы по краям
                        // backgroundColor: "#FFD700", // Желтый фон
                        fontSize: "14px", // Размер шрифта
                        // textTransform: "uppercase", // Заглавные буквы
                        letterSpacing: "2px", // Узкий кернинг (межбуквенный интервал)
                        fontFamily: "Arial, sans-serif", // Шрифт
                        // display: "flex",
                        justifyContent: "center",
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
                                ...(hoveredKey === item.key && activeTab !== item.key ? hoverStyle : {}), // hover не применяется к активной вкладке
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                flex: 1, // Растягиваем вкладки на всю ширину
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
                        // backgroundColor: "#ffffff"
                        backgroundColor: 'linear-gradient(to bottom, #EDD238, #ffffff)',
                    }}
                >
                    <div style={{
                        position: 'relative'
                    }}>
                        {error && (
                            <div style={{
                                position: "absolute",
                                bottom: '102%',
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
                            paddingTop: "24px",
                            paddingBottom: "24px",
                            flexDirection: "column",
                            alignItems: 'center',
                            display: 'flex',
                            justifyContent: 'center',
                            background: '#ffffff',
                            // backgroundColor: 'rgb(250,237,172)',
                        }}>
                            <Routes>
                                <Route path="/" element={<Listening_menu setError={setError}/>}/>
                                <Route path="/profile" element={<MyProfile setError={setError}/>}/>
                                <Route path="/leaderboard" element={<Leaderbord setError={setError}/>}/>
                                <Route path="/about" element={<About setError={setError}/>}/>
                                <Route path="/session/:sessionId" element={<Session setError={setError}/>}/>
                                <Route path="/signup" element={<Signup_test setError={setError}/>}/>
                            </Routes>
                        </div>
                    </div>
                </Content>
                <Footer
                    style={{
                        textAlign: 'center',
                        marginTop: 'auto',
                        backgroundColor: '#131010'
                    }}
                >
                    <p
                        style={{
                            color: "white",
                            fontFamily: 'Inter, sans-serif', // Применяем шрифт Inter
                        }}>
                        Created by <a
                        style={{
                            color: '#7fa6bf',
                            fontFamily: 'Inter, sans-serif', // Применяем шрифт Inter
                        }}
                        href="https://github.com/sega-gremlen">@sega-gremlen</a>
                    </p>
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