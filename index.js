import axios from "axios";

const VERIFY_TOKEN = "1234test";
const PAGE_ACCESS_TOKEN = ""; // Page token 
const PAGE_ID = "" // page id
export const handler = async (event) => {
    console.log(event)
    if (event.requestContext.http.method === "GET") {
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

    if (event.requestContext.http.method === "POST") {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (err) {
            console.error("❌ Invalid JSON:", err);
            return { statusCode: 400, body: "Invalid JSON" };
        }

        console.log("📨 Webhook Event:", JSON.stringify(body));

        // เช็กว่า object เป็น 'instagram'
        if (body.object === "instagram") {
            for (const entry of body.entry || []) {
                for (const messagingEvent of entry.messaging || []) {
                    const senderId = messagingEvent.sender?.id;
                    const text = messagingEvent.message?.text;

                    if (senderId && text) {
                        console.log(`📩 IG DM from ${senderId}: ${text}`);

                        // ส่งข้อความตอบกลับ IG DM
                        try {
                            const res = await axios.post(
                                `https://graph.facebook.com/v17.0/${PAGE_ID}/messages`,
                                {
                                    messaging_product: "instagram",
                                    recipient: { id: senderId },
                                    message: { text: "ขอบคุณสำหรับข้อความของคุณ!" }
                                },
                                {
                                    headers: {
                                        Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
                                        "Content-Type": "application/json"
                                    }
                                }
                            );
                            console.log("✅ Message sent:", res.data);
                        } catch (err) {
                            console.error("❌ Failed to send reply:", err.response?.data || err.message);
                        }
                    }
                }
            }

            return { statusCode: 200, body: "EVENT_RECEIVED" };
        }

        return { statusCode: 400, body: "Unsupported object type" };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
