import { Button } from "antd";
import React, { useState } from "react";

const YooMoneyForm = () => {
    const [amount, setAmount] = useState(""); // Стейт для суммы

    // Функция для ввода только цифр
    const handleInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Удаляем всё, кроме цифр
        setAmount(value);
    };

    return (
        <form
            method="POST"
            action="https://yoomoney.ru/quickpay/confirm"
            target="_blank"  // Открытие в новой вкладке
            rel="noopener noreferrer"
        >
            <input type="hidden" name="receiver" value="4100118843641220" />
            <input type="hidden" name="label" value="$order_id" />
            <input type="hidden" name="quickpay-form" value="button" />
            <input type="hidden" name="sum" value={amount} data-type="number" />

            {/* Поле для ввода суммы */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="₽"
                        name="sum"
                        value={amount}
                        onChange={handleInputChange}
                        style={{
                            width: "120px",
                            fontSize: "30px",
                            border: "none",
                            outline: "none",
                            backgroundColor: "rgba(123,63,228,0.22)",
                            padding: "0",
                            margin: "0",
                            textAlign: "center",
                            marginBottom: "11px"
                        }}
                        required
                    />
                </div>
            </div>

            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
            }}>
                {/* Кнопка отправки */}
                <Button
                    type="primary"
                    htmlType="submit"
                    style={{
                        backgroundColor: "#7B3FE4",
                        borderColor: "#7B3FE4",
                        color: "#fff",
                        fontSize: "16px",
                        padding: "10px 20px",
                        borderRadius: "25px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer"
                    }}
                >
                    <img
                        style={{
                            width: "30px",
                            height: "20px",
                            objectFit: "contain",
                            verticalAlign: "middle" // Выравнивание иконки по центру
                        }}
                        src="/io.png"
                        alt="icon"
                    />
                    Поддержать
                </Button>
            </div>
        </form>
    );
};

export default YooMoneyForm;
