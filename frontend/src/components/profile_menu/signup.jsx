import {useState} from 'react';
import {EyeInvisibleOutlined, EyeTwoTone, LockOutlined, UserOutlined, ArrowLeftOutlined} from '@ant-design/icons';
import {Button, Checkbox, Form, Input, Modal} from 'antd';

const SignupForm = ({setError, onBackToLogin}) => {
    const [form] = Form.useForm();
    const [agreementChecked, setAgreementChecked] = useState(false);

    const onFinish = async (values) => {
        try {
            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    nickname: values.nickname || '', // Отправляем пустую строку если nickname не указан
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(`Error: ${response.status} - ${errorData.detail || 'No details provided'}`);
                throw new Error(`Network response was not ok: ${errorData.message}`);
            }

            Modal.success({
                title: 'Registration Completed',
                content: 'Please confirm your email. Check your inbox for the confirmation link.',
                onOk: () => {
                    window.location.href = '/profile';
                },
            });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="signup-form" style={{width: 350}}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined/>}
                onClick={onBackToLogin}
                style={{marginBottom: 16}}
            />
            <h2 style={{textAlign: 'center', fontSize: 24, fontWeight: 600}}>Sign Up</h2>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                style={{marginTop: 24, marginBottom: -14}}
            >
                <Form.Item
                    name="email"
                    rules={[{required: true, message: 'Please input your E-mail!', type: 'email'}]}
                >
                    <Input prefix={<UserOutlined/>} placeholder="E-mail" style={{fontSize: '16px'}}/>
                </Form.Item>

                <Form.Item
                    name="nickname"
                    rules={[{message: 'Please input a valid nickname!', whitespace: true}]} // Поле необязательное
                >
                    <Input placeholder="Nickname (optional)" style={{fontSize: '16px'}}/>
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{required: true, message: 'Please input your Password!'}]}
                    hasFeedback
                >
                    <Input.Password
                        prefix={<LockOutlined/>}
                        placeholder="Password"
                        iconRender={(visible) => (visible ? <EyeTwoTone/> : <EyeInvisibleOutlined/>)}
                        style={{fontSize: '16px'}}
                    />
                </Form.Item>

                <Form.Item
                    name="confirm"
                    dependencies={['password']}
                    hasFeedback
                    rules={[
                        {required: true, message: 'Please confirm your password!'},
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined/>}
                        placeholder="Confirm Password"
                        iconRender={(visible) => (visible ? <EyeTwoTone/> : <EyeInvisibleOutlined/>)}
                        style={{fontSize: '16px'}}
                    />
                </Form.Item>

                <Form.Item
                    name="agreement"
                    valuePropName="checked"
                    rules={[{
                        validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('You must accept the agreement')),
                    }]}
                >
                    <Checkbox onChange={(e) => setAgreementChecked(e.target.checked)}>
                        I agree to the <a href="">terms</a>, <a href="">privacy policy</a> and allow my personal data to
                        be processed.
                    </Checkbox>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        style={{
                            backgroundColor: agreementChecked ? '#000' : '#f0f0f0',
                            borderColor: agreementChecked ? '#000' : '#d9d9d9',
                            color: agreementChecked ? '#fff' : 'rgba(0, 0, 0, 0.25)',
                            cursor: agreementChecked ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!agreementChecked}
                    >
                        Register
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default SignupForm;