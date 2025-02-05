import React, {useState} from 'react';
import {
    EyeInvisibleOutlined,
    EyeTwoTone,
    GoogleOutlined,
    LockOutlined,
    UserOutlined
} from '@ant-design/icons';
import {Button, Divider, Form, Input, Typography} from 'antd';
import SignupForm from './signup.jsx';

const {Text, Link} = Typography;

const LoginForm = ({setError}) => {
        const googleClientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
        const googleRedirectUri = import.meta.env.VITE_APP_GOOGLE_REDIRECT_URI;
        const googleTokenScopes = import.meta.env.VITE_APP_GOOGLE_TOKEN_SCOPES;

        const [isLogin, setIsLogin] = useState(true);

        const handleToggleForm = () => {
            setIsLogin(!isLogin);
        };

        const onFinish = async (values) => {
            const loginData = {
                email: values.username,
                password: values.password,
            };

            try {
                const response = await fetch('http://localhost:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(loginData),
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    console.error('Login failed:', errorData.detail);
                    setError(errorData.detail)
                }
            } catch (error) {
                console.error('Error during login:', error);
            }
        };

        const handleGoogleLogin = () => {
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${googleRedirectUri}&response_type=code&scope=${googleTokenScopes}`; // перенаправление на страницу аутентификации Google
        };

        // Компонент для кастомной иконки
        const CustomIcon = ({src, fallback}) => {
            const [imageError, setImageError] = React.useState(false);

            const handleImageError = () => {
                setImageError(true);
            };

            return (
                <>
                    {!imageError ? (
                        <img
                            src={src}
                            alt="Google Icon"
                            style={{width: '20px', height: '20px', marginRight: '8px'}}
                            onError={handleImageError}
                        />
                    ) : (
                        fallback
                    )}
                </>
            );
        };

        return (
            <div
                style={{
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
                    className="auth-form-container"
                    style={{
                        width: 350
                    }}>
                    {isLogin ? (
                        <>
                            <h2 style={{textAlign: 'center', fontSize: 24, fontWeight: 600}}>Login</h2>
                            <Form
                                layout="vertical"
                                style={{
                                    marginTop: 24,
                                    marginBottom: -14
                                }}
                                onFinish={onFinish}
                            >
                                <Form.Item
                                    name="username"
                                    rules={[{
                                        required: true,
                                        message: 'Please input your E-mail!',
                                        type: 'email',
                                    }]}
                                >
                                    <Input prefix={<UserOutlined/>} placeholder="E-mail" style={{fontSize: '16px'}}/>
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    rules={[{required: true, message: 'Please input your Password!'}]}
                                    style={{marginBottom: 10}}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined/>}
                                        placeholder="Password"
                                        iconRender={visible => (visible ? <EyeTwoTone/> : <EyeInvisibleOutlined/>)}
                                        style={{fontSize: '16px'}}
                                    />
                                </Form.Item>

                                <div style={{textAlign: 'center', marginBottom: 10}}>
                                    <Link href="#" style={{color: '#1890ff'}}>Forgot password?</Link>
                                </div>

                                <Form.Item>
                                    <Button
                                        type="default"
                                        htmlType="submit"
                                        block size="large">
                                        Login
                                    </Button>
                                </Form.Item>
                            </Form>

                            <div style={{textAlign: 'center', marginTop: 20}}>
                                <Text>Don't have an account? </Text>
                                <Link onClick={handleToggleForm} style={{color: '#1890ff'}}>Signup</Link>
                            </div>

                            <Divider style={{margin: '24px 0', fontWeight: 400, color: '#8c8c8c'}}>Or</Divider>

                            <Button
                                icon={
                                    <CustomIcon
                                        src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
                                        fallback={<GoogleOutlined/>}
                                    />
                                }
                                block
                                size="large"
                                onClick={handleGoogleLogin}
                            >
                                Login with Google
                            </Button>
                        </>
                    ) : (
                        <SignupForm onBackToLogin={handleToggleForm} setError={setError}/>
                    )}
                </div>
            </div>
        );
    }
;

export default LoginForm;
