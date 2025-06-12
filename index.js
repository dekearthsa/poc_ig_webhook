import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const VERIFY_TOKEN = "1234test";
const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN"; // อย่าลืมใส่จริง

exports.handler = async (event) => {
    if (event.httpMethod === "GET") {
        const params = event.queryStringParameters || {};
        if (
            params["hub.mode"] === "subscribe" &&
            params["hub.verify_token"] === VERIFY_TOKEN
        ) {
            return {
                statusCode: 200,
                body: params["hub.challenge"],
            };
        } else {
            return {
                statusCode: 403,
                body: "Verification failed",
            };
        }
    }

    if (event.httpMethod === "POST") {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (err) {
            console.error("Invalid JSON:", err);
            return { statusCode: 400, body: "Invalid JSON" };
        }

        console.log("📨 Full Event:", JSON.stringify(body, null, 2));

        for (const entry of body.entry || []) {
            for (const messagingEvent of entry.messaging || []) {
                if (messagingEvent.message && messagingEvent.sender?.id) {
                    console.log("📩 New IG DM:", messagingEvent.message.text);

                    try {
                        await axios.post(
                            `https://graph.facebook.com/v17.0/me/messages`,
                            {
                                recipient: { id: messagingEvent.sender.id },
                                message: { text: "ขอบคุณสำหรับข้อความของคุณ!" },
                                messaging_type: "RESPONSE",
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                    } catch (err) {
                        console.error("❌ Failed to send reply:", err.response?.data || err.message);
                    }
                }
            }
        }

        return { statusCode: 200, body: "EVENT_RECEIVED" };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
